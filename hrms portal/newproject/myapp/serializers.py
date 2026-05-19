from rest_framework import serializers
from .models import PlannerEvent, PlannerHoliday, PlannerShift

class PlannerEventSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = PlannerEvent
        fields = '__all__'

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
