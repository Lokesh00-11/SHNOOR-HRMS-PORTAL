import { get, post, patch } from './api';

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
  
  getCalendarFeed: async () => {
    return await get('/planner/calendar-feed/');
  },
  
  createEvent: async (eventData) => {
    return await post ( '/planner/create-event/', eventData);
  },
  
    approveEvent: async (id, data) => {
    return await patch(`/planner/approve-event/${id}/`, data);
  }
};
