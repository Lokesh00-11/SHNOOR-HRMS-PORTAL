from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import (
    OrganizationSettings, SecuritySettings, NotificationSettings,
    AttendanceSettings, ExpenseSettings, TaskSettings, BrandingSettings,
    LifecycleSettings, MaintenanceSettings, SettingsAuditLog
)
from .serializers import (
    OrganizationSettingsSerializer, SecuritySettingsSerializer,
    NotificationSettingsSerializer, AttendanceSettingsSerializer,
    ExpenseSettingsSerializer, TaskSettingsSerializer, BrandingSettingsSerializer,
    LifecycleSettingsSerializer, MaintenanceSettingsSerializer
)

def log_setting_change(module, old_value, new_value, user='Admin'):
    # Lightweight diff
    changes = {}
    for k, v in new_value.items():
        if k in old_value and old_value[k] != v:
            changes[k] = {'old': old_value[k], 'new': v}
    
    if changes:
        SettingsAuditLog.objects.create(
            changed_by=user,
            module=module,
            field_changes=changes,
            old_value=old_value,
            new_value=new_value
        )

class SingletonSettingView(APIView):
    """
    Base API View for singleton settings models.
    """
    model = None
    serializer_class = None
    module_name = ''

    def get(self, request):
        obj = self.model.load()
        serializer = self.serializer_class(obj)
        return Response(serializer.data)

    def put(self, request):
        obj = self.model.load()
        old_data = self.serializer_class(obj).data
        serializer = self.serializer_class(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            new_data = serializer.data
            log_setting_change(self.module_name, old_data, new_data, user=request.user.username if request.user.is_authenticated else 'Admin')
            return Response(new_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrganizationSettingsView(SingletonSettingView):
    model = OrganizationSettings
    serializer_class = OrganizationSettingsSerializer
    module_name = 'OrganizationSettings'

class SecuritySettingsView(SingletonSettingView):
    model = SecuritySettings
    serializer_class = SecuritySettingsSerializer
    module_name = 'SecuritySettings'

class NotificationSettingsView(SingletonSettingView):
    model = NotificationSettings
    serializer_class = NotificationSettingsSerializer
    module_name = 'NotificationSettings'

class AttendanceSettingsView(SingletonSettingView):
    model = AttendanceSettings
    serializer_class = AttendanceSettingsSerializer
    module_name = 'AttendanceSettings'

class ExpenseSettingsView(SingletonSettingView):
    model = ExpenseSettings
    serializer_class = ExpenseSettingsSerializer
    module_name = 'ExpenseSettings'

class TaskSettingsView(SingletonSettingView):
    model = TaskSettings
    serializer_class = TaskSettingsSerializer
    module_name = 'TaskSettings'

class BrandingSettingsView(SingletonSettingView):
    model = BrandingSettings
    serializer_class = BrandingSettingsSerializer
    module_name = 'BrandingSettings'

class LifecycleSettingsView(SingletonSettingView):
    model = LifecycleSettings
    serializer_class = LifecycleSettingsSerializer
    module_name = 'LifecycleSettings'

class MaintenanceSettingsView(SingletonSettingView):
    model = MaintenanceSettings
    serializer_class = MaintenanceSettingsSerializer
    module_name = 'MaintenanceSettings'
