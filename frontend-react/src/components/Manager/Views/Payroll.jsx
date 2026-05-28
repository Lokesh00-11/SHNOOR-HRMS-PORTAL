import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Payroll = () => {
    const [payroll, setPayroll] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payLoading, setPayLoading] = useState(false);
    
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [salaryInput, setSalaryInput] = useState('');
    const [showPaymentCard, setShowPaymentCard] = useState(false);
    
    const fetchData = async () => {
        try {
            setLoading(true);
            const [payrollData, empData] = await Promise.all([
                get('/manager/payroll/'),
                get('/manager/employees/')
            ]);
            setPayroll(payrollData || []);
            setEmployees(empData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePay = async () => {
        if (!selectedEmployeeId) {
            alert('Please select an employee to pay.');
            return;
        }
        
        try {
            setPayLoading(true);
            const res = await post('/manager/payroll/pay/', { 
                employee_id: selectedEmployeeId,
                salary_amount: salaryInput
            });
            alert(res.message === 'completed' ? 'completed' : res.message);
            setSelectedEmployeeId('');
            setSalaryInput('');
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Failed to generate payroll');
        } finally {
            setPayLoading(false);
        }
    };

    const selectedEmployee = employees.find(e => e.id.toString() === selectedEmployeeId);
    
    const currentDate = new Date();
    const currentMonthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    let baseSalary = 0;
    let finalSalary = 0;
    let isNightShift = false;
    
    if (selectedEmployee) {
        baseSalary = parseFloat(salaryInput !== '' ? salaryInput : (selectedEmployee.salary || 0));
        isNightShift = (selectedEmployee.shift || '').toLowerCase() === 'night';
        finalSalary = isNightShift ? baseSalary * 1.10 : baseSalary;
    }

    const handleEmployeeChange = (e) => {
        const empId = e.target.value;
        setSelectedEmployeeId(empId);
        
        const emp = employees.find(e => e.id.toString() === empId);
        if (emp && emp.salary) {
            setSalaryInput(emp.salary);
        } else {
            setSalaryInput('');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Team Payroll Management</h2>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowPaymentCard(!showPaymentCard)}
                >
                    <i className="fa-solid fa-money-check-dollar"></i> {showPaymentCard ? 'Close' : 'Run Payroll'}
                </button>
            </div>

            {showPaymentCard && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', maxWidth: '600px' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Issue Payroll</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="setting-item">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Employee</label>
                            <select 
                                className="form-control" 
                                value={selectedEmployeeId} 
                                onChange={handleEmployeeChange}
                            >
                                <option value="">-- Choose Employee --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name || emp.username || `Employee #${emp.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="setting-item">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Base Salary Amount (₹)</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                value={salaryInput} 
                                onChange={(e) => setSalaryInput(e.target.value)}
                                placeholder="Enter base salary..."
                                disabled={!selectedEmployeeId}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Period</span>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentMonthYear}</div>
                            </div>
                            
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Amount to Pay</span>
                                <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                    ₹{finalSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                {isNightShift && (
                                    <div style={{ fontSize: '0.8rem', color: '#10b981' }}>Includes 10% Night Shift Bonus</div>
                                )}
                            </div>
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ marginTop: '1rem', width: '100%', height: '45px', fontSize: '1.1rem' }}
                            onClick={handlePay}
                            disabled={payLoading || !selectedEmployeeId}
                        >
                            {payLoading ? 'Processing...' : 'Pay'}
                        </button>
                    </div>
                </div>
            )}

            <h3 style={{ marginBottom: '1rem' }}>Payroll History</h3>
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
