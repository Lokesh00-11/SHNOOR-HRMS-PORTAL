import React from 'react';

const SuperAdmin = () => {
    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Super Admin Management</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>            
                    <tbody>
                        <tr>
                            <td>John Admin</td>
                            <td>john.admin@example.com</td>
                            <td>Super Admin</td>
                            <td><span className="status active" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Active</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default SuperAdmin;
