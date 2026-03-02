import json
from django.db import models
from django.http import JsonResponse
from django.db.models import Sum, Count, F, Window
from django.db.models.functions import RowNumber
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import datetime

from administration.models import Event
from dashboard.models import EventAccess
from challenges.models import Challenge, UserChallenge, UserHint, ChallengeHint

@login_required
@require_GET
def event_challenges_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    
    # Check access
    access = EventAccess.objects.filter(user=request.user, event=event).first()
    if not access or not access.is_registered:
         return JsonResponse({'error': 'Not registered'}, status=403)
    
    # Pass the ban status to the frontend so it can render a specific ban page
    is_banned = access.is_banned
    challenges = Challenge.objects.filter(
        event=event
    ).filter(
        models.Q(wave__isnull=True) | models.Q(wave__is_active=True)
    ).order_by('category', 'points')
    
    # Get solved status
    solved_ids = UserChallenge.objects.filter(
        user=request.user,
        challenge__event=event,
        is_correct=True
    ).values_list('challenge_id', flat=True)
    
    challenges_data = []
    for challenge in challenges:
        challenges_data.append({
            'id': challenge.id,
            'title': challenge.title,
            'description': challenge.description,
            'category': challenge.category,
            'difficulty': challenge.difficulty,
            'points': challenge.points,
            'author': challenge.author.username if challenge.author else 'Unknown',
            'is_solved': challenge.id in solved_ids,
            'solves_count': UserChallenge.objects.filter(challenge=challenge, is_correct=True).count(),
            'first_blood': UserChallenge.objects.filter(challenge=challenge, is_correct=True).order_by('submitted_at').first(),
            'url': challenge.url if hasattr(challenge, 'url') else None,
            'flag_format': challenge.flag_format if hasattr(challenge, 'flag_format') else 'Hack!tUp{...}',
            'files': [{'name': f.file.name.split('/')[-1], 'url': f.file.url} for f in challenge.attachments.all()],
            'hints': []
        })

        # Process hints
        for hint in challenge.hints.all():
            is_unlocked = hint.cost == 0 or UserHint.objects.filter(user=request.user, hint=hint).exists()
            challenges_data[-1]['hints'].append({
                'id': hint.id,
                'cost': hint.cost,
                'content': hint.content if is_unlocked else None,
                'is_unlocked': is_unlocked
            })
        
        # Serialize first_blood user if exists
        if challenges_data[-1]['first_blood']:
            challenges_data[-1]['first_blood'] = {
                'username': challenges_data[-1]['first_blood'].user.username,
                'time': challenges_data[-1]['first_blood'].submitted_at
            }
        
    return JsonResponse({
        'event': event.event_name, 
        'status': event.get_current_status(),
        'is_banned': is_banned,
        'challenges': challenges_data if not is_banned else []
    })
@csrf_exempt
@login_required
@require_POST
def unlock_hint_api(request, hint_id):
    hint = get_object_or_404(ChallengeHint, id=hint_id)
    
    # Check if already unlocked
    if UserHint.objects.filter(user=request.user, hint=hint).exists():
         return JsonResponse({'success': True, 'hint_content': hint.content})

    # Unlock logic
    UserHint.objects.create(user=request.user, hint=hint)
    
    return JsonResponse({'success': True, 'hint_content': hint.content})

@login_required
@require_POST
def submit_flag_api(request, challenge_id):
    try:
        data = json.loads(request.body)
        submitted_flag = data.get('flag', '').strip()
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
    challenge = get_object_or_404(Challenge, id=challenge_id)
    event = challenge.event
    
    access = EventAccess.objects.filter(user=request.user, event=event).first()
    if not access or not access.is_registered or access.is_banned:
        return JsonResponse({'error': 'Access denied'}, status=403)
        
    current_status = event.get_current_status()
    if current_status != 'live':
        return JsonResponse({'error': f'Event is currently {current_status}. Submissions are closed.'}, status=403)

    # Check if already solved
    already_solved = UserChallenge.objects.filter(
        user=request.user, 
        challenge=challenge, 
        is_correct=True
    ).exists()

    if already_solved and current_status != 'completed':
        return JsonResponse({'success': False, 'message': 'Already solved'})
        
    # Create valid submission record even if wrong (for logs)
    user_submission = UserChallenge.objects.create(
        user=request.user,
        challenge=challenge,
        submitted_flag=submitted_flag[:50],
        is_correct=False
    )
    
    is_correct = check_password(submitted_flag, challenge.flag)
    
    if is_correct:
        # Update submission to be correct
        user_submission.is_correct = True
        user_submission.save()
        
        if event.status == 'ended':
             return JsonResponse({'success': True, 'message': 'Correct (Practice Mode)', 'points': 0})
        
        return JsonResponse({'success': True, 'message': 'Flag Correct!', 'points': challenge.points})
    else:
        return JsonResponse({'success': False, 'message': 'Incorrect Flag'})

