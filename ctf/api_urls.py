from django.urls import path
from accounts import api_views as auth_api
from dashboard import api_views as dashboard_api
from challenges import api_views as challenge_api
from administration import api_views as admin_api

urlpatterns = [
    # Auth
    path('auth/login/', auth_api.login_api, name='api_login'),
    path('auth/register/', auth_api.register_api, name='api_register'),
    path('auth/logout/', auth_api.logout_api, name='api_logout'),
    path('auth/status/', auth_api.user_status_api, name='api_status'),

    # Dashboard
    path('dashboard/events/', dashboard_api.dashboard_events_api, name='api_dashboard_events'),
    path('dashboard/event/<int:event_id>/', dashboard_api.event_details_api, name='api_event_details'),
    path('dashboard/event/<int:event_id>/join/', dashboard_api.join_event_api, name='api_join_event'),
    path('user/request-event/', dashboard_api.user_request_event_api, name='api_user_request_event'),
    
    # Challenges
    path('event/<int:event_id>/challenges/', challenge_api.event_challenges_api, name='api_event_challenges'),
    path('event/<int:event_id>/leaderboard/', challenge_api.event_leaderboard_api, name='api_event_leaderboard'),
    path('challenge/<int:challenge_id>/submit/', challenge_api.submit_flag_api, name='api_challenge_submit'),
    path('hint/<int:hint_id>/unlock/', challenge_api.unlock_hint_api, name='api_unlock_hint'),

    # Admin Dashboard
    
    path('admin/dashboard/', admin_api.admin_dashboard_api, name='api_admin_dashboard'),
    path('admin/users/', admin_api.admin_users_api, name='api_admin_users'),
    path('admin/user/<int:user_id>/', admin_api.admin_user_detail_api, name='api_admin_user_detail'),
    path('admin/user/<int:user_id>/delete/', admin_api.admin_delete_user_api, name='api_admin_delete_user'),
    path('admin/users/import/', admin_api.admin_import_users_api, name='api_admin_import_users'),
    path('admin/events/', admin_api.admin_events_api, name='api_admin_events'),
    path('admin/event-requests/', admin_api.admin_event_requests_api, name='api_admin_event_requests'),
    path('admin/event-request/<int:event_id>/approve/', admin_api.admin_approve_event_api, name='api_admin_approve_event'),
    path('admin/event-request/<int:event_id>/decline/', admin_api.admin_decline_event_api, name='api_admin_decline_event'),
    path('admin/event/new/', admin_api.admin_add_event_api, name='api_admin_add_event'),
    path('admin/event/<int:event_id>/', admin_api.admin_event_detail_api, name='api_admin_event_detail'),
    path('admin/event/<int:event_id>/edit/', admin_api.admin_edit_event_api, name='api_admin_edit_event'),
    path('admin/event/<int:event_id>/control/', admin_api.admin_event_control_api, name='api_admin_event_control'),
    path('admin/event/<int:event_id>/participants/', admin_api.admin_event_participants_api, name='api_admin_event_participants'),
    path('admin/event/<int:event_id>/participant/<int:user_id>/ban/', admin_api.admin_toggle_ban_participant_api, name='api_admin_toggle_ban_participant'),
    path('admin/event/<int:event_id>/leaderboard/', admin_api.admin_event_leaderboard_api, name='api_admin_event_leaderboard'),
    path('admin/event/<int:event_id>/leaderboard/<int:user_id>/submissions/', admin_api.admin_user_event_submissions_api, name='api_admin_user_event_submissions'),
    path('admin/event/<int:event_id>/submissions/', admin_api.admin_event_submissions_api, name='api_admin_event_submissions'),
    path('admin/event/<int:event_id>/challenge/new/', admin_api.admin_create_challenge_api, name='api_admin_create_challenge'),
    path('admin/event/<int:event_id>/challenge/<int:challenge_id>/', admin_api.admin_challenge_detail_api, name='api_admin_challenge_detail'),
    path('admin/event/<int:event_id>/waves/', admin_api.admin_waves_api, name='api_admin_waves'),
    path('admin/event/<int:event_id>/wave/<int:wave_id>/', admin_api.admin_wave_detail_api, name='api_admin_wave_detail'),
    path('admin/event/<int:event_id>/wave/<int:wave_id>/challenges/', admin_api.admin_wave_challenges_api, name='api_admin_wave_challenges'),
    path('admin/event/<int:event_id>/roles/', admin_api.admin_event_roles_api, name='api_admin_event_roles'),
    path('admin/event/<int:event_id>/delete/', admin_api.admin_delete_event_api, name='api_admin_delete_event'),
    path('admin/event/<int:event_id>/export/', admin_api.admin_export_event_data_api, name='api_admin_export_event_data'),
    path('admin/event/<int:event_id>/test-challenges/', admin_api.admin_test_challenges_list_api, name='api_admin_test_challenges'),
    path('admin/challenge/<int:challenge_id>/test-flag/', admin_api.admin_test_challenge_flag_api, name='api_admin_test_challenge_flag'),
]
