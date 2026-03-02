from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db.models import Sum, Min, Max

from administration.models import Event
from dashboard.models import EventAccess
from challenges.models import Challenge, UserChallenge
from django.contrib.auth.hashers import check_password
from dashboard.utils import event_user_guard


# =========================================================
# DASHBOARD
# =========================================================
@login_required(login_url="/accounts/login/")
def dashboard(request):
    events = Event.objects.all()

    # Update event status
    for event in events:
        event.status = event.get_current_status()
        event.save(update_fields=["status"])

    events = Event.objects.all().order_by("-created_at")

    return render(request, "dashboard/dashboard.html", {
        "events": events,
        "user": request.user
    })


# =========================================================
# HOST EVENT
# =========================================================
@login_required(login_url="/accounts/login/")
def host_event(request):
    return render(request, "dashboard/host_event.html")


# =========================================================
# PROFILE
# =========================================================
@login_required(login_url="/accounts/login/")
def user_profile(request):
    return render(request, "dashboard/profile.html")


# =========================================================
# EVENT DETAIL / JOIN
# =========================================================
@login_required
def event_detail_view(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    # Check if already registered
    access = EventAccess.objects.filter(
        user=request.user,
        event=event,
    ).first()

    if access and access.is_registered:
        messages.info(request, "✅ You are already registered")
        return redirect("event_challenges", event.id)

    # ===============================
    # HANDLE REGISTRATION (POST ONLY)
    # ===============================
    if request.method == "POST":

        # 🔒 Registration window check
        if not event.is_registration_open():
            messages.error(
                request,
                "🚫 Registration is closed for this event"
            )
            return redirect("event_detail", event.id)

        access_code = request.POST.get("access_code", "").strip()

        if access_code != event.access_code:
            messages.error(request, "❌ Invalid access code")
            return redirect("event_detail", event.id)

        access, created = EventAccess.objects.get_or_create(
            user=request.user,
            event=event,
            defaults={"is_registered": True}
        )

        if not created:
            messages.info(
                request,
                "ℹ️ You are already registered for this event"
            )
            return redirect("event_challenges", event.id)

        messages.success(
            request,
            f"✅ Successfully registered for {event.event_name}"
        )
        return redirect("event_challenges", event.id)

    # ===============================
    # GET REQUEST (SAFE)
    # ===============================
    return render(request, "dashboard/event_detail.html", {
        "event": event,
        "already_registered": bool(access),
        "registration_open": event.is_registration_open(),
        "in_event":True
    })


# =========================================================
# EVENT CHALLENGES
# =========================================================
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.utils import timezone

@login_required
def event_challenges(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    # 🔒 USER MUST BE REGISTERED
    access = get_object_or_404(
        EventAccess,
        user=request.user,
        event=event,
        is_registered=True
    )

    # 🚫 EVENT NOT LIVE → SHOW WAIT SCREEN (Don't redirect, causes loop)
    if event.get_current_status() == "upcoming":
        messages.info(request, "⏳ Event has not started yet.")
    elif event.get_current_status() == "ended":
        messages.info(request, "🏁 Event has ended.")

    # 🛑 BANNED USER CHECK
    if access.is_banned:
        return render(request, "dashboard/banned.html", {"event": event})

    # Proceed to render even if not live (users can see the empty grid/lobby)


    # ✅ EVENT LIVE + USER REGISTERED → ALLOW
    challenges = Challenge.objects.filter(
        event=event
    ).order_by("category", "points")

    
    solved_ids = UserChallenge.objects.filter(
        user=request.user,
        challenge__event=event,
        is_correct=True
    ).values_list("challenge_id", flat=True).distinct()

    return render(request, "dashboard/event_challenges.html", {
        "event": event,
        "challenges": challenges,
        "solved_ids": list(solved_ids),
        "solved_count": len(solved_ids),
        "total_challenges": challenges.count(),
        "in_event": True,
    })

# =========================================================
# LEADERBOARD
# =========================================================
@login_required
def event_leaderboard_view(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    # 🔒 Event ended guard
    guard = event_user_guard(request, event)
    if guard:
        return guard

    access = get_object_or_404(
        EventAccess,
        user=request.user,
        event=event
    )

    if access.is_banned:
        return render(request, "dashboard/banned.html", {"event": event})

    leaderboard = (
        UserChallenge.objects
        .filter(
            is_correct=True,
            challenge__event=event
        )
        .values("user__username")
        .annotate(
            total_points_solves=Sum("challenge__points"),
            first_flag=Min("submitted_at"),
            last_flag=Max("submitted_at"),
        )
    )

    # 🛑 MANUALLY CALCULATE PENALTY BECAUSE OF COMPLEX JOINS
    # (Django ORM is tricky with multiple unrelated joins on User)
    leaderboard_data = []
    from challenges.models import UserHint

    for entry in leaderboard:
        user_name = entry['user__username']
        # Calculate hint penalty for this user in this event
        penalty = UserHint.objects.filter(
            user__username=user_name,
            hint__challenge__event=event
        ).aggregate(p=Sum('hint__cost'))['p'] or 0

        current_score = (entry['total_points_solves'] or 0) - penalty
        entry['total_points'] = current_score
        leaderboard_data.append(entry)

    # Re-sort manually
    leaderboard_data.sort(key=lambda x: (-x['total_points'], x['last_flag']))
    
    leaderboard = leaderboard_data


    return render(request, "dashboard/leaderboard.html", {
        "event": event,
        "leaderboard": leaderboard,
        "in_event": True,
    })


# =========================================================
# ADMIN BAN / UNBAN PARTICIPANT
# =========================================================
@login_required
def admin_ban_participant(request, event_id, user_id):
    if not request.user.is_staff:
        messages.error(request, "Access denied")
        return redirect("dashboard")

    access = get_object_or_404(
        EventAccess,
        event_id=event_id,
        user_id=user_id
    )

    access.is_banned = True
    access.banned_at = timezone.now()
    access.save()

    messages.success(
        request,
        f"{access.user.username} banned from event"
    )

    return redirect("admin_manage_event", event_id=event_id)


@login_required
def admin_unban_participant(request, event_id, user_id):
    if not request.user.is_staff:
        messages.error(request, "Access denied")
        return redirect("dashboard")

    access = get_object_or_404(
        EventAccess,
        event_id=event_id,
        user_id=user_id
    )

    access.is_banned = False
    access.banned_at = None
    access.save()

    messages.success(
        request,
        f"{access.user.username} unbanned"
    )

    return redirect("admin_manage_event", event_id=event_id)


# =========================================================
# EVENT ENDED PAGE
# =========================================================
@login_required
def event_ended_view(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    # 🔥 TOP 3 WINNERS
    podium = (
        UserChallenge.objects
        .filter(
            is_correct=True,
            challenge__event=event,
            submitted_flag="CORRECT"
        )
        .values("user__username")
        .annotate(total_points=Sum("challenge__points"))
        .order_by("-total_points")[:3]
    )

    return render(request, "dashboard/event_ended.html", {
        "event": event,
        "podium": podium
    })














from dashboard.models import EventRegistration

@login_required
def register_for_event(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    if not event.is_registration_open():
        messages.error(request, "Registration window is closed")
        return redirect("dashboard")

    EventRegistration.objects.get_or_create(
        user=request.user,
        event=event
    )

    messages.success(request, "You are registered for this event")
    return redirect("dashboard")
