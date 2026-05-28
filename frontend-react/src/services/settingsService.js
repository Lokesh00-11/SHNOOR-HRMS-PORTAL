const MANAGER_SETTINGS_KEY = 'shnoor_manager_settings';
const TEAMLEADER_SETTINGS_KEY = 'shnoor_teamleader_settings';

const DEFAULT_MANAGER_SETTINGS = {
  planner: {
    teamPlannerVisibility: 'department',
    recurringEventDefaults: 'weekly',
    plannerLockPreferences: 7,
    eventVisibilityScope: 'team',
    plannerDefaultMode: 'calendar',
    teamCalendarPreferences: true
  },
  leaves: {
    annualLeaveAllocation: 21,
    sickLeaveAllocation: 10,
    casualLeaveAllocation: 5,
    halfDayPermissions: true,
    carryForward: false,
    overlappingLeaveWarning: true,
    emergencyLeaveHandling: 'auto_approve',
    absenceEscalationTiming: 48,
    uninformedAbsenceAlerts: true
  },
  attendance: {
    graceTiming: 15,
    overtimeVisibility: true,
    attendanceLockTiming: 5,
    shiftVisibility: 'department',
    attendanceReminders: true,
    lateCheckInAlerts: true
  },
  notifications: {
    leaveApprovalEmails: true,
    attendanceAlerts: true,
    plannerReminders: true,
    payrollNotifications: true,
    smsAlerts: false,
    shiftReminders: true,
    announcementAlerts: true,
    quietHours: false
  },
  peopleAccess: {
    employeeDataVisibility: 'department',
    departmentOnlyAccess: true,
    attendanceVisibility: 'team',
    plannerVisibility: 'department',
    exportRestrictions: true,
    salaryVisibilityRestrictions: true,
    restrictedEmployeeRecords: true
  },
  payroll: {
    payslipVisibility: true,
    overtimeDisplay: true,
    payrollCutoffReminders: true,
    payrollReviewNotifications: true,
    bonusVisibility: false,
    attendanceSyncVerification: true
  },
  preferences: {
    dashboardDensity: 'comfortable',
    defaultView: 'planner'
  },
  offboarding: {
    exitInterviewReminders: true,
    reminderTiming: '7_days',
    assetReturnTracking: true,
    resignationAlerts: true,
    clearanceChecklistVisibility: true,
    offboardingApprovalNotifications: true,
    finalWorkingDayReminder: true,
    exitDocumentationVisibility: 'department',
    departmentExitAlerts: true
  },
  securityPrivacy: {
    hideSalaryInfo: true,
    restrictAttendanceVisibility: 'department',
    employeeContactPrivacy: true,
    sensitiveDataWarning: true,
    exportRestrictionToggle: true,
    plannerPrivacyScope: 'team',
    loginSessionReminder: true,
    restrictedEmployeeRecords: true,
    leavePrivacyVisibility: true,
    auditPreferenceToggle: true
  }
};

const DEFAULT_TEAMLEADER_SETTINGS = {
  teamPlanner: {
    recurringMeetings: true,
    standupTiming: '09:30',
    teamPlannerVisibility: 'team',
    plannerCompactMode: false,
    calendarPreferences: 'month'
  },
  teamLeave: {
    overlapWarnings: true,
    emergencyLeaveAlerts: true,
    leaveReminderNotifications: true,
    leaveVisibility: 'team_only'
  },
  attendance: {
    attendanceReminders: true,
    shiftVisibility: 'team',
    missingAttendanceAlerts: true,
    lateCheckInWarnings: true
  },
  teamNotifications: {
    plannerReminders: true,
    taskReminders: true,
    absenceAlerts: true,
    standupAlerts: true,
    meetingReminders: true
  },
  preferences: {
    defaultPlannerMode: 'calendar',
    compactViewToggle: false,
    dashboardDensity: 'comfortable',
    sortingPreferences: 'priority'
  }
};

export const settingsService = {
  getManagerSettings: () => {
    try {
      const stored = localStorage.getItem(MANAGER_SETTINGS_KEY);
      if (!stored) {
        return { ...DEFAULT_MANAGER_SETTINGS };
      }
      const parsed = JSON.parse(stored);
      return {
        planner: { ...DEFAULT_MANAGER_SETTINGS.planner, ...parsed.planner },
        leaves: { ...DEFAULT_MANAGER_SETTINGS.leaves, ...parsed.leaves },
        attendance: { ...DEFAULT_MANAGER_SETTINGS.attendance, ...parsed.attendance },
        notifications: { ...DEFAULT_MANAGER_SETTINGS.notifications, ...parsed.notifications },
        peopleAccess: { ...DEFAULT_MANAGER_SETTINGS.peopleAccess, ...parsed.peopleAccess },
        payroll: { ...DEFAULT_MANAGER_SETTINGS.payroll, ...parsed.payroll },
        preferences: { ...DEFAULT_MANAGER_SETTINGS.preferences, ...parsed.preferences },
        offboarding: { ...DEFAULT_MANAGER_SETTINGS.offboarding, ...parsed.offboarding },
        securityPrivacy: { ...DEFAULT_MANAGER_SETTINGS.securityPrivacy, ...parsed.securityPrivacy }
      };
    } catch (err) {
      console.error('Error reading manager settings from localStorage:', err);
      return { ...DEFAULT_MANAGER_SETTINGS };
    }
  },

  saveManagerSettings: (settings) => {
    try {
      localStorage.setItem(MANAGER_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Error writing manager settings to localStorage:', err);
      return false;
    }
  },

  getTeamLeaderSettings: () => {
    try {
      const stored = localStorage.getItem(TEAMLEADER_SETTINGS_KEY);
      if (!stored) {
        return { ...DEFAULT_TEAMLEADER_SETTINGS };
      }
      const parsed = JSON.parse(stored);
      return {
        teamPlanner: { ...DEFAULT_TEAMLEADER_SETTINGS.teamPlanner, ...parsed.teamPlanner },
        teamLeave: { ...DEFAULT_TEAMLEADER_SETTINGS.teamLeave, ...parsed.teamLeave },
        attendance: { ...DEFAULT_TEAMLEADER_SETTINGS.attendance, ...parsed.attendance },
        teamNotifications: { ...DEFAULT_TEAMLEADER_SETTINGS.teamNotifications, ...parsed.teamNotifications },
        preferences: { ...DEFAULT_TEAMLEADER_SETTINGS.preferences, ...parsed.preferences }
      };
    } catch (err) {
      console.error('Error reading team leader settings from localStorage:', err);
      return { ...DEFAULT_TEAMLEADER_SETTINGS };
    }
  },

  saveTeamLeaderSettings: (settings) => {
    try {
      localStorage.setItem(TEAMLEADER_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Error writing team leader settings to localStorage:', err);
      return false;
    }
  }
};
