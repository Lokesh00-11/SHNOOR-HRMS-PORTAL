import React, { useState, useEffect } from 'react';
import { get, post, patch } from '../../../services/api';

const Tasks = ({ currentMode }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    // Create / Edit Form Modal State
    const [showForm, setShowForm] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        assigned_to: '',
        deadline: '',
        priority: 'Medium',
        description: ''
    });

    const fetchTasks = async () => {
        try {
            setLoading(true);
            if (currentMode === 'manager') {
                const data = await get('/manager/tasks/');
                setTasks(data || []);
            } else {
                const data = await get('/employee/tasks/');
                setTasks(data || []);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [currentMode]);

    const handleOpenAssign = () => {
        setEditingTaskId(null);
        setFormData({
            title: '',
            assigned_to: '',
            deadline: '',
            priority: 'Medium',
            description: ''
        });
        setShowForm(true);
    };

    const handleOpenEdit = (task) => {
        setEditingTaskId(task.id);
        setFormData({
            title: task.title,
            assigned_to: task.assigned_to_email,
            deadline: task.deadline || '',
            priority: task.priority || 'Medium',
            description: task.description || ''
        });
        setShowForm(true);
    };

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        try {
            if (editingTaskId) {
                // Update
                await patch(`/tasks/${editingTaskId}/`, formData);
                alert('Task updated successfully!');
            } else {
                // Create
                await post('/manager/tasks/create/', formData);
                alert('Task assigned successfully!');
            }
            setShowForm(false);
            fetchTasks();
        } catch (err) {
            alert('Failed to save task.');
            console.error(err);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchStatus && matchPriority;
    });

    if (currentMode === 'manager') {
        return (
            <section className="view-section active">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 className="gradient-text">Team Tasks</h2>
                    <button className="btn btn-primary" onClick={handleOpenAssign}>
                        <i className="fa-solid fa-plus"></i> Assign Task
                    </button>
                </div>

                {/* Filters */}
                <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status:</span>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                        >
                            <option value="all">All</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Priority:</span>
                        <select 
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                        >
                            <option value="all">All</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                {/* Task Form Modal */}
                {showForm && (
                    <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                        <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 className="gradient-text">{editingTaskId ? 'Edit Task Details' : 'Assign New Task'}</h3>
                                <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ fontSize: '1.25rem', padding: '0.25rem', position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Task Title</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.title} 
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Enter short title"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Assign To (Email)</label>
                                    <input 
                                        type="email" 
                                        required 
                                        disabled={!!editingTaskId}
                                        value={formData.assigned_to} 
                                        onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                                        placeholder="employee@shnoor.com"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: editingTaskId ? 0.6 : 1 }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Deadline</label>
                                        <input 
                                            type="date" 
                                            required 
                                            value={formData.deadline} 
                                            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Priority</label>
                                        <select 
                                            value={formData.priority} 
                                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Description</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows="3"
                                        placeholder="Add task specifics here..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">{editingTaskId ? 'Update Task' : 'Assign Task'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Assigned To</th>
                                <th>Deadline</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Employee Note</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center' }}>Loading tasks...</td></tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No tasks match the filter criteria.</td></tr>
                            ) : (
                                filteredTasks.map((task, index) => {
                                    const statusLower = (task.status || '').toLowerCase();
                                    const statClass = statusLower === 'completed' ? 'active' : (statusLower === 'in progress' ? 'pending' : 'expired');
                                    return (
                                        <tr key={task.id || index}>
                                            <td style={{ fontWeight: 600 }}>{task.title}</td>
                                            <td>{task.description || '-'}</td>
                                            <td>{task.assigned_to_email}</td>
                                            <td>{task.deadline || '-'}</td>
                                            <td>
                                                <span style={{ color: task.priority === 'High' ? '#f43f5e' : (task.priority === 'Medium' ? '#f59e0b' : '#10b981'), fontWeight: 600 }}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${statClass}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td><span style={{ color: 'var(--primary-color)' }}><i>{task.employee_note || '-'}</i></span></td>
                                            <td>
                                                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => handleOpenEdit(task)}>
                                                    <i className="fa-solid fa-edit"></i> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    }

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Tasks</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Deadline</th>
                            <th>Priority</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading tasks...</td></tr>
                        ) : filteredTasks.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No tasks assigned.</td></tr>
                        ) : (
                            filteredTasks.map((task, index) => {
                                const statusLower = (task.status || '').toLowerCase();
                                const statClass = statusLower === 'completed' ? 'active' : (statusLower === 'in progress' ? 'pending' : 'expired');
                                return (
                                    <tr key={task.id || index}>
                                        <td style={{ fontWeight: 600 }}>{task.title}</td>
                                        <td>{task.deadline || '-'}</td>
                                        <td>
                                            <span style={{ color: task.priority === 'High' ? '#f43f5e' : (task.priority === 'Medium' ? '#f59e0b' : '#10b981'), fontWeight: 600 }}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${statClass}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Tasks;
