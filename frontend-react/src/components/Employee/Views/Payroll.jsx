import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Payroll = () => {
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/payroll/');
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
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Salary Records</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Month / Year</th>
                            <th>Salary Amount</th>
                            <th>Bonus Info</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading payroll records...</td></tr>
                        ) : payroll.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No salary records found.</td></tr>
                        ) : (
                            payroll.map((item, index) => {
                                const statusLower = (item.status || '').toLowerCase();
                                const statusClass = statusLower === 'paid' ? 'active' : 'pending';
                                
                                return (
                                    <tr key={item.id || index}>
                                        <td style={{ fontWeight: 600 }}>{item.month_year}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                            ₹{parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                Includes Night Shift Bonus (if applicable)
                                            </span>
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
