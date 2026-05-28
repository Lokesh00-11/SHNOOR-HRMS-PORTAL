import React, { useState, useEffect } from 'react';
import PlannerToolbar from './PlannerToolbar';
import PlannerFilters from './PlannerFilters';
import PlannerMonthView from './PlannerMonthView';
import PlannerYearView from './PlannerYearView';
import PlannerEventModal from './PlannerEventModal';
import PlannerLockModal from './PlannerLockModal';
import PlannerShiftModal from './PlannerShiftModal';
import PlannerDayDetailsModal from './PlannerDayDetailsModal';
import { plannerService } from '../../services/plannerService';
import './Planner.css';

const PlannerPage = ({ role }) => {
  const [viewMode, setViewMode] = useState('year'); // 'month' or 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Data State
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [locks, setLocks] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [feedToken, setFeedToken] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    office: '',
    department: '',
    employee_id: ''
  });
  
  const [filterOptions, setFilterOptions] = useState({
    offices: [],
    departments: [],
    employees: []
  });

  // Modal Visibie State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Details
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState({
    holiday: null,
    lock: null,
    shift: null,
    events: []
  });

  // Fetch hierfilters 
  const fetchFilters = async () => {
    try {
      const data = await plannerService.getFilters();
      setFilterOptions({
        offices: data.offices || [],
        departments: data.departments || [],
        employees: data.employees || []
      });
    } catch (err) {
      console.error("Failed to load hierarchical filter dropdown metadata:", err);
    }
  };

  // Fetch and sync planner 
  const fetchFeed = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.office) params.office = filters.office;
      if (filters.department) params.department = filters.department;
      if (filters.employee_id) params.employee_id = filters.employee_id;

      const res = await plannerService.getCalendarFeed(params);
      setEvents(res.events || []);
      setHolidays(res.holidays || []);
      setLocks(res.locks || []);
      setShifts(res.shifts || []);
      if (res.feed_token) {
        setFeedToken(res.feed_token);
      }
    } catch (err) {
      console.error("Failed to load planner feed data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [filters.office, filters.department, filters.employee_id]);

  // Operations
  const handleAddEventSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        start_date: selectedDate ? selectedDate.toISOString().split('T')[0] : formData.start_date,
        end_date: formData.end_date || (selectedDate ? selectedDate.toISOString().split('T')[0] : formData.start_date)
      };
      await plannerService.createEvent(payload);
      setIsEventModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchFeed();
    } catch (err) {
      console.error("Failed to create event:", err);
      alert(err.message || "Failed to create event. The date might be locked!");
    }
  };

  const handleLockSubmit = async (lockData) => {
    try {
      const payload = {
        ...lockData,
        start_date: selectedDate ? selectedDate.toISOString().split('T')[0] : lockData.start_date,
        end_date: lockData.end_date || (selectedDate ? selectedDate.toISOString().split('T')[0] : lockData.start_date)
      };
      await plannerService.lockDates(payload);
      setIsLockModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchFeed();
    } catch (err) {
      console.error("Failed to lock dates:", err);
      alert(err.message || "Failed to lock date range.");
    }
  };

  const handleShiftSubmit = async (shiftData) => {
    try {
      await plannerService.createShift(shiftData);
      setIsShiftModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchFeed();
    } catch (err) {
      console.error("Failed to assign shift:", err);
      alert(err.message || "Failed to assign shift.");
    }
  };

  const handleUnlockLock = async (lockId) => {
    if (!window.confirm("Are you sure you want to release this date lock?")) return;
    try {
      await plannerService.unlockDates(lockId);
      setIsDetailsModalOpen(false);
      fetchFeed();
    } catch (err) {
      console.error("Failed to unlock dates:", err);
      alert(err.message || "Failed to unlock dates.");
    }
  };

  const handleApproveEvent = async (eventId, status) => {
    try {
      await plannerService.approveEvent(eventId, { status });
      setIsDetailsModalOpen(false);
      fetchFeed();
    } catch (err) {
      console.error("Failed to update event status:", err);
      alert(err.message || "Failed to update event status.");
    }
  };


  const handleDayClick = (date, dayData) => {
    setSelectedDate(date);
    
    if (dayData) {
      setSelectedDayData(dayData);
    } else {
      
      const dateString = date.toISOString().split('T')[0];
      
      const holiday = holidays.find(h => (h.holiday_date ? h.holiday_date.split('T')[0] : '') === dateString);
      const lock = locks.find(l => {
        if (!l.is_active) return false;
        const start = l.start_date ? l.start_date.split('T')[0] : '';
        const end = l.end_date ? l.end_date.split('T')[0] : start;
        return dateString >= start && dateString <= end;
      });
      const shift = shifts.find(s => {
        if (s.recurring_pattern === 'Rotating' && s.rotation_start_date) {
          const start = new Date(s.rotation_start_date.split('T')[0]);
          const current = new Date(dateString);
          const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0) {
            return (diffDays % (s.rotation_cycle_days || 7)) < 5;
          }
          return false;
        }
        return true;
      });
      const dayEvents = events.filter(e => {
        const start = e.start_date ? e.start_date.split('T')[0] : '';
        const end = e.end_date ? e.end_date.split('T')[0] : start;
        return dateString >= start && dateString <= end;
      });

      setSelectedDayData({ holiday, lock, shift, events: dayEvents });
    }
    
    setIsDetailsModalOpen(true);
  };

  const filteredEvents = events.filter(evt => {
    if (filters.type !== 'all' && evt.event_type !== filters.type) return false;
    if (filters.status !== 'all' && evt.status && evt.status !== filters.status) return false;
    return true;
  });

  const filteredHolidays = holidays.filter(evt => {
    if (filters.type !== 'all' && filters.type !== 'Holiday') return false;
    return true;
  });

  const icsFeedUrl = feedToken 
    ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/api/planner/ics/${feedToken}/`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(icsFeedUrl);
    alert("ICS URL copied to clipboard!");
  };

  return (
    <div className="planner-container">
      <div className="planner-main">
        {/* Main Toolbar */}
        <PlannerToolbar 
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentDate={currentDate} 
          setCurrentDate={setCurrentDate}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          role={role}
          onAddEvent={() => { setSelectedDate(null); setIsEventModalOpen(true); }}
          onAddLock={() => { setSelectedDate(null); setIsLockModalOpen(true); }}
          onAddShift={() => { setSelectedDate(null); setIsShiftModalOpen(true); }}
        />

        {/* Selected Employee Header */}
        {filters.employee_id && filterOptions?.employees && (
          <div className="planner-employee-header" style={{
            padding: '12px 24px', 
            background: 'var(--card-bg, rgba(255, 255, 255, 0.05))',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              Viewing Planner: {filterOptions.employees.find(e => e.id.toString() === filters.employee_id.toString())?.full_name || 'Selected Employee'}
            </h3>
          </div>
        )}

        {/* Hierarchical Filters */}
        <PlannerFilters 
          filters={filters} 
          setFilters={setFilters} 
          filterOptions={filterOptions}
        />

        {/* Grid Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.2rem', fontWeight: 600, opacity: 0.7 }}>
            Loading calendar planner assets...
          </div>
        ) : viewMode === 'year' ? (
          <PlannerYearView 
            currentYear={currentYear}
            events={events}
            holidays={holidays}
            locks={locks}
            shifts={shifts}
            onDayClick={handleDayClick}
          />
        ) : (
          <PlannerMonthView 
            currentDate={currentDate} 
            events={filteredEvents} 
            holidays={filteredHolidays}
            locks={locks}
            shifts={shifts}
            onEventClick={(evt) => {
              const dateVal = new Date(evt.start_date || evt.holiday_date || evt.rotation_start_date);
              handleDayClick(dateVal);
            }}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      {/* Modals Layer */}
      <PlannerEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={handleAddEventSubmit}
        eventTypeOptions={['Meeting', 'WFH', 'Shift', 'Other']}
        selectedEmployeeId={filters.employee_id}
        employees={filterOptions?.employees || []}
        role={role}
      />
        
      <PlannerLockModal 
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onSubmit={handleLockSubmit}
        employees={filterOptions?.employees || []}
        departments={filterOptions?.departments || []}
        selectedEmployeeId={filters.employee_id}
        role={role}
      />

      <PlannerShiftModal 
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onSubmit={handleShiftSubmit}
        employees={filterOptions?.employees || []}
        selectedEmployeeId={filters.employee_id}
      />

      <PlannerDayDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        date={selectedDate}
        dayData={selectedDayData}
        role={role}
        onUnlockLock={handleUnlockLock}
        onApproveEvent={handleApproveEvent}
        onOpenLockForm={(date) => { setSelectedDate(date); setIsLockModalOpen(true); }}
        onOpenShiftForm={(date) => { setSelectedDate(date); setIsShiftModalOpen(true); }}
        onOpenEventForm={(date) => { setSelectedDate(date); setIsEventModalOpen(true); }}
      />
    </div>
  );
};

export default PlannerPage;
