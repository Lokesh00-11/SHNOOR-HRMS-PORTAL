import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const badgesList = [
    { id: 'hard_worker', title: 'Hard Worker', icon: 'fa-hammer', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)', desc: 'For always giving 100% effort.', skills: ['Dedication', 'Focus'] },
    { id: 'helpful', title: 'Helpful', icon: 'fa-heart', color: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.2)', desc: 'For always being there to support others.', skills: ['Teamwork', 'Empathy'] },
    { id: 'knowledgeable', title: 'Knowledgeable', icon: 'fa-lightbulb', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)', desc: 'For being the go-to person for answers.', skills: ['Expertise', 'Problem Solving'] },
    { id: 'personal_developer', title: 'Personal Developer', icon: 'fa-user-graduate', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.2)', desc: 'For continuous learning and improvement.', skills: ['Growth Mindset', 'Learning'] },
    { id: 'ambassador', title: 'Ambassador', icon: 'fa-flag', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.2)', desc: 'For representing the company values well.', skills: ['Leadership', 'Communication'] },
    { id: 'cost_cutter', title: 'Cost Cutter', icon: 'fa-sack-dollar', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.2)', desc: 'For finding ways to save resources.', skills: ['Efficiency', 'Resourcefulness'] },
    { id: 'creative', title: 'Creative', icon: 'fa-palette', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.2)', desc: 'For bringing fresh and innovative ideas.', skills: ['Innovation', 'Creativity'] },
    { id: 'customer_champion', title: 'Customer Champion', icon: 'fa-trophy', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.2)', desc: 'For delivering exceptional customer service.', skills: ['Customer Success', 'Support'] },
    { id: 'efficient', title: 'Efficient', icon: 'fa-check-double', color: '#84cc16', bgColor: 'rgba(132, 204, 22, 0.2)', desc: 'For completing tasks well, quickly.', skills: ['Results', 'Productivity'] },
    { id: 'expert', title: 'Expert', icon: 'fa-award', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.2)', desc: 'For demonstrating high-level expertise.', skills: ['Mastery', 'Excellence'] }
];

