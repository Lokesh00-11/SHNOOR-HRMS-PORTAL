from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import LeaveRequest, Task, Attendance, PlannerEvent

@receiver(post_save, sender=LeaveRequest)
def create_planner_event_from_leave(sender, instance, created, **kwargs):
    if instance.status == 'approved':
        event, created_event = PlannerEvent.objects.get_or_create(
            employee=instance.employee,
            event_type='Leave',
            start_date=instance.start_date,
            end_date=instance.end_date,
            defaults={
                'title': f"{instance.leave_type} Leave",
                'description': instance.reason,
                'status': 'Approved',
                'visibility': 'Team',
                'color_code': '#ef4444', 
                'is_approved': True,
                'created_by': instance.employee,
                'approved_at': timezone.now()
            }
        )
        if not created_event:
            event.status = 'Approved'
            event.is_approved = True
            event.save()

@receiver(post_save, sender=Task)
def create_planner_event_from_task(sender, instance, created, **kwargs):
    PlannerEvent.objects.update_or_create(
        employee=instance.assigned_to,
        event_type='Task Deadline',
        start_date=instance.deadline,
        defaults={
            'title': f"Deadline: {instance.title}",
            'description': instance.description,
            'status': 'Pending' if instance.status != 'Completed' else 'Completed',
            'visibility': 'Private',
            'color_code': '#8b5cf6', 
            'created_by': instance.created_by,
        }
    )

@receiver(post_save, sender=Attendance)
def create_planner_event_from_attendance(sender, instance, created, **kwargs):
    if instance.check_in is None and instance.check_out is None and instance.date < timezone.now().date():
        PlannerEvent.objects.get_or_create(
            employee=instance.employee.user,
            event_type='Absent',
            start_date=instance.date,
            defaults={
                'title': 'Absent',
                'description': 'System detected absent',
                'status': 'Completed',
                'visibility': 'Team',
                'color_code': '#ef4444', 
            }
        )
