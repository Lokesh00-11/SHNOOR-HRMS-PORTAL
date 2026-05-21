import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Payroll = () => {
    const [payroll, setPayroll] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPayrollAndProfile = async () => {
        try {
            setLoading(true);
            const [payrollData, profileData] = await Promise.all([
                get('/employee/payroll/'),
                get('/employee/profile/')
            ]);
            setPayroll(payrollData || []);
            setProfile(profileData || null);
        } catch (err) {
            console.error('Error fetching payroll data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrollAndProfile();
    }, []);

    const handleDownload = (record) => {
        if (!profile) return;
        
        const generatePDF = (logoImg = null) => {
            const doc = new jsPDF();
            
            if (logoImg) {
                const aspectRatio = logoImg.height / logoImg.width;
                const imgWidth = 30;
                const imgHeight = imgWidth * aspectRatio;
                doc.addImage(logoImg, 'JPEG', 15, 15, imgWidth, imgHeight);
            }
            
            // Top Header Section
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 58, 138);
            doc.text('SHNOOR HRMS PORTAL', 55, 23);
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(130, 130, 130);
            doc.text(`SALARY SLIP FOR ${record.month_year.toUpperCase()}`, 55, 31);
            
            // Subtle Divider
            doc.setDrawColor(230, 230, 230);
            doc.line(15, 45, 195, 45);
            
            // Employee Details Section - Labels (Bold)
            doc.setFontSize(10.5);
            doc.setTextColor(40, 40, 40);
            doc.setFont('helvetica', 'bold');
            
            const col1X = 15;
            const col1ValX = 50;
            const col2X = 115;
            const col2ValX = 145;
            let startY = 58;
            const lineGap = 9;
            
            doc.text('Employee Name:', col1X, startY);
            doc.text('Employee ID:', col1X, startY + lineGap);
            doc.text('Designation:', col1X, startY + lineGap * 2);
            doc.text('Shift:', col1X, startY + lineGap * 3);
            
            doc.text('Bank Name:', col2X, startY);
            doc.text('Account Number:', col2X, startY + lineGap);
            doc.text('IFSC Code:', col2X, startY + lineGap * 2);
            doc.text('PAN Number:', col2X, startY + lineGap * 3);
            
            // Employee Details Section - Values (Normal)
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            const safeStr = (str) => str || 'N/A';
            
            doc.text(safeStr(profile.full_name || profile.username), col1ValX, startY);
            doc.text(safeStr(profile.employee_id), col1ValX, startY + lineGap);
            doc.text(safeStr(profile.designation), col1ValX, startY + lineGap * 2);
            doc.text(safeStr(record.shift || profile.shift), col1ValX, startY + lineGap * 3);
            
            doc.text(safeStr(profile.bank_name), col2ValX, startY);
            doc.text(safeStr(record.bank_account || profile.account_number), col2ValX, startY + lineGap);
            doc.text(safeStr(record.ifsc_code || profile.ifsc_code), col2ValX, startY + lineGap * 2);
            doc.text(safeStr(record.pan_number || profile.pan_number), col2ValX, startY + lineGap * 3);
            
            // Salary Calculations
            let baseSalary = parseFloat(record.base_salary || 0);
            let totalAmount = parseFloat(record.amount || 0);
            let bonusAmount = 0;
            const shift = (record.shift || profile.shift || '').toLowerCase();
            
            if (baseSalary === 0 && totalAmount > 0) {
                if (shift === 'night') {
                    baseSalary = totalAmount / 1.1;
                } else {
                    baseSalary = totalAmount;
                }
            }
            bonusAmount = totalAmount - baseSalary;
            
            // Elegant Table Styling
            autoTable(doc, {
                startY: 105,
                head: [['DESCRIPTION', 'AMOUNT']],
                body: [
                    ['Base Salary', `Rs. ${baseSalary.toFixed(2)}`],
                    [`Shift Bonus (${shift === 'night' ? '10% Night Shift' : '0% General Shift'})`, `Rs. ${bonusAmount.toFixed(2)}`],
                    ['Leaves Taken (0 working days)', 'Rs. 0.00'],
                    ['Net Payable', `Rs. ${totalAmount.toFixed(2)}`]
                ],
                theme: 'plain',
                headStyles: { 
                    fillColor: [255, 255, 255], 
                    textColor: [40, 40, 40], 
                    fontStyle: 'bold',
                    fontSize: 10
                },
                styles: { 
                    font: 'helvetica', 
                    fontSize: 10.5, 
                    cellPadding: { top: 7, bottom: 7, left: 0, right: 0 }, 
                    textColor: [60, 60, 60]
                },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'right' }
                },
                didDrawPage: function(data) {
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(data.settings.margin.left, data.cursor.y, doc.internal.pageSize.width - data.settings.margin.right, data.cursor.y);
                },
                didParseCell: function(data) {
                    if (data.section === 'head' && data.column.index === 1) {
                        data.cell.styles.halign = 'right';
                    }
                },
                willDrawCell: function (data) {
                    doc.setDrawColor(230, 230, 230);
                    doc.setLineWidth(0.1);
                    doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                    
                    if (data.row.index === 3 && data.section === 'body') {
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(40, 40, 40);
                    }
                }
            });
            
            const finalY = doc.lastAutoTable.finalY + 30;
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('This is a system generated salary slip and does not require signature.', 15, finalY);
            
            doc.save(`Salary_Slip_${record.month_year.replace(/\s+/g, '_')}.pdf`);
        };

        const img = new Image();
        img.src = '/logo.jpg';
        img.onload = () => generatePDF(img);
        img.onerror = () => {
            console.warn("Could not load /logo.jpg, generating without logo.");
            generatePDF(null);
        };
    };

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Salary Records</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Month / Year</th>
                            <th>Salary Amount</th>
                            <th>Bonus Info</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading payroll records...</td></tr>
                        ) : payroll.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No salary records found.</td></tr>
                        ) : (
                            payroll.map((item, index) => {
                                const statusLower = (item.status || '').toLowerCase();
                                const statusClass = statusLower === 'paid' ? 'active' : 'pending';

                                return (
                                    <tr key={item.id || index}>
                                        <td style={{ fontWeight: 600 }}>{item.month_year}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                            ₹{parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                Includes Night Shift Bonus (if applicable)
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`} style={{ marginRight: '1rem' }}>
                                                {item.status || 'Pending'}
                                            </span>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleDownload(item)}
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                disabled={!profile}
                                            >
                                                <i className="fa-solid fa-download"></i> Download
                                            </button>
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

export default Payroll;
