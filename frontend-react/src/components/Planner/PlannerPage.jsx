import React, { useState, useEffect } from 'react';
import PlannerToolbar from './PlannerToolbar';
import PlannerFilters from './PlannerFilters';
import PlannerMonthView from './PlannerMonthView';
import PlannerEventModal from './PlannerEventModal';
import { plannerService } from '../../services/plannerService';
import './Planner.css';

const PlannerPage = ({ role }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', status: 'all' });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await plannerService.getCalendarFeed();
      setEvents(res.events || []);
      setHolidays(res.holidays || []);
    } catch (err) {
      console.error("Failed to load planner feed:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEventSubmit = async (formData) => {
    try {
      await plannerService.createEvent(formData);
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error("Failed to create event:", err);
      alert("Failed to create event.");
    }
  };

  const handleEventClick = (evt) => {
   
    console.log("Clicked event:", evt);
  };

  const filteredEvents = [...events, ...holidays].filter(evt => {
    if (filters.type !== 'all') {
      const typeMatches = (evt.event_type === filters.type) || (filters.type === 'Holiday' && evt.holiday_date);
      if (!typeMatches) return false;
    }
    if (filters.status !== 'all' && evt.status) {
      if (evt.status !== filters.status) return false;
    }
    return true;
  });

  return (
    <div className="planner-container">
      <div className="planner-main">
        <PlannerToolbar 
          currentDate={currentDate} 
          setCurrentDate={setCurrentDate} 
          onAddEvent={() => setIsModalOpen(true)} 
        />
        <PlannerFilters filters={filters} setFilters={setFilters} />
        {loading ? (
          <div>Loading calendar...</div>
        ) : (
          <PlannerMonthView 
            currentDate={currentDate} 
            events={filteredEvents} 
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <PlannerEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddEventSubmit}
        eventTypeOptions={['Meeting', 'Leave', 'WFH', 'Company Event', 'Shift']}
      />
    </div>
  );
};

export default PlannerPage;
