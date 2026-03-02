from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password

from administration.models import Event
from dashboard.models import EventAccess
from .models import Challenge, UserChallenge, ChallengeAttachment, ChallengeHint, UserHint


# =========================
# ADD CHALLENGE (ADMIN)
# =========================
@login_required
def admin_add_challenge(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    if not request.user.is_staff:
        messages.error(request, "Access denied")
        return redirect('admin_manage_events')

    if request.method == 'POST':
        raw_flag = request.POST.get('flag')  # ✅ NO COMMA

        challenge = Challenge.objects.create(
            event=event,
            title=request.POST.get('title'),
            description=request.POST.get('description'),
            category=request.POST.get('category'),
            difficulty=request.POST.get('difficulty'),
            points=request.POST.get('points'),
            author=request.user,
            flag=make_password(raw_flag),  # ✅ HASHED
        )

        # 💡 SAVE HINTS
        hints = request.POST.getlist('hints')
        costs = request.POST.getlist('hint_costs')
        for h, c in zip(hints, costs):
            if h.strip():
                ChallengeHint.objects.create(
                    challenge=challenge,
                    content=h,
                    cost=int(c) if c else 0
                )

        # 📎 SAVE ATTACHMENTS
        for f in request.FILES.getlist("attachments"):
            ChallengeAttachment.objects.create(
                challenge=challenge,
                file=f
            )

        messages.success(request, "Challenge added successfully")
        return redirect('admin_manage_event', event_id=event.id)

    return render(request, 'administration/add_challenge.html', {
        'event': event
    })


# =========================
# EDIT CHALLENGE (ADMIN)
# =========================
@login_required
def admin_edit_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)

    if not request.user.is_staff:
        messages.error(request, "Access denied")
        return redirect('dashboard')

    if request.method == 'POST':
        challenge.title = request.POST.get('title')
        challenge.description = request.POST.get('description')
        challenge.category = request.POST.get('category')
        challenge.difficulty = request.POST.get('difficulty')
        challenge.points = request.POST.get('points')

        # 🔒 UPDATE FLAG (ONLY IF CHANGED)
        new_flag = request.POST.get('flag')
        if new_flag and not new_flag.startswith("pbkdf2_"):
            challenge.flag = make_password(new_flag)

        challenge.save()

        # 📎 ADD NEW ATTACHMENTS (OLD ONES REMAIN)
        for f in request.FILES.getlist("attachments"):
            ChallengeAttachment.objects.create(
                challenge=challenge,
                file=f
            )

        # 💡 SAVE HINTS (Update/Create/Delete)
        hint_ids = request.POST.getlist('hint_ids')
        hints_content = request.POST.getlist('hints')
        hints_costs = request.POST.getlist('hint_costs')
        
        kept_ids = []

        for hid, hcontent, hcost in zip(hint_ids, hints_content, hints_costs):
            if not hcontent.strip():
                continue
            
            cost_val = int(hcost) if hcost else 0

            if hid:  # Existing
                try:
                    h_obj = ChallengeHint.objects.get(id=hid, challenge=challenge)
                    h_obj.content = hcontent
                    h_obj.cost = cost_val
                    h_obj.save()
                    kept_ids.append(h_obj.id)
                except ChallengeHint.DoesNotExist:
                    pass
            else:    # New
                new_h = ChallengeHint.objects.create(
                    challenge=challenge,
                    content=hcontent,
                    cost=cost_val
                )
                kept_ids.append(new_h.id)
        
        # Remove deleted hints
        challenge.hints.exclude(id__in=kept_ids).delete()

        messages.success(request, "Challenge updated successfully")
        return redirect('admin_manage_event', event_id=challenge.event.id)

    return render(request, 'administration/admin_edit_challenge.html', {
        'challenge': challenge,
        'event': challenge.event,
        'categories': Challenge.CATEGORY_CHOICES,
        'difficulties': Challenge.DIFFICULTY_CHOICES,
    })


# =========================
# DELETE CHALLENGE (ADMIN)
# =========================
@login_required
def admin_delete_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)

    if not request.user.is_staff:
        messages.error(request, "Access denied")
        return redirect('dashboard')

    event_id = challenge.event.id
    challenge.delete()

    messages.success(request, "Challenge deleted successfully")
    return redirect('admin_manage_event', event_id=event_id)


