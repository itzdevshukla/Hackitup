import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaTrophy, FaArrowLeft, FaEye, FaTimes, FaCheck } from 'react-icons/fa';

function AdminEventLeaderboard() {
    const { id } = useParams();
    const [data, setData] = useState({ event_name: '', leaderboard: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSubmissions, setUserSubmissions] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`/api/admin/event/${id}/leaderboard/`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!response.ok) throw new Error('Failed to fetch leaderboard');
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [id]);

    if (loading) return <div className="loading-text">Loading Leaderboard...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    const openSubmissionsModal = async (userId, username) => {
        setSelectedUser(username);
        setModalOpen(true);
        setModalLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/leaderboard/${userId}/submissions/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch user submissions');
            const result = await response.json();
            setUserSubmissions(result.submissions || []);
        } catch (err) {
            console.error(err);
            setUserSubmissions([]);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <>
            <div className="admin-content-header" style={{ marginBottom: '20px', minWidth: 0, paddingRight: '20px' }}>
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>Admin Leaderboard: {data.event_name}</h1>
                <p className="admin-content-subtitle">
                    <Link to={`/administration/event/${id}`} style={{ color: '#00ff41', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaArrowLeft /> Back to Event
                    </Link>
                </p>
            </div>

            <div className="admin-table-container">
                <h2 style={{ color: '#fff', marginBottom: '20px', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaTrophy color="#ffaa00" /> Current Standings
                </h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>User ID</th>
                            <th>Username</th>
                            <th>Total Points</th>
                            <th>Solves</th>
                            <th>Last Solve Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.leaderboard.map(u => (
                            <tr key={u.user_id}>
                                <td><strong style={{ color: u.rank <= 3 ? '#00ff41' : '#fff' }}>{u.rank}</strong></td>
                                <td>{u.user_id}</td>
                                <td>{u.username}</td>
                                <td style={{ color: '#00ff41', fontWeight: 'bold' }}>{u.total_points}</td>
                                <td>{u.solves}</td>
                                <td>{u.last_solve || '-'}</td>
                                <td>
                                    <button className="admin-btn-action-view" onClick={() => openSubmissionsModal(u.user_id, u.username)}>
                                        <FaEye /> View Submissions
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {data.leaderboard.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No solves yet. The leaderboard is empty.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ maxWidth: '800px' }}>
                        <div className="admin-modal-header">
                            <h2>Submissions History: {selectedUser}</h2>
                            <button className="admin-modal-close" onClick={() => setModalOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        {modalLoading ? (
                            <p style={{ color: '#00ff41', textAlign: 'center', padding: '20px' }}>Loading submissions...</p>
                        ) : (
                            <div className="admin-table-container" style={{ marginTop: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Challenge</th>
                                            <th>Submitted Flag</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userSubmissions.map(s => (
                                            <tr key={s.id}>
                                                <td>{s.submitted_at}</td>
                                                <td>{s.challenge_title}</td>
                                                <td style={{ fontFamily: 'monospace', color: '#aaa' }}>
                                                    {s.is_correct ? "CORRECT" : s.flag}
                                                </td>
                                                <td>
                                                    {s.is_correct ? (
                                                        <span style={{ color: '#00ff41', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                                            <FaCheck /> Correct
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <FaTimes /> Incorrect
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {userSubmissions.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No submissions found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}


                    </div>
                </div>
            )}
        </>
    );
}

export default AdminEventLeaderboard;
