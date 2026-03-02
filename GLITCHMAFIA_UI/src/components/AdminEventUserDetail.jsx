import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaTrophy, FaStar, FaUser, FaCrosshairs, FaExchangeAlt, FaSearch, FaBullseye, FaBan, FaDownload } from 'react-icons/fa';

function AdminEventUserDetail() {
    const { id, userId } = useParams();
    const location = useLocation();
    const fromParticipants = new URLSearchParams(location.search).get('from') === 'participants';
    const [loading, setLoading] = useState(true);
    const [eventName, setEventName] = useState('');
    const [username, setUsername] = useState('');
    const [rank, setRank] = useState('—');
    const [points, setPoints] = useState(0);
    const [solves, setSolves] = useState(0);
    const [submissions, setSubmissions] = useState([]);
    const [filter, setFilter] = useState('all');
    const [leaderboard, setLeaderboard] = useState([]);

    const [compareQuery, setCompareQuery] = useState('');
    const [compareUser, setCompareUser] = useState(null);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState('');
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [banLoading, setBanLoading] = useState(false);

    useEffect(() => {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        Promise.all([
            fetch(`/api/admin/event/${id}/leaderboard/`, { headers }),
            fetch(`/api/admin/event/${id}/leaderboard/${userId}/submissions/`, { headers })
        ])
            .then(([lbRes, subRes]) => Promise.all([lbRes.json(), subRes.json()]))
            .then(([lbData, subData]) => {
                setEventName(subData.event_name || lbData.event_name || '');
                setUsername(subData.username || '');
                setSubmissions(subData.submissions || []);
                setLeaderboard(lbData.leaderboard || []);
                const entry = (lbData.leaderboard || []).find(e => e.user_id === parseInt(userId));
                if (entry) { setRank(entry.rank); setPoints(entry.total_points); setSolves(entry.solves); }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id, userId]);

    const handleCompare = async () => {
        const query = compareQuery.trim().toLowerCase();
        if (!query) return;
        const rival = leaderboard.find(e => e.username.toLowerCase() === query);
        if (!rival) { setCompareError('User not found in this event'); setCompareUser(null); return; }

        setCompareLoading(true);
        setCompareError('');
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            const res = await fetch(`/api/admin/event/${id}/leaderboard/${rival.user_id}/submissions/`, { headers });
            const data = await res.json();
            const subs = data.submissions || [];
            const rivalCorrectSubs = subs.filter(s => s.is_correct);
            const rivalAccuracy = subs.length > 0 ? ((rivalCorrectSubs.length / subs.length) * 100).toFixed(1) : '0.0';
            setCompareUser({
                username: rival.username, rank: rival.rank, points: rival.total_points, solves: rival.solves,
                correctCount: rivalCorrectSubs.length, incorrectCount: subs.filter(s => !s.is_correct).length,
                totalSubs: subs.length, accuracy: rivalAccuracy, correctSubs: rivalCorrectSubs
            });
            setShowCompareModal(true);
        } catch {
            setCompareError('Failed to fetch rival data');
            setCompareUser(null);
        } finally {
            setCompareLoading(false);
        }
    };

    const handleExportData = () => {
        const correctSubs = submissions.filter(s => s.is_correct);
        let csvContent = "Event Name,Username,Total Points,Total Solves\n";
        csvContent += `"${eventName}","${username}",${points},${solves}\n\n`;

        csvContent += "Correct Submissions\n";
        csvContent += "No.,Challenge Title,Timestamp\n";

        if (correctSubs.length === 0) {
            csvContent += "No correct submissions found.,,\n";
        } else {
            correctSubs.forEach((sub, index) => {
                const safeTitle = sub.challenge_title.replace(/"/g, '""');
                csvContent += `${index + 1},"${safeTitle}","${sub.submitted_at}"\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${username}_${eventName.replace(/\s+/g, '_')}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="loading-text">Loading...</div>;

    const filtered = submissions.filter(s => {
        if (filter === 'correct') return s.is_correct;
        if (filter === 'incorrect') return !s.is_correct;
        return true;
    });

    const correctCount = submissions.filter(s => s.is_correct).length;
    const incorrectCount = submissions.filter(s => !s.is_correct).length;
    const accuracy = submissions.length > 0 ? ((correctCount / submissions.length) * 100).toFixed(1) : '0.0';

    const statWinner = (v1, v2, higherWins = true) => {
        const a = typeof v1 === 'string' ? parseFloat(v1) : v1;
        const b = typeof v2 === 'string' ? parseFloat(v2) : v2;
        if (isNaN(a) || isNaN(b) || a === b) return '';
        if (higherWins) return a > b ? 'winner' : 'loser';
        return a < b ? 'winner' : 'loser';
    };

    const myCorrectSubs = submissions.filter(s => s.is_correct);
    const timestampChallenges = compareUser
        ? [...new Set([...myCorrectSubs.map(s => s.challenge_title), ...compareUser.correctSubs.map(s => s.challenge_title)])]
        : [];

    // Compare Modal
    const compareModal = (showCompareModal && compareUser) ? ReactDOM.createPortal(
        <div className="cmp-overlay" onClick={() => setShowCompareModal(false)}>
            <div className="cmp-modal" onClick={e => e.stopPropagation()}>
                <button className="cmp-close" onClick={() => setShowCompareModal(false)}><FaTimes /></button>

                <h2 className="cmp-title">
                    <FaExchangeAlt style={{ marginRight: '10px', color: '#00ff41' }} />
                    {username} vs {compareUser.username}
                </h2>

                <div className="eud-compare-table">
                    <div className="eud-compare-header-row">
                        <div className="eud-compare-label"></div>
                        <div className="eud-compare-player">{username}</div>
                        <div className="eud-compare-player">{compareUser.username}</div>
                    </div>
                    {[
                        { label: 'Rank', v1: rank, v2: compareUser.rank, fmt: v => `#${v}`, higher: false },
                        { label: 'Points', v1: points, v2: compareUser.points, fmt: v => v, higher: true },
                        { label: 'Solves', v1: solves, v2: compareUser.solves, fmt: v => v, higher: true },
                        { label: 'Correct', v1: correctCount, v2: compareUser.correctCount, fmt: v => v, higher: true },
                        { label: 'Wrong', v1: incorrectCount, v2: compareUser.incorrectCount, fmt: v => v, higher: false },
                        { label: 'Total Attempts', v1: submissions.length, v2: compareUser.totalSubs, fmt: v => v, higher: null },
                        { label: 'Accuracy', v1: parseFloat(accuracy), v2: parseFloat(compareUser.accuracy), fmt: v => `${v}%`, higher: true },
                    ].map((row, i) => (
                        <div key={i} className="eud-compare-row">
                            <div className="eud-compare-label">{row.label}</div>
                            <div className={`eud-compare-val ${row.higher !== null ? statWinner(row.v1, row.v2, row.higher) : ''}`}>{row.fmt(row.v1)}</div>
                            <div className={`eud-compare-val ${row.higher !== null ? statWinner(row.v2, row.v1, row.higher) : ''}`}>{row.fmt(row.v2)}</div>
                        </div>
                    ))}
                </div>

                {timestampChallenges.length > 0 && (
                    <>
                        <h3 className="cmp-subtitle">Solve Timestamps</h3>
                        <div className="eud-compare-table">
                            <div className="eud-compare-header-row">
                                <div className="eud-compare-label">Challenge</div>
                                <div className="eud-compare-player">{username}</div>
                                <div className="eud-compare-player">{compareUser.username}</div>
                            </div>
                            {timestampChallenges.map((ch, i) => {
                                const mySub = myCorrectSubs.find(s => s.challenge_title === ch);
                                const rivalSub = compareUser.correctSubs.find(s => s.challenge_title === ch);
                                return (
                                    <div key={i} className="eud-compare-row">
                                        <div className="eud-compare-label" style={{ fontWeight: 600, color: '#ccc' }}>{ch}</div>
                                        <div className="eud-compare-val" style={{ fontSize: '0.8rem', color: '#888' }}>{mySub ? mySub.submitted_at : '—'}</div>
                                        <div className="eud-compare-val" style={{ fontSize: '0.8rem', color: '#888' }}>{rivalSub ? rivalSub.submitted_at : '—'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            {compareModal}
            <Link to={fromParticipants ? `/administration/event/${id}/participants` : `/administration/event/${id}/submissions`} className="admin-back-link">
                <FaArrowLeft /> {fromParticipants ? 'Back to Participants' : 'Back to Live Submissions'}
            </Link>

            <div className="eud-header">
                <div className="eud-avatar"><FaUser /></div>
                <div>
                    <h1 className="eud-username">{username}</h1>
                    <p className="eud-event-name">{eventName}</p>
                </div>
                <button
                    className={`eud-ban-btn ${isBanned ? 'banned' : ''}`}
                    disabled={banLoading}
                    onClick={async () => {
                        setBanLoading(true);
                        try {
                            const res = await fetch(`/api/admin/event/${id}/participant/${userId}/ban/`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });
                            const data = await res.json();
                            if (res.ok) setIsBanned(data.is_banned);
                        } catch (e) { console.error(e); }
                        finally { setBanLoading(false); }
                    }}
                >
                    <FaBan /> {banLoading ? '...' : isBanned ? 'Unban' : 'Ban'}
                </button>
                <button
                    className="eud-ban-btn"
                    style={{ background: 'transparent', border: '1px solid #00ff41', color: '#00ff41', marginLeft: '10px' }}
                    onClick={handleExportData}
                >
                    <FaDownload /> Export Data
                </button>
            </div>

            <div className="eud-stats-row">
                <div className="eud-stat-card">
                    <FaTrophy className="eud-stat-icon" style={{ color: '#FFD700' }} />
                    <span className="eud-stat-value">#{rank}</span>
                    <span className="eud-stat-label">Rank</span>
                </div>
                <div className="eud-stat-card">
                    <FaStar className="eud-stat-icon" style={{ color: '#00ff41' }} />
                    <span className="eud-stat-value">{points}</span>
                    <span className="eud-stat-label">Points</span>
                </div>
                <div className="eud-stat-card">
                    <FaCrosshairs className="eud-stat-icon" style={{ color: '#00bfff' }} />
                    <span className="eud-stat-value">{solves}</span>
                    <span className="eud-stat-label">Solves</span>
                </div>
                <div className="eud-stat-card">
                    <FaBullseye className="eud-stat-icon" style={{ color: '#ff9500' }} />
                    <span className="eud-stat-value">{accuracy}%</span>
                    <span className="eud-stat-label">Accuracy</span>
                </div>
            </div>

            {/* Compare Search */}
            <div className="eud-section">
                <div className="eud-section-header">
                    <h2 className="eud-section-title"><FaExchangeAlt style={{ marginRight: '8px' }} />Compare with Player</h2>
                </div>
                <div className="eud-compare-search-wrapper">
                    <div className="eud-compare-search">
                        <FaSearch className="eud-compare-search-icon" />
                        <input
                            type="text"
                            className="eud-compare-input"
                            placeholder="Enter username to compare..."
                            value={compareQuery}
                            onChange={e => setCompareQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCompare()}
                        />
                        <button className="eud-compare-btn" onClick={handleCompare} disabled={compareLoading}>
                            {compareLoading ? 'Loading...' : 'Compare'}
                        </button>
                    </div>
                    {compareQuery.trim().length > 0 && (() => {
                        const q = compareQuery.trim().toLowerCase();
                        const suggestions = leaderboard
                            .filter(e => e.username.toLowerCase().includes(q) && e.user_id !== parseInt(userId))
                            .slice(0, 6);
                        if (suggestions.length === 0) return null;
                        return (
                            <div className="eud-suggestions">
                                {suggestions.map(s => (
                                    <div key={s.user_id} className="eud-suggestion-item" onClick={() => { setCompareQuery(s.username); }}>
                                        <span className="eud-suggestion-name">{s.username}</span>
                                        <span className="eud-suggestion-meta">Rank #{s.rank} &middot; {s.total_points} pts</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
                {compareError && <div className="eud-compare-error">{compareError}</div>}
            </div>

            {/* Submission History */}
            <div className="eud-section" style={{ marginTop: '10px' }}>
                <div className="eud-section-header">
                    <h2 className="eud-section-title">Submission History</h2>
                    <div className="eud-filters">
                        <button className={`eud-filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                            All ({submissions.length})
                        </button>
                        <button className={`eud-filter-pill correct ${filter === 'correct' ? 'active' : ''}`} onClick={() => setFilter('correct')}>
                            Correct ({correctCount})
                        </button>
                        <button className={`eud-filter-pill incorrect ${filter === 'incorrect' ? 'active' : ''}`} onClick={() => setFilter('incorrect')}>
                            Wrong ({incorrectCount})
                        </button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="eud-empty">No submissions match this filter.</div>
                ) : (
                    <div className="eud-submissions">
                        {filtered.map((s, i) => (
                            <div key={i} className={`eud-sub-row ${s.is_correct ? 'correct' : 'incorrect'}`}>
                                <div className="eud-sub-challenge">{s.challenge_title}</div>
                                <div className="eud-sub-flag">{s.flag}</div>
                                <div className="eud-sub-time">{s.submitted_at}</div>
                                <div className="eud-sub-result">
                                    {s.is_correct ? (
                                        <span className="eud-badge-correct"><FaCheck /> Correct</span>
                                    ) : (
                                        <span className="eud-badge-incorrect"><FaTimes /> Wrong</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default AdminEventUserDetail;
