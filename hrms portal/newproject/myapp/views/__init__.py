from .auth_views import LoginView, UserProfileView

from .admin_views import (
    AdminStatsView, CompanyListView, CompanyDetailView, 
    SubscriptionPlanListView, TransactionListView, UserManagementView, UserDetailView,
    SuperAdminListView, AdminSettingsView, AllEmployeeProfilesView, SystemDataSetupView,
    AdminCompanyCreateView
)
from .employee_views import (
    EmployeeStatsView, EmployeeReportView, EmployeeProfileView,
    EmployeeProfileUpdateView, EmployeeAppreciationView, EmployeeExpenseView
)
from .manager_views import (
    ManagerEmployeeListView, ManagerLeaveApprovalView, ManagerProfileView,
    ManagerProfileUpdateView, ManagerPerformanceView, ManagerNotificationView,
    PendingLeavesCountView, ManagerExpenseView
)
from .attendance_views import (
    ManagerAttendanceView, EmployeeAttendanceView, EmployeeClockInView,
    EmployeeClockOutView, EmployeeAttendanceTodayView, TeamLeaderAttendanceView
)
from .team_leader_views import (
    TeamLeaderProfileView, TeamLeaderProfileUpdateView, TeamLeaderStatsView,
    TeamLeaderTeamMembersView, TeamLeaderTasksView, TeamLeaderPerformanceView
)
from .task_views import (
    ManagerTaskCreateView, ManagerTaskListView, EmployeeTaskListView,
    TaskDetailView, EmployeeTaskUpdateView
)
from .leave_views import LeaveRequestView, EmployeeLeaveApplyView, LeaveRequestDetailView
from .payroll_views import PayrollView
from .document_views import (
    CompanyPolicyView, CompanyPolicyDetailView, DocumentUploadView, 
    EmployeeDocumentsView, LetterHeadView, LetterHeadDetailView
)
from .notification_views import (
    NotificationView, MarkNotificationsReadView, UnreadNotificationCountView,
    EmployeeNotificationView
)
from .off_views import (
    HolidayView, AssetView, OrgChartView, OrgChartDetailView,
    SupportQueryView, SupportQueryDetailView, SupportQueryUnreadCountView,
    OffboardingView, OffboardingDetailView, CalendarDataView
)
from .appreciation_views import AppreciationView