const Thanks = ({ currentMode }) => {
    const [feed, setFeed] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState(1);

    const [newThanks, setNewThanks] = useState({ recipient: '', badge: null, message: '' });
    const [commentInputs, setCommentInputs] = useState({});
    const [infoBadge, setInfoBadge] = useState(null);
    const [currentUserEmail, setCurrentUserEmail] = useState(null);

    useEffect(() => {
        const fetchEmployeesAndProfile = async () => {
            try {
                const empData = await get('/manager/all-employee-profiles/');
                setEmployees(empData || []);
            } catch (err) {
                console.error("Failed to load employees for thanks", err);
            }
            try {
                const profileData = await get('/employee/profile/').catch(() => get('/manager/profile/'));
                if (profileData && profileData.email) {
                    setCurrentUserEmail(profileData.email);
                }
            } catch (err) {
                console.error("Failed to fetch profile");
            }
        };
        const fetchFeed = async () => {
            try {
                const feedData = await get('/manager/thanks/');
                setFeed(feedData || []);
            } catch (e) { }
        };
        fetchEmployeesAndProfile();
        fetchFeed();
    }, []);

    const openModal = () => {
        setModalStep(1);
        setNewThanks({ recipient: '', badge: null, message: '' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleGiveThanks = async () => {
        if (!newThanks.badge) { alert("Please select a badge."); return; }
        if (!newThanks.message) { alert("Please enter a message."); return; }
        if (!newThanks.recipient) { alert("Please select a recipient."); return; }

        try {
            await post('/manager/thanks/', {
                recipient: newThanks.recipient,
                title: newThanks.badge.title,
                description: newThanks.message
            });
            alert("Thanks posted successfully!");

            const feedData = await get('/manager/thanks/');
            setFeed(feedData || []);
            closeModal();
        } catch (e) {
            alert("Failed to post thanks.");
        }
    };

    const handleAddComment = async (id) => {
        const text = commentInputs[id];
        if (!text) return;

        try {
            await post(`/thanks/${id}/comments/`, { text });
            const feedData = await get('/manager/thanks/');
            setFeed(feedData || []);
            setCommentInputs({ ...commentInputs, [id]: '' });
        } catch (e) {
            alert("Failed to post comment.");
        }
    };

    const badgeCounts = feed.reduce((acc, curr) => {
        const badgeTitle = curr.title || 'Unknown Badge';
        acc[badgeTitle] = (acc[badgeTitle] || 0) + 1;
        return acc;
    }, {});
    let mostPopularBadgeTitle = "No badges yet";
    let mostPopularCount = 0;
    let popularBadgeObj = null;

    Object.entries(badgeCounts).forEach(([badge, count]) => {
        if (count > mostPopularCount) {
            mostPopularCount = count;
            mostPopularBadgeTitle = badge;
            popularBadgeObj = badgesList.find(b => b.title === badge);
        }
    });

    const formatDate = (dateString) => {
        try {
            const d = dateString ? new Date(dateString) : new Date();
            if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
    };

    const getStepperStyle = (stepNum) => ({
        flex: 1,
        textAlign: 'center',
        padding: '0.75rem',
        background: modalStep === stepNum ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: modalStep === stepNum ? 'var(--primary)' : 'var(--text-muted)',
        borderBottom: `2px solid ${modalStep === stepNum ? 'var(--primary)' : 'var(--glass-border)'}`,
        fontWeight: modalStep === stepNum ? 600 : 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.3s ease'
    });

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>Thanks</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Thank badges are a way to appreciate colleagues for their hard work, dedication, or special contributions.
            </p>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)' }}>
                <div>
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Thank Your Colleagues</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '800px' }}>
                        Show appreciation to a colleague by awarding them a unique badge that recognizes their skills and contributions, along with a personal message of appreciation.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openModal}>Give Thanks</button>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', width: 'fit-content' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Most Popular Badge:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', background: popularBadgeObj ? popularBadgeObj.bgColor : 'rgba(255,255,255,0.1)', color: popularBadgeObj ? popularBadgeObj.color : 'var(--text-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {popularBadgeObj ? <i className={`fa-solid ${popularBadgeObj.icon}`}></i> : '-'}
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{mostPopularBadgeTitle}</h4>
                    </div>
                    <div style={{ marginLeft: '3rem', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem', fontWeight: 300 }}>{mostPopularCount}</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left', lineHeight: 1.2 }}>Badges awarded<br />in the last<br />12 months</span>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {feed.map(item => {
                    const badgeObj = badgesList.find(b => b.title === item.title) || badgesList[0];
                    return (
                        <div key={item.id} style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <i className="fa-solid fa-user" style={{ color: 'var(--text-muted)' }}></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                        <span style={{ fontWeight: 600 }}>{item.recipient_name || item.recipient_username || 'Unknown'}</span> received thanks from <span style={{ fontWeight: 600 }}>{item.sender_name || item.sender_username || 'Unknown'}</span> - <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(item.created_at)}</span>
                                        <span style={{ marginLeft: '1rem', color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer' }}>{item.comments ? item.comments.length : 0} Comment{item.comments?.length !== 1 ? 's' : ''}</span>
                                    </p>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '50px', height: '50px', background: badgeObj.bgColor, color: badgeObj.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', flexShrink: 0 }}>
                                            <i className={`fa-solid ${badgeObj.icon}`}></i>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>{item.title}</h4>
                                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.03)' }}>
                                {item.comments && item.comments.map((comment, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            <i className="fa-solid fa-user" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                <span style={{ fontWeight: 600 }}>{comment.author_name || comment.author_username || 'Unknown'}</span> added a comment - <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(comment.created_at)}</span>
                                            </p>
                                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{comment.text}</p>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: item.comments?.length ? '1rem' : '0' }}>
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={commentInputs[item.id] || ''}
                                        onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-navy)', color: 'var(--text-main)' }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item.id)}
                                    />
                                    <button className="btn btn-primary" style={{ padding: '0.75rem 1rem' }} onClick={() => handleAddComment(item.id)}>Add Comment</button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '800px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#333333' }}>Thanks</h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#666666', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                            <p style={{ color: '#666666', marginBottom: '2rem' }}>
                                Thanks badges are a way of thanking colleagues for working extra hard or doing something extra special.
                            </p>

                            <div style={{ display: 'flex', marginBottom: '2rem', background: '#f9fafb', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                <div style={getStepperStyle(1)}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: modalStep === 1 ? 'var(--primary)' : '#e5e7eb', color: modalStep === 1 ? '#fff' : '#666', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                                    Choose a Badge
                                </div>
                                <div style={getStepperStyle(2)}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: modalStep === 2 ? 'var(--primary)' : '#e5e7eb', color: modalStep === 2 ? '#fff' : '#666', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                                    Comment
                                </div>
                                <div style={getStepperStyle(3)}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: modalStep === 3 ? 'var(--primary)' : '#e5e7eb', color: modalStep === 3 ? '#fff' : '#666', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                                    Select Person
                                </div>
                            </div>

                            <div style={{ minHeight: '300px' }}>
                                {modalStep === 1 && (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                            {badgesList.map(b => (
                                                <div
                                                    key={b.id}
                                                    onClick={() => setNewThanks({ ...newThanks, badge: b })}
                                                    style={{
                                                        border: newThanks.badge?.id === b.id ? '2px solid navy' : '1px solid #ccc',
                                                        borderRadius: '8px',
                                                        textAlign: 'center',
                                                        cursor: 'pointer',
                                                        background: '#fff',
                                                        color: '#000',
                                                        display: 'flex',
                                                        flexDirection: 'column'
                                                    }}
                                                >
                                                    <div style={{ padding: '1.5rem 1rem', flex: 1 }}>
                                                        <div style={{ width: '60px', height: '60px', margin: '0 auto 1rem', background: b.bgColor, color: b.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                                                            <i className={`fa-solid ${b.icon}`}></i>
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{b.title}</div>
                                                    </div>
                                                    <div
                                                        style={{ borderTop: '1px solid #ccc', padding: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#666', transition: 'background 0.2s' }}
                                                        onClick={(e) => { e.stopPropagation(); setInfoBadge(b); }}
                                                        onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
                                                        onMouseOut={(e) => e.target.style.background = 'transparent'}
                                                    >
                                                        Info
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {modalStep === 2 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                            <div style={{ width: '50px', height: '50px', background: newThanks.badge.bgColor, color: newThanks.badge.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                                <i className={`fa-solid ${newThanks.badge.icon}`}></i>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#333333' }}>{newThanks.badge.title}</h4>
                                                <span style={{ fontSize: '0.8rem', color: '#666666' }}>Selected Badge</span>
                                            </div>
                                        </div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333333', fontWeight: 600 }}>Why are you giving this thanks?</label>
                                        <textarea
                                            value={newThanks.message}
                                            onChange={(e) => setNewThanks({ ...newThanks, message: e.target.value })}
                                            placeholder="Write a nice message recognizing their effort..."
                                            style={{ flex: 1, minHeight: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', color: '#333', resize: 'vertical' }}
                                        ></textarea>
                                    </div>
                                )}

                                {modalStep === 3 && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '1rem', color: '#333333', fontWeight: 600 }}>Who do you want to thank?</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {employees.map(emp => {
                                                const empName = emp.full_name || 'Unknown';
                                                const userId = emp.user_id;
                                                // Prevent thanking yourself
                                                if (currentUserEmail && emp.email === currentUserEmail) return null;
                                                return (
                                                    <div
                                                        key={emp.id}
                                                        onClick={() => setNewThanks({ ...newThanks, recipient: userId })}
                                                        style={{
                                                            border: newThanks.recipient === userId ? '2px solid navy' : '1px solid #ccc',
                                                            borderRadius: '8px',
                                                            padding: '1rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '1rem',
                                                            background: newThanks.recipient === userId ? '#f0f9ff' : '#fff',
                                                            color: '#000'
                                                        }}
                                                    >
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                            {emp.profile_picture ? (
                                                                <img src={emp.profile_picture} alt={empName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <i className="fa-solid fa-user" style={{ color: '#666' }}></i>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{empName}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{emp.designation || 'Team Member'}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {employees.filter(e => !currentUserEmail || e.email !== currentUserEmail).length === 0 && (
                                                <div style={{ color: '#666', fontStyle: 'italic' }}>Loading employees or none available...</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => modalStep > 1 ? setModalStep(modalStep - 1) : closeModal()}
                            >
                                {modalStep > 1 ? 'Back' : 'Cancel'}
                            </button>

                            {modalStep < 3 ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setModalStep(modalStep + 1)}
                                    disabled={modalStep === 1 && !newThanks.badge}
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleGiveThanks}
                                    disabled={!newThanks.recipient || !newThanks.message}
                                >
                                    Post Thanks
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {infoBadge && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#333333', fontSize: '1.2rem' }}>About This Badge</h3>
                            <button onClick={() => setInfoBadge(null)} style={{ background: 'none', border: 'none', color: '#666666', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', color: '#666666', fontSize: '0.9rem' }}>
                            <p style={{ margin: '0 0 1.5rem 0' }}>See what this badge means when you award it.</p>

                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                <div style={{ width: '100px', height: '100px', background: '#f0f4f8', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '70px', height: '70px', background: infoBadge.bgColor, color: infoBadge.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                        <i className={`fa-solid ${infoBadge.icon}`}></i>
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>Badge Name</div>
                                            <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', border: '1px solid #bae6fd', fontSize: '0.8rem', borderRadius: '4px' }}>
                                                {infoBadge.title}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>Skills</div>
                                            <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>This badge adds these skills to the recipient's profile:</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {infoBadge.skills?.map(s => (
                                                    <span key={s} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: '#4b5563', borderRadius: '4px' }}>{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#333', marginBottom: '0.2rem' }}>Who Deserves This Badge?</div>
                                        <div>{infoBadge.desc}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', textAlign: 'center' }}>
                                <div style={{ fontWeight: 600, color: '#333', marginBottom: '1rem' }}>Statistics</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', width: '120px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem' }}>0</div>
                                        <div style={{ fontSize: '0.8rem' }}>This Month</div>
                                    </div>
                                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', width: '120px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem' }}>0</div>
                                        <div style={{ fontSize: '0.8rem' }}>Total</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', textAlign: 'right', background: '#f9fafb' }}>
                            <button className="btn btn-primary" onClick={() => setInfoBadge(null)} style={{ padding: '0.5rem 1.5rem' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Thanks;
