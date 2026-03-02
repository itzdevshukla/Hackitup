import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaUsers, FaArrowLeft, FaBan, FaUnlock } from 'react-icons/fa';

function AdminEventParticipants() {
    const { id } = useParams();
    const [data, setData] = useState({ event_name: '', participants: [], total_participants: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const response = await fetch(`/api/admin/event/${id}/participants/`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!response.ok) throw new Error('Failed to fetch participants');
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchParticipants();
    }, [id]);

    if (loading) return <div className="loading-text">Loading Participants...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    const toggleBanStatus = async (userId, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/participant/${userId}/ban/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to toggle ban status');
            const result = await response.json();

            // Update local state to reflect new ban status
            setData(prev => ({
                ...prev,
                participants: prev.participants.map(p =>
                    p.id === userId ? { ...p, is_banned: result.is_banned } : p
                )
            }));
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="admin-content-header" style={{ marginBottom: '20px', minWidth: 0, paddingRight: '20px' }}>
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>Participant List: {data.event_name}</h1>
                <p className="admin-content-subtitle">
                    <Link to={`/administration/event/${id}`} style={{ color: '#00ff41', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaArrowLeft /> Back to Event
                    </Link>
                </p>
            </div>

            <div className="admin-table-container">
                <h2 style={{ color: '#fff', marginBottom: '20px', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaUsers color="#00ff41" /> Enrolled Users ({data.total_participants})
                </h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Joined At</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.participants.map(p => (
                            <tr key={p.id} style={{ opacity: p.is_banned ? 0.5 : 1 }}>
                                <td>{p.id}</td>
                                <td>
                                    <span style={{ textDecoration: p.is_banned ? 'line-through' : 'none' }}>
                                        {p.username}
                                    </span>
                                </td>
                                <td>{p.email}</td>
                                <td>
                                    {p.is_banned ?
                                        <span style={{ color: '#ff3b30', fontWeight: 'bold' }}>Banned</span> :
                                        p.is_registered ?
                                            <span style={{ color: '#00ff41', fontWeight: 'bold' }}>Registered</span> :
                                            <span style={{ color: '#ffaa00' }}>Pending</span>
                                    }
                                </td>
                                <td>{p.joined_at || '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Link to={`/administration/event/${id}/user/${p.id}?from=participants`} className="admin-btn-view">View Profile</Link>
                                        <button
                                            className={p.is_banned ? "admin-btn-unban" : "admin-btn-ban"}
                                            onClick={() => toggleBanStatus(p.id, p.is_banned)}
                                            disabled={actionLoading}
                                        >
                                            {p.is_banned ? <><FaUnlock /> Unban</> : <><FaBan /> Ban</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.participants.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No participants enrolled yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AdminEventParticipants;
