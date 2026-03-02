import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from administration.models import EventRole

@require_POST
def login_api(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            has_admin_access = user.is_staff or user.is_superuser or EventRole.objects.filter(user=user).exists()
            assigned_event_id = None
            if has_admin_access and not user.is_staff and not user.is_superuser:
                first_role = EventRole.objects.filter(user=user).first()
                if first_role:
                    assigned_event_id = first_role.event_id

            return JsonResponse({
                'success': True,
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'has_admin_access': has_admin_access,
                    'assigned_event_id': assigned_event_id
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid credentials'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

@require_POST
def register_api(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')
        
        if not username or not password:
             return JsonResponse({'success': False, 'error': 'Username and password required'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Username already taken'}, status=400)
            
        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        
        has_admin_access = user.is_staff or user.is_superuser or EventRole.objects.filter(user=user).exists()
        assigned_event_id = None
        if has_admin_access and not user.is_staff and not user.is_superuser:
            first_role = EventRole.objects.filter(user=user).first()
            if first_role:
                assigned_event_id = first_role.event_id

        return JsonResponse({
            'success': True,
            'user': {
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'has_admin_access': has_admin_access,
                'assigned_event_id': assigned_event_id
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_POST
def logout_api(request):
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logged out successfully'})

@require_GET
@ensure_csrf_cookie
def user_status_api(request):
    if request.user.is_authenticated:
        has_admin_access = request.user.is_staff or request.user.is_superuser or EventRole.objects.filter(user=request.user).exists()
        assigned_event_id = None
        if has_admin_access and not request.user.is_staff and not request.user.is_superuser:
            first_role = EventRole.objects.filter(user=request.user).first()
            if first_role:
                assigned_event_id = first_role.event_id

        return JsonResponse({
            'is_authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
                'has_admin_access': has_admin_access,
                'assigned_event_id': assigned_event_id
            }
        })
    else:
        return JsonResponse({
            'is_authenticated': False,
            'user': None
        })
