import React from 'react';

const PlannerFilters = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="planner-filters">
  <div className="form-group" style={{ marginBottom: 0 }}>
        <select name="type" value={filters.type} onChange={handleChange}>
        <option value="all">All Event Types</option>
       <option value="Leave">Leave</option>
          <option value="Meeting">Meeting</option>
        <option value="Task Deadline">Task Deadline</option>
          <option value="Holiday">Holiday</option>
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <select name="status" value={filters.status} onChange={handleChange}>
        <option value="all">All Statuses</option>
        <option value="Pending">Pending</option>
    <option value="Approved">Approved</option>
        </select>
      </div>
    </div>
  );
};

export default PlannerFilters;
