import React from 'react';

const PlannerToolbar = ({ 
  viewMode, 
  setViewMode, 
  currentDate, 
  setCurrentDate, 
  currentYear, 
  setCurrentYear, 
  onAddEvent,
  onAddLock,
  onAddShift,
  role 
}) => {
  const isManagerOrAdmin = ['admin', 'super_admin', 'manager', 'team_leader'].includes(role?.toLowerCase());

  const handlePrev = () => {
    if (viewMode === 'year') {
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'year') {
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const displayTitle = viewMode === 'year' 
    ? `Year ${currentYear}`
    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="planner-toolbar">
      <div className="planner-toolbar-controls">
        <button className="btn btn-secondary" onClick={handlePrev}>&lt; Prev</button>
        <span style={{ margin: '0 15px', fontWeight: 'bold', fontSize: '1.2em', minWidth: '150px', textAlign: 'center' }}>
          {displayTitle}
        </span>
        <button className="btn btn-secondary" onClick={handleNext}>Next &gt;</button>
      </div>

      <div className="planner-toolbar-controls">
        {/* Month/Year View Toggle */}
        <div className="view-toggle-pill">
          <button 
            type="button" 
            className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button 
            type="button" 
            className={`view-toggle-btn ${viewMode === 'year' ? 'active' : ''}`}
            onClick={() => setViewMode('year')}
          >
            Year
          </button>
        </div>

        {/* Action triggers */}
        {isManagerOrAdmin && (
          <>
            <button className="btn btn-secondary" style={{ borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }} onClick={onAddLock}>
              🔒 Lock Dates
            </button>
            <button className="btn btn-secondary" onClick={onAddShift}>
              📅 Assign Shift
            </button>
          </>
        )}
        <button className="btn btn-primary" onClick={onAddEvent}>
          + Add Event
        </button>
      </div>
    </div>
  );
};

export default PlannerToolbar;
