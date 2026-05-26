import React, { useMemo } from 'react';


const DayCell = React.memo(({ date, today, holiday, lock, shift, events, onClick }) => {
  if (!date) {
    return <div className="mini-day-cell empty"></div>;
  }

  const isToday = today.getDate() === date.getDate() &&
                  today.getMonth() === date.getMonth() &&
                  today.getFullYear() === date.getFullYear();

  
  let cellClass = 'mini-day-cell';
  if (isToday) cellClass += ' day-today';
  if (holiday) cellClass += ' day-holiday';
  if (lock) cellClass += ' day-locked';
  if (shift) cellClass += ' day-shift';

  const style = shift ? { '--shift-color': shift.color_code || '#f59e0b' } : {};

  return (
    <div 
      className={cellClass} 
      style={style}
      onClick={() => onClick(date, { holiday, lock, shift, events })}
      title={`${date.toLocaleDateString()}${holiday ? `\nHoliday: ${holiday.title}` : ''}${lock ? `\nLocked: ${lock.title} (${lock.reason || 'No reason'})` : ''}${shift ? `\nShift: ${shift.shift_name}` : ''}${events.length ? `\nEvents: ${events.length}` : ''}`}
    >
      {date.getDate()}
      {events.length > 0 && !lock && !holiday && (
        <div className="day-dots">
          {events.slice(0, 3).map((evt, i) => (
            <span 
              key={i} 
              className="day-dot" 
              style={{ backgroundColor: evt.color_code || '#3b82f6' }}
            ></span>
          ))}
        </div>
      )}
    </div>
  );
});

DayCell.displayName = 'DayCell';

const PlannerYearView = ({ currentYear, events, holidays, locks, shifts, onDayClick }) => {
  const months = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const today = useMemo(() => new Date(), []);

  const normalizeDateString = (d) => {
    if (!d) return null;
    const parts = d.split('T')[0].split('-');
    if (parts.length !== 3) return null;
    if (parts[0].length === 4) return parts.join('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const getDayAttributes = (date) => {
    if (!date) return { holiday: null, lock: null, shift: null, dayEvents: [] };

    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Find Holiday
    const holiday = holidays.find(h => {
      const hDate = normalizeDateString(h.holiday_date);
      if (!hDate) return false;
      return hDate === dateString;
    });

    // Find Lock
    const lock = locks.find(l => {
      if (!l.is_active) return false;
      const start = normalizeDateString(l.start_date);
      if (!start) return false;
      const end = normalizeDateString(l.end_date) || start;
      return dateString >= start && dateString <= end;
    });

    // Find Shift 
    const shift = shifts.find(s => {
      if (s.recurring_pattern === 'Rotating' && s.rotation_start_date) {
        const startRaw = normalizeDateString(s.rotation_start_date);
        if (!startRaw) return false;
        const start = new Date(startRaw);
        const current = new Date(dateString);
        const diffTime = current - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          const cycleDay = diffDays % (s.rotation_cycle_days || 7);
          return cycleDay < 5;
        }
        return false;
      }
      
      const start = normalizeDateString(s.start_date);
      if (!start) return false;
      const end = normalizeDateString(s.end_date) || start;
      return dateString >= start && dateString <= end;
    });

    // Find Planner Events
    const dayEvents = events.filter(e => {
      const start = normalizeDateString(e.start_date);
      if (!start) return false;
      const end = normalizeDateString(e.end_date) || start;
      return dateString >= start && dateString <= end;
    });

    return { holiday, lock, shift, dayEvents };
  };

  // Generate date array for a specific month
  const generateMonthDays = (monthIndex) => {
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    const firstDay = new Date(currentYear, monthIndex, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(currentYear, monthIndex, i));
    }
    return cells;
  };

  return (
    <div className="planner-year-grid">
      {months.map((monthName, monthIndex) => {
        const monthDays = generateMonthDays(monthIndex);
        return (
          <div key={monthName} className="mini-month-container">
            <div className="mini-month-title">{monthName} {currentYear}</div>
            <div className="mini-month-days-header">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="mini-month-days-grid">
              {monthDays.map((date, idx) => {
                const attrs = getDayAttributes(date);
                return (
                  <DayCell 
                    key={idx}
                    date={date}
                    today={today}
                    holiday={attrs.holiday}
                    lock={attrs.lock}
                    shift={attrs.shift}
                    events={attrs.dayEvents}
                    onClick={onDayClick}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlannerYearView;
