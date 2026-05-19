import React from 'react';

const PlannerToolbar = ({ currentDate, setCurrentDate, onAddEvent }) => {
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYearString = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="planner-toolbar">
      <div>
        <button className="btn" onClick={handlePrevMonth}>&lt; Prev</button>
        <span style={{ margin: '0 15px', fontWeight: 'bold', fontSize: '1.2em' }}>{monthYearString}</span>
        <button className="btn" onClick={handleNextMonth}>Next &gt;</button>
      </div>
      <div>
        <button className="btn btn-primary" onClick={onAddEvent}>+ Add Event</button>
      </div>
    </div>
  );
};

export default PlannerToolbar;
