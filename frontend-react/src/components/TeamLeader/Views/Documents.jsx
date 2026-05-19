import React, { useState, useEffect } from 'react';
import { get, API_BASE } from '../../../services/api';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await get('/employee/documents/');
            let docsArray = [];
            if (Array.isArray(data)) {
                docsArray = data;
            } else if (data && typeof data === 'object') {
                docsArray = data.documents || data.data || Object.values(data);
            }
            setDocuments(Array.isArray(docsArray) ? docsArray : []);
        } catch (err) {
            console.error('Error loading documents vault:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    return (
        <section className="view-section active">
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Company Documents & Policies</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Uploaded Date</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Loading vault documents...</td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No documents available in corporate vault.</td></tr>
                        ) : (
                            documents.map((doc, index) => {
                                const dateStr = doc.uploaded_at || doc.created_at;
                                const date = dateStr ? new Date(dateStr).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                }) : 'Unknown Date';
                                
                                const fileUrl = doc.file || doc.file_url || '#';
                                const title = doc.title || 'Untitled Document';
                                const downloadUrl = (fileUrl && fileUrl.startsWith('http')) 
                                    ? `${API_BASE}/download-file/?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(title)}` 
                                    : fileUrl;

                                return (
                                    <tr key={doc.id || index}>
                                        <td style={{ fontWeight: 600 }}>{title}</td>
                                        <td>{date}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-block' }}>
                                                <i className="fa-solid fa-eye"></i> View File
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
