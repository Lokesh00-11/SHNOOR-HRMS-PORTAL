import React, { useState, useEffect } from 'react';
import { get, post } from '../../../services/api';

const CreateTicketModal = ({ onClose, onSuccess }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'Medium'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await get('/helpdesk/categories/');
                setCategories(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await post('/helpdesk/tickets/', formData);
            onSuccess();
        } catch (error) {
            console.error("Failed to create ticket", error);
            alert("Error creating ticket");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel fade-in" style={{ width: '90%', maxWidth: '550px', padding: '2rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                
                <h3 className="gradient-text" style={{ margin: '0 0 1.5rem 0' }}>Create Support Ticket</h3>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Title</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Category</label>
                            <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Priority</label>
                            <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Description</label>
                        <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'vertical' }}></textarea>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicketModal;
