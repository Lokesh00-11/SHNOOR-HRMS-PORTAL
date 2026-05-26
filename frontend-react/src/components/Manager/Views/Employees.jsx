import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        personal_email: '',
        password: '',
        designation: '',
        role: 'employee',
    });

    const getNextEmployeeId = () => {
        if (!employees || employees.length === 0) return 'EMP001';
        let maxId = 0;
        employees.forEach(emp => {
            if (emp.employee_id && emp.employee_id.startsWith('EMP')) {
                const num = parseInt(emp.employee_id.replace('EMP', ''), 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
        const nextId = maxId + 1;
        return `EMP${nextId.toString().padStart(3, '0')}`;
    };
    
    const getCurrentDateFormatted = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const data = await get('/manager/employees/');
            setEmployees(data || []);
        } catch (err) {
            console.error('Error fetching team employees:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            await post('/manager/employees/create/', formData);
            alert('Employee created successfully!');
            setShowCreateModal(false);
            setFormData({ first_name: '', last_name: '', email: '', personal_email: '', password: '', designation: '', role: 'employee' });
            fetchEmployees();
        } catch (err) {
            alert('Failed to create employee. Make sure the email is unique.');
            console.error(err);
        }
    };

    const handlePromote = async (userId, normalizedRole, currentRole) => {
        setOpenDropdownId(null);
        if (normalizedRole === currentRole) {
            alert('User already has this role.');
            return;
        }

        if (!window.confirm(`Are you sure you want to change their role to ${normalizedRole}?`)) return;

        try {
            await post('/manager/employees/promote/', {
                user_id: userId,
                new_role: normalizedRole
            });
            alert('User role updated successfully!');
            fetchEmployees();
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Failed to update user role.');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>My Team</h2>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <i className="fa-solid fa-plus"></i> Create Employee
                </button>
            </div>

            {showCreateModal && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="gradient-text">Create New Employee</h3>
                            <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)} style={{ fontSize: '1.25rem', padding: '0.25rem', position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Employee ID</label>
                                    <input 
                                        type="text" 
                                        disabled
                                        value={getNextEmployeeId()} 
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.7 }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Joining Date</label>
                                    <input 
                                        type="date" 
                                        disabled
                                        value={getCurrentDateFormatted()} 
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.7 }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>First Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.first_name} 
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Last Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.last_name} 
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Official Email (For Login)</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={formData.email} 
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Personal Email (Credentials)</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={formData.personal_email} 
                                        onChange={(e) => setFormData({...formData, personal_email: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={formData.password} 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Designation</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.designation} 
                                        onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>System Access Role</label>
                                    <select 
                                        required 
                                        value={formData.role} 
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="team_leader">Team Leader</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Designation</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : employees.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No employees found</td></tr>
                        ) : (
                            employees.map((emp, index) => {
                                const displayName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || (emp.email ? emp.email.split('@')[0] : 'Team Member');
                                return (
                                    <tr key={emp.id || index}>
                                        <td style={{ fontWeight: 600 }}>{displayName}</td>
                                        <td>{emp.email}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{(emp.role || 'employee').replace('_', ' ')}</td>
                                        <td>{emp.designation || 'Team Member'}</td>
                                        <td>
                                            <span className={`status-badge ${emp.is_active !== false ? 'active' : 'inactive'}`}>
                                                {emp.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', position: 'relative' }}>
                                            <button 
                                                className="btn btn-ghost" 
                                                style={{ padding: '0.5rem', minWidth: '40px' }} 
                                                onClick={() => setOpenDropdownId(openDropdownId === emp.user_id ? null : emp.user_id)}
                                                title="Change User Role"
                                            >
                                                <i className="fa-solid fa-user-gear" style={{ color: '#8b5cf6' }}></i>
                                            </button>
                                            {openDropdownId === emp.user_id && (
                                                <div style={{ position: 'absolute', right: '50%', transform: 'translateX(50%)', top: '100%', zIndex: 10, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '130px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                                    <button className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textAlign: 'left', width: '100%' }} onClick={() => handlePromote(emp.user_id, 'employee', emp.role || 'employee')}>Employee</button>
                                                    <button className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textAlign: 'left', width: '100%' }} onClick={() => handlePromote(emp.user_id, 'team_leader', emp.role || 'employee')}>Team Leader</button>
                                                </div>
                                            )}
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

export default Employees;
