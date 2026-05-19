import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Performance = () => {
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const data = await get('/teamleader/performance/');
            setPerformance(data || []);
        } catch (err) {
            console.error('Error fetching team performance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, []);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Team Performance Metrics</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Designation</th>
                            <th>Completed Tasks</th>
                            <th>Pending Tasks</th>
                            <th>Overdue Tasks</th>
                            <th>Attendance Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading performance metrics...</td></tr>
                        ) : performance.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available. Assign employees to your team first.</td></tr>
                        ) : (
                            performance.map((p, index) => (
                                <tr key={p.id || index}>
                                    <td style={{ fontWeight: 600 }}>{p.employee_name}</td>
                                    <td>{p.designation || 'Staff'}</td>
                                    <td style={{ color: '#10b981', fontWeight: 600 }}>{p.completed_tasks}</td>
                                    <td style={{ color: '#f59e0b', fontWeight: 600 }}>{p.pending_tasks}</td>
                                    <td style={{ color: '#f43f5e', fontWeight: 600 }}>{p.overdue_tasks}</td>
                                    <td style={{ fontWeight: 600 }}>{p.attendance_percentage}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Performance;
