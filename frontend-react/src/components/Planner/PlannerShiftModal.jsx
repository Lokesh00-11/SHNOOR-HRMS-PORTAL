import React, { useState, useEffect } from 'react';

const PlannerShiftModal = ({ isOpen, onClose, onSubmit, employees, selectedEmployeeId }) => {
  const [formData, setFormData] = useState({
    employee: '',
    shift_name: 'Morning Shift',
    start_time: '09:00',
    end_time: '17:00',
    color_code: '#f59e0b',
    recurring_pattern: 'None',
    rotation_start_date: '',
    rotation_cycle_days: 7
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employee: selectedEmployeeId || employees[0]?.id || '',
        shift_name: 'Morning Shift',
        start_time: '09:00',
        end_time: '17:00',
        color_code: '#f59e0b',
        recurring_pattern: 'None',
        rotation_start_date: '',
        rotation_cycle_days: 7
      });
    }
  }, [isOpen, employees]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="planner-modal-overlay" onClick={onClose}>
      <div className="planner-modal" onClick={e => e.stopPropagation()}>
        <div className="planner-modal-header">
          <h3 className="planner-modal-title">Assign Shift</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee *</label>
            <select name="employee" value={formData.employee} onChange={handleChange} required>
              <option value="">Select Employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.department || 'No Dept'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Shift Label / Name *</label>
            <input 
              type="text" 
              name="shift_name" 
              value={formData.shift_name} 
              onChange={handleChange} 
              placeholder="e.g. Morning Shift, Night Shift" 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input 
                type="time" 
                name="start_time" 
                value={formData.start_time} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input 
                type="time" 
                name="end_time" 
                value={formData.end_time} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Recurring Pattern</label>
            <select name="recurring_pattern" value={formData.recurring_pattern} onChange={handleChange}>
              <option value="None">None (Fixed / Daily)</option>
              <option value="Weekly">Weekly (Repeats same weekdays)</option>
              <option value="Rotating">Rotating (Rolling Schedule)</option>
            </select>
          </div>

          {formData.recurring_pattern === 'Rotating' && (
            <div className="form-row">
              <div className="form-group">
                <label>Rotation Anchor Date *</label>
                <input 
                  type="date" 
                  name="rotation_start_date" 
                  value={formData.rotation_start_date} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Rotation Cycle (Days) *</label>
                <input 
                  type="number" 
                  name="rotation_cycle_days" 
                  value={formData.rotation_cycle_days} 
                  onChange={handleChange} 
                  min="2"
                  max="365"
                  required 
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Shift Color Badge</label>
            <input 
              type="color" 
              name="color_code" 
              value={formData.color_code} 
              onChange={handleChange} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Assign Shift</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlannerShiftModal;
