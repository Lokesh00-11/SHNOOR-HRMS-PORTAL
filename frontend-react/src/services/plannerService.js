import { get, post, patch, del } from './api';

export const plannerService = {
  getMyEvents: async () => {
    return await get('/planner/my-events/');
  },
  
  getTeamEvents: async () => {
    return await get('/planner/team-events/');
  },
  
  getDepartmentEvents: async () => {
    return await get('/planner/department-events/');
  },
  
  getAllEvents: async () => {
    return await get('/planner/all-events/');
  },
  
  getHolidays: async () => {
    return await get('/planner/holidays/');
  },
  
  getCalendarFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await get(`/planner/calendar-feed/${query ? `?${query}` : ''}`);
  },
  
  createEvent: async (eventData) => {
    return await post('/planner/create-event/', eventData);
  },
  
  approveEvent: async (id, data) => {
    return await patch(`/planner/approve-event/${id}/`, data);
  },

  getFilters: async () => {
    return await get('/planner/filters/');
  },

  lockDates: async (lockData) => {
    return await post('/planner/lock/', lockData);
  },

  unlockDates: async (id) => {
    return await del(`/planner/unlock/${id}/`);
  },

  getShifts: async () => {
    return await get('/planner/shifts/');
  },

  createShift: async (shiftData) => {
    return await post('/planner/shifts/', shiftData);
  },

  createHoliday: async (holidayData) => {
    return await post('/planner/holidays/create/', holidayData);
  }
};
