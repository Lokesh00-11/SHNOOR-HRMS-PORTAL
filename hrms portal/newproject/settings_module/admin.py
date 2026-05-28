from django.contrib import admin
from .models import (
    OrganizationSettings, SecuritySettings, NotificationSettings,
    AttendanceSettings, ExpenseSettings, TaskSettings, BrandingSettings,
    LifecycleSettings, MaintenanceSettings, Role, Permission, RolePermission,
    SettingsAuditLog
)

@admin.register(OrganizationSettings)
class OrganizationSettingsAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'official_email', 'timezone')

@admin.register(SecuritySettings)
class SecuritySettingsAdmin(admin.ModelAdmin):
    list_display = ('password_policy', 'session_timeout', 'two_factor_auth_enabled')

@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ('email_notifications', 'task_alerts', 'system_notifications')

@admin.register(AttendanceSettings)
class AttendanceSettingsAdmin(admin.ModelAdmin):
    list_display = ('grace_timing', 'overtime_rules', 'leave_carry_forward')

@admin.register(ExpenseSettings)
class ExpenseSettingsAdmin(admin.ModelAdmin):
    list_display = ('upload_size_limit', 'approval_hierarchy')

@admin.register(TaskSettings)
class TaskSettingsAdmin(admin.ModelAdmin):
    pass

@admin.register(BrandingSettings)
class BrandingSettingsAdmin(admin.ModelAdmin):
    list_display = ('primary_color', 'theme_support')

@admin.register(LifecycleSettings)
class LifecycleSettingsAdmin(admin.ModelAdmin):
    list_display = ('employee_id_generation', 'probation_settings')

@admin.register(MaintenanceSettings)
class MaintenanceSettingsAdmin(admin.ModelAdmin):
    list_display = ('maintenance_mode_enabled', 'logging_controls')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')

@admin.register(SettingsAuditLog)
class SettingsAuditLogAdmin(admin.ModelAdmin):
    list_display = ('module', 'changed_by', 'timestamp')
    list_filter = ('module', 'changed_by', 'timestamp')
    readonly_fields = ('module', 'changed_by', 'field_changes', 'old_value', 'new_value', 'timestamp')
