import React, { useState, useEffect } from 'react';
import { get, post, del } from '../../../services/api';

const Subscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [newPlan, setNewPlan] = useState({
        name: '',
        price: '',
        duration_months: 1,
        features: '',
        trial_period_days: 7
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await get('/admin/subscriptions/');
            setPlans(data || []);
        } catch (err) {
            console.error('Error fetching plans:', err);
            setError('Failed to fetch subscription plans.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleAddPlan = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newPlan.name || !newPlan.price || newPlan.duration_months <= 0) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            setSubmitLoading(true);
            await post('/admin/subscriptions/', {
                ...newPlan,
                price: parseFloat(newPlan.price)
            });
            setSuccess('Subscription plan created successfully!');
            setNewPlan({
                name: '',
                price: '',
                duration_months: 1,
                features: '',
                trial_period_days: 7
            });
            await fetchPlans();
        } catch (err) {
            console.error('Error adding plan:', err);
            setError(err.message || 'Failed to create plan.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeletePlan = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the plan "${name}"?`)) return;
        setError('');
        setSuccess('');

        try {
            await del(`/admin/subscriptions/${id}/`);
            setSuccess('Subscription plan deleted successfully!');
            await fetchPlans();
        } catch (err) {
            console.error('Error deleting plan:', err);
            setError('Failed to delete subscription plan.');
        }
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Subscription Plans Builder</h2>

            {success && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--success-color)', background: 'rgba(16, 185, 129, 0.1)' }}>
                    <p style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 500 }}>
                        <i className="fa-solid fa-circle-check"></i> {success}
                    </p>
                </div>
            )}

            {error && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <p style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 500 }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> {error}
                    </p>
                </div>
            )}

            {/* Create New Plan Form */}
            <div className="glass-panel" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 600 }}>Create New Subscription Plan</h3>
                <form onSubmit={handleAddPlan} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div className="setting-item">
                        <h4>Plan Name</h4>
                        <input 
                            type="text" 
                            required 
                            value={newPlan.name}
                            onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                            placeholder="e.g. Pro Monthly, Premium Annual"
                        />
                    </div>
                    <div className="setting-item">
                        <h4>Price (₹)</h4>
                        <input 
                            type="number" 
                            required 
                            min="0"
                            step="0.01"
                            value={newPlan.price}
                            onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                            placeholder="e.g. 999.00"
                        />
                    </div>
                    <div className="setting-item">
                        <h4>Duration (Months)</h4>
                        <input 
                            type="number" 
                            required 
                            min="1"
                            value={newPlan.duration_months}
                            onChange={(e) => setNewPlan({...newPlan, duration_months: parseInt(e.target.value) || 1})}
                            placeholder="e.g. 1, 3, 12"
                        />
                    </div>
                    <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
                        <h4>Features / Description (One feature per line)</h4>
                        <textarea 
                            rows="4"
                            value={newPlan.features}
                            onChange={(e) => setNewPlan({...newPlan, features: e.target.value})}
                            placeholder="e.g.&#10;Full HRMS Access&#10;24/7 Support&#10;Unlimited Employee Accounts"
                            style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                color: 'var(--text-main)',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }} disabled={submitLoading}>
                            {submitLoading ? 'Creating Plan...' : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Active Plans Catalog */}
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontWeight: 600 }}>Active Subscription Plans</h3>
            
            {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}></i>
                    <p>Loading active subscription plans...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-store-slash fa-2x" style={{ marginBottom: '1rem' }}></i>
                    <p>No subscription plans have been created yet. Use the form above to add a plan.</p>
                </div>
            ) : (
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    {plans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className="glass-panel-no-hover" 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                padding: '2rem', 
                                border: '1px solid var(--glass-border)',
                                position: 'relative',
                                background: 'rgba(255,255,255,0.02)'
                            }}
                        >
                            <button 
                                className="btn btn-ghost" 
                                style={{ 
                                    position: 'absolute', 
                                    top: '1rem', 
                                    right: '1rem', 
                                    minWidth: '35px', 
                                    padding: '0.4rem', 
                                    borderRadius: '50%',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                }}
                                onClick={() => handleDeletePlan(plan.id, plan.name)}
                                title="Delete Plan"
                            >
                                <i className="fa-solid fa-trash" style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}></i>
                            </button>

                            <span 
                                style={{ 
                                    alignSelf: 'flex-start',
                                    fontSize: '0.75rem', 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '12px', 
                                    background: 'rgba(99, 102, 241, 0.1)', 
                                    color: 'var(--primary-color)',
                                    fontWeight: 600,
                                    marginBottom: '1rem'
                                }}
                            >
                                {plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}
                            </span>

                            <h4 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', color: 'var(--text-main)', paddingRight: '1.5rem' }}>{plan.name}</h4>
                            
                            <div style={{ margin: '0.5rem 0 1.5rem 0' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{plan.price}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> / cycle</span>
                            </div>

                            <div style={{ flex: 1 }}>
                                <h5 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Features List:</h5>
                                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                    {plan.features ? (
                                        plan.features.split('\n').map((feat, idx) => (
                                            <li key={idx}>{feat}</li>
                                        ))
                                    ) : (
                                        <li>Full HRMS Portal Access</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default Subscriptions;
