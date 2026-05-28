from rest_framework import serializers
from .models import (
    OrganizationSettings, SecuritySettings, NotificationSettings,
    AttendanceSettings, ExpenseSettings, TaskSettings, BrandingSettings,
    LifecycleSettings, MaintenanceSettings, Role, Permission, RolePermission,
    SettingsAuditLog
)

class OrganizationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationSettings
        exclude = ('id',)

class SecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecuritySettings
        exclude = ('id',)

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        exclude = ('id',)

class AttendanceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSettings
        exclude = ('id',)

class ExpenseSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseSettings
        exclude = ('id',)

class TaskSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSettings
        exclude = ('id',)

class BrandingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandingSettings
        exclude = ('id',)

class LifecycleSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LifecycleSettings
        exclude = ('id',)

class MaintenanceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceSettings
        exclude = ('id',)

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = '__all__'

class SettingsAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SettingsAuditLog
        fields = '__all__'
