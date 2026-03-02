import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaCheckCircle, FaTimesCircle, FaLock, FaUnlock, FaBug, FaCode, FaDatabase, FaShieldAlt, FaBan } from 'react-icons/fa';

const Challenges = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [flagInput, setFlagInput] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null);
    const [filter, setFilter] = useState('All');
    const [isBanned, setIsBanned] = useState(false);
    const [eventStatus, setEventStatus] = useState('live');

    useEffect(() => {
        fetchChallenges();
        const intervalId = setInterval(fetchChallenges, 5000);
        return () => clearInterval(intervalId);
    }, [id]);

    const fetchChallenges = async () => {
        try {
            const response = await fetch(`/api/event/${id}/challenges/`);
            if (response.status === 403) {
                setError("Access Denied. You might need to register for this event.");
                setLoading(false);
                return;
            }

            const data = await response.json();
            if (data.challenges) {
                setChallenges(data.challenges);
                setEventName(data.event);
                setIsBanned(data.is_banned || false);
                setEventStatus(data.status || 'live');
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch challenges", err);
            setError("Failed to load challenges.");
            setLoading(false);
        }
    };

    const submitFlag = async (e) => {
        e.preventDefault();
        if (!selectedChallenge) return;

        try {
            const response = await fetch(`/api/challenge/${selectedChallenge.id}/submit/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
                },
                body: JSON.stringify({ flag: flagInput })
            });
            const data = await response.json();

            if (data.success) {
                setSubmitStatus('success');
                fetchChallenges(); // Refresh status
                setTimeout(() => {
                    setSelectedChallenge(null);
                    setSubmitStatus(null);
                    setFlagInput('');
                }, 1500);
            } else {
                setSubmitStatus('error');
            }
        } catch (err) {
            setSubmitStatus('error');
        }
    };

    const unlockHint = async (hintId, cost) => {
        if (!window.confirm(`Are you sure you want to unlock this hint for ${cost} points?`)) return;

        try {
            const response = await fetch(`/api/hint/${hintId}/unlock/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
                }
            });
            const data = await response.json();
            if (data.success) {
                // Update the selectedChallenge state directly so the hint shows immediately without refresh
                setSelectedChallenge(prev => ({
                    ...prev,
                    hints: prev.hints.map(h =>
                        h.id === hintId
                            ? { ...h, is_unlocked: true, content: data.hint_content || h.content }
                            : h
                    )
                }));
                // Also refresh the full list in background to update point totals
                fetchChallenges();
            } else {
                alert(data.error || "Failed to unlock hint.");
            }
        } catch (err) {
            console.error("Unlock failed", err);
        }
    };


    const categories = ['All', ...new Set(challenges.map(c => c.category))];
    const filteredChallenges = filter === 'All'
        ? challenges
        : challenges.filter(c => c.category === filter);

    const getIcon = (category) => {
        switch (category.toLowerCase()) {
            case 'web': return <FaBug />;
            case 'crypto': return <FaLock />;
            case 'pwn': return <FaCode />;
            case 'forensics': return <FaDatabase />;
            default: return <FaShieldAlt />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black text-[#88ff00] font-mono tracking-widest">
            INITIALIZING_CHALLENGES...
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-black text-red-500 font-bold">
            {error}
        </div>
    );

    if (isBanned) return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-red-500 font-bold p-8 text-center gap-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <FaBan style={{ fontSize: '4rem', marginBottom: '10px' }} />
            <h1 style={{ fontSize: '2.5rem', margin: 0, textShadow: '0 0 15px rgba(255,0,0,0.5)', letterSpacing: '2px' }}>ACCESS TERMINATED</h1>
            <p style={{ fontSize: '1.1rem', color: '#aaa', maxWidth: '600px', lineHeight: '1.6', fontFamily: 'Inter, sans-serif', fontWeight: 'normal' }}>
                You are banned from this event so you cannot view the challenges.<br />
                Contact the organizers for further details.
            </p>
        </div>
    );

    return (
        <div className="challenges-page">
            <div className="event-content">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="challenges-header"
                >
                    <h1 className="challenges-title">{eventName}</h1>
                    <p className="challenges-subtitle">Decryption Protocols Active. Good Luck.</p>
                </motion.div>

                {/* Solve Statistics with Circular Progress */}
                <div className="solve-stats-container">
                    <div className="stat-item stat-solved-item">
                        <div className="stat-number">{challenges.filter(c => c.is_solved).length}</div>
                        <div className="stat-label">Solved</div>
                    </div>

                    <div className="progress-circle-wrapper">
                        <svg className="progress-circle" viewBox="0 0 120 120">
                            <circle
                                className="progress-circle-bg"
                                cx="60"
                                cy="60"
                                r="54"
                            />
                            <circle
                                className="progress-circle-fill"
                                cx="60"
                                cy="60"
                                r="54"
                                style={{
                                    strokeDasharray: `${2 * Math.PI * 54}`,
                                    strokeDashoffset: `${2 * Math.PI * 54 * (1 - (challenges.length > 0 ? (challenges.filter(c => c.is_solved).length / challenges.length) : 0))}`
                                }}
                            />
                        </svg>
                        <div className="progress-percentage">
                            {challenges.length > 0 ? Math.round((challenges.filter(c => c.is_solved).length / challenges.length) * 100) : 0}%
                        </div>
                    </div>

                    <div className="stat-item stat-unsolved-item">
                        <div className="stat-number">{challenges.length - challenges.filter(c => c.is_solved).length}</div>
                        <div className="stat-label">Unsolved</div>
                    </div>
                </div>

                {/* Categories */}
                <div className="category-filter">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`filter-btn ${filter === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Challenges Grid - Grouped by Category */}
                <div className="challenges-container">
                    {categories.filter(cat => cat !== 'All' && (filter === 'All' || filter === cat)).map(category => {
                        const categoryChallenges = challenges.filter(c => c.category === category);
                        if (categoryChallenges.length === 0) return null;

                        return (
                            <div key={category} className="category-section mb-12">
                                <h2 className="category-title text-2xl font-bold mb-6 text-white border-b border-white/10 pb-2 pl-2">
                                    {getIcon(category)} <span className="ml-2">{category}</span>
                                </h2>

                                <div className="challenges-grid">
                                    <AnimatePresence>
                                        {categoryChallenges.map((challenge, index) => (
                                            <motion.div
                                                key={challenge.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className={`challenge-card ${challenge.is_solved ? 'solved' : ''}`}
                                            >
                                                {challenge.is_solved && (
                                                    <div className="solved-icon">
                                                        <FaCheckCircle />
                                                    </div>
                                                )}

                                                {/* Category Tag at Top */}
                                                <div className="card-category-tag">
                                                    {getIcon(challenge.category)} {challenge.category}
                                                </div>

                                                <div className="card-header">
                                                    <span className="challenge-points">{challenge.points} PTS</span>
                                                </div>
                                                <h3 className="challenge-title">{challenge.title}</h3>

                                                <div className="challenge-author">
                                                    by {challenge.author || 'Unknown'}
                                                </div>

                                                <div className="challenge-action">
                                                    {challenge.is_solved ? (
                                                        <button className="solved-badge" onClick={() => {
                                                            setSelectedChallenge(challenge);
                                                            setSubmitStatus(null);
                                                            setFlagInput('');
                                                        }}>
                                                            <FaCheckCircle /> System Compromised
                                                        </button>
                                                    ) : (
                                                        <button className="attempt-btn" onClick={() => {
                                                            setSelectedChallenge(challenge);
                                                            setSubmitStatus(null);
                                                            setFlagInput('');
                                                        }}>
                                                            <FaUnlock /> Attempt
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal */}
                <AnimatePresence>
                    {selectedChallenge && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="modal-overlay"
                            onClick={() => setSelectedChallenge(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 50 }}
                                className="modal-content"
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    className="modal-close"
                                    onClick={() => setSelectedChallenge(null)}
                                >
                                    <FaTimesCircle />
                                </button>

                                {/* Top Right Stats */}
                                <div className="modal-top-stats">
                                    <div className="mini-stat stat-first-blood">
                                        <span className="mini-label">First Blood:</span>
                                        <span className="mini-value">
                                            {selectedChallenge.first_blood ? selectedChallenge.first_blood.username : 'None'}
                                        </span>
                                    </div>
                                    <div className="mini-stat stat-solves">
                                        <span className="mini-label">Solves:</span>
                                        <span className="mini-value">{selectedChallenge.solves_count || 0}</span>
                                    </div>
                                </div>

                                <div className="modal-header">
                                    <h2 className="modal-title">{selectedChallenge.title}</h2>
                                    <div className="modal-meta">
                                        <span>// {selectedChallenge.category}</span>
                                        <span>// {selectedChallenge.points} PTS</span>
                                        <span>// {selectedChallenge.difficulty}</span>
                                    </div>
                                </div>

                                <div className="modal-body-grid">
                                    <div className="modal-main">
                                        <div className="modal-desc">
                                            {selectedChallenge.description}
                                        </div>

                                        {/* Flag Format above input */}
                                        {selectedChallenge.flag_format && (
                                            <div style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '0.95rem', color: '#fff', opacity: 0.8 }}>
                                                Flag Format: {selectedChallenge.flag_format}
                                            </div>
                                        )}

                                        <form onSubmit={submitFlag} className="flag-submission-form">
                                            <div className="flag-form" style={{ flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        value={flagInput}
                                                        onChange={(e) => setFlagInput(e.target.value)}
                                                        placeholder="Hack!t{...}"
                                                        className="flag-input"
                                                        disabled={selectedChallenge.is_solved || eventStatus !== 'live'}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="submit-btn small"
                                                        disabled={selectedChallenge.is_solved || eventStatus !== 'live'}
                                                    >
                                                        {selectedChallenge.is_solved ? 'Solved' : eventStatus !== 'live' ? eventStatus.toUpperCase() : 'Submit'}
                                                    </button>
                                                </div>
                                                {eventStatus !== 'live' && <div style={{ color: '#ff9500', fontSize: '0.85rem', marginTop: '10px', textAlign: 'center', width: '100%' }}>Submissions are disabled because the event is {eventStatus}.</div>}
                                            </div>

                                            <AnimatePresence>
                                                {submitStatus === 'success' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="submission-status status-success"
                                                    >
                                                        <FaCheckCircle /> ROOT ACCESS GRANTED. FLAG ACCEPTED.
                                                    </motion.div>
                                                )}
                                                {submitStatus === 'error' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="submission-status status-error"
                                                    >
                                                        <FaTimesCircle /> ACCESS DENIED. KEY INVALID.
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </form>
                                    </div>

                                    <div className="modal-sidebar">
                                        {/* URL */}
                                        <div className="extra-item-sidebar">
                                            <span className="extra-label">URL:</span>
                                            {selectedChallenge.url ? (
                                                <a href={selectedChallenge.url} target="_blank" rel="noopener noreferrer" className="extra-link">
                                                    Click Here
                                                </a>
                                            ) : (
                                                <span className="extra-none">Not Provided</span>
                                            )}
                                        </div>

                                        {/* 5. Attachment */}
                                        <div className="extra-item-sidebar">
                                            <span className="extra-label">FILE:</span>
                                            {selectedChallenge.files && selectedChallenge.files.length > 0 ? (
                                                selectedChallenge.files.map((file, i) => (
                                                    <a key={i} href={file.url} download className="extra-link">
                                                        Click Here
                                                    </a>
                                                ))
                                            ) : (
                                                <span className="extra-none">Not Provided</span>
                                            )}
                                        </div>

                                        {/* 2. Hints */}
                                        <div className="modal-hints">
                                            <h4 className="hints-title">HINTS</h4>
                                            {selectedChallenge.hints && selectedChallenge.hints.length > 0 ? (
                                                selectedChallenge.hints.map(hint => (
                                                    <div key={hint.id} className={`hint-item ${hint.is_unlocked ? 'unlocked' : 'locked'}`}>
                                                        {hint.is_unlocked ? (
                                                            <div className="hint-content">{hint.content}</div>
                                                        ) : (
                                                            <button
                                                                className="unlock-hint-btn"
                                                                onClick={() => unlockHint(hint.id, hint.cost)}
                                                            >
                                                                <FaLock /> Unlock Hint (-{hint.cost} pts)
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="extra-none">No Hints</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Challenges;
