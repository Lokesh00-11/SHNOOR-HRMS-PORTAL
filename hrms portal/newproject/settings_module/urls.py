from django.urls import path
from .views import (
    OrganizationSettingsView, SecuritySettingsView, NotificationSettingsView,
    AttendanceSettingsView, ExpenseSettingsView, TaskSettingsView, BrandingSettingsView,
    LifecycleSettingsView, MaintenanceSettingsView
)

urlpatterns = [
    path('organization/', OrganizationSettingsView.as_view(), name='settings-organization'),
    path('security/', SecuritySettingsView.as_view(), name='settings-security'),
    path('notifications/', NotificationSettingsView.as_view(), name='settings-notifications'),
    path('attendance/', AttendanceSettingsView.as_view(), name='settings-attendance'),
    path('expenses/', ExpenseSettingsView.as_view(), name='settings-expenses'),
    path('tasks/', TaskSettingsView.as_view(), name='settings-tasks'),
    path('branding/', BrandingSettingsView.as_view(), name='settings-branding'),
    path('lifecycle/', LifecycleSettingsView.as_view(), name='settings-lifecycle'),
    path('maintenance/', MaintenanceSettingsView.as_view(), name='settings-maintenance'),
]
