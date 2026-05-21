from .auth_views import LoginView, UserProfileView

from .admin_views import (
    AdminStatsView, CompanyListView, CompanyDetailView, 
    SubscriptionPlanListView, SubscriptionPlanDetailView, TransactionListView, UserManagementView, UserDetailView,
    SuperAdminListView, AdminSettingsView, AllEmployeeProfilesView, SystemDataSetupView,
    AdminCompanyCreateView
)
from .employee_views import (
    EmployeeStatsView, EmployeeReportView, EmployeeProfileView,
    EmployeeProfileUpdateView, EmployeeAppreciationView, EmployeeExpenseView,
    EmployeeQueriesView
)
from .manager_views import (
    ManagerEmployeeListView, ManagerLeaveApprovalView, ManagerProfileView,
    ManagerProfileUpdateView, ManagerPerformanceView, ManagerNotificationView,
    PendingLeavesCountView, ManagerExpenseView, ManagerSubscriptionView, ManagerRenewSubscriptionView,
    ManagerQueriesView
)
from .attendance_views import (
    ManagerAttendanceView, EmployeeAttendanceView, EmployeeClockInView,
    EmployeeClockOutView, EmployeeAttendanceTodayView, TeamLeaderAttendanceView
)
from .team_leader_views import (
    TeamLeaderProfileView, TeamLeaderProfileUpdateView, TeamLeaderStatsView,
    TeamLeaderTeamMembersView, TeamLeaderTasksView, TeamLeaderPerformanceView,
    TeamLeaderQueriesView
)
from .task_views import (
    ManagerTaskCreateView, ManagerTaskListView, EmployeeTaskListView,
    TaskDetailView, EmployeeTaskUpdateView
)
from .leave_views import LeaveRequestView, EmployeeLeaveApplyView, LeaveRequestDetailView
from .payroll_views import PayrollView, ManagerPaySingleEmployeeView
from .document_views import (
    CompanyPolicyView, CompanyPolicyDetailView, DocumentUploadView, 
    EmployeeDocumentsView, LetterHeadView, LetterHeadDetailView, DownloadFileView
)
from .notification_views import (
    NotificationView, MarkNotificationsReadView, UnreadNotificationCountView,
    EmployeeNotificationView, BadgeCountsView, MarkBadgeReadView
)
from .off_views import (
    HolidayView, AssetView, OrgChartView, OrgChartDetailView,
    SupportQueryView, SupportQueryDetailView, SupportQueryUnreadCountView,
    OffboardingView, OffboardingDetailView, CalendarDataView
)
from .appreciation_views import AppreciationView, AppreciationCommentView
from .thanks_views import ThanksView, ThanksCommentView
from .expense_views import (
    EmployeeExpenseListView, TeamLeaderExpenseListView, TeamLeaderExpenseUpdateView,
    ManagerExpenseListView, ManagerExpenseApproveView, ManagerExpensePayView
)

# Explicitly pulling the views from wherever they are defined inside this folder package
from myapp.views.employee_views import EmployeeQueriesView
from myapp.views.manager_views import ManagerQueriesView
from myapp.views.team_leader_views import TeamLeaderQueriesView