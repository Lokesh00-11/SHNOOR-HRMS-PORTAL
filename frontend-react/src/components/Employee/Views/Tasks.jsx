import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: 'all', priority: 'all' });

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/tasks/');
            setTasks(data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleUpdateTask = async (taskId) => {
        const note = prompt('Add a note for this task (optional):');
        if (note === null) return;

        const markDone = window.confirm('Mark this task as completed?');
        
        try {
            await post('/employee/tasks/update/', {
                task_id: taskId,
                employee_note: note,
                status: markDone ? 'Completed' : 'In Progress'
            });
            alert('Task updated');
            fetchTasks();
        } catch (err) {
            alert('Update failed');
        }
    };

    const filteredTasks = tasks.filter(t => {
        const statusMatch = filter.status === 'all' || t.status === filter.status;
        const priorityMatch = filter.priority === 'all' || t.priority === filter.priority;
        return statusMatch && priorityMatch;
    });

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Tasks</h2>

            <div className="glass-panel" style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-filter" style={{ color: 'var(--primary-color)' }}></i>
                    <span style={{ fontWeight: 600 }}>Filters:</span>
                </div>
                <div className="setting-item" style={{ flex: 'none', minWidth: '150px' }}>
                    <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} style={{ padding: '0.5rem' }}>
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div className="setting-item" style={{ flex: 'none', minWidth: '150px' }}>
                    <select value={filter.priority} onChange={(e) => setFilter({...filter, priority: e.target.value})} style={{ padding: '0.5rem' }}>
                        <option value="all">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Deadline</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : filteredTasks.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No tasks found</td></tr>
                        ) : (
                            filteredTasks.map((task) => (
                                <tr key={task.id}>
                                    <td style={{ fontWeight: 600 }}>{task.title}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{task.description}</td>
                                    <td>{task.deadline || '-'}</td>
                                    <td>
                                        <span style={{ color: task.priority === 'High' ? '#f43f5e' : (task.priority === 'Medium' ? '#f59e0b' : '#10b981'), fontWeight: 600 }}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${task.status === 'Completed' ? 'active' : 'pending'}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td>
                                        {task.status !== 'Completed' ? (
                                            <button 
                                                className="btn btn-primary" 
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => handleUpdateTask(task.id)}
                                            >
                                                Update
                                            </button>
                                        ) : (
                                            <span style={{ color: '#10b981' }}><i className="fa-solid fa-check"></i> Done</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Tasks;
