from rest_framework import serializers
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
