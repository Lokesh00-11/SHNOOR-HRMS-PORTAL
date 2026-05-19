import React from 'react';

const Policies = () => {
    // Static policies for now as requested in the priority list, 
    // can be connected to a specific backend endpoint later if available.
    const policies = [
        { title: 'Code of Conduct', lastUpdated: '2024-01-15' },
        { title: 'Remote Work Policy', lastUpdated: '2024-02-01' },
        { title: 'Leave & Attendance Policy', lastUpdated: '2023-11-20' },
        { title: 'Anti-Harassment Policy', lastUpdated: '2024-03-10' },
        { title: 'Data Privacy & Security', lastUpdated: '2024-04-05' },
    ];

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Company Policies</h2>
            
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Please review our official company policies. These documents govern our workplace standards and expectations.
                </p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {policies.map((p, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>{p.title}</h4>
                                <small style={{ color: 'var(--text-muted)' }}>Last updated: {p.lastUpdated}</small>
                            </div>
                            <button className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>
                                <i className="fa-solid fa-file-pdf"></i> Read Policy
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Policies;
