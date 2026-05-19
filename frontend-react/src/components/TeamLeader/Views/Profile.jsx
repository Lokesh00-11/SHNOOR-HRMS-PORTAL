import React, { useState, useEffect } from 'react';
import { get, put } from '../../../services/api';

const Profile = () => {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        date_of_birth: '',
        address: '',
        permanent_address: '',
        
        employee_id: '',
        designation: '',
        department: '',
        joining_date: '',
        aadhaar_number: '',
        pan_number: '',
        nationality: '',
        marital_status: '',
        blood_group: '',
        
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch: ''
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await get('/teamleader/profile/');
            if (data) {
                setProfile({
                    ...data,
                    date_of_birth: formatDateForInput(data.date_of_birth),
                    joining_date: formatDateForInput(data.joining_date)
                });
            }
        } catch (err) {
            console.error('Error fetching team leader profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            const data = await put('/teamleader/profile/update/', profile);
            if (data) {
                alert('Profile details saved successfully!');
                fetchProfile();
            } else {
                alert('Failed to save profile changes.');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving profile changes.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <section className="view-section active">
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading profile...</div>
            </section>
        );
    }

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Profile Details</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 1. Identity & Credentials */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Personal Identity</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>First Name</label>
                            <input 
                                type="text" 
                                name="first_name"
                                required
                                value={profile.first_name || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Last Name</label>
                            <input 
                                type="text" 
                                name="last_name"
                                required
                                value={profile.last_name || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Registered Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                disabled
                                value={profile.email || ''}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Phone Number</label>
                            <input 
                                type="text" 
                                name="phone"
                                value={profile.phone || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Gender</label>
                            <select 
                                name="gender"
                                value={profile.gender || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="">-- Choose Gender --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Date of Birth</label>
                            <input 
                                type="date" 
                                name="date_of_birth"
                                value={profile.date_of_birth || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Employment & Work Info */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Employment Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Employee ID</label>
                            <input 
                                type="text" 
                                name="employee_id"
                                disabled
                                value={profile.employee_id || ''}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Designation</label>
                            <input 
                                type="text" 
                                name="designation"
                                disabled
                                value={profile.designation || ''}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Department</label>
                            <input 
                                type="text" 
                                name="department"
                                disabled
                                value={profile.department || ''}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Date of Joining</label>
                            <input 
                                type="date" 
                                name="joining_date"
                                disabled
                                value={profile.joining_date || ''}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Aadhaar Number</label>
                            <input 
                                type="text" 
                                name="aadhaar_number"
                                value={profile.aadhaar_number || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>PAN Card Number</label>
                            <input 
                                type="text" 
                                name="pan_number"
                                value={profile.pan_number || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Nationality</label>
                            <input 
                                type="text" 
                                name="nationality"
                                value={profile.nationality || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Marital Status</label>
                            <select 
                                name="marital_status"
                                value={profile.marital_status || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="">-- Choose Status --</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Blood Group</label>
                            <input 
                                type="text" 
                                name="blood_group"
                                value={profile.blood_group || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Addresses */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Addresses & Contacts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Present Mailing Address</label>
                            <input 
                                type="text" 
                                name="address"
                                value={profile.address || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Permanent Home Address</label>
                            <input 
                                type="text" 
                                name="permanent_address"
                                value={profile.permanent_address || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>

                    <h4 style={{ color: 'var(--primary-color)', margin: '2rem 0 1rem', fontSize: '1.05rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Emergency Contact</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Emergency Contact Name</label>
                            <input 
                                type="text" 
                                name="emergency_contact_name"
                                value={profile.emergency_contact_name || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Contact Phone</label>
                            <input 
                                type="text" 
                                name="emergency_contact_phone"
                                value={profile.emergency_contact_phone || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Relationship</label>
                            <input 
                                type="text" 
                                name="emergency_contact_relation"
                                value={profile.emergency_contact_relation || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Bank Information */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Bank Accounts</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Bank Name</label>
                            <input 
                                type="text" 
                                name="bank_name"
                                value={profile.bank_name || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Account Number</label>
                            <input 
                                type="text" 
                                name="account_number"
                                value={profile.account_number || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>IFSC Code</label>
                            <input 
                                type="text" 
                                name="ifsc_code"
                                value={profile.ifsc_code || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>IFSC Branch</label>
                            <input 
                                type="text" 
                                name="branch"
                                value={profile.branch || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <button type="submit" className="btn btn-primary" disabled={updating} style={{ padding: '0.75rem 3rem' }}>
                        {updating ? 'Saving changes...' : 'Save Profile Details'}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default Profile;
