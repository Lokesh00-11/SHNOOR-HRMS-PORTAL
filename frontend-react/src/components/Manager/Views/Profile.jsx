import React, { useState, useEffect } from 'react';
import { get, put } from '../../../services/api';

const Profile = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: 'Male',
        date_of_birth: '',
        address: '',
        
        employee_id: '',
        joining_date: '',
        designation: '',
        department: '',
        
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch: '',
        
        aadhaar_number: '',
        pan_number: '',
        marital_status: 'Single',
        nationality: '',
        blood_group: '',
        permanent_address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: ''
    });
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await get('/manager/profile/');
            if (data) {
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    phone: data.phone_number || '',
                    gender: data.gender || 'Male',
                    date_of_birth: data.date_of_birth || '',
                    address: data.address || '',
                    
                    employee_id: data.employee_id || '',
                    joining_date: data.date_of_joining || '',
                    designation: data.designation || '',
                    department: data.department || '',
                    
                    bank_name: data.bank_name || '',
                    account_number: data.account_number || '',
                    ifsc_code: data.ifsc_code || '',
                    branch: data.branch || '',
                    
                    aadhaar_number: data.aadhaar_number || '',
                    pan_number: data.pan_number || '',
                    marital_status: data.marital_status || 'Single',
                    nationality: data.nationality || '',
                    blood_group: data.blood_group || '',
                    permanent_address: data.permanent_address || '',
                    emergency_contact_name: data.emergency_contact_name || '',
                    emergency_contact_phone: data.emergency_contact_phone || '',
                    emergency_contact_relation: data.emergency_contact_relation || ''
                });
            }
        } catch (err) {
            console.error('Error fetching profile details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await put('/manager/profile/update/', formData);
            alert('Profile updated successfully!');
            fetchProfile();
        } catch (err) {
            alert('Failed to update profile details.');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3 style={{ color: 'var(--text-muted)' }}>Loading Profile Details...</h3>
            </div>
        );
    }

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Profile Details</h2>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 1. Personal Details */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Personal Info</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>First Name</label>
                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Last Name</label>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.6 }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Phone Number</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Date of Birth</label>
                            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Present Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                    </div>
                </div>

                {/* 2. Identity Records */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Identity Records</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Aadhaar Number</label>
                            <input type="text" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>PAN Number</label>
                            <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Marital Status</label>
                            <select name="marital_status" value={formData.marital_status} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Nationality</label>
                            <input type="text" name="nationality" value={formData.nationality} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Blood Group</label>
                            <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} placeholder="e.g. O+"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Permanent Address</label>
                            <input type="text" name="permanent_address" value={formData.permanent_address} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                    </div>
                </div>

                {/* 3. Professional Info */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Professional Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Employee ID</label>
                            <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.6 }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Date of Joining</label>
                            <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.6 }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Designation</label>
                            <input type="text" name="designation" value={formData.designation} onChange={handleChange} disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.6 }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Department</label>
                            <input type="text" name="department" value={formData.department} onChange={handleChange} disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', opacity: 0.6 }} />
                        </div>
                    </div>
                </div>

                {/* 4. Bank Account Details */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Bank Accounts</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Bank Name</label>
                            <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Account Number</label>
                            <input type="text" name="account_number" value={formData.account_number} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>IFSC Code</label>
                            <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Branch Name</label>
                            <input type="text" name="branch" value={formData.branch} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                    </div>
                </div>

                {/* 5. Emergency Contact Details */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Emergency Contacts</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Contact Name</label>
                            <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Contact Phone</label>
                            <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Relation</label>
                            <input type="text" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginBottom: '3rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>Save All Changes</button>
                </div>
            </form>
        </section>
    );
};

export default Profile;
