import React from 'react';

const EmailQueries = () => {
    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Email Queries</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>From</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Jane Doe</td>
                            <td>jane.doe@example.com</td>
                            <td>Payment Issue</td>
                            <td>Oct 21, 2026</td>
                            <td><span className="status active" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Unread</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default EmailQueries;
