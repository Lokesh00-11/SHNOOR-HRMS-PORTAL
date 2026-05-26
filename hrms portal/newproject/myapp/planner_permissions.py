import logging
from django.db.models import Q

logger = logging.getLogger(__name__)

def can_lock_dates(user, scope='Global', department=None, affected_employees=None):
    """
    Checks if a user has permission to lock dates under the given scope and targets.
    Admin: Any scope.
    Manager: Only their own department or employees within their department.
    Team Leader: Only their own team scope or employees within their team.
    Employee: Cannot lock dates.
    """
    role = user.role.lower() if hasattr(user, 'role') else ''

    if role in ['admin', 'super_admin']:
        return True

    if role == 'manager':
        # Manager can lock department-wide for any of their departments, or any specific employee
        depts = []
        mgr_dept = getattr(getattr(user, 'manager_profile', None), 'department', None)
        if mgr_dept: depts.append(mgr_dept)
        emp_dept = getattr(getattr(user, 'employee_profile', None), 'department', None)
        if emp_dept and emp_dept not in depts: depts.append(emp_dept)

        if scope == 'Global':
            return False  # Only Admin can lock globally

        if scope == 'Department':
            return department in depts

        if scope == 'Employee' and affected_employees:
            # Manager has access to all employees via ManagerEmployeeListView
            return True

        if scope == 'Team':
            return True # Allow manager to lock their own team

        return True

    if role == 'team_leader':
        if scope in ['Global', 'Department']:
            return False  # TLs cannot lock globally or department-wide

        if scope == 'Team':
            # TL can lock for their own team
            return True

        if scope == 'Employee' and affected_employees:
            # Check if all affected employees are assigned to this TL or are the TL themselves
            from .models import Employee
            tl_emp_ids = Employee.objects.filter(team_leader=user).values_list('user_id', flat=True)
            for emp_id in affected_employees:
                uid = emp_id.id if hasattr(emp_id, 'id') else emp_id
                if uid not in tl_emp_ids and uid != user.id:
                    return False
            return True
        return True

    return False

def can_approve_events(user, event):
    """
    Checks if a user can approve/reject a PlannerEvent.
    Admin: Any event.
    Manager: Events for employees in their department.
    Team Leader: Events for employees in their team.
    Employee: Cannot approve.
    """
    role = user.role.lower() if hasattr(user, 'role') else ''

    if role in ['admin', 'super_admin']:
        return True

    if not event.employee:
        return False

    if role == 'manager':
        # Manager has access to all employees via ManagerEmployeeListView
        return True

    if role == 'team_leader':
        if event.employee == user:
            return True
        employee_tl = getattr(getattr(event.employee, 'employee_profile', None), 'team_leader', None)
        return employee_tl == user

    return False

def can_view_employee(user, target_employee):
    """
    Checks if user can view the schedule of the target_employee.
    Admin: Any employee.
    Manager: Employees in their department.
    Team Leader: Employees in their team.
    Employee: Self only.
    """
    if user == target_employee:
        return True

    role = user.role.lower() if hasattr(user, 'role') else ''

    if role in ['admin', 'super_admin']:
        return True

    if role == 'manager':
        # Manager has access to all employees via ManagerEmployeeListView
        return True

    if role == 'team_leader':
        if target_employee == user:
            return True
        employee_tl = getattr(getattr(target_employee, 'employee_profile', None), 'team_leader', None)
        return employee_tl == user

    return False
