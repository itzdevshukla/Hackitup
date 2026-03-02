from django.urls import path
from . import views



urlpatterns = [
    path('add/<int:event_id>/', views.admin_add_challenge, name='admin_add_challenge'),
    path('challenge/edit/<int:challenge_id>/', views.admin_edit_challenge, name='admin_edit_challenge'),
    path('challenge/delete/<int:challenge_id>/', views.admin_delete_challenge, name='admin_delete_challenge'),
    path("solve/<int:challenge_id>/", views.solve_challenge, name="solve_challenge"),
    path("unlock_hint/<int:hint_id>/", views.unlock_hint, name="unlock_hint"),
    path("admin/attachment/delete/<int:attachment_id>/",views.admin_delete_attachment,name="admin_delete_attachment"),
    path("admin/challenge/manage/<int:challenge_id>/",views.admin_manage_challenge,name="admin_manage_challenge"),

]
