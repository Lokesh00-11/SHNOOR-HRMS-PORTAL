import React, { useState, useEffect } from 'react';
import { get } from '../../../services/api';

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
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Company Documents</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Upload Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading documents...</td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No documents shared with you yet.</td></tr>
                        ) : documents.map(doc => (
                            <tr key={doc.id}>
                                <td><strong>{doc.title}</strong></td>
                                <td>{doc.description || 'No description provided'}</td>
                                <td>{doc.created_at || 'Recently'}</td>
                                <td>
                                    <a href={doc.file} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem' }}>
                                        <i className="fa-solid fa-download"></i> Download
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Documents;
