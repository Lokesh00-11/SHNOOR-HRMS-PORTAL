from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import models
from .models import (
    User, SuperAdmin, SubscriptionPlan, Company, Transactions, Employee,
    SupportQuery, Holiday, Appreciation, AppreciationComment, Thanks, ThanksComment, LeaveRequest, CompanyPolicy,
    Payroll, Offboarding, LetterHead, AdminProfile, Attendance, Asset,
    Expense, Task, CompanyDocument, ManagerProfile, TeamLeaderProfile, OrgChart, Notification, EmployeeCase
)

User = get_user_model()

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['bio', 'address']

class UserSerializer(serializers.ModelSerializer):
    admin_profile = AdminProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'password', 'phone_number', 'location', 'admin_profile', 'company']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        admin_profile_data = validated_data.pop('admin_profile', None)
        user = User.objects.create_user(**validated_data)
        if admin_profile_data and user.role == 'admin':
            AdminProfile.objects.update_or_create(user=user, defaults=admin_profile_data)
        return user

    def update(self, instance, validated_data):
        admin_profile_data = validated_data.pop('admin_profile', None)
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if admin_profile_data and instance.role == 'admin':
            profile, _ = AdminProfile.objects.update_or_create(user=instance, defaults=admin_profile_data)
            instance.admin_profile = profile
        return instance

class SuperAdminSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model = SuperAdmin
        fields = ['id', 'user', 'username', 'email', 'can_manage_admins', 'created_at']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'duration_months', 'features', 'trial_period_days']

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'email', 'members_count', 'is_active', 'license_expired', 'license_expiry_date', 'created_at', 'max_users', 'subscription_plan']

class TransactionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    plan_name = serializers.CharField(source='subscription_plan.name', read_only=True)
    class Meta:
        model = Transactions
        fields = ['id', 'company', 'company_name', 'subscription_plan', 'plan_name', 'amount', 'transaction_id', 'status', 'payment_method', 'transaction_date']

class EmployeeSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'first_name', 'last_name', 'email', 'designation', 'department', 
            'salary', 'casual_leaves', 'sick_leaves', 'vacation_leaves', 'paid_leaves',
            'employee_id', 'bank_name', 'account_number', 'ifsc_code', 'pan_number', 'shift', 'employment_type'
        ]

class EmployeeProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    phone_number = serializers.CharField(source='phone', required=False, allow_blank=True)
    date_of_joining = serializers.DateField(source='joining_date', required=False, allow_null=True)
    branch_name = serializers.CharField(source='branch', required=False, allow_blank=True)
    full_name = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user_id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'designation', 'department', 'phone_number', 'gender', 'date_of_birth', 'address',
            'employee_id', 'date_of_joining', 'bank_name', 'account_number', 'ifsc_code', 'branch_name',
            'aadhaar_number', 'pan_number', 'marital_status', 'nationality', 'blood_group', 
            'permanent_address', 'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relation', 'shift', 'casual_leaves', 'sick_leaves', 'vacation_leaves', 'paid_leaves',
            'profile_picture', 'work_mode'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        if 'first_name' in user_data: user.first_name = user_data['first_name']
        if 'last_name' in user_data: user.last_name = user_data['last_name']
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class SupportQuerySerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportQuery
        fields = ['id', 'sender', 'sender_username', 'sender_name', 'recipient', 'recipient_username', 'recipient_name', 'target_role', 'subject', 'message', 'reply', 'status', 'sender_read', 'recipient_read', 'created_at', 'updated_at']
        extra_kwargs = {'sender': {'read_only': True}, 'recipient': {'read_only': True}}
        
    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username if obj.sender else "Unknown"

    def get_recipient_name(self, obj):
        return f"{obj.recipient.first_name} {obj.recipient.last_name}".strip() or obj.recipient.username if obj.recipient else "Unknown"

class EmployeeCaseSerializer(serializers.ModelSerializer):
    employee_names = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeCase
        fields = '__all__'
        read_only_fields = ['created_by', 'status']
        
    def get_employee_names(self, obj):
        names = []
        for emp in obj.employees.all():
            name = f"{emp.user.first_name} {emp.user.last_name}".strip() or emp.user.username
            names.append(name)
        return ", ".join(names)
        
    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description', 'created_at']

class AppreciationCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    class Meta:
        model = AppreciationComment
        fields = ['id', 'appreciation', 'author', 'author_username', 'text', 'created_at']

class AppreciationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    comments = AppreciationCommentSerializer(many=True, read_only=True)
    class Meta:
        model = Appreciation
        fields = ['id', 'sender', 'sender_username', 'recipient', 'recipient_username', 'title', 'description', 'amount', 'created_at', 'comments']

class ThanksCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_name = serializers.SerializerMethodField()
    class Meta:
        model = ThanksComment
        fields = ['id', 'thanks', 'author', 'author_username', 'author_name', 'text', 'created_at']
    def get_author_name(self, obj):
        name = f"{obj.author.first_name} {obj.author.last_name}".strip()
        if name: return name
        return obj.author.username.split('@')[0].capitalize() if '@' in obj.author.username else obj.author.username

class ThanksSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    comments = ThanksCommentSerializer(many=True, read_only=True)
    class Meta:
        model = Thanks
        fields = ['id', 'sender', 'sender_username', 'sender_name', 'recipient', 'recipient_username', 'recipient_name', 'title', 'description', 'created_at', 'comments']
    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        if name: return name
        return obj.sender.username.split('@')[0].capitalize() if '@' in obj.sender.username else obj.sender.username
    def get_recipient_name(self, obj):
        name = f"{obj.recipient.first_name} {obj.recipient.last_name}".strip()
        if name: return name
        return obj.recipient.username.split('@')[0].capitalize() if '@' in obj.recipient.username else obj.recipient.username

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_name = serializers.SerializerMethodField()
    class Meta:
        model = LeaveRequest
        fields = ['id', 'employee', 'employee_username', 'employee_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'created_at', 'updated_at']
    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}".strip() or obj.employee.username

class CompanyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyPolicy
        fields = ['id', 'title', 'description', 'file', 'created_at', 'updated_at']

class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.username', read_only=True)
    username = serializers.CharField(source='employee.user.username', read_only=True)
    bank_account = serializers.CharField(source='employee.account_number', read_only=True)
    ifsc_code = serializers.CharField(source='employee.ifsc_code', read_only=True)
    pan_number = serializers.CharField(source='employee.pan_number', read_only=True)
    shift = serializers.CharField(source='employee.shift', read_only=True)
    base_salary = serializers.DecimalField(source='employee.salary', max_digits=10, decimal_places=2, read_only=True)
    employment_type = serializers.CharField(source='employee.employment_type', read_only=True)
    class Meta:
        model = Payroll
        fields = ['id', 'employee', 'employee_name', 'username', 'amount', 'payment_date', 'month_year', 'status', 'bank_account', 'ifsc_code', 'pan_number', 'shift', 'employment_type', 'base_salary']

class OffboardingSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    username = serializers.CharField(source='employee.user.username', read_only=True)
    class Meta:
        model = Offboarding
        fields = ['id', 'employee', 'employee_name', 'username', 'action_type', 'reason', 'file', 'date', 'created_at']

class LetterHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = LetterHead
        fields = ['id', 'title', 'document_type', 'file', 'created_at']

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='employee.user.username', read_only=True)
    status = serializers.SerializerMethodField()
    hours_worked = serializers.SerializerMethodField()
    total_day_hours = serializers.SerializerMethodField()
    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'employee_name', 'username', 'date', 'check_in', 'check_out', 'hours_worked', 'status', 'total_day_hours']
    def get_employee_name(self, obj):
        user = obj.employee.user
        return f'{user.first_name} {user.last_name}'.strip() or user.email
    def get_hours_worked(self, obj):
        # If already clocked out, return the saved hours
        if obj.check_out:
            return obj.hours_worked
        # If still clocked in, calculate live hours
        if obj.check_in:
            diff = timezone.now() - obj.check_in
            return round(diff.total_seconds() / 3600.0, 2)
        return 0.00
    def get_total_day_hours(self, obj):
        res = Attendance.objects.filter(employee=obj.employee, date=obj.date).aggregate(sum=models.Sum('hours_worked'))['sum']
        total = float(res) if res is not None else 0.0
        active_session = Attendance.objects.filter(employee=obj.employee, date=obj.date, check_out__isnull=True).first()
        if active_session:
            diff = timezone.now() - active_session.check_in
            total += (diff.total_seconds() / 3600.0)
        return round(total, 2)
    def get_status(self, obj):
        return 'Present' if obj.check_in else 'Absent'

class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.user.get_full_name', read_only=True)
    class Meta:
        model = Asset
        fields = ['id', 'name', 'asset_type', 'serial_number', 'assigned_to', 'assigned_to_name', 'status', 'purchase_date']

