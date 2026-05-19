import React, { useState, useEffect } from 'react';
import { get, API_BASE } from '../../../services/api';

const parseCustomDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return null;
    
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('-');
    
    if (dateParts.length !== 3) return new Date(dateStr);
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    if (parts.length > 1) {
        const timeParts = parts[1].split(':');
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);
        const second = parseInt(timeParts[2], 10) || 0;
        return new Date(year, month, day, hour, minute, second);
    }
    
    return new Date(year, month, day);
};

const LetterHeads = () => {
    const [letters, setLetters] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form fields
    const [title, setTitle] = useState('');
    const [selectedDocType, setSelectedDocType] = useState('offer_letter');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [content, setContent] = useState('');
    
    // Dynamic fields
    const [designation, setDesignation] = useState('');
    const [salary, setSalary] = useState('');
    const [month, setMonth] = useState('');

    const fetchDataInit = async () => {
        try {
            setLoading(true);
            const [lettersData, empsData] = await Promise.all([
                get('/manager/letterheads/'),
                get('/manager/employees/')
            ]);
            setLetters(lettersData || []);
            setEmployees(empsData || []);
        } catch (err) {
            console.error('Error fetching letterhead details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDataInit();
    }, []);

    const handleCompileLetter = async (e) => {
        e.preventDefault();
        if (!selectedEmployeeId) {
            alert('Please select a recipient employee.');
            return;
        }

        const selectedEmp = employees.find(emp => String(emp.id) === String(selectedEmployeeId));
        const employeeName = selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : 'Valued Employee';

        const payload = {
            title,
            document_type: selectedDocType,
            employee: selectedEmployeeId,
            employee_name: employeeName,
            content
        };

        if (selectedDocType === 'offer_letter' || selectedDocType === 'recommendation') {
            payload.designation = designation;
        }
        if (selectedDocType === 'offer_letter' || selectedDocType === 'payslip') {
            payload.salary = salary;
        }
        if (selectedDocType === 'payslip') {
            payload.month = month;
        }

        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/manager/letterheads/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Letter compiled and compiled directly to Google Drive successfully!');
                setTitle('');
                setSelectedEmployeeId('');
                setContent('');
                setDesignation('');
                setSalary('');
                setMonth('');
                fetchDataInit();
            } else {
                const errData = await res.json();
                alert(`Compilation failed: ${errData.message || 'Server error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred during reportlab PDF compiling.');
        }
    };

    const handleDeleteLetter = async (id) => {
        if (!confirm('Are you sure you want to delete this generated letterhead archive?')) return;

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Token ${token}`;

        try {
            const res = await fetch(`${API_BASE}/manager/letterheads/${id}/`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                alert('Letterhead archived document deleted successfully!');
                fetchDataInit();
            } else {
                alert('Failed to delete letterhead.');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting letterhead.');
        }
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Corporate Letterheads & PDFs</h2>

            {/* Template Selector Cards */}
            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                {[
                    { type: 'offer_letter', title: 'Offer Letter', desc: 'Generate standard job offers with title & gross CTC packages.', icon: 'fa-file-signature', bg: 'var(--primary-light)', activeColor: 'var(--primary-color)' },
                    { type: 'nda', title: 'Confidential NDA', desc: 'Generate corporate non-disclosure agreements for candidate onboarding.', icon: 'fa-user-shield', bg: 'rgba(16,185,129,0.05)', activeColor: '#10b981' },
                    { type: 'payslip', title: 'Salary Payslip', desc: 'Generate monthly corporate payslips with direct payouts mapped.', icon: 'fa-money-bill-wave', bg: 'rgba(245,158,11,0.05)', activeColor: '#f59e0b' },
                    { type: 'recommendation', title: 'Recommendation Letter', desc: 'Generate official performance recommendation and relieving files.', icon: 'fa-medal', bg: 'rgba(225,29,72,0.05)', activeColor: '#e11d48' }
                ].map(tmpl => {
                    const isActive = selectedDocType === tmpl.type;
                    return (
                        <div 
                            key={tmpl.type}
                            className="glass-panel" 
                            onClick={() => setSelectedDocType(tmpl.type)}
                            style={{ 
                                padding: '1.5rem', 
                                cursor: 'pointer', 
                                border: `1px solid ${isActive ? tmpl.activeColor : 'var(--glass-border)'}`,
                                background: isActive ? tmpl.bg : 'transparent',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <i className={`fa-solid ${tmpl.icon}`} style={{ fontSize: '1.5rem', color: isActive ? tmpl.activeColor : 'var(--text-muted)' }}></i>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{tmpl.title}</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{tmpl.desc}</p>
                        </div>
                    );
                })}
            </div>

            {/* Document Creation Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Compile Document</h3>
                <form onSubmit={handleCompileLetter} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Document Title</label>
                            <input 
                                type="text" 
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Offer_Letter_John_Doe"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Recipient Employee / Candidate</label>
                            <select 
                                required
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                            >
                                <option value="">-- Choose Employee / Candidate --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name} ({emp.designation || 'Staff'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Template Specific Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {selectedDocType === 'offer_letter' && (
                            <>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Offer Designation</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={designation}
                                        onChange={(e) => setDesignation(e.target.value)}
                                        placeholder="e.g. Associate Tech Lead"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Annual Gross Salary (CTC)</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        placeholder="e.g. ₹1,200,000 per annum"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </>
                        )}
                        {selectedDocType === 'nda' && (
                            <div style={{ gridColumn: 'span 2', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                                <i className="fa-solid fa-circle-info"></i> The NDA utilizes standard corporate confidentiality clauses mapped to the chosen employee.
                            </div>
                        )}
                        {selectedDocType === 'payslip' && (
                            <>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Salary Month</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        placeholder="e.g. May 2026"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Net Paid Amount</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        placeholder="e.g. ₹85,000"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </>
                        )}
                        {selectedDocType === 'recommendation' && (
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Serving Designation</label>
                                <input 
                                    type="text" 
                                    required
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    placeholder="e.g. Technical Product Manager"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Additional Custom Clauses / Remarks</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="4"
                            placeholder="Add standard body text or customized clauses here..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', resize: 'none' }}
                        />
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>
                            <i className="fa-solid fa-file-pdf"></i> Compile & Upload to Drive
                        </button>
                    </div>
                </form>
            </div>

            {/* Generated Documents Archive List */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Category</th>
                            <th>Compiled Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading compiled letters directory...</td></tr>
                        ) : letters.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No documents compiled yet.</td></tr>
                        ) : (
                            letters.map((item, index) => {
                                let docDate = '-';
                                if (item.created_at) {
                                    const parsedDate = parseCustomDate(item.created_at);
                                    if (parsedDate && !isNaN(parsedDate.getTime())) {
                                        docDate = parsedDate.toLocaleString();
                                    }
                                }
                                
                                let categoryBadge = '';
                                if (item.document_type === 'offer_letter') categoryBadge = '<span class="status-badge" style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Offer Letter</span>';
                                else if (item.document_type === 'nda') categoryBadge = '<span class="status-badge" style="background: rgba(16,185,129,0.1); color: #10b981; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Confidential NDA</span>';
                                else if (item.document_type === 'payslip') categoryBadge = '<span class="status-badge" style="background: rgba(245,158,11,0.1); color: #f59e0b; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Salary Payslip</span>';
                                else if (item.document_type === 'recommendation') categoryBadge = '<span class="status-badge" style="background: rgba(225,29,72,0.1); color: #e11d48; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Recommendation</span>';
                                else categoryBadge = `<span class="status-badge" style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${item.document_type}</span>`;

                                const downloadUrl = item.file ? (item.file.startsWith('http') ? `${API_BASE}/download-file/?url=${encodeURIComponent(item.file)}&name=${encodeURIComponent(item.title)}` : item.file) : '#';

                                return (
                                    <tr key={item.id || index}>
                                        <td style={{ fontWeight: 600 }}>{item.title}</td>
                                        <td dangerouslySetInnerHTML={{ __html: categoryBadge }}></td>
                                        <td>{docDate}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                                                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Open in Drive
                                                </a>
                                                <button onClick={() => handleDeleteLetter(item.id)} className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#f43f5e', borderColor: 'rgba(244,63,94,0.15)' }}>
                                                    <i className="fa-solid fa-trash"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default LetterHeads;
