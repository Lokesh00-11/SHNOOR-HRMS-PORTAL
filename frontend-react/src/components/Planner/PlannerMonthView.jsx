import React from 'react';

const PlannerMonthView = ({ currentDate, events, holidays, locks, shifts, onEventClick, onDayClick }) => {
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

  const normalizeDateString = (d) => {
    if (!d) return null;
    const parts = d.split('T')[0].split('-');
    if (parts.length !== 3) return null;
    if (parts[0].length === 4) return parts.join('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const getDayItems = (date) => {
    if (!date) return [];
    const yearVal = date.getFullYear();
    const monthVal = String(date.getMonth() + 1).padStart(2, '0');
    const dayVal = String(date.getDate()).padStart(2, '0');
    const dateString = `${yearVal}-${monthVal}-${dayVal}`;

    const items = [];

    // 1. Holidays
    if (holidays) {
      holidays.forEach(h => {
        const hDate = normalizeDateString(h.holiday_date);
        if (hDate === dateString) {
          items.push({
            type: 'holiday',
            title: h.title,
            color: h.color_code || '#10b981',
            raw: h
          });
        }
      });
    }

    // 2. Locks
    if (locks) {
      locks.forEach(l => {
        if (!l.is_active) return;
        const start = normalizeDateString(l.start_date);
        const end = normalizeDateString(l.end_date) || start;
        if (start && dateString >= start && dateString <= end) {
          items.push({
            type: 'lock',
            title: `Locked: ${l.title}`,
            color: '#dc2626',
            role: l.locked_by_role,
            creator: l.locked_by_name || l.locked_by_username,
            reason: l.reason,
            raw: l
          });
        }
      });
    }

    // 3. Shifts
    if (shifts) {
      shifts.forEach(s => {
        let isShiftActive = false;
        if (s.recurring_pattern === 'Rotating' && s.rotation_start_date) {
          const startRaw = normalizeDateString(s.rotation_start_date);
          if (startRaw) {
            const start = new Date(startRaw);
            const current = new Date(dateString);
            const diffTime = current - start;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) {
              const cycleDay = diffDays % (s.rotation_cycle_days || 7);
              isShiftActive = cycleDay < 5;
            }
          }
        } else {
          isShiftActive = true;
        }

        if (isShiftActive) {
          items.push({
            type: 'shift',
            title: `Shift: ${s.shift_name} (${s.start_time.substring(0, 5)}-${s.end_time.substring(0, 5)})`,
            color: s.color_code || '#d97706',
            raw: s
          });
        }
      });
    }

    // 4. Events
    if (events) {
      events.forEach(e => {
        if (e.holiday_date) return;
        const start = normalizeDateString(e.start_date);
        const end = normalizeDateString(e.end_date) || start;
        if (start && dateString >= start && dateString <= end) {
          items.push({
            type: 'event',
            title: e.title,
            color: e.color_code || '#2563eb',
            role: e.created_by_role,
            creator: e.created_by_name || e.created_by_username,
            visibility: e.visibility,
            eventType: e.event_type,
            raw: e
          });
        }
      });
    }

    return items;
  };

  return (
    <div className="planner-calendar">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="calendar-header">{day}</div>
      ))}
      
      {days.map((date, index) => {
        const dayItems = getDayItems(date);
        return (
          <div 
            key={index} 
            className="calendar-day"
            style={{ cursor: date ? 'pointer' : 'default' }}
            onClick={(e) => {
              if (date && onDayClick && !e.target.closest('.planner-event-card')) {
                onDayClick(date);
              }
            }}
          >
            {date && (
              <>
                <div className="calendar-day-number">{date.getDate()}</div>
                <div className="calendar-events" style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', maxHeight: '90px' }}>
                  {dayItems.map((item, i) => {
                    let badge = '';
                    let tooltip = item.title;
                    if (item.type === 'holiday') {
                      badge = '🌴';
                    } else if (item.type === 'lock') {
                      badge = '🔒';
                      const roleName = item.role ? item.role.replace('_', ' ').toUpperCase() : 'ADMIN';
                      tooltip += `\nLocked by: ${item.creator || 'System'} (${roleName})\nReason: ${item.reason || 'N/A'}`;
                    } else if (item.type === 'shift') {
                      badge = '⏰';
                    } else if (item.type === 'event') {
                      if (item.eventType === 'Leave') badge = '🤒';
                      else if (item.eventType === 'WFH') badge = '🏠';
                      else if (item.eventType === 'Meeting') badge = '💬';
                      else badge = '📅';

                      if (item.creator) {
                        const roleName = item.role ? item.role.replace('_', ' ').toUpperCase() : 'EMPLOYEE';
                        tooltip += `\nCreated by: ${item.creator} (${roleName})\nVisibility: ${item.visibility}`;
                      }
                    }

                    return (
                      <div 
                        key={i} 
                        className={`planner-event-card planner-item-${item.type}`}
                        style={{ 
                          '--event-bg': item.color 
                        }}
                        title={tooltip}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEventClick) onEventClick(item.raw);
                        }}
                      >
                        <span>{badge}</span>
                        <span className="planner-event-title">{item.title}</span>
                      </div>
                    );
                  })}
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
