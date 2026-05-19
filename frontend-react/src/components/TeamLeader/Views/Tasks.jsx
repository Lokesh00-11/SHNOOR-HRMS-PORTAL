import React, { useState, useEffect } from 'react';
import { get, post, patch } from '../../../services/api';

const Tasks = () => {
    const [myTasks, setMyTasks] = useState([]);
    const [teamTasks, setTeamTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentTab, setCurrentTab] = useState('my'); // 'my' or 'team'
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    // Create Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        assigned_to: '',
        deadline: '',
        priority: 'Medium',
        description: ''
    });

    // Update own task status modal
    const [selectedMyTask, setSelectedMyTask] = useState(null);
    const [myTaskUpdate, setMyTaskUpdate] = useState({
        status: 'Pending',
        employee_note: ''
    });

    // Edit delegated task modal
    const [selectedTeamTask, setSelectedTeamTask] = useState(null);
    const [teamTaskEdit, setTeamTaskEdit] = useState({
        title: '',
        deadline: '',
        priority: 'Medium',
        description: '',
        status: 'Pending'
    });

    const fetchDataInit = async () => {
        try {
            setLoading(true);
            const [tasksData, empsData] = await Promise.all([
                get('/teamleader/tasks/'),
                get('/teamleader/team-members/')
            ]);
            setMyTasks(tasksData?.my_tasks || []);
            setTeamTasks(tasksData?.team_tasks || []);
            setEmployees(empsData || []);
        } catch (err) {
            console.error('Error fetching tasks resources:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDataInit();
    }, []);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.assigned_to) {
            alert('Please select an employee to delegate to.');
            return;
        }

        try {
            const data = await post('/teamleader/tasks/', newTask);
            if (data) {
                alert('New task delegated successfully!');
                setNewTask({
                    title: '',
                    assigned_to: '',
                    deadline: '',
                    priority: 'Medium',
                    description: ''
                });
                setShowCreateModal(false);
                fetchDataInit();
            } else {
                alert('Failed to delegate task. Ensure employee is assigned to your team.');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating task.');
        }
    };

    const handleUpdateMyTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                task_id: selectedMyTask.id,
                status: myTaskUpdate.status,
                employee_note: myTaskUpdate.employee_note
            };
            const data = await patch('/teamleader/tasks/', payload);
            if (data) {
                alert('Task status saved successfully!');
                setSelectedMyTask(null);
                fetchDataInit();
            } else {
                alert('Failed to update task.');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating task.');
        }
    };

    const handleEditTeamTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                task_id: selectedTeamTask.id,
                title: teamTaskEdit.title,
                deadline: teamTaskEdit.deadline,
                priority: teamTaskEdit.priority,
                description: teamTaskEdit.description,
                status: teamTaskEdit.status
            };
            const data = await patch('/teamleader/tasks/', payload);
            if (data) {
                alert('Task specifications updated successfully!');
                setSelectedTeamTask(null);
                fetchDataInit();
            } else {
                alert('Failed to edit task.');
            }
        } catch (err) {
            console.error(err);
            alert('Error editing task.');
        }
    };

    const filterTasksList = (list) => {
        return list.filter(task => {
            const matchStatus = statusFilter === 'all' || task.status === statusFilter;
            const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            return matchStatus && matchPriority;
        });
    };

    const filteredMyTasks = filterTasksList(myTasks);
    const filteredTeamTasks = filterTasksList(teamTasks);

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Tasks & Team Delegation</h2>
                {currentTab === 'team' && (
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <i className="fa-solid fa-plus"></i> Delegate Task
                    </button>
                )}
            </div>

            {/* Subtabs Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <button 
                    className={`btn ${currentTab === 'my' ? 'btn-primary active' : 'btn-ghost'}`}
                    onClick={() => setCurrentTab('my')}
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                    Assigned to Me
                </button>
                <button 
                    className={`btn ${currentTab === 'team' ? 'btn-primary active' : 'btn-ghost'}`}
                    onClick={() => setCurrentTab('team')}
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                    Delegated to Sub-members
                </button>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status:</span>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    >
                        <option value="all">All Statuses</option>
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
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                    >
                        <option value="all">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>

            {/* List Table */}
            {currentTab === 'my' ? (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Task Title</th>
                                <th>Deadline Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading tasks...</td></tr>
                            ) : filteredMyTasks.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No tasks match the filter criteria.</td></tr>
                            ) : (
                                filteredMyTasks.map((task, index) => {
                                    const priorityLower = (task.priority || '').toLowerCase();
                                    const statusLower = (task.status || '').toLowerCase();
                                    const statusClass = statusLower === 'completed' ? 'active' : 'pending';
                                    return (
                                        <tr key={task.id || index}>
                                            <td style={{ fontWeight: 600 }}>{task.title}</td>
                                            <td>{task.deadline}</td>
                                            <td>
                                                <span className={`status-badge ${priorityLower === 'high' ? 'danger' : priorityLower === 'medium' ? 'warning' : 'info'}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${statusClass}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost" onClick={() => {
                                                    setSelectedMyTask(task);
                                                    setMyTaskUpdate({ status: task.status, employee_note: task.employee_note || '' });
                                                }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                    <i className="fa-solid fa-pen-to-square"></i> Update Status
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Task Title</th>
                                <th>Assigned To</th>
                                <th>Deadline Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading delegated tasks...</td></tr>
                            ) : filteredTeamTasks.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No delegated tasks match the filter criteria.</td></tr>
                            ) : (
                                filteredTeamTasks.map((task, index) => {
                                    const priorityLower = (task.priority || '').toLowerCase();
                                    const statusLower = (task.status || '').toLowerCase();
                                    const statusClass = statusLower === 'completed' ? 'active' : 'pending';
                                    return (
                                        <tr key={task.id || index}>
                                            <td style={{ fontWeight: 600 }}>{task.title}</td>
                                            <td>{task.assigned_to_username}</td>
                                            <td>{task.deadline}</td>
                                            <td>
                                                <span className={`status-badge ${priorityLower === 'high' ? 'danger' : priorityLower === 'medium' ? 'warning' : 'info'}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${statusClass}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost" onClick={() => {
                                                    setSelectedTeamTask(task);
                                                    setTeamTaskEdit({
                                                        title: task.title,
                                                        deadline: task.deadline,
                                                        priority: task.priority,
                                                        description: task.description || '',
                                                        status: task.status
                                                    });
                                                }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                    <i className="fa-solid fa-edit"></i> View / Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delegate Task Modal */}
            {showCreateModal && (
                <div className="modal-overlay" style={{ display: 'block', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '550px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Delegate New Task</h3>
                        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Task Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Assign To Employee</label>
                                <select 
                                    required
                                    value={newTask.assigned_to}
                                    onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.email}>
                                            {emp.first_name} {emp.last_name} ({emp.designation || 'Staff'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Deadline</label>
                                <input 
                                    type="date" 
                                    required
                                    value={newTask.deadline}
                                    onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Priority</label>
                                <select 
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Description Summary</label>
                                <textarea 
                                    rows="3"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Delegate Task</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Update My Task Status Modal */}
            {selectedMyTask && (
                <div className="modal-overlay" style={{ display: 'block', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '550px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setSelectedMyTask(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Update Task Status</h3>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <p style={{ margin: '0.4rem 0' }}><strong>Title:</strong> {selectedMyTask.title}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Assigned By:</strong> Management ({selectedMyTask.created_by_username || 'Manager'})</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Deadline:</strong> {selectedMyTask.deadline}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Priority:</strong> {selectedMyTask.priority}</p>
                            <p style={{ margin: '0.4rem 0', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}><strong>Description:</strong><br/>{selectedMyTask.description || 'No description provided.'}</p>
                        </div>
                        <form onSubmit={handleUpdateMyTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Status</label>
                                <select 
                                    value={myTaskUpdate.status}
                                    onChange={(e) => setMyTaskUpdate({...myTaskUpdate, status: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>My Progress Note</label>
                                <textarea 
                                    rows="3"
                                    value={myTaskUpdate.employee_note}
                                    onChange={(e) => setMyTaskUpdate({...myTaskUpdate, employee_note: e.target.value})}
                                    placeholder="Describe progress done so far..."
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Save Updates</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Delegated Task Modal */}
            {selectedTeamTask && (
                <div className="modal-overlay" style={{ display: 'block', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '550px', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setSelectedTeamTask(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Edit Task Details</h3>
                        <form onSubmit={handleEditTeamTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Task Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={teamTaskEdit.title}
                                    onChange={(e) => setTeamTaskEdit({...teamTaskEdit, title: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <p style={{ margin: '0.4rem 0' }}><strong>Assigned To:</strong> {selectedTeamTask.assigned_to_username} ({selectedTeamTask.assigned_to_email || ''})</p>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Deadline</label>
                                <input 
                                    type="date" 
                                    required
                                    value={teamTaskEdit.deadline}
                                    onChange={(e) => setTeamTaskEdit({...teamTaskEdit, deadline: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Priority</label>
                                <select 
                                    value={teamTaskEdit.priority}
                                    onChange={(e) => setTeamTaskEdit({...teamTaskEdit, priority: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Description</label>
                                <textarea 
                                    rows="3"
                                    value={teamTaskEdit.description}
                                    onChange={(e) => setTeamTaskEdit({...teamTaskEdit, description: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Employee Progress Note</label>
                                <p style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', margin: 0 }}>
                                    {selectedTeamTask.employee_note || 'No notes added by employee yet.'}
                                </p>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Status</label>
                                <select 
                                    value={teamTaskEdit.status}
                                    onChange={(e) => setTeamTaskEdit({...teamTaskEdit, status: e.target.value})}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Tasks;
