from django.db import models
from django.core.exceptions import ValidationError

class SingletonModel(models.Model):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

class OrganizationSettings(SingletonModel):
    company_name = models.CharField(max_length=255, default='Company Name')
    official_email = models.EmailField(default='contact@company.com')
    timezone = models.CharField(max_length=100, default='UTC')
    date_format = models.CharField(max_length=50, default='YYYY-MM-DD')
    currency = models.CharField(max_length=10, default='USD')
    office_timings = models.CharField(max_length=255, default='09:00 AM - 06:00 PM')
    working_days = models.CharField(max_length=255, default='Monday - Friday')
    holidays = models.TextField(blank=True, default='')

    class Meta:
        verbose_name_plural = 'Organization Settings'

class SecuritySettings(SingletonModel):
    password_policy = models.CharField(max_length=255, default='Standard')
    session_timeout = models.IntegerField(default=30) # minutes
    login_attempt_limit = models.IntegerField(default=5)
    two_factor_auth_enabled = models.BooleanField(default=False)
    device_session_handling = models.CharField(max_length=50, default='Concurrent')

    class Meta:
        verbose_name_plural = 'Security Settings'

class NotificationSettings(SingletonModel):
    email_notifications = models.BooleanField(default=True)
    task_alerts = models.BooleanField(default=True)
    leave_alerts = models.BooleanField(default=True)
    expense_alerts = models.BooleanField(default=True)
    attendance_alerts = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Notification Settings'

class AttendanceSettings(SingletonModel):
    grace_timing = models.IntegerField(default=15)
    overtime_rules = models.CharField(max_length=255, default='Standard')
    leave_carry_forward = models.BooleanField(default=False)
    leave_approvals = models.CharField(max_length=50, default='Manager')
    leave_type_configuration = models.JSONField(default=dict)

    class Meta:
        verbose_name_plural = 'Attendance & Leave Settings'

class ExpenseSettings(SingletonModel):
    upload_size_limit = models.IntegerField(default=5) # MB
    allowed_file_formats = models.CharField(max_length=255, default='pdf,jpg,png')
    compression_thresholds = models.IntegerField(default=2) # MB
    reimbursement_policies = models.TextField(blank=True, default='')
    approval_hierarchy = models.CharField(max_length=50, default='Manager -> Finance')
    category_management = models.JSONField(default=dict)

    class Meta:
        verbose_name_plural = 'Expense Settings'

class TaskSettings(SingletonModel):
    default_statuses = models.JSONField(default=list)
    escalation_rules = models.TextField(blank=True, default='')
    reminder_configuration = models.JSONField(default=dict)
    assignment_rules = models.TextField(blank=True, default='')
    task_priority_labels = models.JSONField(default=list)

    class Meta:
        verbose_name_plural = 'Task Settings'

class BrandingSettings(SingletonModel):
    logo_url = models.URLField(blank=True, null=True)
    primary_color = models.CharField(max_length=50, default='#000000')
    theme_support = models.CharField(max_length=50, default='Light')
    dashboard_widget_toggles = models.JSONField(default=dict)

    class Meta:
        verbose_name_plural = 'Branding Settings'

class LifecycleSettings(SingletonModel):
    onboarding_rules = models.TextField(blank=True, default='')
    offboarding_rules = models.TextField(blank=True, default='')
    employee_id_generation = models.CharField(max_length=50, default='Auto')
    probation_settings = models.IntegerField(default=90) # Days
    asset_return_workflow = models.TextField(blank=True, default='')
    account_disable_logic = models.CharField(max_length=50, default='Immediate')

    class Meta:
        verbose_name_plural = 'Lifecycle Settings'

class MaintenanceSettings(SingletonModel):
    maintenance_mode_enabled = models.BooleanField(default=False)
    cache_clearing_hooks = models.JSONField(default=dict)
    backup_configuration_readiness = models.BooleanField(default=False)
    logging_controls = models.CharField(max_length=50, default='Standard')

    class Meta:
        verbose_name_plural = 'Maintenance Settings'

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    
    def __str__(self):
        return self.name

class Permission(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"

class SettingsAuditLog(models.Model):
    changed_by = models.CharField(max_length=100) # Simplified for isolated RBAC currently
    module = models.CharField(max_length=100)
    field_changes = models.JSONField()
    old_value = models.JSONField()
    new_value = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.module} changed by {self.changed_by} at {self.timestamp}"
