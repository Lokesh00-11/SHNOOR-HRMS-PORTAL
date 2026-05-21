import React, { useState, useEffect } from 'react';
import { get, put } from '../../../services/api';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/profile/');
            if (data) {
                if (data.date_of_birth && data.date_of_birth.includes('-')) {
                    const parts = data.date_of_birth.split('-');
                    if (parts[0].length === 2) data.date_of_birth = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                if (data.date_of_joining && data.date_of_joining.includes('-')) {
                    const parts = data.date_of_joining.split('-');
                    if (parts[0].length === 2) data.date_of_joining = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            setProfile(data);
            setFormData(data || {});
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            const dataToSubmit = { ...formData };
            if (dataToSubmit.date_of_birth === "") dataToSubmit.date_of_birth = null;
            if (dataToSubmit.date_of_joining === "") dataToSubmit.date_of_joining = null;

            delete dataToSubmit.profile_picture;

            await put('/employee/profile/update/', dataToSubmit);
            alert('Profile updated successfully!');
            setEditMode(false);
            fetchProfile();
        } catch (err) {
            console.error('Update Error:', err);
            alert(`Failed to update profile: ${err.message}`);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading complete profile data...</div>;

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 className="gradient-text">My Profile</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your personal and professional information</p>
                </div>
                <div>
                    {!editMode ? (
                        <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                            <i className="fa-solid fa-user-pen"></i> Edit Profile
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>

                    {/* 1. Basic Personal Details */}
                    <div className="profile-group">
                        <h3 className="section-header">
                            <i className="fa-solid fa-user"></i> Personal Details
                        </h3>
                        <div className="form-grid">
                            <div className="setting-item">
                                <h4>First Name</h4>
                                <input type="text" disabled={!editMode} value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Last Name</h4>
                                <input type="text" disabled={!editMode} value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Email Address</h4>
                                <input type="email" disabled value={formData.email || ''} style={{ opacity: 0.7 }} />
                            </div>
                            <div className="setting-item">
                                <h4>Phone Number</h4>
                                <input type="text" disabled={!editMode} value={formData.phone_number || ''} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Gender</h4>
                                <select disabled={!editMode} value={formData.gender || ''} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <h4>Date of Birth</h4>
                                <input type="date" disabled={!editMode} value={formData.date_of_birth || ''} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Professional Details */}
                    <div className="profile-group">
                        <h3 className="section-header">
                            <i className="fa-solid fa-briefcase"></i> Professional Info
                        </h3>
                        <div className="form-grid">
                            <div className="setting-item">
                                <h4>Employee ID</h4>
                                <input type="text" disabled={!editMode} value={formData.employee_id || ''} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Designation</h4>
                                <input type="text" disabled={!editMode} value={formData.designation || ''} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Department</h4>
                                <input type="text" disabled={!editMode} value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Joining Date</h4>
                                <input type="date" disabled={!editMode} value={formData.date_of_joining || ''} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Shift</h4>
                                <select disabled={!editMode} value={formData.shift || 'day'} onChange={(e) => setFormData({ ...formData, shift: e.target.value })}>
                                    <option value="day">General Shift</option>
                                    <option value="night">Night Shift</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <h4>Marital Status</h4>
                                <select disabled={!editMode} value={formData.marital_status || ''} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <h4>Blood Group</h4>
                                <input type="text" disabled={!editMode} value={formData.blood_group || ''} onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })} placeholder="e.g. O+" />
                            </div>
                        </div>
                    </div>

                    {/* 3. Financial & Identity */}
                    <div className="profile-group">
                        <h3 className="section-header">
                            <i className="fa-solid fa-id-card"></i> Identity & Bank
                        </h3>
                        <div className="form-grid">
                            <div className="setting-item">
                                <h4>Aadhaar Number</h4>
                                <input type="text" maxLength="12" disabled={!editMode} value={formData.aadhaar_number || ''} onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>PAN Number</h4>
                                <input type="text" maxLength="10" disabled={!editMode} value={formData.pan_number || ''} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Bank Name</h4>
                                <input type="text" disabled={!editMode} value={formData.bank_name || ''} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Account Number</h4>
                                <input type="text" disabled={!editMode} value={formData.account_number || ''} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>IFSC Code</h4>
                                <input type="text" disabled={!editMode} value={formData.ifsc_code || ''} onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })} />
                            </div>
                            <div className="setting-item">
                                <h4>Branch Name</h4>
                                <input type="text" disabled={!editMode} value={formData.branch_name || ''} onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Address & Emergency */}
                    <div className="profile-group" style={{ gridColumn: '1 / -1' }}>
                        <h3 className="section-header">
                            <i className="fa-solid fa-location-dot"></i> Address & Emergency Contacts
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div className="setting-item">
                                <h4>Current Address</h4>
                                <textarea disabled={!editMode} value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--bg-tertiary)', color: 'var(--text-main)' }} />
                            </div>
                            <div className="setting-item">
                                <h4>Permanent Address</h4>
                                <textarea disabled={!editMode} value={formData.permanent_address || ''} onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })} style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--bg-tertiary)', color: 'var(--text-main)' }} />
                            </div>
                            <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px' }}>
                                    <div className="setting-item">
                                        <h4>Emergency Contact Name</h4>
                                        <input type="text" disabled={!editMode} value={formData.emergency_contact_name || ''} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} />
                                    </div>
                                    <div className="setting-item">
                                        <h4>Emergency Contact Phone</h4>
                                        <input type="text" disabled={!editMode} value={formData.emergency_contact_phone || ''} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} />
                                    </div>
                                    <div className="setting-item">
                                        <h4>Relation</h4>
                                        <input type="text" disabled={!editMode} value={formData.emergency_contact_relation || ''} onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .section-header {
                    margin-bottom: 2rem;
                    color: var(--primary-color);
                    font-size: 1.2rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border-bottom: 2px solid var(--primary-light);
                    padding-bottom: 0.75rem;
                }
                .form-grid {
                    display: grid;
                    gap: 1.5rem;
                }
            `}</style>
        </section>
    );
};

export default Profile;
