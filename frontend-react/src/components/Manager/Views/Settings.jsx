import React, { useState, useEffect } from 'react';
import { settingsService } from '../../../services/settingsService';
import '../../../styles/settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('planner');
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = settingsService.getManagerSettings();
    setSettings(loadedSettings);
  }, []);

  const triggerToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleCheckboxChange = (section, key) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key]
      }
    }));
  };

  const handleValueChange = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate minor network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    const success = settingsService.saveManagerSettings(settings);
    setSaving(false);
    if (success) {
      triggerToast('Manager settings saved successfully.');
    } else {
      triggerToast('Failed to save settings. Please try again.');
    }
  };

  if (!settings) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> Loading settings...
      </div>
    );
  }

  return (
    <section className="view-section active">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Manager Settings</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Configure department preferences, access controls, payroll visibility, and team workflows.
        </p>
      </div>

      <div className="settings-layout">
        {/* Left Side Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            <i className="fa-solid fa-calendar-days"></i>
            Planner
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaves')}
          >
            <i className="fa-solid fa-umbrella-beach"></i>
            Leaves & Absence
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <i className="fa-solid fa-clock"></i>
            Attendance
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <i className="fa-solid fa-bell"></i>
            Notifications
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'peopleAccess' ? 'active' : ''}`}
            onClick={() => setActiveTab('peopleAccess')}
          >
            <i className="fa-solid fa-users-gear"></i>
            People HR Access
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
            onClick={() => setActiveTab('payroll')}
          >
            <i className="fa-solid fa-file-invoice-dollar"></i>
            Payroll
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'offboarding' ? 'active' : ''}`}
            onClick={() => setActiveTab('offboarding')}
          >
            <i className="fa-solid fa-person-walking-arrow-right"></i>
            Offboarding
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'securityPrivacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('securityPrivacy')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            Security & Privacy
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <i className="fa-solid fa-sliders"></i>
            Preferences
          </button>
        </div>

        {/* Right Side Content Form */}
        <form onSubmit={handleSave} className="settings-content-panel">
          
          {/* PLANNER SETTINGS */}
          {activeTab === 'planner' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Planner Settings</h3>
                <p>Manage visibility permissions, locking rules, and calendar preferences for your department.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="teamPlannerVisibility">Planner Visibility</label>
                  <select
                    id="teamPlannerVisibility"
                    value={settings.planner.teamPlannerVisibility}
                    onChange={(e) => handleValueChange('planner', 'teamPlannerVisibility', e.target.value)}
                  >
                    <option value="all">Entire Company</option>
                    <option value="department">My Department Only</option>
                    <option value="team">My direct team only</option>
                  </select>
                  <span className="field-desc">Determine who can see the shared calendar views.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="recurringEventDefaults">Recurring Event Defaults</label>
                  <select
                    id="recurringEventDefaults"
                    value={settings.planner.recurringEventDefaults}
                    onChange={(e) => handleValueChange('planner', 'recurringEventDefaults', e.target.value)}
                  >
                    <option value="none">No Recurrence</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <span className="field-desc">Default recurrence pattern when scheduling new events.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="plannerLockPreferences">Planner Lock Window (Days)</label>
                  <input
                    id="plannerLockPreferences"
                    type="number"
                    min="0"
                    max="60"
                    value={settings.planner.plannerLockPreferences}
                    onChange={(e) => handleValueChange('planner', 'plannerLockPreferences', parseInt(e.target.value) || 0)}
                  />
                  <span className="field-desc">Days in advance employees are prevented from modifying schedules.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="eventVisibilityScope">Event Visibility Scope</label>
                  <select
                    id="eventVisibilityScope"
                    value={settings.planner.eventVisibilityScope}
                    onChange={(e) => handleValueChange('planner', 'eventVisibilityScope', e.target.value)}
                  >
                    <option value="all">Full Details (Title & Owner)</option>
                    <option value="department">Department-level details</option>
                    <option value="team">Team-only details, others see Busy</option>
                    <option value="self">Private (Only self and manager)</option>
                  </select>
                  <span className="field-desc">Control how detailed events appear outside your team.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="plannerDefaultMode">Planner Display Mode</label>
                  <select
                    id="plannerDefaultMode"
                    value={settings.planner.plannerDefaultMode}
                    onChange={(e) => handleValueChange('planner', 'plannerDefaultMode', e.target.value)}
                  >
                    <option value="calendar">Month Calendar Grid</option>
                    <option value="list">Detailed Agenda List</option>
                    <option value="year">Yearly Matrix Overview</option>
                  </select>
                  <span className="field-desc">Initial layout mode displayed when launching the planner.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Team Calendar Preferences</h4>
                    <p className="settings-switch-desc">Automatically synchronize team-wide events into the master planner.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.planner.teamCalendarPreferences}
                      onChange={() => handleCheckboxChange('planner', 'teamCalendarPreferences')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* LEAVES & ABSENCE SETTINGS */}
          {activeTab === 'leaves' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Earned Leaves & Absence Settings</h3>
                <p>Configure leave authorization timelines, allocations, and hierarchy rules.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="annualLeaveAllocation">Annual Leave Allocation (Days)</label>
                  <input
                    id="annualLeaveAllocation"
                    type="number"
                    min="0"
                    max="50"
                    value={settings.leaves.annualLeaveAllocation}
                    onChange={(e) => handleValueChange('leaves', 'annualLeaveAllocation', parseInt(e.target.value) || 0)}
                  />
                  <span className="field-desc">Standard yearly allocation for department employees.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="sickLeaveAllocation">Sick Leave Allocation (Days)</label>
                  <input
                    id="sickLeaveAllocation"
                    type="number"
                    min="0"
                    max="50"
                    value={settings.leaves.sickLeaveAllocation}
                    onChange={(e) => handleValueChange('leaves', 'sickLeaveAllocation', parseInt(e.target.value) || 0)}
                  />
                  <span className="field-desc">Standard medical leave allocation per year.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="casualLeaveAllocation">Casual Leave Allocation (Days)</label>
                  <input
                    id="casualLeaveAllocation"
                    type="number"
                    min="0"
                    max="50"
                    value={settings.leaves.casualLeaveAllocation}
                    onChange={(e) => handleValueChange('leaves', 'casualLeaveAllocation', parseInt(e.target.value) || 0)}
                  />
                  <span className="field-desc">Discretionary personal time off allocation.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="absenceEscalationTiming">Absence Escalation (Hours)</label>
                  <select
                    id="absenceEscalationTiming"
                    value={settings.leaves.absenceEscalationTiming}
                    onChange={(e) => handleValueChange('leaves', 'absenceEscalationTiming', parseInt(e.target.value))}
                  >
                    <option value="24">24 Hours</option>
                    <option value="48">48 Hours</option>
                    <option value="72">72 Hours</option>
                    <option value="96">96 Hours</option>
                  </select>
                  <span className="field-desc">Hours elapsed before pending requests escalate.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="emergencyLeaveHandling">Emergency Leave Handling</label>
                  <select
                    id="emergencyLeaveHandling"
                    value={settings.leaves.emergencyLeaveHandling}
                    onChange={(e) => handleValueChange('leaves', 'emergencyLeaveHandling', e.target.value)}
                  >
                    <option value="auto_approve">Auto-Approve (Manager notified)</option>
                    <option value="fast_track">Fast-Track Review</option>
                    <option value="standard">Standard Approval</option>
                  </select>
                  <span className="field-desc">Process for handling urgent leave requests.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Half-Day Leave Option</h4>
                    <p className="settings-switch-desc">Allow employees to request single-session half-day leaves.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.leaves.halfDayPermissions}
                      onChange={() => handleCheckboxChange('leaves', 'halfDayPermissions')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Leave Carry-Forward</h4>
                    <p className="settings-switch-desc">Allow employees to carry forward unused leaves to the next fiscal year.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.leaves.carryForward}
                      onChange={() => handleCheckboxChange('leaves', 'carryForward')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Overlapping Leave Warning</h4>
                    <p className="settings-switch-desc">Show dynamic alerts if someone else in the department is out on identical dates.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.leaves.overlappingLeaveWarning}
                      onChange={() => handleCheckboxChange('leaves', 'overlappingLeaveWarning')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Uninformed Absence Alerts</h4>
                    <p className="settings-switch-desc">Trigger immediate notifications for no-shows without leave applications.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.leaves.uninformedAbsenceAlerts}
                      onChange={() => handleCheckboxChange('leaves', 'uninformedAbsenceAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE SETTINGS */}
          {activeTab === 'attendance' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Attendance Settings</h3>
                <p>Define operational rosters, tracking grace timings, and review scopes.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="graceTiming">Attendance Grace Minutes</label>
                  <input
                    id="graceTiming"
                    type="number"
                    min="0"
                    max="120"
                    value={settings.attendance.graceTiming}
                    onChange={(e) => handleValueChange('attendance', 'graceTiming', parseInt(e.target.value) || 0)}
                  />
                  <span className="field-desc">Allowed late minutes before clock-in gets flagged as late.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="attendanceLockTiming">Attendance Lock Window (Days)</label>
                  <input
                    id="attendanceLockTiming"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.attendance.attendanceLockTiming}
                    onChange={(e) => handleValueChange('attendance', 'attendanceLockTiming', parseInt(e.target.value) || 0)}
                  />
                  <span className="field-desc">Number of days after which past attendance records cannot be modified.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="shiftVisibility">Shift Visibility</label>
                  <select
                    id="shiftVisibility"
                    value={settings.attendance.shiftVisibility}
                    onChange={(e) => handleValueChange('attendance', 'shiftVisibility', e.target.value)}
                  >
                    <option value="all">Company-wide</option>
                    <option value="department">Department Only</option>
                    <option value="team">Direct Team Only</option>
                  </select>
                  <span className="field-desc">Control who can view individual shift assignments.</span>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Overtime Visibility</h4>
                    <p className="settings-switch-desc">Allow employees to view accumulated extra hours inside their dashboard panel.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.attendance.overtimeVisibility}
                      onChange={() => handleCheckboxChange('attendance', 'overtimeVisibility')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Attendance Reminders</h4>
                    <p className="settings-switch-desc">Send automated reminders to clock in/out at start/end of shifts.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.attendance.attendanceReminders}
                      onChange={() => handleCheckboxChange('attendance', 'attendanceReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Late Check-in Alerts</h4>
                    <p className="settings-switch-desc">Notify managers instantly when an employee exceeds the grace period.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.attendance.lateCheckInAlerts}
                      onChange={() => handleCheckboxChange('attendance', 'lateCheckInAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SETTINGS */}
          {activeTab === 'notifications' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Email & Mobile Notifications</h3>
                <p>Toggle alert dispatch rules for core module interactions.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Leave Approval Emails</h4>
                    <p className="settings-switch-desc">Send email copies of leave approvals and rejections.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.leaveApprovalEmails}
                      onChange={() => handleCheckboxChange('notifications', 'leaveApprovalEmails')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Attendance Alerts</h4>
                    <p className="settings-switch-desc">Receive push notifications for irregular clock-ins.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.attendanceAlerts}
                      onChange={() => handleCheckboxChange('notifications', 'attendanceAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Planner Reminders</h4>
                    <p className="settings-switch-desc">Daily digest of upcoming department events and meetings.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.plannerReminders}
                      onChange={() => handleCheckboxChange('notifications', 'plannerReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
                
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Payroll Notifications</h4>
                    <p className="settings-switch-desc">Alerts when payslips are generated or payroll review is needed.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.payrollNotifications}
                      onChange={() => handleCheckboxChange('notifications', 'payrollNotifications')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">SMS Alerts</h4>
                    <p className="settings-switch-desc">Enable critical alerts via SMS (carrier charges may apply).</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsAlerts}
                      onChange={() => handleCheckboxChange('notifications', 'smsAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Shift Reminders</h4>
                    <p className="settings-switch-desc">Notifications for upcoming shift changes or rotations.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.shiftReminders}
                      onChange={() => handleCheckboxChange('notifications', 'shiftReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Announcement Alerts</h4>
                    <p className="settings-switch-desc">Broadcast notifications for new company-wide announcements.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.announcementAlerts}
                      onChange={() => handleCheckboxChange('notifications', 'announcementAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Quiet Hours</h4>
                    <p className="settings-switch-desc">Mute all non-critical notifications outside of standard business hours.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications.quietHours}
                      onChange={() => handleCheckboxChange('notifications', 'quietHours')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PEOPLE HR ACCESS CONTROLS */}
          {activeTab === 'peopleAccess' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>People HR Access Controls</h3>
                <p>Manage data privacy, export restrictions, and visibility limits for your department.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="employeeDataVisibility">Employee Data Visibility</label>
                  <select
                    id="employeeDataVisibility"
                    value={settings.peopleAccess.employeeDataVisibility}
                    onChange={(e) => handleValueChange('peopleAccess', 'employeeDataVisibility', e.target.value)}
                  >
                    <option value="all">Company Directory</option>
                    <option value="department">Department Only</option>
                    <option value="team">Direct Reports Only</option>
                  </select>
                  <span className="field-desc">Control which employee profiles your team leaders can view.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="accessAttendanceVisibility">Attendance Visibility</label>
                  <select
                    id="accessAttendanceVisibility"
                    value={settings.peopleAccess.attendanceVisibility}
                    onChange={(e) => handleValueChange('peopleAccess', 'attendanceVisibility', e.target.value)}
                  >
                    <option value="department">Department-wide</option>
                    <option value="team">Team-scoped</option>
                    <option value="self">Self Only</option>
                  </select>
                  <span className="field-desc">Level of access granted for viewing other colleagues' attendance records.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="accessPlannerVisibility">Planner Visibility</label>
                  <select
                    id="accessPlannerVisibility"
                    value={settings.peopleAccess.plannerVisibility}
                    onChange={(e) => handleValueChange('peopleAccess', 'plannerVisibility', e.target.value)}
                  >
                    <option value="department">Department-wide</option>
                    <option value="team">Team-scoped</option>
                  </select>
                  <span className="field-desc">Define planner event transparency within the department.</span>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Department-Only Access Lock</h4>
                    <p className="settings-switch-desc">Restrict all HR module data access strictly to users within the same department.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.peopleAccess.departmentOnlyAccess}
                      onChange={() => handleCheckboxChange('peopleAccess', 'departmentOnlyAccess')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Data Export Restrictions</h4>
                    <p className="settings-switch-desc">Prevent team members from exporting HR lists (CSV/PDF) without approval.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.peopleAccess.exportRestrictions}
                      onChange={() => handleCheckboxChange('peopleAccess', 'exportRestrictions')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Salary Visibility Restrictions</h4>
                    <p className="settings-switch-desc">Hide all salary and compensation data from lower-level reporting lines.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.peopleAccess.salaryVisibilityRestrictions}
                      onChange={() => handleCheckboxChange('peopleAccess', 'salaryVisibilityRestrictions')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Restricted Employee Records</h4>
                    <p className="settings-switch-desc">Enable strict privacy mode for executive or confidential employee profiles.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.peopleAccess.restrictedEmployeeRecords}
                      onChange={() => handleCheckboxChange('peopleAccess', 'restrictedEmployeeRecords')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PAYROLL PREFERENCES */}
          {activeTab === 'payroll' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Payroll Preferences</h3>
                <p>Configure visibility and review alerts for departmental payroll operations.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Payslip Visibility</h4>
                    <p className="settings-switch-desc">Allow employees to view and download their monthly payslips from the portal.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.payroll.payslipVisibility}
                      onChange={() => handleCheckboxChange('payroll', 'payslipVisibility')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Overtime Pay Display</h4>
                    <p className="settings-switch-desc">Show estimated overtime earnings in real-time on employee dashboards.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.payroll.overtimeDisplay}
                      onChange={() => handleCheckboxChange('payroll', 'overtimeDisplay')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Payroll Cutoff Reminders</h4>
                    <p className="settings-switch-desc">Send automated alerts 3 days prior to the payroll processing cutoff date.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.payroll.payrollCutoffReminders}
                      onChange={() => handleCheckboxChange('payroll', 'payrollCutoffReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Payroll Review Notifications</h4>
                    <p className="settings-switch-desc">Notify managers when the preliminary payroll sheet is ready for departmental review.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.payroll.payrollReviewNotifications}
                      onChange={() => handleCheckboxChange('payroll', 'payrollReviewNotifications')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Bonus Visibility</h4>
                    <p className="settings-switch-desc">Show pending departmental bonuses or variable pay before final payout.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.payroll.bonusVisibility}
                      onChange={() => handleCheckboxChange('payroll', 'bonusVisibility')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Attendance Sync Verification</h4>
                    <p className="settings-switch-desc">Require explicit manager sign-off before attendance data is passed to payroll.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.payroll.attendanceSyncVerification}
                      onChange={() => handleCheckboxChange('payroll', 'attendanceSyncVerification')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* OFFBOARDING PREFERENCES */}
          {activeTab === 'offboarding' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Offboarding Preferences</h3>
                <p>Manage exit protocols, checklists, and documentation visibility.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="reminderTiming">Exit Interview Reminder Timing</label>
                  <select
                    id="reminderTiming"
                    value={settings.offboarding.reminderTiming}
                    onChange={(e) => handleValueChange('offboarding', 'reminderTiming', e.target.value)}
                  >
                    <option value="1_day">1 Day Before Exit</option>
                    <option value="3_days">3 Days Before Exit</option>
                    <option value="7_days">7 Days Before Exit</option>
                  </select>
                  <span className="field-desc">When to send the automated exit interview prompt.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="exitDocumentationVisibility">Exit Documentation Visibility</label>
                  <select
                    id="exitDocumentationVisibility"
                    value={settings.offboarding.exitDocumentationVisibility}
                    onChange={(e) => handleValueChange('offboarding', 'exitDocumentationVisibility', e.target.value)}
                  >
                    <option value="department">Department Management</option>
                    <option value="hr_only">HR & System Admins Only</option>
                  </select>
                  <span className="field-desc">Who can view the submitted exit checklists and docs.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Exit Interview Reminders</h4>
                    <p className="settings-switch-desc">Enable automated alerts for pending exit interviews.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.offboarding.exitInterviewReminders}
                      onChange={() => handleCheckboxChange('offboarding', 'exitInterviewReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Asset Return Tracking Visibility</h4>
                    <p className="settings-switch-desc">Show asset recovery status on the department offboarding dashboard.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.offboarding.assetReturnTracking}
                      onChange={() => handleCheckboxChange('offboarding', 'assetReturnTracking')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Resignation Notification Alerts</h4>
                    <p className="settings-switch-desc">Notify the team leader and manager immediately when a resignation is filed.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.offboarding.resignationAlerts}
                      onChange={() => handleCheckboxChange('offboarding', 'resignationAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Clearance Checklist Visibility</h4>
                    <p className="settings-switch-desc">Allow team leaders to view the offboarding clearance status of their reports.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.offboarding.clearanceChecklistVisibility}
                      onChange={() => handleCheckboxChange('offboarding', 'clearanceChecklistVisibility')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Offboarding Approval Notifications</h4>
                    <p className="settings-switch-desc">Receive prompts for pending clearance steps that require your approval.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.offboarding.offboardingApprovalNotifications}
                      onChange={() => handleCheckboxChange('offboarding', 'offboardingApprovalNotifications')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Final Working Day Reminder</h4>
                    <p className="settings-switch-desc">Automatic reminder on the employee's final working day to ensure smooth handover.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.offboarding.finalWorkingDayReminder}
                      onChange={() => handleCheckboxChange('offboarding', 'finalWorkingDayReminder')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Department Exit Alerts</h4>
                    <p className="settings-switch-desc">Automatically notify department members when an employee completes offboarding.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.offboarding.departmentExitAlerts}
                      onChange={() => handleCheckboxChange('offboarding', 'departmentExitAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & PRIVACY PREFERENCES */}
          {activeTab === 'securityPrivacy' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Security & Privacy</h3>
                <p>Manage data protection, visibility restrictions, and operational security.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="restrictAttendanceVisibility">Restrict Attendance Visibility</label>
                  <select
                    id="restrictAttendanceVisibility"
                    value={settings.securityPrivacy.restrictAttendanceVisibility}
                    onChange={(e) => handleValueChange('securityPrivacy', 'restrictAttendanceVisibility', e.target.value)}
                  >
                    <option value="department">Department Only</option>
                    <option value="team">Direct Team Only</option>
                    <option value="self">Strict (Self/Managers Only)</option>
                  </select>
                  <span className="field-desc">Limit peer visibility of clock-ins to specific scopes.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="plannerPrivacyScope">Planner Privacy Scope</label>
                  <select
                    id="plannerPrivacyScope"
                    value={settings.securityPrivacy.plannerPrivacyScope}
                    onChange={(e) => handleValueChange('securityPrivacy', 'plannerPrivacyScope', e.target.value)}
                  >
                    <option value="department">Department Visibility</option>
                    <option value="team">Team-Only Visibility</option>
                    <option value="restricted">Restricted (Busy/Free Only)</option>
                  </select>
                  <span className="field-desc">How calendar events are displayed to non-authorized viewers.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Hide Salary Information</h4>
                    <p className="settings-switch-desc">Restrict salary and payroll data visibility from all non-essential views.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.hideSalaryInfo}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'hideSalaryInfo')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Employee Contact Privacy</h4>
                    <p className="settings-switch-desc">Hide personal employee contact details (phone, personal email) from the general directory.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.employeeContactPrivacy}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'employeeContactPrivacy')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Sensitive Data Warning</h4>
                    <p className="settings-switch-desc">Show a mandatory acknowledgment prompt before accessing highly confidential HR records.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.sensitiveDataWarning}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'sensitiveDataWarning')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Data Export Restriction</h4>
                    <p className="settings-switch-desc">Block unauthorized bulk export (CSV/PDF) of department data arrays.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.exportRestrictionToggle}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'exportRestrictionToggle')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Login Session Reminder</h4>
                    <p className="settings-switch-desc">Trigger alert notifications on suspicious activity or approaching session timeouts.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.loginSessionReminder}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'loginSessionReminder')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Restricted Employee Records</h4>
                    <p className="settings-switch-desc">Enable strict privacy mode for executives, contractors, or confidential profiles.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.restrictedEmployeeRecords}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'restrictedEmployeeRecords')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Leave Privacy Visibility</h4>
                    <p className="settings-switch-desc">Hide the specific reasons for employee leaves from broader team calendars.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.leavePrivacyVisibility}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'leavePrivacyVisibility')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Audit Tracking Preference</h4>
                    <p className="settings-switch-desc">Record and display visibility of who accessed sensitive department actions.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.securityPrivacy.auditPreferenceToggle}
                      onChange={() => handleCheckboxChange('securityPrivacy', 'auditPreferenceToggle')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Dashboard Preferences</h3>
                <p>Customize the look, density, and default behaviors for your workspace.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="dashboardDensity">Dashboard Density</label>
                  <select
                    id="dashboardDensity"
                    value={settings.preferences.dashboardDensity}
                    onChange={(e) => handleValueChange('preferences', 'dashboardDensity', e.target.value)}
                  >
                    <option value="comfortable">Comfortable (Spacious)</option>
                    <option value="compact">Compact (Data-dense)</option>
                  </select>
                  <span className="field-desc">Control the spacing and sizing of UI elements.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="defaultView">Default Startup View</label>
                  <select
                    id="defaultView"
                    value={settings.preferences.defaultView}
                    onChange={(e) => handleValueChange('preferences', 'defaultView', e.target.value)}
                  >
                    <option value="dashboard">Overview Dashboard</option>
                    <option value="planner">Department Planner</option>
                    <option value="attendance">Attendance Roster</option>
                  </select>
                  <span className="field-desc">The default screen opened after logging in.</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="settings-save-bar">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ minWidth: '130px' }}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="settings-toast">
          <i className="fa-solid fa-circle-check" style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
};

export default Settings;
