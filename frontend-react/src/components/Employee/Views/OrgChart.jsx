import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const OrgNode = ({ node, allData }) => {
    const children = allData.filter(item => item.manager === node.id);

    return (
        <li>
            <div className="tree-node">
                {node.work_mode && (
                    <span className="node-mode">{node.work_mode}</span>
                )}
                
                <div className="node-img">
                    {node.profile_picture ? (
                        <img src={node.profile_picture} alt={node.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <i className="fa-solid fa-user"></i>
                    )}
                </div>
                
                <span className="node-id" style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                    #{node.id}
                </span>
                
                <span className="node-name">{node.name}</span>
                <span className="node-role">{node.role}</span>
                <span className="node-dept">{node.department}</span>
            </div>
            
            {children.length > 0 && (
                <ul>
                    {children.map(child => (
                        <OrgNode key={child.id} node={child} allData={allData} />
                    ))}
                </ul>
            )}
        </li>
    );
};

const OrgChart = () => {
    const [orgData, setOrgData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrgChart = async () => {
        try {
            setLoading(true);
            const data = await get('/org-chart/');
            setOrgData(data || []);
        } catch (err) {
            console.error('Error loading org chart:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgChart();
    }, []);

    const topLevelNodes = orgData.filter(node => !node.manager);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Organization Chart</h2>

            <div className="org-chart-container">
                {loading ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading hierarchy...</div>
                ) : orgData.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No organization data found.</div>
                ) : (
                    <div className="tree">
                        <ul>
                            {topLevelNodes.map(node => (
                                <OrgNode key={node.id} node={node} allData={orgData} />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
};

export default OrgChart;
