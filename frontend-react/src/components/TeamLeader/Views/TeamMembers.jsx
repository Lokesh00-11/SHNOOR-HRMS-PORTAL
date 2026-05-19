import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { get } from '../../../services/api';

const TeamMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search/Filter
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [selectedEmp, setSelectedEmp] = useState(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await get('/teamleader/team-members/');
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching team members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const filteredMembers = members.filter(emp => {
        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
        const email = (emp.email || '').toLowerCase();
        const designation = (emp.designation || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query) || designation.includes(query);
    });

    const handleExportToExcel = () => {
        try {
            const titleRow = ["SHNOOR HRM - TEAM MEMBER DIRECTORY"];
            const reportRow = ["Report: Team Member Profiles"];
            const generatedRow = [`Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`];
            const emptyRow = [];
            const headerRow = [
                "Employee ID",
                "Full Name",
                "Department",
                "Designation",
                "Email",
                "Phone",
                "Joining Date",
                "Aadhaar Number",
                "PAN Number",
                "Gender",
                "Blood Group",
                "Marital Status",
                "Address"
            ];

            const dataRows = filteredMembers.map(emp => [
                emp.employee_id || '-',
                `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '-',
                emp.department || '-',
                emp.designation || '-',
                emp.email || '-',
                emp.phone_number || '-',
                emp.date_of_joining || '-',
                emp.aadhaar_number || '-',
                emp.pan_number || '-',
                emp.gender || '-',
                emp.blood_group || '-',
                emp.marital_status || '-',
                emp.address || '-'
            ]);

            const aoaData = [
                titleRow,
                reportRow,
                generatedRow,
                emptyRow,
                headerRow,
                ...dataRows
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(aoaData);

            // Calculate auto-fit columns
            const colWidths = [];
            aoaData.forEach(row => {
                row.forEach((cell, idx) => {
                    const cellVal = cell === null || cell === undefined ? "" : cell.toString();
                    const len = cellVal.length + 3;
                    if (!colWidths[idx] || len > colWidths[idx]) {
                        colWidths[idx] = len;
                    }
                });
            });
            ws['!cols'] = colWidths.map(w => ({ wch: w }));

            XLSX.utils.book_append_sheet(wb, ws, "Team Members");
            XLSX.writeFile(wb, `ShnoorHRM_Team_Members_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error('Failed to export excel:', err);
            alert('Failed to export to Excel');
        }
    };

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Team Member Profiles</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={handleExportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        <i className="fa-solid fa-file-excel"></i> Export to Excel
                    </button>
                    <span className="status-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600 }}>
                        {members.length} Members
                    </span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem' }}>
                <input 
                    type="text" 
                    placeholder="Search members by name, email, or designation..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                />
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Employee ID</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Email Address</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading team members...</td></tr>
                        ) : filteredMembers.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No employees are assigned to your team.</td></tr>
                        ) : (
                            filteredMembers.map((emp, index) => {
                                const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || emp.email;
                                return (
                                    <tr key={emp.id || index}>
                                        <td style={{ fontWeight: 600 }}>{name}</td>
                                        <td>{emp.employee_id || '-'}</td>
                                        <td>{emp.department || '-'}</td>
                                        <td>{emp.designation || '-'}</td>
                                        <td>{emp.email || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-ghost" onClick={() => setSelectedEmp(emp)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                <i className="fa-solid fa-eye"></i> View Profile
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Profile Details Modal */}
            {selectedEmp && (
                <div className="modal-overlay" style={{ display: 'block', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setSelectedEmp(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                            {selectedEmp.first_name} {selectedEmp.last_name}'s Full Profile
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                            <div>
                                <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Personal Identification</h4>
                                <p style={{ margin: '0.4rem 0' }}><strong>Full Name:</strong> {selectedEmp.first_name} {selectedEmp.last_name}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Email Address:</strong> {selectedEmp.email || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Phone:</strong> {selectedEmp.phone_number || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Gender:</strong> {selectedEmp.gender || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Date of Birth:</strong> {selectedEmp.date_of_birth || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Nationality:</strong> {selectedEmp.nationality || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Blood Group:</strong> {selectedEmp.blood_group || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Marital Status:</strong> {selectedEmp.marital_status || '-'}</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Employment & Work</h4>
                                <p style={{ margin: '0.4rem 0' }}><strong>Employee ID:</strong> {selectedEmp.employee_id || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Department:</strong> {selectedEmp.department || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Designation:</strong> {selectedEmp.designation || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Date of Joining:</strong> {selectedEmp.date_of_joining || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Aadhaar Card:</strong> {selectedEmp.aadhaar_number || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>PAN Number:</strong> {selectedEmp.pan_number || '-'}</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Addresses & Contacts</h4>
                            <p style={{ margin: '0.4rem 0' }}><strong>Present Address:</strong> {selectedEmp.address || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Permanent Address:</strong> {selectedEmp.permanent_address || '-'}</p>
                            <p style={{ margin: '0.8rem 0 0.4rem' }}>
                                <strong>Emergency Contact:</strong> {selectedEmp.emergency_contact_name || '-'} ({selectedEmp.emergency_contact_relation || '-'}) - {selectedEmp.emergency_contact_phone || '-'}
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Bank Account Details</h4>
                            <p style={{ margin: '0.4rem 0' }}><strong>Bank:</strong> {selectedEmp.bank_name || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Account Number:</strong> {selectedEmp.account_number || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>IFSC Code:</strong> {selectedEmp.ifsc_code || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Branch Name:</strong> {selectedEmp.branch_name || '-'}</p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button onClick={() => setSelectedEmp(null)} className="btn btn-primary" style={{ padding: '0.5rem 2rem' }}>Close Details</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default TeamMembers;
