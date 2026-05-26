import React, { useState, useEffect } from 'react';

const PlannerLockModal = ({ isOpen, onClose, onSubmit, employees, departments, selectedEmployeeId, role }) => {
  const [formData, setFormData] = useState({
    title: '',
    reason: '',
    start_date: '',
    end_date: '',
    scope: selectedEmployeeId ? 'Employee' : 'Global',
    department: departments[0] || '',
    office: '',
    affected_employees: selectedEmployeeId ? [selectedEmployeeId] : []
  });

  useEffect(() => {
    if (isOpen) {
      
      setFormData({
        title: '',
        reason: '',
        start_date: '',
        end_date: '',
        scope: selectedEmployeeId ? 'Employee' : 'Global',
        department: departments[0] || '',
        office: '',
        affected_employees: selectedEmployeeId ? [selectedEmployeeId] : []
      });
    }
  }, [isOpen, departments, selectedEmployeeId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
     
      ...(name === 'scope' && {
        department: value === 'Department' ? (departments[0] || '') : '',
        affected_employees: []
      })
    }));
  };

  const handleEmployeeToggle = (empId) => {
    setFormData(prev => {
      const current = prev.affected_employees;
      const updated = current.includes(empId)
        ? current.filter(id => id !== empId)
        : [...current, empId];
      return { ...prev, affected_employees: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="planner-modal-overlay" onClick={onClose}>
      <div className="planner-modal" onClick={e => e.stopPropagation()}>
        <div className="planner-modal-header">
          <h3 className="planner-modal-title">Lock Date Range</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Lock Title *</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g. System Freeze / Holiday Lock" 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input 
                type="date" 
                name="start_date" 
                value={formData.start_date} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input 
                type="date" 
                name="end_date" 
                value={formData.end_date} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Target Scope *</label>
            <select name="scope" value={formData.scope} onChange={handleChange}>
              {(role === 'admin' || role === 'super_admin') && (
                <option value="Global">Organization Wide (All Employees)</option>
              )}
              {role === 'manager' && (
                <option value="Global">Managed Employees</option>
              )}
              <option value="Department">
                {role === 'manager' ? 'My Department Employees' : 'Specific Department'}
              </option>
              <option value="Team">My Managed Team</option>
              <option value="Employee">Specific Employee(s)</option>
            </select>
          </div>

          {formData.scope === 'Department' && (
            <div className="form-group">
              <label>Department *</label>
              <select name="department" value={formData.department} onChange={handleChange} required>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {formData.scope === 'Employee' && (
            <div className="form-group">
              <label>Select Affected Employees *</label>
              <div className="employee-select-list">
                {employees.map(emp => (
                  <label key={emp.id} className="employee-select-item">
                    <input 
                      type="checkbox" 
                      checked={formData.affected_employees.includes(emp.id)} 
                      onChange={() => handleEmployeeToggle(emp.id)} 
                    />
                    <span>{emp.full_name} ({emp.department || 'No Dept'})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Reason / Description</label>
            <textarea 
              name="reason" 
              value={formData.reason} 
              onChange={handleChange}
              placeholder="e.g. Critical deployment window, team availability required"
              rows={3}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Lock Dates</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlannerLockModal;