@login_required
@require_GET
def event_leaderboard_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    User = get_user_model()

    # Get all users who have solved at least one challenge in this event
    # We aggregate points and find the latest submission time for tie-breaking
    
    # 1. Get all correct submissions for this event
    submissions = UserChallenge.objects.filter(
        challenge__event=event,
        is_correct=True
    ).select_related('user', 'challenge').order_by('submitted_at')

    # Get all unlocked hints for this event to deduct points
    unlocked_hints = UserHint.objects.filter(
        hint__challenge__event=event
    ).select_related('user', 'hint')
    
    # Get ALL registered users for this event
    registered_users = EventAccess.objects.filter(event=event).select_related('user')

    # 2. Process data - EVENT SOURCING APPROACH
    # We collect all "score events" (Solve, Hint) and replay them chronologically
    # to build the graph and final score. This ensures dips (hints) happen at the right time.
    
    leaderboard_data = {}
    
    # Helper to init user
    def get_or_init_user(uid, username):
        if uid not in leaderboard_data:
            leaderboard_data[uid] = {
                'id': uid,
                'username': username,
                'team': 'Hack!t',
                'points': 0,
                'flags': 0,
                'last_solve_time': None,
                'history': [],
                'timeline_events': [], # Temporary list to store raw events
                'avatar': f'https://ui-avatars.com/api/?name={username}&background=random&color=fff'
            }
        return leaderboard_data[uid]

    # Initialize all registered users
    for access in registered_users:
        get_or_init_user(access.user.id, access.user.username)

    # 1. Collect Solves
    processed_solves = set()
    for sub in submissions:
        uid = sub.user.id
        # Prevent duplicate counting for same challenge
        if (uid, sub.challenge.id) in processed_solves:
            continue
        processed_solves.add((uid, sub.challenge.id))

        user_data = get_or_init_user(uid, sub.user.username)
        user_data['timeline_events'].append({
            'type': 'solve',
            'name': sub.challenge.title,
            'delta': sub.challenge.points,
            'timestamp': sub.submitted_at,
            'id': sub.id
        })
        # Track duplicate filter but we calculate final points during replay for consistency?
        # Actually easier to just track duplicates here.

    # 2. Collect Hints
    for uh in unlocked_hints:
        uid = uh.user.id
        user_data = get_or_init_user(uid, uh.user.username)
        user_data['timeline_events'].append({
            'type': 'hint',
            'name': f"Hint: {uh.hint.challenge.title}",
            'delta': -uh.hint.cost, # Negative delta
            'timestamp': uh.unlocked_at,
            'id': f"hint-{uh.id}"
        })

    # 3. Replay Timeline for each user
    
    # Determine global start time
    if event.start_date and event.start_time:
        start_dt = datetime.combine(event.start_date, event.start_time)
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)
        event_start_iso = start_dt.isoformat()
    else:
        start_dt = timezone.now() - timezone.timedelta(hours=1)
        event_start_iso = start_dt.isoformat()

    for uid, data in leaderboard_data.items():
        # Sort events by time
        data['timeline_events'].sort(key=lambda x: x['timestamp'])
        
        current_score = 0
        current_flags = 0
        last_solve = None

        # Add Start Point
        data['history'].append({
            'flagName': 'Event Start',
            'points': 0,
            'total': 0,
            'timestamp': 'Start',
            'rawTime': event_start_iso,
            'id': 'start'
        })

        for evt in data['timeline_events']:
            # Apply delta
            current_score += evt['delta']
            # Prevent negative score? Usually CTFs allow min 0
            if current_score < 0:
                current_score = 0
            
            if evt['type'] == 'solve':
                current_flags += 1
                last_solve = evt['timestamp']
            
            # Add to history
            data['history'].append({
                'flagName': evt['name'],
                'points': evt['delta'],
                'total': current_score,
                'timestamp': evt['timestamp'].strftime('%H:%M'),
                'rawTime': evt['timestamp'].isoformat(),
                'id': evt['id']
            })

        # Set final stats
        data['points'] = current_score
        data['flags'] = current_flags
        data['last_solve_time'] = last_solve

        # Add End Point (Current)
        data['history'].append({
            'flagName': 'Current',
            'points': 0,
            'total': current_score,
            'timestamp': 'Now',
            'rawTime': timezone.now().isoformat(),
            'id': 'now'
        })

        # Cleanup temp key
        del data['timeline_events']

    # 3. Convert to list and sort
    # Sort by Points (Desc), then Last Solve Time (Asc)
    
    sorted_users = sorted(
        leaderboard_data.values(),
        key=lambda x: (-x['points'], x['last_solve_time'] if x['last_solve_time'] else timezone.now())
    )

    # 4. Add Rank
    current_user_stats = None
    
    for index, user in enumerate(sorted_users):
        user['rank'] = index + 1
        
        # Add extra fields expected by frontend
        user['maxPoints'] = 15000 # Mock or calc max possible?
        user['totalFlags'] = Challenge.objects.filter(event=event).count() # Total challenges in event
        user['progress'] = (user['flags'] / user['totalFlags']) * 100 if user['totalFlags'] > 0 else 0
        user['color'] = f"hsl({(index * 137.5) % 360}, 85%, 60%)" # Deterministic random color
        
        if user['id'] == request.user.id:
            current_user_stats = user

    # If current user is not in leaderboard (no solves), return basic stats
    if not current_user_stats:
        current_user_stats = {
            'id': request.user.id,
            'username': request.user.username,
            'rank': '-',
            'points': 0,
            'flags': 0,
            'totalFlags': Challenge.objects.filter(event=event).count(),
            'avatar': f'https://ui-avatars.com/api/?name={request.user.username}&background=random&color=fff'
        }

    return JsonResponse({
        'leaderboard': sorted_users, 
        'event_name': event.event_name,
        'current_user_stats': current_user_stats
    })
