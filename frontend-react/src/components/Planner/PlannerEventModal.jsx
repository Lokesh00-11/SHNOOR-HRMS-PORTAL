import React, { useState } from 'react';

const PlannerEventModal = ({ isOpen, onClose, onSubmit, eventTypeOptions }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'Meeting',
    start_date: '',
    end_date: '',
    visibility: 'Team',
    color_code: '#172554'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="planner-modal-overlay" onClick={onClose}>
      <div className="planner-modal" onClick={e => e.stopPropagation()}>
        <h3>Create Event</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Event Type</label>
            <select name="event_type" value={formData.event_type} onChange={handleChange}>
              {eventTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Visibility</label>
            <select name="visibility" value={formData.visibility} onChange={handleChange}>
              <option value="Private">Private</option>
              <option value="Team">Team</option>
              <option value="Department">Department</option>
              <option value="Organization">Organization</option>
            </select>
          </div>
          <div className="form-group">
            <label>Color</label>
            <input type="color" name="color_code" value={formData.color_code} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlannerEventModal;
