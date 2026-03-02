from django.urls import path
from . import views

urlpatterns = [
    # ... existing URLs
    
    # Admin URLs
    path('', views.admin_dashboard_view, name='admin_dashboard'),
    path('users/', views.admin_users_view, name='admin_users'),
    path('users/import/', views.admin_import_users, name='admin_import_users'),
    path('add-event/', views.admin_add_event_view, name='admin_add_event'),
    path('manage-events/', views.admin_manage_events_view, name='admin_manage_events'),
    path('settings/', views.admin_settings_view, name='admin_settings'),
    path('user/<int:user_id>/', views.admin_user_detail_view, name='admin_user_detail'),
    path('delete-user/<int:user_id>/', views.admin_delete_user_view, name='admin_delete_user'),
    path('administration/delete-event/<int:event_id>/', views.admin_delete_event_view, name='admin_delete_event'),
    path('events/<int:event_id>/manage/',views.admin_manage_event,name='admin_manage_event'),
    path('events/<int:event_id>/edit/', views.admin_edit_event, name='admin_edit_event'),
    path('events/<int:event_id>/users/',views.admin_event_users,name='admin_event_users'),
    path("admin/event/<int:event_id>/leaderboard/",views.admin_event_leaderboard,name="admin_event_leaderboard"),
    path("admin/event/<int:event_id>/submissions/<int:user_id>/",views.admin_user_submissions,name="admin_user_submissions"),



    path("admin/event/<int:event_id>/submissions/", views.admin_live_submissions, name="admin_live_submissions"),
    path("admin/event/<int:event_id>/live/", views.admin_live_correct_submissions_api, name="admin_live_submissions_api"),

    path("events/<int:event_id>/challenges/all/",views.admin_all_challenges,name="admin_all_challenges"),



]
