import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

const ManageProfiles = () => {
    const [profiles, setProfiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const data = await get('/manager/all-employee-profiles/');
            setProfiles(data || []);
        } catch (err) {
            console.error('Error fetching employee profiles:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const escapeXML = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const handleExportExcel = () => {
        if (!profiles || profiles.length === 0) {
            alert('No profiles to export.');
            return;
        }

        const headers = [
            "Employee ID", "Full Name", "Email", "Phone", "Gender", "Date of Birth", 
            "Present Address", "Permanent Address", "Aadhaar Number", "PAN Number", 
            "Marital Status", "Nationality", "Blood Group", "Designation", "Department", 
            "Joining Date", "Emergency Contact Name", "Emergency Contact Phone", "Emergency Contact Relation"
        ];

        const rows = profiles.map(p => [
            p.employee_id || '',
            `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            p.email || '',
            p.phone_number || '',
            p.gender || '',
            p.date_of_birth || '',
            p.address || '',
            p.permanent_address || '',
            p.aadhaar_number || '',
            p.pan_number || '',
            p.marital_status || '',
            p.nationality || '',
            p.blood_group || '',
            p.designation || '',
            p.department || '',
            p.date_of_joining || '',
            p.emergency_contact_name || '',
            p.emergency_contact_phone || '',
            p.emergency_contact_relation || ''
        ]);

        const colWidths = headers.map((header, i) => {
            let maxLen = header.length;
            rows.forEach(row => {
                const valStr = String(row[i] || '');
                if (valStr.length > maxLen) maxLen = valStr.length;
            });
            return Math.max(110, (maxLen * 8.5) + 20);
        });

        let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="MainTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#1B365D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#2E5B9A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F4E78" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Team Profiles">
  <Table>`;

        colWidths.forEach(width => {
            xml += `\n   <Column ss:Width="${width}"/>`;
        });

        xml += `\n   <Row ss:Height="40">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="MainTitle">
     <Data ss:Type="String">SSNOOR - TEAM MEMBER PROFILES</Data>
    </Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="SubTitle">
     <Data ss:Type="String">Company: Shnoor   |   Exported on: ${new Date().toLocaleDateString()}</Data>
    </Cell>
   </Row>
   <Row ss:Height="15"/>`;

        xml += `\n   <Row ss:Height="25">`;
        headers.forEach(h => {
            xml += `\n    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`;
        });
        xml += `\n   </Row>`;

        rows.forEach(row => {
            xml += `\n   <Row ss:Height="20">`;
            row.forEach(cellVal => {
                xml += `\n    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(cellVal)}</Data></Cell>`;
            });
            xml += `\n   </Row>`;
        });

        xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "shnoor_employee_profiles.xls");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleViewDetails = (profile) => {
        setSelectedProfile(profile);
        setShowModal(true);
    };

    const filteredProfiles = profiles.filter(p => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || (p.email ? p.email.split('@')[0] : 'Team Member');
        return name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <section className="view-section active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>Team Member Profiles</h2>
                <button 
                    className="btn btn-primary" 
                    onClick={handleExportExcel}
                    style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <i className="fa-solid fa-file-excel"></i> Export to Excel
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                    />
                </div>

                <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Designation</th>
                                <th>Department</th>
                                <th>Email</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading team profiles...</td></tr>
                            ) : filteredProfiles.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No matching profiles found.</td></tr>
                            ) : (
                                filteredProfiles.map((p, idx) => {
                                    const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username || (p.email ? p.email.split('@')[0] : 'Team Member');
                                    return (
                                        <tr key={p.id || idx}>
                                            <td style={{ fontWeight: 600 }}>{displayName}</td>
                                            <td>{p.designation || '-'}</td>
                                            <td>{p.department || '-'}</td>
                                            <td>{p.email}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-ghost" 
                                                    onClick={() => handleViewDetails(p)}
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                >
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
            </div>

            {/* View Details Modal Revamped */}
            {showModal && selectedProfile && (
                <div className="modal-overlay" style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h3 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                            {`${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim() || selectedProfile.email.split('@')[0]}'s Full Profile
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                            <div>
                                <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Personal Identification</h4>
                                <p style={{ margin: '0.4rem 0' }}><strong>Full Name:</strong> {`${selectedProfile.first_name || ''} ${selectedProfile.last_name || ''}`.trim() || selectedProfile.email.split('@')[0]}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Email Address:</strong> {selectedProfile.email || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Phone:</strong> {selectedProfile.phone_number || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Gender:</strong> {selectedProfile.gender || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Date of Birth:</strong> {selectedProfile.date_of_birth || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Nationality:</strong> {selectedProfile.nationality || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Blood Group:</strong> {selectedProfile.blood_group || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Marital Status:</strong> {selectedProfile.marital_status || '-'}</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Employment & Work</h4>
                                <p style={{ margin: '0.4rem 0' }}><strong>Employee ID:</strong> {selectedProfile.employee_id || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Department:</strong> {selectedProfile.department || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Designation:</strong> {selectedProfile.designation || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Date of Joining:</strong> {selectedProfile.date_of_joining || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>Aadhaar Card:</strong> {selectedProfile.aadhaar_number || '-'}</p>
                                <p style={{ margin: '0.4rem 0' }}><strong>PAN Number:</strong> {selectedProfile.pan_number || '-'}</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Addresses & Contacts</h4>
                            <p style={{ margin: '0.4rem 0' }}><strong>Present Address:</strong> {selectedProfile.address || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Permanent Address:</strong> {selectedProfile.permanent_address || '-'}</p>
                            <p style={{ margin: '0.8rem 0 0.4rem' }}>
                                <strong>Emergency Contact:</strong> {selectedProfile.emergency_contact_name || '-'} ({selectedProfile.emergency_contact_relation || '-'}) - {selectedProfile.emergency_contact_phone || '-'}
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Leave Balance Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Free Sick Leaves</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '0.25rem' }}>{selectedProfile.sick_leaves ?? 7} / 7 left</div>
                                </div>
                                <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Free Casual Leaves</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '0.25rem' }}>{selectedProfile.casual_leaves ?? 7} / 7 left</div>
                                </div>
                                <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Free Vacation Leaves</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '0.25rem' }}>{selectedProfile.vacation_leaves ?? 7} / 7 left</div>
                                </div>
                                <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paid Leaves Taken</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--danger-color)', marginTop: '0.25rem' }}>{selectedProfile.paid_leaves ?? 0}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Bank Account Details</h4>
                            <p style={{ margin: '0.4rem 0' }}><strong>Bank:</strong> {selectedProfile.bank_name || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Account Number:</strong> {selectedProfile.account_number || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>IFSC Code:</strong> {selectedProfile.ifsc_code || '-'}</p>
                            <p style={{ margin: '0.4rem 0' }}><strong>Branch Name:</strong> {selectedProfile.branch_name || '-'}</p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button onClick={() => setShowModal(false)} className="btn btn-primary" style={{ padding: '0.5rem 2rem' }}>Close Details</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ManageProfiles;
