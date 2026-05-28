import React from 'react';

const PlannerDayDetailsModal = ({ 
  isOpen, 
  onClose, 
  date, 
  dayData, 
  role, 
  currentUserId,
  onUnlockLock, 
  onApproveEvent, 
  onOpenLockForm, 
  onOpenShiftForm, 
  onOpenEventForm 
}) => {
  if (!isOpen || !date) return null;

  const { holiday, lock, shift, events } = dayData;
  const isManagerOrAdmin = ['admin', 'super_admin', 'manager', 'team_leader'].includes(role?.toLowerCase());

  const handleApprove = async (eventId, approve) => {
    onApproveEvent(eventId, approve ? 'Approved' : 'Rejected');
  };

  return (
    <div className="planner-modal-overlay" onClick={onClose}>
      <div className="planner-modal" onClick={e => e.stopPropagation()}>
        <div className="planner-modal-header">
          <h3 className="planner-modal-title">Details for {date.toLocaleDateString()}</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* HOLIDAY SECTION */}
          {holiday && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#10b981' }}>Holiday</strong>
                <span className="badge badge-holiday">Public</span>
              </div>
              <h4 style={{ margin: '6px 0 2px 0' }}>{holiday.title}</h4>
              {holiday.description && <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{holiday.description}</p>}
            </div>
          )}

          {/* LOCK SECTION */}
          {lock && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#ef4444' }}>Locked Date Range</strong>
                <span className="badge badge-lock">{lock.scope} Scope</span>
              </div>
              <h4 style={{ margin: '6px 0 2px 0' }}>{lock.title}</h4>
              {lock.reason && <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', opacity: 0.8 }}>Reason: {lock.reason}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', opacity: 0.7 }}>
                <span>Locked by: {lock.locked_by_username || 'Admin'}</span>
                
                {/* Unlock trigger */}
                {(role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'super_admin' || lock.locked_by === currentUserId) && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444' }}
                    onClick={() => onUnlockLock(lock.id)}
                  >
                    Unlock Range
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SHIFT SECTION */}
          {shift && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#d97706' }}>Assigned Shift</strong>
                <span className="badge badge-shift" style={{ backgroundColor: shift.color_code || '#f59e0b', color: '#fff' }}>
                  {shift.recurring_pattern || 'Fixed'}
                </span>
              </div>
              <h4 style={{ margin: '6px 0 2px 0' }}>{shift.shift_name}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Hours: {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}</p>
            </div>
          )}

          {/* EVENTS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '8px 0 4px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '4px' }}>
              Events & Bookings ({events.length})
            </h4>
            
            {events.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6, fontStyle: 'italic' }}>No events scheduled for this day.</p>
            ) : (
              events.map(evt => (
                <div 
                  key={evt.id} 
                  style={{ 
                    borderLeft: `4px solid ${evt.color_code || '#3b82f6'}`, 
                    padding: '8px 12px', 
                    background: 'rgba(0,0,0,0.02)', 
                    borderRadius: '0 8px 8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{evt.title} <span style={{ fontWeight: 'normal', fontSize: '0.8rem', opacity: 0.7 }}>({evt.event_type})</span></strong>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        background: evt.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: evt.status === 'Approved' ? '#10b981' : '#d97706'
                      }}
                    >
                      {evt.status}
                    </span>
                  </div>
                  {evt.description && <p style={{ margin: 0, fontSize: '0.85rem' }}>{evt.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>
                    <span>By: {evt.employee_name || evt.employee_username}</span>
                    
                    {/* Approve / Reject buttons */}
                    {evt.status !== 'Approved' && isManagerOrAdmin && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#dc2626' }}
                          onClick={() => handleApprove(evt.id, false)}
                        >
                          Reject
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => handleApprove(evt.id, true)}
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Action Panel */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {isManagerOrAdmin && (
            <>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                onClick={() => onOpenLockForm(date)}
              >
                🔒 Lock Dates
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => onOpenShiftForm(date)}
              >
                📅 Assign Shift
              </button>
            </>
          )}
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => onOpenEventForm(date)}
            disabled={!!lock}
            title={lock ? "Dates are locked" : ""}
          >
            + Book / Add Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlannerDayDetailsModal;
