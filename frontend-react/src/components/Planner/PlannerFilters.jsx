import React, { useMemo } from 'react';

const PlannerFilters = ({ filters, setFilters, filterOptions }) => {
  const { offices = [], departments = [], employees = [] } = filterOptions || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const next = { ...prev, [name]: value };
      // Clear selected employee if office/department changes and they don't match anymore
      if (name === 'office' || name === 'department') {
        next.employee_id = '';
      }
      return next;
    });
  };

  // Filter employees dropdown
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (filters.office && emp.office !== filters.office) return false;
      if (filters.department && emp.department !== filters.department) return false;
      return true;
    });
  }, [employees, filters.office, filters.department]);

  return (
    <div className="planner-filters">
      {/* Office Hier Filter */}
      {offices.length > 0 && (
        <select 
          name="office" 
          value={filters.office || ''} 
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">All Offices</option>
          {offices.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

      {/* Department Hier Filter */}
      {departments.length > 0 && (
        <select 
          name="department" 
          value={filters.department || ''} 
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}

      {/* Employee Hier Filter */}
      {employees.length > 0 && (
        <select 
          name="employee_id" 
          value={filters.employee_id || ''} 
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">All Employees</option>
          {filteredEmployees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.full_name}</option>
          ))}
        </select>
      )}

      {/* Event Type Filter */}
      <select 
        name="type" 
        value={filters.type} 
        onChange={handleChange}
        className="filter-select"
      >
        <option value="all">All Event Types</option>
        <option value="Leave">Leave</option>
        <option value="Meeting">Meeting</option>
        <option value="WFH">WFH</option>
        <option value="Shift">Shift</option>
        <option value="Holiday">Holiday</option>
        <option value="Other">Other</option>
      </select>

      {/* Event Status Filter */}
      <select 
        name="status" 
        value={filters.status} 
        onChange={handleChange}
        className="filter-select"
      >
        <option value="all">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
      </select>
    </div>
  );
};

export default PlannerFilters;
