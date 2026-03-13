import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone

from administration.models import Event
from dashboard.models import EventAccess
from ctf.utils import encode_id
from .models import Team, TeamMember, TeamChallenge


# ─────────────────────────────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────────────────────────────

def _get_user_team(user, event):
    """Return the Team the user belongs to in the given event, or None."""
    membership = TeamMember.objects.filter(user=user, team__event=event).select_related("team").first()
    return membership.team if membership else None


def _serialize_team(team, request_user=None):
    members = team.members.select_related("user").order_by("joined_at")
    
    # Calculate points per user in this team
    from .models import TeamChallenge
    from django.db.models import Sum
    
    serialized_members = []
    for m in members:
        # Sum points for the challenges solved by this user on behalf of the team
        user_points = TeamChallenge.objects.filter(
            team=team, solved_by=m.user
        ).aggregate(total=Sum("challenge__points"))["total"] or 0
        
        serialized_members.append({
            "username": m.user.username,
            "is_captain": m.user_id == team.captain_id,
            "is_me": (request_user is not None and m.user_id == request_user.id),
            "joined_at": m.joined_at.isoformat(),
            "points": user_points
        })

    return {
        "id": encode_id(team.id),
        "name": team.name,
        "invite_code": team.invite_code,
        "captain": team.captain.username,
        "members": serialized_members,
        "member_count": members.count(),
        "total_points": team.total_points,
        "created_at": team.created_at.isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────
# LIST TEAMS  –  GET /api/teams/event/<event_id>/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_GET
def list_teams_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    teams = Team.objects.filter(event=event).prefetch_related("members")
    data = [
        {
            "id": encode_id(t.id),
            "name": t.name,
            "captain": t.captain.username,
            "member_count": t.members.count(),
            "total_points": t.total_points,
        }
        for t in teams
    ]
    return JsonResponse({"teams": data})


# ─────────────────────────────────────────────────────────────────────
# MY TEAM  –  GET /api/teams/event/<event_id>/my-team/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_GET
def my_team_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    team = _get_user_team(request.user, event)
    if not team:
        return JsonResponse({"team": None})

    return JsonResponse({"team": _serialize_team(team, request.user)})


# ─────────────────────────────────────────────────────────────────────
# CREATE TEAM  –  POST /api/teams/event/<event_id>/create/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def create_team_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    # Must be registered
    access = EventAccess.objects.filter(user=request.user, event=event, is_registered=True).first()
    if not access:
        return JsonResponse({"error": "You must be registered for this event first."}, status=403)

    if access.is_banned:
        return JsonResponse({"error": "You are banned from this event."}, status=403)

    # Already in a team?
    if _get_user_team(request.user, event):
        return JsonResponse({"error": "You are already in a team for this event."}, status=400)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    team_name = (body.get("name") or "").strip()
    if not team_name:
        return JsonResponse({"error": "Team name is required."}, status=400)
    if len(team_name) > 100:
        return JsonResponse({"error": "Team name is too long (max 100 chars)."}, status=400)

    # Name must be unique per event
    if Team.objects.filter(event=event, name__iexact=team_name).exists():
        return JsonResponse({"error": "A team with this name already exists for this event."}, status=400)

    team = Team.objects.create(event=event, name=team_name, captain=request.user)
    # Captain auto-joins as a member
    TeamMember.objects.create(team=team, user=request.user)

    return JsonResponse({"success": True, "team": _serialize_team(team, request.user)}, status=201)


# ─────────────────────────────────────────────────────────────────────
# JOIN TEAM  –  POST /api/teams/event/<event_id>/join/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def join_team_api(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    if not event.is_team_mode:
        return JsonResponse({"error": "This event is not in team mode."}, status=400)

    # Must be registered
    access = EventAccess.objects.filter(user=request.user, event=event, is_registered=True).first()
    if not access:
        return JsonResponse({"error": "You must be registered for this event first."}, status=403)

    if access.is_banned:
        return JsonResponse({"error": "You are banned from this event."}, status=403)

    # Already in a team?
    if _get_user_team(request.user, event):
        return JsonResponse({"error": "You are already in a team for this event."}, status=400)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    invite_code = (body.get("invite_code") or "").strip()
    if not invite_code:
        return JsonResponse({"error": "invite_code is required."}, status=400)

    team = Team.objects.filter(event=event, invite_code=invite_code).first()
    if not team:
        return JsonResponse({"error": "Invalid invite code. Please check and try again."}, status=404)

    # Team capacity
    if team.members.count() >= event.max_team_size:
        return JsonResponse({"error": f"This team is full ({event.max_team_size} members max)."}, status=400)

    TeamMember.objects.create(team=team, user=request.user)

    return JsonResponse({"success": True, "team": _serialize_team(team, request.user)})


# ─────────────────────────────────────────────────────────────────────
# LEAVE TEAM  –  POST /api/teams/<team_id>/leave/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def leave_team_api(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    event = team.event

    member = TeamMember.objects.filter(team=team, user=request.user).first()
    if not member:
        return JsonResponse({"error": "You are not a member of this team."}, status=400)

    is_captain = team.captain_id == request.user.id
    other_members = team.members.exclude(user=request.user)

    if is_captain:
        if other_members.exists():
            # Transfer captaincy to the next member
            new_captain_member = other_members.order_by("joined_at").first()
            team.captain = new_captain_member.user
            team.save(update_fields=["captain"])
        else:
            # Captain is last member — disband the team
            team.delete()
            return JsonResponse({"success": True, "message": "Team disbanded as you were the last member."})

    member.delete()
    return JsonResponse({"success": True, "message": "You have left the team."})


# ─────────────────────────────────────────────────────────────────────
# KICK MEMBER  –  POST /api/teams/<team_id>/kick/
# ─────────────────────────────────────────────────────────────────────

@login_required
@require_POST
def kick_member_api(request, team_id):
    team = get_object_or_404(Team, id=team_id)

    # Only captain can kick
    if team.captain_id != request.user.id:
        return JsonResponse({"error": "Only the team captain can kick members."}, status=403)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    target_username = (body.get("username") or "").strip()
    if not target_username:
        return JsonResponse({"error": "username of the member to kick is required."}, status=400)

    if target_username == request.user.username:
        return JsonResponse({"error": "You cannot kick yourself. Use leave instead."}, status=400)

    member = TeamMember.objects.filter(team=team, user__username=target_username).first()
    if not member:
        return JsonResponse({"error": "That user is not a member of your team."}, status=404)

    member.delete()
    return JsonResponse({"success": True, "message": f"{target_username} has been removed from the team."})
