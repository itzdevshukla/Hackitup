from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from administration.models import Event

@login_required
@require_GET
def dashboard_events_api(request):
    events = Event.objects.filter(is_approved=True, is_rejected=False).order_by('-created_at')
    
    events_data = []
    for event in events:
        events_data.append({
            'id': event.id,
            'title': event.event_name,
            'description': event.description,
            'status': event.get_current_status(),
            'venue': event.venue,
            'type': event.ctf_type,
            'participants': event.max_participants, # Ideally current participants, but max for now
            'start_date': event.start_date,
            'start_time': event.start_time,
            'end_date': event.end_date,
            'creator': event.created_by.username,
            # Add image URL if you have an image field, currently using placeholder in React
        })
    
    return JsonResponse({'events': events_data})

@login_required
@require_POST
def join_event_api(request, event_id):
    import json
    from django.shortcuts import get_object_or_404
    from dashboard.models import EventAccess
    
    try:
        data = json.loads(request.body)
        access_code = data.get('accessCode', '').strip()
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
    event = get_object_or_404(Event, id=event_id)
    
    if not event.is_registration_open():
        return JsonResponse({'success': False, 'message': 'Registration Closed'})

    # Check max participants
    current_participants = EventAccess.objects.filter(event=event, is_registered=True).count()
    if current_participants >= event.max_participants:
        return JsonResponse({'success': False, 'message': 'Event is full (Capacity Reached)'})
        
    if access_code != event.access_code:
        return JsonResponse({'success': False, 'message': 'Invalid Access Code'})
        
    access, created = EventAccess.objects.get_or_create(
        user=request.user,
        event=event,
        defaults={"is_registered": True}
    )
    
    if not created and not access.is_registered:
        access.is_registered = True
        access.save()
        
    return JsonResponse({'success': True, 'message': 'Registered Successfully'})

@login_required
@require_GET
def event_details_api(request, event_id):
    from django.shortcuts import get_object_or_404
    from dashboard.models import EventAccess
    from challenges.models import Challenge
    
    event = get_object_or_404(Event, id=event_id)
    
    # Check if user is registered (or has access)
    is_registered = False
    if EventAccess.objects.filter(user=request.user, event=event, is_registered=True).exists():
        is_registered = True

    # Counts
    challenges_count = Challenge.objects.filter(event=event).count()
    participants_count = EventAccess.objects.filter(event=event, is_registered=True).count()
    
    data = {
        'id': event.id,
        'title': event.event_name,
        'description': event.description,
        'status': event.get_current_status(),
        'venue': event.venue,
        'type': event.ctf_type,
        # 'difficulty': event.difficulty_level, # Check if this field exists in Event model?
        # Checking Event model fields from previous context or just standard fields.
        # administration.models.Event usually has these. Let's assume description, venue, etc are there.
        # If difficulty is not in Event, I should omit or fetch from challenges average?
        # Let's check Event model again if needed, or just omit difficulty for now if unsure.
        # I recall 'difficulty' used in frontend mock data.
        'organizer': event.created_by.username,
        'start_date': event.start_date,
        'start_time': event.start_time,
        'end_date': event.end_date,
        'end_time': event.end_time,
        'challenges_count': challenges_count,
        'participants_count': participants_count,
        'is_registered': is_registered,
        'is_registration_open': event.is_registration_open(),
    }
    
    return JsonResponse(data)

@csrf_exempt
@login_required
@require_POST
def user_request_event_api(request):
    import json
    from django.utils.dateparse import parse_date, parse_time

    try:
        data = json.loads(request.body)
        
        event = Event.objects.create(
            event_name=data.get('eventName'),
            venue=data.get('venue'),
            description=data.get('description'),
            ctf_type=data.get('ctfType'),
            max_participants=int(data.get('participants')),
            start_date=parse_date(data.get('startDate')),
            start_time=parse_time(data.get('startTime')),
            end_date=parse_date(data.get('endDate')),
            end_time=parse_time(data.get('endTime')),
            registration_start_date=parse_date(data.get('registrationStartDate')) if data.get('registrationStartDate') else None,
            registration_start_time=parse_time(data.get('registrationStartTime')) if data.get('registrationStartTime') else None,
            registration_end_date=parse_date(data.get('registrationEndDate')) if data.get('registrationEndDate') else None,
            registration_end_time=parse_time(data.get('registrationEndTime')) if data.get('registrationEndTime') else None,
            created_by=request.user,
            is_approved=False,
            is_rejected=False
        )
        return JsonResponse({'success': True, 'message': 'Event requested successfully.', 'event_id': event.id})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
