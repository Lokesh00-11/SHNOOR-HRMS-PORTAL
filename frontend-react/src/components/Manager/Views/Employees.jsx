import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Team</h2>
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                        ) : employees.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No employees found</td></tr>
                        ) : (
                            employees.map((emp, index) => {
                                const displayName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || (emp.email ? emp.email.split('@')[0] : 'Team Member');
                                return (
                                    <tr key={emp.id || index}>
                                        <td style={{ fontWeight: 600 }}>{displayName}</td>
                                        <td>{emp.email}</td>
                                        <td>{emp.designation || 'Team Member'}</td>
                                        <td>
                                            <span className="status-badge active">
                                                Active
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

export default Employees;
