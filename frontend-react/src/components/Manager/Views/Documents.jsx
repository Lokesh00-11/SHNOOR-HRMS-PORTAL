import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

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

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/documents/');
            setDocuments(data || []);
        } catch (err) {
            console.error('Error fetching documents:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>My Official Documents</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Uploaded Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Loading documents...</td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No documents uploaded.</td></tr>
                        ) : (
                            documents.map((doc, index) => {
                                const fileUrl = doc.file ? (doc.file.startsWith('http') ? doc.file : `http://127.0.0.1:8000${doc.file}`) : '#';
                                return (
                                    <tr key={doc.id || index}>
                                        <td style={{ fontWeight: 600 }}>{doc.title}</td>
                                        <td>{(() => {
                                            const parsedDate = parseCustomDate(doc.uploaded_at);
                                            return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : '-';
                                        })()}</td>
                                        <td>
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                                                <i className="fa-solid fa-download"></i> Download
                                            </a>
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

export default Documents;
