import React from 'react';

const PlannerMonthView = ({ currentDate, events, onEventClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const getEventsForDay = (date) => {
    if (!date) return [];
    return events.filter(e => {
      const dateString = e.start_date || e.holiday_date;
      if (!dateString) return false;
      
      const parts = dateString.split('T')[0].split('-');
      if (parts.length !== 3) return false;

      let year, month, day;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }

      return day === date.getDate() &&
             month === date.getMonth() &&
             year === date.getFullYear();
    });
  };

  return (
    <div className="planner-calendar">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="calendar-header">{day}</div>
      ))}
      
      {days.map((date, index) => {
        const dayEvents = getEventsForDay(date);
        return (
          <div key={index} className="calendar-day">
            {date && (
              <>
                <div className="calendar-day-number">{date.getDate()}</div>
                <div className="calendar-events">
                  {dayEvents.map((evt, i) => (
                    <div 
                      key={i} 
                      className="planner-event-card"
                      style={{ backgroundColor: evt.color_code || '#3b82f6' }}
                      onClick={() => onEventClick && onEventClick(evt)}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlannerMonthView;
