import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Payroll = () => {
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const data = await get('/manager/payroll/');
            setPayroll(data || []);
        } catch (err) {
            console.error('Error fetching payroll:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, []);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Team Payroll Records</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            <th>Month / Year</th>
                            <th>Salary Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading payroll records...</td></tr>
                        ) : payroll.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payroll data found.</td></tr>
                        ) : (
                            payroll.map((item, index) => {
                                const statusLower = (item.status || '').toLowerCase();
                                const statusClass = statusLower === 'paid' ? 'active' : 'pending';
                                return (
                                    <tr key={item.id || index}>
                                        <td style={{ fontWeight: 600 }}>{item.employee_name || item.username}</td>
                                        <td>{item.month_year}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                            ₹{parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`}>
                                                {item.status || 'Pending'}
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

export default Payroll;
