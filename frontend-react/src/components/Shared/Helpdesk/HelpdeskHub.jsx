import React, { useState } from 'react';
import HelpdeskDashboard from './HelpdeskDashboard';
import TicketGrid from './TicketGrid';
import TicketDetailView from './TicketDetailView';

const HelpdeskHub = ({ role }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedTicket, setSelectedTicket] = useState(null);

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setActiveTab('detail');
    };

    const handleBack = () => {
        setSelectedTicket(null);
        setActiveTab('tickets');
    };

    const renderContent = () => {
        if (activeTab === 'dashboard') {
            return <HelpdeskDashboard role={role} onViewAll={() => setActiveTab('tickets')} />;
        }
        if (activeTab === 'tickets') {
            return <TicketGrid role={role} onViewTicket={handleViewTicket} />;
        }
        if (activeTab === 'detail' && selectedTicket) {
            return <TicketDetailView role={role} ticketId={selectedTicket.id} onBack={handleBack} />;
        }
        return <HelpdeskDashboard role={role} onViewAll={() => setActiveTab('tickets')} />;
    };

    return (
        <div className="helpdesk-hub fade-in">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    Helpdesk Support
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Manage tickets, track resolutions etc..
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                <button 
                    className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('dashboard'); setSelectedTicket(null); }}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: activeTab === 'dashboard' ? 'var(--primary-light)' : 'transparent', color: activeTab === 'dashboard' ? 'var(--primary-color)' : 'var(--text-primary)', fontWeight: activeTab === 'dashboard' ? '600' : '500', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <i className="fa-solid fa-chart-pie" style={{ marginRight: '8px' }}></i> Dashboard
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'tickets' || activeTab === 'detail' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('tickets'); setSelectedTicket(null); }}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: (activeTab === 'tickets' || activeTab === 'detail') ? 'var(--primary-light)' : 'transparent', color: (activeTab === 'tickets' || activeTab === 'detail') ? 'var(--primary-color)' : 'var(--text-primary)', fontWeight: (activeTab === 'tickets' || activeTab === 'detail') ? '600' : '500', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <i className="fa-solid fa-ticket" style={{ marginRight: '8px' }}></i> Tickets
                </button>
            </div>

            <div className="helpdesk-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default HelpdeskHub;
