import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const FinanceAnalyticsPanel = ({ stats }) => {
    // Generate dummy trend data for Bar Chart
    const trendData = [
        { name: 'Week 1', expenses: stats.total > 0 ? stats.total * 0.2 : 4000, reimbursements: 2400 },
        { name: 'Week 2', expenses: stats.total > 0 ? stats.total * 0.3 : 3000, reimbursements: 1398 },
        { name: 'Week 3', expenses: stats.total > 0 ? stats.total * 0.4 : 2000, reimbursements: 9800 },
        { name: 'Week 4', expenses: stats.total > 0 ? stats.total * 0.1 : 2780, reimbursements: 3908 },
    ];

    const utilizationData = [
        { name: 'Approved', value: stats.approved > 0 ? stats.approved : 600 },
        { name: 'Pending', value: stats.pending > 0 ? stats.pending : 300 },
        { name: 'Rejected', value: stats.rejected > 0 ? stats.rejected : 100 },
    ];

    const COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

    return (
        <div className="fade-in">
            <div className="dashboard-grid">
                
                {/* Pie Chart: Financial Utilization */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '550px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Financial Utilization (Claims)</h3>
                    <div style={{ flex: 1, width: '100%', minHeight: '450px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={utilizationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={90}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {utilizationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Expense vs Reimbursement Trends */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '550px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Monthly Financial Trends</h3>
                    <div style={{ flex: 1, width: '100%', minHeight: '450px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={trendData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Legend />
                                <Bar dataKey="expenses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="reimbursements" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default FinanceAnalyticsPanel;
