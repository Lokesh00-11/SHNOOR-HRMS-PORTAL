import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const Subscription = () => {
    const [subData, setSubData] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [plansLoading, setPlansLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState('method'); // 'method' | 'form' | 'processing' | 'receipt'
    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: ''
    });
    const [receiptData, setReceiptData] = useState(null);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            const data = await get('/manager/subscription/');
            setSubData(data);
        } catch (err) {
            console.error('Error fetching subscription details:', err);
            setError('Failed to fetch subscription data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            setPlansLoading(true);
            const data = await get('/admin/subscriptions/');
            setPlans(data || []);
        } catch (err) {
            console.error('Error fetching subscription plans:', err);
        } finally {
            setPlansLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();
        fetchPlans();
    }, []);

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : v;
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleCardChange = (field, value) => {
        if (field === 'cardNumber') {
            value = formatCardNumber(value);
            if (value.replace(/\s/g, '').length > 16) return;
        }
        if (field === 'expiry') {
            value = formatExpiry(value.replace('/', ''));
            if (value.replace('/', '').length > 4) return;
        }
        if (field === 'cvv') {
            value = value.replace(/[^0-9]/g, '');
            if (value.length > 3) return;
        }
        setCardData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = () => {
        return (
            cardData.cardNumber.replace(/\s/g, '').length === 16 &&
            cardData.cardName.trim().length >= 3 &&
            cardData.expiry.length === 5 &&
            cardData.cvv.length === 3
        );
    };

    const handlePayClick = (plan) => {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
        setPaymentStep('method');
        setCardData({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
        setError('');
        setMessage('');
    };

    const handleCloseModal = async () => {
        // If closing the modal after choosing a payment method, simulate a failed transaction
        if (['form', 'netbanking', 'upi'].includes(paymentStep)) {
            post('/manager/renew/', { 
                plan_id: selectedPlan.id,
                payment_method: paymentStep === 'form' ? 'Card' : paymentStep === 'upi' ? 'UPI' : 'Net Banking',
                simulate_failure: true
            }).then(() => {
                fetchSubscriptionData();
            }).catch(() => {});
        }

        setShowPaymentModal(false);
        setPaymentStep('method');
        setError('');
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        
        // Only validate card form if we are in the card step
        if (paymentStep === 'form' && !isFormValid()) return;

        setPaymentStep('processing');

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const response = await post('/manager/renew/', { 
                plan_id: selectedPlan.id,
                payment_method: paymentStep === 'form' ? 'Card' : paymentStep === 'upi' ? 'UPI' : 'Net Banking'
            });
            
            // On success, show receipt
            setReceiptData({
                transactionId: response.transaction_id || `TXN${Math.floor(Math.random() * 1000000)}`,
                amount: selectedPlan.price,
                planName: selectedPlan.name,
                companyName: response.company_name || 'Your Company',
                expiryDate: response.license_expiry_date,
                date: new Date().toLocaleString(),
                paymentMode: paymentStep === 'form' ? `Card •••• ${cardData.cardNumber.replace(/\s/g, '').slice(-4)}` : paymentStep === 'upi' ? 'UPI / QR Code' : 'Net Banking'
            });
            setMessage(response.message || `Subscribed to ${selectedPlan.name} successfully!`);
            setPaymentStep('receipt');
            fetchSubscriptionData(); // Refresh data
        } catch (err) {
            // Handle Failed transaction gracefully without breaking the modal completely
            if (err.response?.status === 400 && err.response?.data?.message?.includes('failed')) {
                setError(err.response.data.message);
                setPaymentStep('method'); // Go back to method selection to show the error
                fetchSubscriptionData(); // Fetch to show the failed transaction in history
            } else {
                setError(err.response?.data?.message || 'Failed to process payment. Please try again.');
                setPaymentStep('method');
            }
        }
    };

    const handleReceiptClose = async () => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
        setReceiptData(null);
        await fetchSubscriptionData();
    };

    if (loading) {
        return (
            <section className="view-section active">
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}></i>
                    <p>Loading subscription details...</p>
                </div>
            </section>
        );
    }

    const expiryDateFormatted = subData?.license_expiry_date 
        ? new Date(subData.license_expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'No active subscription';

    // Simplified Styles for Modal
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem'
    };

    const modalStyle = {
        background: '#ffffff',
        color: '#333333',
        borderRadius: '8px', maxWidth: '480px', width: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb', overflow: 'hidden'
    };

    const inputStyle = {
        width: '100%', padding: '0.75rem', borderRadius: '4px',
        border: '1px solid #d1d5db', background: '#f9fafb',
        color: '#111827', fontSize: '0.95rem', outline: 'none'
    };

    const labelStyle = {
        fontSize: '0.85rem', color: '#4b5563', marginBottom: '0.4rem',
        display: 'block', fontWeight: 500
    };

    return (
        <section className="view-section active" style={{ position: 'relative' }}>
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Subscription & Licensing</h2>

            {message && !showPaymentModal && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--success-color)', background: 'rgba(16, 185, 129, 0.1)' }}>
                    <p style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 500 }}>
                        <i className="fa-solid fa-circle-check"></i> {message}
                    </p>
                </div>
            )}

            {error && !showPaymentModal && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <p style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 500 }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> {error}
                    </p>
                </div>
            )}

            {/* Current Plan Overview Card */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', background: subData?.license_expired ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                            Company Portal status
                        </span>
                        <h3 style={{ margin: '0.25rem 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.75rem' }}>
                            {subData?.company_name}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                            Register Email: <span style={{ color: 'var(--text-main)' }}>{subData?.email}</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Expiry Date</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: subData?.license_expired ? 'var(--danger-color)' : 'var(--text-main)' }}>
                                {expiryDateFormatted}
                            </span>
                        </div>

                        <div className="status-badge-container">
                            {subData?.license_expired ? (
                                <span className="status-badge expired" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <i className="fa-solid fa-circle-xmark" style={{ marginRight: '6px' }}></i> Expired
                                </span>
                            ) : (
                                <span className="status-badge" style={{ 
                                    padding: '0.5rem 1.25rem', 
                                    fontSize: '0.9rem', 
                                    fontWeight: 600,
                                    background: 'rgba(30, 58, 138, 0.08)',
                                    color: 'var(--primary-color)',
                                    border: '1px solid rgba(30, 58, 138, 0.15)'
                                }}>
                                    <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i> Active ({subData?.days_left} Days Left)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Plans List */}
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontWeight: 600 }}>Choose a Subscription Plan to Renew</h3>
            
            {plansLoading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading subscription plans...</div>
            ) : plans.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-store-slash fa-2x" style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}></i>
                    <p>No subscription plans are defined by the administrator yet.</p>
                </div>
            ) : (
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    {plans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className="glass-panel card-hover" 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                padding: '2rem', 
                                border: '1px solid var(--glass-border)',
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.02)'
                            }}
                        >
                            <span 
                                style={{ 
                                    position: 'absolute', 
                                    top: '1.25rem', 
                                    right: '1.25rem', 
                                    fontSize: '0.75rem', 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '12px', 
                                    background: 'rgba(99, 102, 241, 0.1)', 
                                    color: 'var(--primary-color)',
                                    fontWeight: 600
                                }}
                            >
                                {plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}
                            </span>

                            <h4 style={{ fontSize: '1.3rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>{plan.name}</h4>
                            
                            <div style={{ margin: '1rem 0 1.5rem 0' }}>
                                <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{plan.price}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> / plan duration</span>
                            </div>

                            <div style={{ flex: 1, marginBottom: '1.5rem' }}></div>

                            <button 
                                className="btn btn-primary" 
                                style={{ width: '100%', padding: '0.75rem 0' }}
                                onClick={() => handlePayClick(plan)}
                            >
                                <i className="fa-solid fa-credit-card" style={{ marginRight: '6px' }}></i>
                                Renew / Pay Now
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Transactions History */}
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontWeight: 600 }}>Transaction History</h3>
            <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Subscription Plan</th>
                            <th>Amount Paid</th>
                            <th>Payment Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!subData?.transactions || subData.transactions.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payment transactions found.</td>
                            </tr>
                        ) : (
                            subData.transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--primary-color)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{tx.transaction_id || `#${tx.id}`}</td>
                                    <td style={{ fontWeight: 600 }}>{tx.plan_name || 'Manual Extension'}</td>
                                    <td>₹{tx.amount}</td>
                                    <td>{tx.transaction_date ? tx.transaction_date.split(' ')[0] : '-'}</td>
                                    <td>
                                        <span className={`status-badge ${tx.status?.toLowerCase() === 'failed' ? 'rejected' : 'active'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', textTransform: 'uppercase' }}>
                                            {tx.status || 'SUCCESS'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ============ PAYMENT GATEWAY MODAL ============ */}
            {showPaymentModal && (
                <div style={overlayStyle}>
                    <div className="glass-panel" style={modalStyle}>
                        
                        {/* ---- STEP 0: PAYMENT METHOD ---- */}
                        {paymentStep === 'method' && (
                            <>
                                {/* Header */}
                                <div style={{
                                    padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: '#ffffff'
                                }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#111827', fontSize: '1.2rem', fontWeight: 600 }}>
                                            Select Payment Method
                                        </h3>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        style={{
                                            background: 'transparent', border: 'none',
                                            color: '#6b7280', fontSize: '1.5rem',
                                            cursor: 'pointer', padding: 0
                                        }}
                                    >×</button>
                                </div>

                                {/* Plan Summary */}
                                <div style={{
                                    margin: '1.5rem 1.5rem 0', padding: '1rem', borderRadius: '6px',
                                    background: '#f9fafb', border: '1px solid #e5e7eb',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563' }}>Plan</p>
                                        <p style={{ margin: '0.15rem 0 0 0', color: '#111827', fontWeight: 600 }}>{selectedPlan?.name}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563' }}>Amount</p>
                                        <p style={{ margin: '0.15rem 0 0 0', color: '#4f46e5', fontWeight: 700, fontSize: '1.1rem' }}>₹{selectedPlan?.price}</p>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button 
                                        onClick={() => { setPaymentStep('form'); setError(''); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '1rem', borderRadius: '8px', border: '1px solid #d1d5db',
                                            background: '#ffffff', cursor: 'pointer',
                                            transition: 'border-color 0.2s', width: '100%', textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <i className="fa-solid fa-credit-card" style={{ color: '#4f46e5', fontSize: '1.2rem', width: '24px', textAlign: 'center' }}></i>
                                            <span style={{ color: '#111827', fontWeight: 500, fontSize: '1rem' }}>Credit / Debit Card</span>
                                        </div>
                                        <i className="fa-solid fa-chevron-right" style={{ color: '#9ca3af' }}></i>
                                    </button>

                                    <button 
                                        onClick={() => { setPaymentStep('upi'); setError(''); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '1rem', borderRadius: '8px', border: '1px solid #d1d5db',
                                            background: '#ffffff', cursor: 'pointer',
                                            transition: 'border-color 0.2s', width: '100%', textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <i className="fa-brands fa-google-pay" style={{ color: '#10b981', fontSize: '1.2rem', width: '24px', textAlign: 'center' }}></i>
                                            <span style={{ color: '#111827', fontWeight: 500, fontSize: '1rem' }}>UPI (GPay, PhonePe, Paytm)</span>
                                        </div>
                                        <i className="fa-solid fa-chevron-right" style={{ color: '#9ca3af' }}></i>
                                    </button>

                                    <button 
                                        onClick={() => { setPaymentStep('netbanking'); setError(''); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '1rem', borderRadius: '8px', border: '1px solid #d1d5db',
                                            background: '#ffffff', cursor: 'pointer',
                                            transition: 'border-color 0.2s', width: '100%', textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <i className="fa-solid fa-building-columns" style={{ color: '#f59e0b', fontSize: '1.2rem', width: '24px', textAlign: 'center' }}></i>
                                            <span style={{ color: '#111827', fontWeight: 500, fontSize: '1rem' }}>Net Banking</span>
                                        </div>
                                        <i className="fa-solid fa-chevron-right" style={{ color: '#9ca3af' }}></i>
                                    </button>
                                </div>
                                {error && (
                                    <div style={{ margin: '0 1.5rem 1.5rem', padding: '0.75rem', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                                        <p style={{ color: '#ef4444', margin: 0, fontSize: '0.85rem' }}>{error}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ---- STEP 1: CARD FORM ---- */}
                        {paymentStep === 'form' && (
                            <>
                                {/* Header */}
                                <div style={{
                                    padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: '#ffffff'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button 
                                            onClick={() => { setPaymentStep('method'); setError(''); }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, fontSize: '1.1rem' }}
                                        >
                                            <i className="fa-solid fa-arrow-left"></i>
                                        </button>
                                        <h3 style={{ margin: 0, color: '#111827', fontSize: '1.2rem', fontWeight: 600 }}>
                                            Card Details
                                        </h3>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        style={{
                                            background: 'transparent', border: 'none',
                                            color: '#6b7280', fontSize: '1.5rem',
                                            cursor: 'pointer', padding: 0
                                        }}
                                    >×</button>
                                </div>

                                {/* Plan Summary */}
                                <div style={{
                                    margin: '1.5rem 1.5rem 0', padding: '1rem', borderRadius: '6px',
                                    background: '#f9fafb', border: '1px solid #e5e7eb',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563' }}>Plan</p>
                                        <p style={{ margin: '0.15rem 0 0 0', color: '#111827', fontWeight: 600 }}>{selectedPlan?.name}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563' }}>Amount</p>
                                        <p style={{ margin: '0.15rem 0 0 0', color: '#4f46e5', fontWeight: 700, fontSize: '1.1rem' }}>₹{selectedPlan?.price}</p>
                                    </div>
                                </div>

                                {error && (
                                    <div style={{ margin: '1rem 1.5rem 0', padding: '0.75rem', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                                        <p style={{ color: '#ef4444', margin: 0, fontSize: '0.85rem' }}>{error}</p>
                                    </div>
                                )}

                                {/* Card Form */}
                                <form onSubmit={handlePaymentSubmit} style={{ padding: '1.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Card Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                placeholder="1234 5678 9012 3456"
                                                value={cardData.cardNumber}
                                                onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                                                style={inputStyle}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Cardholder Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={cardData.cardName}
                                            onChange={(e) => handleCardChange('cardName', e.target.value)}
                                            style={inputStyle}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <label style={labelStyle}>Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={cardData.expiry}
                                                onChange={(e) => handleCardChange('expiry', e.target.value)}
                                                style={inputStyle}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>CVV</label>
                                            <input
                                                type="password"
                                                placeholder="•••"
                                                value={cardData.cvv}
                                                onChange={(e) => handleCardChange('cvv', e.target.value)}
                                                style={inputStyle}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!isFormValid()}
                                        style={{ width: '100%', opacity: isFormValid() ? 1 : 0.6 }}
                                    >
                                        Pay ₹{selectedPlan?.price}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* ---- STEP: NET BANKING ---- */}
                        {paymentStep === 'netbanking' && (
                            <>
                                <div style={{
                                    padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: '#ffffff'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button 
                                            onClick={() => { setPaymentStep('method'); setError(''); }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, fontSize: '1.1rem' }}
                                        >
                                            <i className="fa-solid fa-arrow-left"></i>
                                        </button>
                                        <h3 style={{ margin: 0, color: '#111827', fontSize: '1.2rem', fontWeight: 600 }}>
                                            Net Banking
                                        </h3>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
                                    >×</button>
                                </div>

                                <form onSubmit={handlePaymentSubmit} style={{ padding: '1.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Select Bank</label>
                                        <select style={inputStyle} required>
                                            <option value="">-- Choose your bank --</option>
                                            <option value="sbi">State Bank of India</option>
                                            <option value="hdfc">HDFC Bank</option>
                                            <option value="icici">ICICI Bank</option>
                                            <option value="axis">Axis Bank</option>
                                            <option value="kotak">Kotak Mahindra Bank</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Customer ID / User ID</label>
                                        <input type="text" placeholder="Enter your banking ID" style={inputStyle} required />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Password</label>
                                        <input type="password" placeholder="••••••••" style={inputStyle} required />
                                    </div>

                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                        Secure Login & Pay ₹{selectedPlan?.price}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* ---- STEP: UPI ---- */}
                        {paymentStep === 'upi' && (
                            <>
                                <div style={{
                                    padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: '#ffffff'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button 
                                            onClick={() => { setPaymentStep('method'); setError(''); }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0, fontSize: '1.1rem' }}
                                        >
                                            <i className="fa-solid fa-arrow-left"></i>
                                        </button>
                                        <h3 style={{ margin: 0, color: '#111827', fontSize: '1.2rem', fontWeight: 600 }}>
                                            UPI Payment
                                        </h3>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
                                    >×</button>
                                </div>

                                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 1rem', color: '#4b5563', fontSize: '0.9rem' }}>Scan the QR code using any UPI app</p>
                                    
                                    <div style={{ 
                                        width: '200px', height: '200px', margin: '0 auto 1.5rem', 
                                        border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb'
                                    }}>
                                        <img 
                                            src="/upi-scanner.png" 
                                            alt="UPI QR Scanner" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div style={{ display: 'none', color: '#9ca3af', fontSize: '0.85rem' }}>QR Code Missing</div>
                                    </div>

                                    <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
                                        <hr style={{ borderTop: '1px solid #e5e7eb', margin: 0 }} />
                                        <span style={{ 
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                                            background: '#ffffff', padding: '0 10px', color: '#6b7280', fontSize: '0.85rem' 
                                        }}>OR</span>
                                    </div>

                                    <form onSubmit={handlePaymentSubmit} style={{ textAlign: 'left' }}>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={labelStyle}>Enter UPI ID</label>
                                            <input type="text" placeholder="e.g. username@okaxis" style={inputStyle} required />
                                        </div>

                                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                            Verify & Pay ₹{selectedPlan?.price}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}

                        {/* ---- STEP 2: PROCESSING ---- */}
                        {paymentStep === 'processing' && (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <i className="fa-solid fa-spinner fa-spin fa-3x" style={{ color: '#4f46e5', marginBottom: '1.5rem' }}></i>
                                <h3 style={{ color: '#111827', margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Processing Payment</h3>
                                <p style={{ color: '#4b5563', margin: 0, fontSize: '0.9rem' }}>
                                    Please wait while we verify your details...
                                </p>
                            </div>
                        )}

                        {/* ---- STEP 3: RECEIPT ---- */}
                        {paymentStep === 'receipt' && receiptData && (
                            <>
                                <div style={{ padding: '2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                    <div style={{
                                        width: '60px', height: '60px', margin: '0 auto 1rem',
                                        borderRadius: '50%', background: '#d1fae5',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <i className="fa-solid fa-check" style={{ color: '#10b981', fontSize: '1.5rem' }}></i>
                                    </div>
                                    <h3 style={{ color: '#10b981', margin: '0 0 0.3rem', fontSize: '1.3rem' }}>Payment Successful</h3>
                                </div>

                                {/* Receipt Card */}
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Transaction ID</span>
                                        <span style={{ color: '#111827', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'monospace' }}>{receiptData.transactionId}</span>
                                    </div>
                                    
                                    {[
                                        { label: 'Plan', value: receiptData.planName },
                                        { label: 'Amount Paid', value: `₹${receiptData.amount}` },
                                        { label: 'Method', value: receiptData.paymentMode },
                                        { label: 'Date', value: receiptData.date }
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{item.label}</span>
                                            <span style={{ color: '#111827', fontWeight: 500, fontSize: '0.9rem' }}>{item.value}</span>
                                        </div>
                                    ))}

                                    <button
                                        onClick={handleReceiptClose}
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '2rem' }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default Subscription;
