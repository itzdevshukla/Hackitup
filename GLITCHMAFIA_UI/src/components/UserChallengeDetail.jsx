import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaLock, FaChevronLeft, FaTimesCircle, FaDownload, FaLink, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

// Color map for difficulty tags matching the user's theme (Orange-ish for medium, Green for easy, Red for hard, etc.)
const DIFF_COLOR = {
    easy: '#4ADE80',    // Light Green
    medium: '#F59E0B',  // Amber/Orange
    hard: '#EF4444',    // Red
    insane: '#8B5CF6'   // Purple
};

const UserChallengeDetail = () => {
    const { id, challengeId } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flagInput, setFlagInput] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null); // 'submitting', 'success', 'error'
    const [eventStatus, setEventStatus] = useState('live');
    const [eventName, setEventName] = useState('Loading...');
    const [isTeamMode, setIsTeamMode] = useState(false);

    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'solves'
    const [solvers, setSolvers] = useState([]);
    const [loadingSolvers, setLoadingSolvers] = useState(false);

    useEffect(() => {
        fetchChallengeData();
        // eslint-disable-next-line
    }, [id, challengeId]);

    // Fetch Solvers when tab changes
    useEffect(() => {
        if (activeTab === 'solves' && solvers.length === 0 && challenge && challenge.solves_count > 0) {
            fetchSolversList();
        }
        // eslint-disable-next-line
    }, [activeTab, challenge]);

    const fetchChallengeData = async () => {
        try {
            const res = await fetch(`/api/event/${id}/challenges/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.error?.includes('register') || data.error?.includes('team') || data.error?.includes('banned')) {
                    navigate(`/event/${id}`);
                    return;
                }
                throw new Error(data.error || 'Failed to fetch challenge data');
            }

            setEventName(data.event || `Event #${id}`);
            const foundStatus = data.event_status || data.status || 'live';
            setEventStatus(foundStatus);
            setIsTeamMode(data.is_team_mode || false);

            const allChalls = data.challenges || [];
            const current = allChalls.find(c => c.id.toString() === challengeId);

            if (current) {
                setChallenge(current);
            } else {
                navigate(`/event/${id}/challenges`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSolversList = async () => {
        setLoadingSolvers(true);
        try {
            const res = await fetch(`/api/challenge/${challenge.id}/solvers/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            if (data.solvers) {
                setSolvers(data.solvers);
            }
        } catch { } finally {
            setLoadingSolvers(false);
        }
    };

    const submitFlag = async (e) => {
        e.preventDefault();
        if (!flagInput.trim() || challenge?.is_solved || eventStatus !== 'live') return;

        setSubmitStatus({ status: 'submitting' });
        try {
            const res = await fetch(`/api/challenge/${challenge.id}/submit/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ flag: flagInput })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSubmitStatus({ status: 'success', message: data.message || 'Correct flag! Points awarded.' });
                setChallenge(prev => ({
                    ...prev,
                    is_solved: true,
                    solves_count: (prev.solves_count || 0) + 1
                }));
            } else {
                setSubmitStatus({ status: 'error', message: data.message || data.error || 'Incorrect flag.' });
                setTimeout(() => setSubmitStatus(null), 3000);
            }
        } catch (err) {
            setSubmitStatus({ status: 'error', message: 'Error submitting flag.' });
            setTimeout(() => setSubmitStatus(null), 3000);
        }
    };

    const unlockHint = async (hintId, cost) => {
        if (!window.confirm(`Unlock this hint for ${cost} points?`)) return;
        try {
            const res = await fetch(`/api/hint/${hintId}/unlock/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-CSRFToken': getCsrfToken()
                }
            });
            const data = await res.json();
            if (data.success) {
                setChallenge(prev => ({
                    ...prev,
                    hints: prev.hints.map(h => h.id === hintId ? { ...h, is_unlocked: true, content: data.hint_content } : h)
                }));
            } else {
                alert(data.error || 'Failed to unlock hint.');
            }
        } catch { }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#888', fontFamily: 'monospace' }}>
            Loading Challenge Data...
        </div>
    );

    if (error || !challenge) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#ff3b30' }}>
            <h2><FaExclamationTriangle /> Error Loading Challenge</h2>
            <p>{error || 'Challenge not found'}</p>
            <button onClick={() => navigate(`/event/${id}/challenges`)} style={{ marginTop: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back to Challenges</button>
        </div>
    );

    const diffColor = DIFF_COLOR[challenge.difficulty?.toLowerCase()] || '#9ACD32';
    const isSolved = challenge.is_solved;

    return (
        <div style={{ minHeight: '100vh', background: '#111111', color: '#e5e5ea', fontFamily: "'Inter', sans-serif" }}>

            {/* Top Navigation Breadcrumb / Header Area */}
            <header style={{ padding: '0 2rem', borderBottom: '1px solid #2a2a2a', background: '#1c1c1e' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        CHALLENGES
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#8e8e93' }}>
                        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => navigate(`/event/${id}/challenges`)} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#8e8e93'}>Challenges</span>
                        <span>›</span>
                        <span style={{ color: '#d1d1d6' }}>{challenge.title}</span>
                    </div>
                </div>
            </header>

            {/* Main Title Bar */}
            <div style={{ background: '#1e1e1e', borderBottom: '1px solid #3a3a3c', padding: '2rem' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Circle Logo Placeholder */}
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
                        {isSolved ? <span style={{ color: '#34c759' }}><FaCheckCircle size={30} /></span> : eventName.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fff', fontWeight: 600, letterSpacing: '0.5px' }}>
                            {challenge.title}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px', color: '#988e84', fontSize: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8e8e93' }}><FaFlag /> {eventName}</span>
                            <span style={{ color: '#8e8e93' }}>|</span>
                            <span style={{ color: '#8e8e93' }}>Points: <span style={{ color: '#d1d1d6' }}>{challenge.points}</span></span>
                            <span style={{ color: '#8e8e93' }}>|</span>
                            <span style={{ color: diffColor }}>{challenge.difficulty?.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem', boxSizing: 'border-box' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #3a3a3c', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('details')}
                        style={{
                            flex: 1, padding: '15px 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'details' ? '2px solid #9ACD32' : '2px solid transparent',
                            color: activeTab === 'details' ? '#9ACD32' : '#8e8e93', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        Challenge Details
                    </button>
                    <button
                        onClick={() => setActiveTab('solves')}
                        style={{
                            flex: 1, padding: '15px 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'solves' ? '2px solid #9ACD32' : '2px solid transparent',
                            color: activeTab === 'solves' ? '#9ACD32' : '#8e8e93', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        Solves ({challenge.solves_count || 0})
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                    {/* LEFT COLUMN: Main Content */}
                    <div style={{ flex: '1 1 700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {activeTab === 'details' ? (
                            <>
                                {/* Description Block */}
                                <div style={{ background: '#1c1c1e', borderRadius: '8px', border: '1px solid #2e2e30', overflow: 'hidden' }}>
                                    <div style={{ padding: '15px 20px', borderBottom: '1px solid #2e2e30', color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>
                                        Challenge Description
                                    </div>
                                    <div style={{ padding: '20px', fontSize: '1rem', lineHeight: '1.7', color: '#d1d1d6', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                        {challenge.description}
                                    </div>
                                </div>

                                {/* Solved Notification Box */}
                                {isSolved && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ background: 'rgba(154, 205, 50, 0.1)', border: '1px solid rgba(154, 205, 50, 0.3)', borderRadius: '8px', padding: '20px', color: '#9ACD32', fontWeight: 600, letterSpacing: '0.5px' }}>
                                        {isTeamMode
                                            ? "THIS CHALLENGE IS ALREADY SOLVED BY YOU OR YOUR TEAM MEMBER"
                                            : "THIS CHALLENGE IS ALREADY SOLVED BY YOU"
                                        }
                                    </motion.div>
                                )}

                                {/* Flag Submission Form */}
                                <div style={{ background: '#1c1c1e', borderRadius: '8px', border: '1px solid #2e2e30', padding: '20px' }}>
                                    <form onSubmit={submitFlag} style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                                        <div style={{ color: '#8e8e93', fontSize: '0.9rem', marginBottom: '5px' }}>
                                            {challenge.flag_format ? `Format: ${challenge.flag_format}` : 'Submit the flag here.'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="text"
                                                value={flagInput}
                                                onChange={(e) => setFlagInput(e.target.value)}
                                                placeholder={challenge.flag_format || "Hack!tUp{...}"}
                                                disabled={isSolved || eventStatus !== 'live'}
                                                style={{
                                                    flex: 1, background: '#151515', border: '1px solid #3a3a3c', padding: '12px 15px',
                                                    color: '#fff', borderRadius: '6px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s',
                                                    opacity: (isSolved || eventStatus !== 'live') ? 0.6 : 1
                                                }}
                                                onFocus={e => !isSolved && (e.target.style.borderColor = '#9ACD32')}
                                                onBlur={e => !isSolved && (e.target.style.borderColor = '#3a3a3c')}
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSolved || eventStatus !== 'live' || submitStatus?.status === 'submitting'}
                                                style={{
                                                    background: isSolved ? '#2e2e30' : '#ffffff',
                                                    color: isSolved ? '#8e8e93' : '#000000',
                                                    border: 'none', padding: '0 25px', borderRadius: '6px', fontSize: '1rem', fontWeight: 600,
                                                    cursor: (isSolved || eventStatus !== 'live') ? 'not-allowed' : 'pointer',
                                                    transition: 'opacity 0.2s'
                                                }}
                                            >
                                                {submitStatus?.status === 'submitting' ? '...' : isSolved ? 'SOLVED' : eventStatus !== 'live' ? 'CLOSED' : 'SUBMIT'}
                                            </button>
                                        </div>
                                        {/* Status Message */}
                                        {submitStatus?.status === 'error' && <div style={{ color: '#ff453a', fontSize: '0.85rem' }}>{submitStatus.message}</div>}
                                        {submitStatus?.status === 'success' && <div style={{ color: '#9ACD32', fontSize: '0.85rem' }}>{submitStatus.message}</div>}
                                    </form>
                                </div>
                            </>
                        ) : (
                            /* Solvers Tab Content */
                            <div style={{ background: '#1c1c1e', borderRadius: '8px', border: '1px solid #2e2e30', overflow: 'hidden' }}>
                                <div style={{ padding: '15px 20px', borderBottom: '1px solid #2e2e30', color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>
                                    Successful Solves
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {loadingSolvers ? (
                                        <div style={{ padding: '30px', textAlign: 'center', color: '#8e8e93' }}>Loading solvers...</div>
                                    ) : solvers.length > 0 ? (
                                        solvers.map((s, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: i !== solvers.length - 1 ? '1px solid #2e2e30' : 'none', background: i === 0 ? 'rgba(154, 205, 50, 0.05)' : 'transparent' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <span style={{ color: i === 0 ? '#9ACD32' : '#636366', fontWeight: 700, width: '25px' }}>#{i + 1}</span>
                                                    <span style={{ color: '#fff', fontWeight: 500 }}>{s.name}</span>
                                                    {i === 0 && <span style={{ background: '#9ACD32', color: '#000', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>FIRST BLOOD</span>}
                                                </div>
                                                <div style={{ color: '#8e8e93', fontSize: '0.85rem' }}>
                                                    {new Date(s.time).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '30px', textAlign: 'center', color: '#8e8e93' }}>No one has solved this yet. Be the first!</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Details, Hints, Files) */}
                    <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Challenge Details Sidebar Panel */}
                        <div style={{ background: '#1c1c1e', borderRadius: '8px', border: '1px solid #2e2e30' }}>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid #2e2e30', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                                Challenge Details
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#8e8e93' }}>Author</span>
                                    <span style={{ color: '#d1d1d6' }}>{challenge.author || 'Anonymous'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#8e8e93' }}>Points</span>
                                    <span style={{ color: '#d1d1d6' }}>{challenge.points}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#8e8e93' }}>Category</span>
                                    <span style={{ background: '#9ACD32', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{challenge.category}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#8e8e93' }}>Difficulty</span>
                                    <span style={{ background: diffColor, color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{challenge.difficulty?.charAt(0).toUpperCase() + challenge.difficulty?.slice(1)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#8e8e93' }}>Solves</span>
                                    <span style={{ color: '#d1d1d6' }}>{challenge.solves_count || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* File Attachments Panel */}
                        <div style={{ background: '#1c1c1e', borderRadius: '8px', border: '1px solid #2e2e30' }}>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid #2e2e30', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                                File Attachments
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {challenge.files?.length > 0 ? (
                                    challenge.files.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#151515', borderRadius: '8px', border: '1px solid #2e2e30' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ padding: '10px', background: 'rgba(154, 205, 50, 0.1)', borderRadius: '6px', color: '#9ACD32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FaDownload size={14} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: '#d1d1d6', fontSize: '0.9rem', fontWeight: 500 }}>{f.name || `Attachment ${i + 1}`}</span>
                                                    <span style={{ color: '#636366', fontSize: '0.75rem', marginTop: '4px' }}>File details</span>
                                                </div>
                                            </div>
                                            <a href={f.url} download style={{ color: '#8e8e93', padding: '8px', borderRadius: '50%', background: 'transparent', transition: 'all 0.2s', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#2e2e30' }} onMouseLeave={e => { e.currentTarget.style.color = '#8e8e93'; e.currentTarget.style.background = 'transparent' }}>
                                                <FaDownload size={12} />
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#636366', fontSize: '0.9rem' }}>No file attachments available.</div>
                                )}
                            </div>
                        </div>

                        {/* Resource URL Attachments Panel */}
                        <div style={{ background: '#1c1c1e', borderRadius: '8px', border: '1px solid #2e2e30' }}>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid #2e2e30', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                                Resource URL Attachments
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {challenge.url ? (
                                    <a href={challenge.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#151515', borderRadius: '8px', border: '1px solid #2e2e30', textDecoration: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ padding: '10px', background: 'rgba(100, 210, 255, 0.1)', borderRadius: '6px', color: '#64d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FaLink size={14} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: '#d1d1d6', fontSize: '0.9rem', fontWeight: 500 }}>Launch Target Instance</span>
                                                <span style={{ color: '#636366', fontSize: '0.75rem', marginTop: '4px' }}>External Link</span>
                                            </div>
                                        </div>
                                        <span style={{ color: '#8e8e93' }}><FaLink size={12} /></span>
                                    </a>
                                ) : (
                                    <div style={{ color: '#636366', fontSize: '0.9rem' }}>No resource URLs available.</div>
                                )}
                            </div>
                        </div>

                        {/* Hints Panel */}
                        <div style={{ background: '#1c1c1e', borderRadius: '8px', border: '1px solid #2e2e30' }}>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid #2e2e30', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                                Hints
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {challenge.hints?.length > 0 ? challenge.hints.map((hint, i) => (
                                    <div key={hint.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ color: '#8e8e93', fontSize: '0.85rem', fontWeight: 600 }}>Hint {i + 1}</div>
                                        {hint.is_unlocked ? (
                                            <div style={{ background: '#151515', padding: '12px', borderRadius: '6px', border: '1px solid #2e2e30', color: '#d1d1d6', fontSize: '0.9rem', wordBreak: 'break-word' }}>
                                                {hint.content}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => unlockHint(hint.id, hint.cost)}
                                                style={{ padding: '10px', background: 'transparent', border: '1px dashed #3a3a3c', borderRadius: '6px', color: '#8e8e93', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontSize: '0.9rem' }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#9ACD32'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#8e8e93'; e.currentTarget.style.borderColor = '#3a3a3c'; }}
                                            >
                                                <FaLock /> Unlock Hint (-{hint.cost} pts)
                                            </button>
                                        )}
                                    </div>
                                )) : <div style={{ color: '#636366', fontSize: '0.9rem' }}>No hints for this challenge.</div>}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserChallengeDetail;