class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    submitted_at_str = serializers.SerializerMethodField()
    class Meta:
        model = Expense
        fields = '__all__'
        
    def get_employee_name(self, obj):
        name = f"{obj.employee.first_name} {obj.employee.last_name}".strip()
        return name or obj.employee.username
        
    def get_submitted_at_str(self, obj):
        if obj.submitted_at:
            return obj.submitted_at.strftime('%b %d, %Y')
        return None

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_to_email = serializers.CharField(source='assigned_to.email', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    class Meta:
        model = Task
        fields = '__all__'

class CompanyDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    class Meta:
        model = CompanyDocument
        fields = '__all__'

class ManagerProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = ManagerProfile
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'gender', 
            'date_of_birth', 'address', 'designation', 'department', 
            'employee_id', 'joining_date', 'bank_name', 'account_number', 
            'ifsc_code', 'branch', 'profile_picture',
            'aadhaar_number', 'pan_number', 'marital_status', 'nationality', 
            'permanent_address', 'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relation', 'blood_group'
        ]
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        if 'first_name' in user_data: user.first_name = user_data['first_name']
        if 'last_name' in user_data: user.last_name = user_data['last_name']
        user.save()
        for attr, value in validated_data.items(): setattr(instance, attr, value)
        instance.save()
        return instance

class TeamLeaderProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = TeamLeaderProfile
        fields = '__all__'
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        if 'first_name' in user_data: user.first_name = user_data['first_name']
        if 'last_name' in user_data: user.last_name = user_data['last_name']
        user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class OrgChartSerializer(serializers.ModelSerializer):
    manager_name=serializers.CharField(source='manager.name',read_only=True)
    class Meta:
        model = OrgChart
        fields = ['id','name','role','profile_picture','department','company_name','employee_months','work_mode','manager','manager_name']

class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    class Meta:
        model = Notification
        fields = '__all__'
from .models import PlannerEvent, PlannerHoliday, PlannerShift, PlannerLock

class PlannerEventSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_by_role = serializers.SerializerMethodField()
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    target_employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = PlannerEvent
        fields = '__all__'

    def get_created_by_role(self, obj):
        if not obj.created_by:
            return ''
        return getattr(obj.created_by, 'role', 'employee')

class PlannerHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlannerHoliday
        fields = '__all__'

class PlannerShiftSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = PlannerShift
        fields = '__all__'

class PlannerLockSerializer(serializers.ModelSerializer):
    locked_by_username = serializers.CharField(source='locked_by.username', read_only=True)
    locked_by_name = serializers.CharField(source='locked_by.get_full_name', read_only=True)
    locked_by_role = serializers.SerializerMethodField()
    unlocked_by_username = serializers.CharField(source='unlocked_by.username', read_only=True)
    affected_employee_usernames = serializers.SerializerMethodField()
    affected_employees = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = PlannerLock
        fields = '__all__'

    def get_affected_employee_usernames(self, obj):
        return [u.username for u in obj.affected_employees.all()]

    def get_locked_by_role(self, obj):
        if not obj.locked_by:
            return ''
        return getattr(obj.locked_by, 'role', 'employee')

# ========================================================
# HELPDESK MODULE SERIALIZERS
# ========================================================

from .models import HelpdeskCategory, HelpdeskTicket, HelpdeskReply, HelpdeskAttachment, HelpdeskEscalation

class HelpdeskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpdeskCategory
        fields = '__all__'

class HelpdeskAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = HelpdeskAttachment
        fields = ['id', 'file', 'file_url', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['uploaded_by']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class HelpdeskReplySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    attachments = HelpdeskAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = HelpdeskReply
        fields = ['id', 'ticket', 'user', 'user_name', 'user_role', 'message', 'is_internal_note', 'created_at', 'attachments']
        read_only_fields = ['user']

class HelpdeskEscalationSerializer(serializers.ModelSerializer):
    escalated_by_name = serializers.CharField(source='escalated_by.get_full_name', read_only=True)

    class Meta:
        model = HelpdeskEscalation
        fields = ['id', 'ticket', 'escalated_by', 'escalated_by_name', 'escalated_to_role', 'reason', 'created_at']
        read_only_fields = ['escalated_by']

class HelpdeskTicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    replies = HelpdeskReplySerializer(many=True, read_only=True)
    escalations = HelpdeskEscalationSerializer(many=True, read_only=True)
    attachments = HelpdeskAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = HelpdeskTicket
        fields = [
            'id', 'title', 'description', 'category', 'category_name', 'priority', 'status', 
            'created_by', 'created_by_name', 'assigned_to', 'assigned_to_name', 'department_scope',
            'created_at', 'updated_at', 'resolved_at', 'replies', 'escalations', 'attachments'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'resolved_at']
