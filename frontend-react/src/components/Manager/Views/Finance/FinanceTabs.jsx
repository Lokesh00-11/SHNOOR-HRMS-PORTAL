import React from 'react';

const FinanceTabs = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'expenses', label: 'Expenses & Reimbursements', icon: 'fa-file-invoice-dollar' },
        { id: 'payroll', label: 'Payroll Management', icon: 'fa-money-check-dollar' },
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
        { id: 'reports', label: 'Reports', icon: 'fa-file-csv' }
    ];

    return (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`btn ${activeTab === tab.id ? 'btn-primary active' : 'btn-ghost'}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <i className={`fa-solid ${tab.icon}`}></i>
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default FinanceTabs;
