import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaCheckCircle, FaTimesCircle, FaLock, FaUnlock, FaBug, FaCode, FaDatabase, FaShieldAlt, FaFlask, FaExclamationTriangle } from 'react-icons/fa';
import './AdminTestChallengesOverrides.css';

const AdminTestChallenges = () => {
    const { id } = useParams();
    const [challenges, setChallenges] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Testing Modals / Statuses
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [flagInput, setFlagInput] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [waveFilter, setWaveFilter] = useState('All');
    const [availableWaves, setAvailableWaves] = useState([]);

    useEffect(() => {
        fetchTestChallenges();
    }, [id]);

    const fetchTestChallenges = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/test-challenges/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error("Forbidden: You are not an admin for this event.");
                throw new Error("Failed to fetch test challenges");
            }

            const data = await response.json();
            if (data.challenges) {
                setChallenges(data.challenges);
                setEventName(data.event);

                // Extract unique waves for the filter
                const waves = new Set(data.challenges.map(c => c.wave_name).filter(w => w !== null));
                setAvailableWaves(['All', 'No Wave', ...waves]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Test fetch failed:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const submitFlag = async (e) => {
        e.preventDefault();
        if (!selectedChallenge) return;

        try {
            const response = await fetch(`/api/admin/challenge/${selectedChallenge.id}/test-flag/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
                },
                body: JSON.stringify({ flag: flagInput })
            });

            const data = await response.json();

            if (data.success) {
                setSubmitStatus('success');
            } else {
                setSubmitStatus('error');
            }
        } catch (err) {
            setSubmitStatus('error');
        }
    };

    const categories = ['All', ...new Set(challenges.map(c => c.category))];

    const filteredChallenges = challenges.filter(c => {
        const searchVal = searchQuery.toLowerCase();
        const matchesSearch = c.title.toLowerCase().includes(searchVal) ||
            (c.description && c.description.toLowerCase().includes(searchVal));
        const catMatch = categoryFilter === 'All' || c.category === categoryFilter;
        const waveMatch = waveFilter === 'All'
            || (waveFilter === 'No Wave' && !c.wave_name)
            || c.wave_name === waveFilter;
        return matchesSearch && catMatch && waveMatch;
    });

    const getIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'web': return <FaBug />;
            case 'crypto': return <FaLock />;
            case 'pwn': return <FaCode />;
            case 'forensics': return <FaDatabase />;
            default: return <FaShieldAlt />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black text-[#00ff41] font-mono tracking-widest">
            INITIALIZING_TEST_ENVIRONMENT...
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-black text-red-500 font-bold">
            {error}
        </div>
    );

    return (
        <div className="admin-test-challenges-wrapper">
            <div className="challenges-page">
                <div className="event-content" style={{ textAlign: 'left' }}>

                    {/* Header / Admin Warning */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="challenges-header"
                        style={{ textAlign: 'left', alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}
                    >
                        <Link to={`/administration/event/${id}`} className="back-link" style={{ color: '#888', textDecoration: 'none' }}>
                            ← Back to Admin Panel
                        </Link>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-start' }}>
                            <FaFlask style={{ color: '#fff', fontSize: '2rem' }} />
                            <h1 className="challenges-title" style={{ margin: 0, padding: 0 }}>Test Environment</h1>
                        </div>
                        <p className="challenges-subtitle" style={{ color: '#666', marginTop: '5px' }}>Event: {eventName}</p>

                        <div style={{ marginTop: '15px', padding: '12px 15px', background: 'rgba(255, 255, 255, 0.05)', borderLeft: '3px solid #555', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', maxWidth: '600px' }}>
                            <FaExclamationTriangle style={{ color: '#aaa' }} />
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                Testing flags here will NOT award points or alter the database. Sandbox mode actively running.
                            </span>
                        </div>
                    </motion.div>

                    {/* Filters & Search */}
                    <div className="admin-controls-row" style={{ marginTop: '20px', marginBottom: '40px', justifyContent: 'flex-start' }}>
                        <div className="admin-search-container" style={{ maxWidth: '400px' }}>
                            <FaFlask />
                            <input
                                type="text"
                                placeholder="Search challenges..."
                                className="admin-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <select
                                className="admin-form-select"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={{ width: 'auto', minWidth: '150px' }}
                            >
                                {categories.map(cat => (
                                    <option key={`cat-${cat}`} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {availableWaves.length > 0 && (
                                <select
                                    className="admin-form-select"
                                    value={waveFilter}
                                    onChange={(e) => setWaveFilter(e.target.value)}
                                    style={{ width: 'auto', minWidth: '150px' }}
                                >
                                    {availableWaves.map(wave => (
                                        <option key={`wave-${wave}`} value={wave}>{wave}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Admin Grid View (Styled like normal challenges but distinct) */}
                    <div className="challenges-container">
                        <motion.div layout className="challenges-grid">
                            <AnimatePresence mode="popLayout">
                                {filteredChallenges.map((challenge, index) => (
                                    <motion.div
                                        key={challenge.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="challenge-card"
                                        style={{ borderTop: '2px solid #333' }}
                                    >

                                        <div className="card-category-tag" style={{ color: '#fff', borderColor: '#333', background: 'transparent' }}>
                                            {getIcon(challenge.category)} {challenge.category}
                                        </div>

                                        <div className="card-header">
                                            <span className="challenge-points" style={{ color: '#fff' }}>{challenge.points} PTS</span>
                                        </div>
                                        <h3 className="challenge-title">{challenge.title}</h3>

                                        {challenge.wave_name && (
                                            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '15px', border: '1px solid #333', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                                                Wave: {challenge.wave_name}
                                            </div>
                                        )}

                                        <div className="challenge-action">
                                            <button
                                                className="attempt-btn"
                                                onClick={() => {
                                                    setSelectedChallenge(challenge);
                                                    setSubmitStatus(null);
                                                    setFlagInput('');
                                                }}
                                            /* Hover effects are managed by AdminTestChallengesOverrides.css */
                                            >
                                                <FaFlask /> Test Challenge
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredChallenges.length === 0 && (
                                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: '#555', border: '1px dashed #333', borderRadius: '8px' }}>
                                    No challenges match the current filters.
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    {/* Test Sandbox Modal via Portal to escape Admin Layout stacking contexts */}
                    {createPortal(
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
                                        style={{ borderTop: '3px solid #333' }}
                                    >
                                        <button
                                            className="modal-close"
                                            onClick={() => setSelectedChallenge(null)}
                                            style={{ color: '#888' }}
                                        >
                                            <FaTimesCircle />
                                        </button>

                                        <div className="modal-header">
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem' }}>// TEST SANDBOX</span>
                                            </div>
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

                                                <form onSubmit={submitFlag} className="flag-submission-form" style={{ marginTop: '20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
                                                            <FaFlask /> Flag Verification Test
                                                        </div>
                                                        <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                                                            <input
                                                                type="text"
                                                                value={flagInput}
                                                                onChange={(e) => setFlagInput(e.target.value)}
                                                                placeholder="Enter flag to test..."
                                                                className="flag-input sandbox-input"
                                                            />
                                                            <button
                                                                type="submit"
                                                                className="submit-btn small sandbox-submit"
                                                                style={{ background: 'transparent', color: '#fff', border: '1px solid #444', padding: '0 20px', fontSize: '0.9rem' }}
                                                            >
                                                                EVALUATE
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {submitStatus === 'success' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="submission-status status-success"
                                                            >
                                                                <FaCheckCircle /> VALID FLAG - Logic checks out successfully.
                                                            </motion.div>
                                                        )}
                                                        {submitStatus === 'error' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="submission-status status-error"
                                                            >
                                                                <FaTimesCircle /> INVALID FLAG - Hash mismatch or incorrect format.
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

                                                {/* Attachment */}
                                                <div className="extra-item-sidebar">
                                                    <span className="extra-label">FILE:</span>
                                                    {selectedChallenge.files && selectedChallenge.files.length > 0 ? (
                                                        selectedChallenge.files.map((file, i) => (
                                                            <a key={i} href={file.url} download className="extra-link">
                                                                Attachment {i + 1}
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <span className="extra-none">Not Provided</span>
                                                    )}
                                                </div>

                                                {/* Hints List */}
                                                <div className="modal-hints">
                                                    <h4 className="hints-title">HINTS (ADMIN VIEW)</h4>
                                                    {selectedChallenge.hints && selectedChallenge.hints.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {selectedChallenge.hints.map((hint, i) => (
                                                                <div key={i} className="hint-item unlocked" style={{ borderLeftColor: 'var(--primary)' }}>
                                                                    <div className="hint-content">
                                                                        <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '4px' }}>Cost: {hint.cost} PTS</div>
                                                                        {hint.content}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="extra-none">No Hints Assigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminTestChallenges;