# =========================
# SOLVE CHALLENGE (USER)
# =========================
@login_required
def solve_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    event = challenge.event

    # 🔒 CHECK EVENT ACCESS / BAN
    access = EventAccess.objects.filter(user=request.user, event=event).first()
    
    if not access or not access.is_registered:
        messages.error(request, "🚫 You must register for the event first.")
        return redirect("event_detail", event_id=event.id)
        
    if access.is_banned:
        return render(request, "dashboard/banned.html", {"event": event})

    if request.method == "POST":
        submitted_flag = request.POST.get("flag", "").strip()

        # 🔍 Check if ALREADY solved correctly (Live or Past)
        already_solved = UserChallenge.objects.filter(
            user=request.user,
            challenge=challenge,
            is_correct=True
        ).exists()

        # 🔒 Block duplicate correct solves during LIVE event
        if already_solved and challenge.event.status != "ended":
            messages.info(request, "⚠️ Challenge already solved")
            return redirect("solve_challenge", challenge_id=challenge.id)

        # 📝 Create NEW submission record (History)
        user_challenge = UserChallenge.objects.create(
            user=request.user,
            challenge=challenge,
            submitted_flag=submitted_flag[:50],  # initial save
            is_correct=False
        )

        # ✅ FLAG CHECK
        if check_password(submitted_flag, challenge.flag):

            # 🧊 EVENT ENDED → PRACTICE MODE
            if challenge.event.status == "ended":
                
                if already_solved:
                    # solved during event earlier
                    messages.info(
                        request,
                        "🧊 Practice Mode: Already solved during event"
                    )
                else:
                    # practice solve — DO NOT MARK CORRECT (No points)
                    user_challenge.submitted_flag = "CORRECT (PRACTICE)"
                    user_challenge.save()

                    messages.info(
                        request,
                        "🧊 Practice Mode: Correct flag (no leaderboard impact)"
                    )

            # 🔥 EVENT LIVE → NORMAL SCORING
            else:
                user_challenge.submitted_flag = "CORRECT"
                user_challenge.is_correct = True
                user_challenge.save()

                messages.success(request, "✅ Correct flag!")

        # ❌ WRONG FLAG
        else:
            # Record the wrong attempt (already saved as created)
            # Just ensure flag is stored correctly if we want original input
            user_challenge.submitted_flag = submitted_flag[:50]
            user_challenge.is_correct = False
            user_challenge.save()

            messages.error(request, "❌ Wrong flag")

        return redirect("solve_challenge", challenge_id=challenge.id)

    
    # 🕵️ CHECK HINTS
    # We want a list of hints, and for each, know if it's unlocked.
    all_hints = challenge.hints.all().order_by('timestamp', 'id')
    unlocked_hint_ids = UserHint.objects.filter(
        user=request.user, 
        hint__in=all_hints
    ).values_list('hint_id', flat=True)

    return render(request, "dashboard/solve_challenges.html", {
        "challenge": challenge,
        "event": challenge.event,
        "in_event": True,
        "all_hints": all_hints,
        "unlocked_hint_ids": list(unlocked_hint_ids),
    })


# =========================
# UNLOCK HINT
# =========================
@login_required
@login_required
def unlock_hint(request, hint_id):
    hint_obj = get_object_or_404(ChallengeHint, id=hint_id)
    challenge = hint_obj.challenge
    
    # Check if already unlocked
    if UserHint.objects.filter(user=request.user, hint=hint_obj).exists():
        messages.info(request, "💡 Hint already unlocked")
        return redirect("solve_challenge", challenge_id=challenge.id)

    # Unlock it
    UserHint.objects.create(
        user=request.user,
        hint=hint_obj
    )
    
    messages.success(request, f"🔓 Hint unlocked! -{hint_obj.cost} points")
    return redirect("solve_challenge", challenge_id=challenge.id)


# =========================
# DELETE ATTACHMENT (ADMIN)
# =========================


from .models import ChallengeAttachment

@login_required
def admin_delete_attachment(request, attachment_id):
    attachment = get_object_or_404(ChallengeAttachment, id=attachment_id)

    if not request.user.is_staff:
        messages.error(request, "Access denied")
        return redirect("dashboard")

    challenge_id = attachment.challenge.id
    attachment.file.delete(save=False)  # 🔥 delete file from disk
    attachment.delete()                 # 🔥 delete DB row

    messages.success(request, "Attachment removed")
    return redirect("admin_edit_challenge", challenge_id=challenge_id)



# =========================
# MANAGE EACH CHALLENGE (ADMIN)
# =========================
@login_required
def admin_manage_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)

    if not request.user.is_staff:
        messages.error(request, "Access denied")
        return redirect("dashboard")

    # ✅ ONLY CORRECT SUBMISSIONS
    submissions = (
        UserChallenge.objects
        .filter(challenge=challenge, is_correct=True)
        .select_related("user")
        .order_by("submitted_at")   # 🔥 first blood on top
    )

    total_correct = submissions.count()

    return render(request, "administration/admin_manage_challenge.html", {
        "challenge": challenge,
        "submissions": submissions,
        "total_correct": total_correct,
    })
