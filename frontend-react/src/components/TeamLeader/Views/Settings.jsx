import React, { useState, useEffect } from 'react';
import { settingsService } from '../../../services/settingsService';
import '../../../styles/settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('teamPlanner');
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = settingsService.getTeamLeaderSettings();
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
    const success = settingsService.saveTeamLeaderSettings(settings);
    setSaving(false);
    if (success) {
      triggerToast('Team settings saved successfully.');
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
        <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Team Settings</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage preferences, schedules, reminders, and leave controls for your assigned team members.
        </p>
      </div>

      <div className="settings-layout">
        {/* Left Side Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab-btn ${activeTab === 'teamPlanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('teamPlanner')}
          >
            <i className="fa-solid fa-calendar-week"></i>
            Team Planner
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'teamLeave' ? 'active' : ''}`}
            onClick={() => setActiveTab('teamLeave')}
          >
            <i className="fa-solid fa-plane-departure"></i>
            Leaves
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <i className="fa-solid fa-clock"></i>
            Attendance
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'teamNotifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('teamNotifications')}
          >
            <i className="fa-solid fa-bell-concierge"></i>
            Notifications
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
          
          {/* TEAM PLANNER SETTINGS */}
          {activeTab === 'teamPlanner' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Team Planner Preferences</h3>
                <p>Configure team sync timings and event patterns on the team calendar view.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="teamPlannerVisibility">Team Planner Visibility</label>
                  <select
                    id="teamPlannerVisibility"
                    value={settings.teamPlanner.teamPlannerVisibility}
                    onChange={(e) => handleValueChange('teamPlanner', 'teamPlannerVisibility', e.target.value)}
                  >
                    <option value="team">Team Members Only</option>
                    <option value="department">Department Wide</option>
                  </select>
                  <span className="field-desc">Who can see the consolidated team schedule.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="standupTiming">Standup Meeting Time</label>
                  <input
                    id="standupTiming"
                    type="time"
                    value={settings.teamPlanner.standupTiming}
                    onChange={(e) => handleValueChange('teamPlanner', 'standupTiming', e.target.value)}
                  />
                  <span className="field-desc">Scheduled time slot for daily team synchronization updates.</span>
                </div>

                <div className="setting-field">
                  <label htmlFor="calendarPreferences">Calendar Layout</label>
                  <select
                    id="calendarPreferences"
                    value={settings.teamPlanner.calendarPreferences}
                    onChange={(e) => handleValueChange('teamPlanner', 'calendarPreferences', e.target.value)}
                  >
                    <option value="month">Month Calendar view</option>
                    <option value="week">Week Timeline view</option>
                    <option value="list">Agenda agenda list</option>
                  </select>
                  <span className="field-desc">Default layout displaying when your team opens their planner.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Auto-schedule Recurring Meetings</h4>
                    <p className="settings-switch-desc">Inject weekly team check-ins automatically into the shared planner sheet.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamPlanner.recurringMeetings}
                      onChange={() => handleCheckboxChange('teamPlanner', 'recurringMeetings')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
                
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Planner Compact Mode</h4>
                    <p className="settings-switch-desc">Display events in a condensed format to fit more items on the screen.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamPlanner.plannerCompactMode}
                      onChange={() => handleCheckboxChange('teamPlanner', 'plannerCompactMode')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TEAM LEAVE CONTROLS */}
          {activeTab === 'teamLeave' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Team Leave Controls</h3>
                <p>Control transparency and peer indicators for leave dates in your team.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="leaveVisibility">Leave Visibility Scope</label>
                  <select
                    id="leaveVisibility"
                    value={settings.teamLeave.leaveVisibility}
                    onChange={(e) => handleValueChange('teamLeave', 'leaveVisibility', e.target.value)}
                  >
                    <option value="team_only">Visible to team members</option>
                    <option value="none">Private (visible to TL & Managers only)</option>
                  </select>
                  <span className="field-desc">Choose who can see details of a team member's approved leaves.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Overlapping Leave Blockers</h4>
                    <p className="settings-switch-desc">Warn or block if more than 30% of your team applies for leave on overlapping dates.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamLeave.overlapWarnings}
                      onChange={() => handleCheckboxChange('teamLeave', 'overlapWarnings')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Emergency Leave Alerts</h4>
                    <p className="settings-switch-desc">Receive high-priority alerts for urgent unplanned absences.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamLeave.emergencyLeaveAlerts}
                      onChange={() => handleCheckboxChange('teamLeave', 'emergencyLeaveAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Leave Reminder Notifications</h4>
                    <p className="settings-switch-desc">Remind the team when members are scheduled to be away next week.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamLeave.leaveReminderNotifications}
                      onChange={() => handleCheckboxChange('teamLeave', 'leaveReminderNotifications')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE PREFERENCES */}
          {activeTab === 'attendance' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Attendance Preferences</h3>
                <p>Manage how attendance anomalies and shifts are handled for your team.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="shiftVisibility">Shift Visibility</label>
                  <select
                    id="shiftVisibility"
                    value={settings.attendance.shiftVisibility}
                    onChange={(e) => handleValueChange('attendance', 'shiftVisibility', e.target.value)}
                  >
                    <option value="team">Visible to Team</option>
                    <option value="private">Private (Self Only)</option>
                  </select>
                  <span className="field-desc">Whether team members can see each other's specific shifts.</span>
                </div>
              </div>
              
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Attendance Reminders</h4>
                    <p className="settings-switch-desc">Enable automated clock-in/out prompts for team members on active shifts.</p>
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
                    <h4 className="settings-switch-label">Missing Attendance Alerts</h4>
                    <p className="settings-switch-desc">Get notified when a scheduled team member fails to log attendance by mid-day.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.attendance.missingAttendanceAlerts}
                      onChange={() => handleCheckboxChange('attendance', 'missingAttendanceAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Late Check-in Warnings</h4>
                    <p className="settings-switch-desc">Receive a digest of employees who clocked in past the grace period.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.attendance.lateCheckInWarnings}
                      onChange={() => handleCheckboxChange('attendance', 'lateCheckInWarnings')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TEAM NOTIFICATIONS */}
          {activeTab === 'teamNotifications' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Team Notifications</h3>
                <p>Specify events that trigger notifications to you and the team.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Planner Reminders</h4>
                    <p className="settings-switch-desc">Get notified when team members edit scheduled shifts or declare off-days.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamNotifications.plannerReminders}
                      onChange={() => handleCheckboxChange('teamNotifications', 'plannerReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Task Reminders</h4>
                    <p className="settings-switch-desc">Receive updates when team members accept tasks or request code review.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamNotifications.taskReminders}
                      onChange={() => handleCheckboxChange('teamNotifications', 'taskReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Absence Alerts</h4>
                    <p className="settings-switch-desc">Get notified immediately when a team member submits a leave request.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamNotifications.absenceAlerts}
                      onChange={() => handleCheckboxChange('teamNotifications', 'absenceAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Standup Alerts</h4>
                    <p className="settings-switch-desc">Send automated standup prompts to the team before the meeting starts.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamNotifications.standupAlerts}
                      onChange={() => handleCheckboxChange('teamNotifications', 'standupAlerts')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>

                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Meeting Reminders</h4>
                    <p className="settings-switch-desc">General reminders for all scheduled team meetings 10 minutes prior.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.teamNotifications.meetingReminders}
                      onChange={() => handleCheckboxChange('teamNotifications', 'meetingReminders')}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TEAM PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>Team Preferences</h3>
                <p>Customize the default behavior and layout for team tools.</p>
              </div>

              <div className="settings-grid">
                <div className="setting-field">
                  <label htmlFor="defaultPlannerMode">Default Planner Mode</label>
                  <select
                    id="defaultPlannerMode"
                    value={settings.preferences.defaultPlannerMode}
                    onChange={(e) => handleValueChange('preferences', 'defaultPlannerMode', e.target.value)}
                  >
                    <option value="calendar">Calendar View</option>
                    <option value="list">List View</option>
                  </select>
                  <span className="field-desc">Preferred starting layout for the team planner.</span>
                </div>
                
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
                  <label htmlFor="sortingPreferences">Default Sorting</label>
                  <select
                    id="sortingPreferences"
                    value={settings.preferences.sortingPreferences}
                    onChange={(e) => handleValueChange('preferences', 'sortingPreferences', e.target.value)}
                  >
                    <option value="priority">Priority-based</option>
                    <option value="date">Date-based</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                  <span className="field-desc">How lists and tables are ordered by default.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="settings-switch-row">
                  <div className="settings-switch-info">
                    <h4 className="settings-switch-label">Compact View Toggle</h4>
                    <p className="settings-switch-desc">Enable quick-toggle for compact mode across all team data tables.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={settings.preferences.compactViewToggle}
                      onChange={() => handleCheckboxChange('preferences', 'compactViewToggle')}
                    />
                    <span className="settings-slider"></span>
                  </label>
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
