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
