import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPencilAlt, FaChevronDown, FaChevronUp, FaCheckCircle, FaLock } from 'react-icons/fa';

function EventWriteUps() {
    const { id } = useParams();
    const [writeups, setWriteups] = useState({});      // { challengeId: text }
    const [solvedChallenges, setSolvedChallenges] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [savedIds, setSavedIds] = useState([]);
    const [eventName, setEventName] = useState('');
    const [acceptingWriteups, setAcceptingWriteups] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [chalRes, wuRes] = await Promise.all([
                fetch(`/api/event/${id}/challenges/`, { credentials: 'include' }),
                fetch(`/api/event/${id}/writeups/`, { credentials: 'include' })
            ]);

            if (chalRes.ok) {
                const chalData = await chalRes.json();
                setEventName(chalData.event || '');
                setAcceptingWriteups(chalData.accepting_writeups === true);
                const solved = (chalData.challenges || []).filter(c => c.is_solved);
                setSolvedChallenges(solved);
            }

            if (wuRes.ok) {
                const wuData = await wuRes.json();
                const map = {};
                (wuData.writeups || []).forEach(wu => { map[wu.challenge_id] = wu.content; });
                setWriteups(map);
                setSavedIds(Object.keys(map).map(Number));
            }
        } catch (err) {
            console.error('Failed to load writeups', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (challengeId) => {
        setSaving(challengeId);
        try {
            const res = await fetch(`/api/event/${id}/writeups/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1] || ''
                },
                body: JSON.stringify({ challenge_id: challengeId, content: writeups[challengeId] || '' })
            });
            if (res.ok) {
                setSavedIds(prev => [...new Set([...prev, challengeId])]);
            }
        } catch (err) {
            console.error('Failed to save writeup', err);
        } finally {
            setSaving(null);
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', color: '#555', padding: '4rem', fontFamily: 'Orbitron' }}>LOADING...</div>
    );

    return (
        <div style={{ padding: '2rem 2rem 4rem', minHeight: '100vh' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <FaPencilAlt style={{ color: '#9ACD32', fontSize: '1.2rem' }} />
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>My WriteUps</h1>
                </div>
                <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
                    Personal writeups for challenges you've solved in <span style={{ color: '#9ACD32' }}>{eventName}</span>
                </p>
                {!acceptingWriteups && !loading && (
                    <div style={{ marginTop: '1rem', padding: '10px 15px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '6px', color: '#dc3545', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaLock /> Write-up submissions are currently closed for this event. You can still view your saved write-ups.
                    </div>
                )}
            </motion.div>

            {solvedChallenges.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: '5rem 2rem', color: '#444' }}>
                    <FaLock style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }} />
                    <p style={{ fontSize: '1.1rem' }}>No solved challenges yet.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Solve a challenge to unlock its writeup slot.</p>
                </motion.div>
            ) : (
                <AnimatePresence>
                    {solvedChallenges.map((ch, i) => {
                        const isOpen = expandedId === ch.id;
                        const hasSaved = savedIds.includes(ch.id);
                        return (
                            <motion.div
                                key={ch.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    background: 'rgba(15,15,15,0.85)',
                                    border: `1px solid ${isOpen ? 'rgba(154,205,50,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '12px',
                                    marginBottom: '10px',
                                    overflow: 'hidden',
                                    boxShadow: isOpen ? '0 0 30px rgba(154,205,50,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
                                    transition: 'border-color 0.3s, box-shadow 0.3s'
                                }}
                            >
                                {/* Challenge Row */}
                                <div
                                    onClick={() => setExpandedId(isOpen ? null : ch.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px', padding: '1.1rem 1.5rem',
                                        cursor: 'pointer', userSelect: 'none'
                                    }}
                                >
                                    <FaCheckCircle style={{ color: '#9ACD32', fontSize: '1rem', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{ch.title}</div>
                                        <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '2px' }}>{ch.category} · {ch.points} pts</div>
                                    </div>
                                    {hasSaved && <span style={{ fontSize: '0.72rem', color: '#9ACD32', background: 'rgba(154,205,50,0.1)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(154,205,50,0.3)', whiteSpace: 'nowrap' }}>Saved</span>}
                                    <span style={{ color: '#555', fontSize: '0.85rem' }}>{isOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
                                </div>

                                {/* Writeup Editor */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <textarea
                                                    value={writeups[ch.id] || ''}
                                                    onChange={e => setWriteups(prev => ({ ...prev, [ch.id]: e.target.value }))}
                                                    placeholder={`Document your approach for "${ch.title}" here...\n\nExample:\n1. Identified the vulnerability...\n2. Crafted the payload...\n3. Extracted the flag...`}
                                                    onCopy={e => e.preventDefault()}
                                                    onPaste={e => e.preventDefault()}
                                                    onCut={e => e.preventDefault()}
                                                    onContextMenu={e => e.preventDefault()}
                                                    style={{
                                                        width: '100%', minHeight: '200px', marginTop: '1rem',
                                                        padding: '1rem', background: 'rgba(0,0,0,0.5)',
                                                        border: '1px solid rgba(154,205,50,0.2)', borderRadius: '8px',
                                                        color: '#ddd', fontSize: '0.9rem', fontFamily: 'monospace',
                                                        lineHeight: 1.6, resize: 'vertical', outline: 'none',
                                                        boxSizing: 'border-box', transition: 'border-color 0.2s'
                                                    }}
                                                    onFocus={e => e.currentTarget.style.borderColor = '#9ACD32'}
                                                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(154,205,50,0.2)'}
                                                />
                                                <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: '#666', fontFamily: 'monospace' }}>
                                                    ⚠ Copy, paste and cut are disabled. You must type your writeup manually.
                                                </p>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                                    <button
                                                        onClick={() => handleSave(ch.id)}
                                                        disabled={saving === ch.id || !acceptingWriteups}
                                                        style={{
                                                            padding: '8px 22px', background: !acceptingWriteups ? '#444' : '#9ACD32', border: 'none',
                                                            color: !acceptingWriteups ? '#888' : '#000', borderRadius: '6px', fontWeight: 'bold',
                                                            cursor: (saving === ch.id || !acceptingWriteups) ? 'not-allowed' : 'pointer',
                                                            opacity: saving === ch.id ? 0.7 : 1,
                                                            boxShadow: !acceptingWriteups ? 'none' : '0 0 15px rgba(154,205,50,0.3)', transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {saving === ch.id ? 'Saving...' : 'Save WriteUp'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            )}
        </div>
    );
}

export default EventWriteUps;
