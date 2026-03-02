from django.urls import path
from . import views



urlpatterns = [
    path('', views.dashboard, name="dashboard"),
    path('host-event/', views.host_event, name="host_event"),
    path('profile/', views.user_profile, name="user_profile"),
    path('event/<int:event_id>/', views.event_detail_view, name='event_detail'),
    path('event/<int:event_id>/challenges/', views.event_challenges, name='event_challenges'),

    # 🔥 Event-wise Leaderboard
    path("event/<int:event_id>/leaderboard/",views.event_leaderboard_view,name="event_leaderboard"),


    path("event/<int:event_id>/ban/<int:user_id>/",views.admin_ban_participant,name="admin_ban_participant"),
    path("event/<int:event_id>/unban/<int:user_id>/",views.admin_unban_participant,name="admin_unban_participant"),
    path("event/<int:event_id>/ended/", views.event_ended_view, name="event_ended"),

]
