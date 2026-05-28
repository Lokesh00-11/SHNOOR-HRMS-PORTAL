import React, { useState, useEffect } from 'react';
import { get, post } from '../../../../services/api';

const PayrollFinancePanel = () => {
    const [payrollData, setPayrollData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const data = await get('/teamleader/payroll/');
            setPayrollData(data || []);
        } catch (err) {
            console.error('Error fetching payroll data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, []);

    const handlePaySalary = async (employeeId) => {
        try {
            await post('/teamleader/payroll/', { employee_id: employeeId });
            alert('Salary credited successfully.');
            fetchPayroll();
        } catch (err) {
            alert('Failed to credit salary: ' + (err.message || 'Unknown error'));
        }
    };

    return (
        <div className="fade-in">
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-file-invoice"></i>
                    </div>
                    <h3 style={{ margin: 0 }}>Team Payroll Disbursement</h3>
                </div>
                
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Month</th>
                                <th>Base Salary</th>
                                <th>Credited?</th>
                                <th>Amount Credited</th>
                                <th>Payment Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading payroll data...</td></tr>
                            ) : payrollData.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No team members found.</td></tr>
                            ) : (
                                payrollData.map((emp, index) => {
                                    return (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 600 }}>{emp.name}</td>
                                            <td>{emp.month}</td>
                                            <td>₹{parseFloat(emp.salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td>
                                                <span className={`status-badge ${emp.credited ? 'active' : 'pending'}`}>
                                                    {emp.credited ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600, color: emp.credited ? '#10b981' : 'inherit' }}>
                                                ₹{parseFloat(emp.amount_credited || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>{emp.payment_date || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {emp.credited ? (
                                                    <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}><i className="fa-solid fa-check-circle" style={{ marginRight: '5px' }}></i>Verified</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayrollFinancePanel;
