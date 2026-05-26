import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

class DashboardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return <div style={{ padding: '2rem', color: 'red' }}><h2>Dashboard Error</h2><pre>{this.state.error?.toString()}</pre></div>;
        }
        return this.props.children;
    }
}
const COLORS = ['#1e40af', '#cbd5e1'];
const NAVY_BLUE = '#1e40af';
const YELLOW_ORANGE = '#f59e0b';

const Dashboard = ({ currentMode }) => {
    const [data, setData] = useState(null);
    const [selfStats, setSelfStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const handleClockIn = async () => {
        try {
            setActionLoading(true);
            await post('/employee/attendance/clock-in/');
            alert('Clocked In successfully');
        } catch (err) {
            alert('Clock in failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        try {
            setActionLoading(true);
            await post('/employee/attendance/clock-out/');
            alert('Clocked Out successfully');
        } catch (err) {
            alert('Clock out failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                if (currentMode === 'manager') {
                    const res = await get('/manager/analytics/');
                    setData(res);
                } else {
                    const [statsData, profileData] = await Promise.all([
                        get('/employee/stats/'),
                        get('/manager/profile/')
                    ]);
                    setSelfStats(statsData);
                    setProfile(profileData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentMode]);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard data...</div>;
    }

    if (currentMode !== 'manager') {
        return (
            <section className="view-section active">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 className="gradient-text" style={{ margin: 0 }}>My Dashboard</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleClockIn}
                            disabled={actionLoading}
                        >
                            <i className="fa-solid fa-clock"></i> Clock In
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={handleClockOut}
                            disabled={actionLoading}
                        >
                            Clock Out
                        </button>
                    </div>
                </div>
                {profile && (
                    <div className="glass-panel-no-hover" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold'
                        }}>
                            {((profile.first_name || profile.email || 'M')[0]).toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 600 }}>{`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email.split('@')[0]}</h3>
                            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile.designation || 'Manager'} • {profile.email}</p>
                        </div>
                    </div>
                )}
                <div className="dashboard-grid">
                    <div className="glass-panel-no-hover" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Leave Balance</h4>
                        <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}>{`${selfStats?.total_leaves || 0} Days`}</h1>
                    </div>
                    <div className="glass-panel-no-hover" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pending Tasks</h4>
                        <h1 style={{ fontSize: '2rem', color: '#10b981', marginTop: '0.5rem' }}>{selfStats?.pending_tasks || 0}</h1>
                    </div>
                    <div className="glass-panel-no-hover" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Appreciations</h4>
                        <h1 style={{ fontSize: '2rem', color: '#f59e0b', marginTop: '0.5rem' }}>{selfStats?.appreciations_count || 0}</h1>
                    </div>
                    <div className="glass-panel-no-hover" style={{ padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Active Warnings</h4>
                        <h1 style={{ fontSize: '2rem', color: '#f43f5e', marginTop: '0.5rem' }}>{selfStats?.warnings_count || 0}</h1>
                    </div>
                </div>
            </section>
        );
    }

    if (!data || !data.summary || !data.attendance) {
        return <div style={{ padding: '2rem' }}>Loading or invalid data format received from backend.</div>;
    }

    const { summary, attendance } = data;


    const barChartDataWeekly = {
        labels: attendance.weeklyTrend.map(d => d.name),
        datasets: [
            {
                label: 'Present',
                data: attendance.weeklyTrend.map(d => d.Present),
                backgroundColor: NAVY_BLUE,
                borderRadius: 4
            },
            {
                label: 'Absent',
                data: attendance.weeklyTrend.map(d => d.Absent),
                backgroundColor: YELLOW_ORANGE,
                borderRadius: 4
            }
        ]
    };

    const barOptionsWeekly = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { stacked: true, grid: { color: '#f1f5f9' }, border: { display: false } },
            x: { stacked: true, grid: { display: false }, border: { display: false } }
        }
    };

    const doughnutData = {
        labels: ['Present', 'Absent', 'On Leave'],
        datasets: [{
            data: [summary.presentToday, summary.absentToday, summary.onLeave],
            backgroundColor: [NAVY_BLUE, YELLOW_ORANGE, '#38bdf8'],
            borderWidth: 0,
            cutout: '75%'
        }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
    };

    const monthlyData = attendance.monthlyTrend || [];

    const barChartDataMonthly = {
        labels: monthlyData.map(d => d.name),
        datasets: [
            {
                label: 'Present',
                data: monthlyData.map(d => d.Present),
                backgroundColor: NAVY_BLUE,
                borderRadius: 4
            },
            {
                label: 'Absent',
                data: monthlyData.map(d => d.Absent),
                backgroundColor: YELLOW_ORANGE,
                borderRadius: 4
            }
        ]
    };

    const barOptionsMonthly = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { grid: { color: '#f1f5f9' }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false } }
        }
    };

    return (
        <DashboardErrorBoundary>
            <section className="view-section active" style={{ paddingBottom: '3rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Manager Analytics Dashboard</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <SummaryCard title="Total Team" value={summary.totalTeam} color="#6366f1" />
                    <SummaryCard title="Present Today" value={summary.presentToday} color={NAVY_BLUE} trend={`${attendance.overallPercentage}% overall`} />
                    <SummaryCard title="Absent Today" value={summary.absentToday} color={YELLOW_ORANGE} />
                    <SummaryCard title="On Leave" value={summary.onLeave} color="#38bdf8" />
                    <SummaryCard title="Pending Expenses" value={summary.pendingExpenses} color="#8b5cf6" />
                    <SummaryCard title="Open Cases" value={summary.openCases} color="#06b6d4" />
                </div>

                {/* Attendance Analytics Section */}
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1e293b', fontWeight: 600 }}>Attendance Analytics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>Weekly Attendance Trend</h3>
                        <div style={{ height: 250, width: '100%' }}>
                            <Bar data={barChartDataWeekly} options={barOptionsWeekly} />
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151', alignSelf: 'flex-start' }}>Overall Attendance</h3>
                        <div style={{ height: 180, width: '100%', position: 'relative' }}>
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column', pointerEvents: 'none'
                            }}>
                                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>{attendance.overallPercentage}%</span>
                            </div>
                        </div>

                        <div style={{ width: '100%', marginTop: '1rem', background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                            <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>EMPLOYEES LATE TODAY</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e' }}>{attendance.lateToday || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>Monthly Attendance Overview</h3>
                    <div style={{ height: 250, width: '100%' }}>
                        <Bar data={barChartDataMonthly} options={barOptionsMonthly} />
                    </div>
                </div>

            </section>
        </DashboardErrorBoundary>
    );
};

const SummaryCard = ({ title, value, color, trend }) => (
    <div style={{
        background: '#fff', borderRadius: '12px', padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{title}</div>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 600, color: color, lineHeight: 1 }}>{value}</div>
        {trend && <div style={{ fontSize: '0.75rem', color: NAVY_BLUE, marginTop: '0.5rem', fontWeight: 500 }}>↑ {trend}</div>}
    </div>
);

export default Dashboard;
