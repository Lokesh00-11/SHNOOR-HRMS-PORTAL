import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const Assets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await get('/assets/');
            setAssets(data || []);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'available': return <span className="status-badge" style={{ background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Available</span>;
            case 'assigned': return <span className="status-badge" style={{ background: '#3b82f620', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Assigned</span>;
            case 'maintenance': return <span className="status-badge" style={{ background: '#f59e0b20', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Maintenance</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text">My Assigned Assets</h2>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Serial Number</th>
                                <th>Status</th>
                                <th>Purchase Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>Loading assets...</td>
                                </tr>
                            ) : (Array.isArray(assets) ? assets : []).length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assets assigned to you.</td>
                                </tr>
                            ) : (
                                (Array.isArray(assets) ? assets : []).map(asset => (
                                    <tr key={asset.id}>
                                        <td style={{ fontWeight: 600 }}>{asset.name}</td>
                                        <td>{asset.asset_type}</td>
                                        <td>{asset.serial_number}</td>
                                        <td>{getStatusBadge(asset.status)}</td>
                                        <td>{asset.purchase_date || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default Assets;
