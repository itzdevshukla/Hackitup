import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaFlag, FaCheckCircle, FaTimesCircle, FaLock,
    FaBug, FaCode, FaDatabase, FaShieldAlt, FaBan, FaGavel,
    FaArrowRight, FaStar, FaEye
} from 'react-icons/fa';

/* ─── helpers ─────────────────────────────────────────────────── */
const DIFF_COLOR = { easy: '#4CAF50', medium: '#FF9800', hard: '#f44336' };
const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const CAT_ICONS = {
    web: <FaBug />, crypto: <FaLock />, pwn: <FaCode />,
    forensics: <FaDatabase />, osint: <FaEye />,
    misc: <FaStar />, default: <FaShieldAlt />
};
const CAT_COLORS = {
    web: '#3b82f6', crypto: '#a855f7', pwn: '#ef4444',
    forensics: '#22c55e', osint: '#f59e0b', misc: '#ec4899', default: '#9ACD32'
};
function catIcon(cat) { return CAT_ICONS[cat?.toLowerCase()] ?? CAT_ICONS.default; }
function catColor(cat) { return CAT_COLORS[cat?.toLowerCase()] ?? CAT_COLORS.default; }

/* ─── component ───────────────────────────────────────────────── */
const Challenges = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category') || 'All';

    const [challenges, setChallenges] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState(categoryParam);
    const [isBanned, setIsBanned] = useState(false);
    const [eventStatus, setEventStatus] = useState('live');


    // Rules overlay
    const [rules, setRules] = useState('');
    const [showRulesOverlay, setShowRulesOverlay] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const countdownRef = useRef(null);

    useEffect(() => { setFilter(categoryParam); }, [categoryParam]);

    useEffect(() => {
        fetchChallenges();
        fetchEventRules();
        const intervalId = setInterval(fetchChallenges, 5000);
        return () => clearInterval(intervalId);
    }, [id]);

    useEffect(() => {
        if (showRulesOverlay && countdown > 0) {
            countdownRef.current = setInterval(() => {
                setCountdown(prev => { if (prev <= 1) { clearInterval(countdownRef.current); return 0; } return prev - 1; });
            }, 1000);
        }
        return () => clearInterval(countdownRef.current);
    }, [showRulesOverlay]);

    const fetchEventRules = async () => {
        const seenKey = `rules_seen_event_${id}`;
        if (localStorage.getItem(seenKey)) return;
        try {
            const res = await fetch(`/api/dashboard/event/${id}/`);
            if (res.ok) {
                const data = await res.json();
                if (data.rules?.trim()) { setRules(data.rules); setShowRulesOverlay(true); }
            }
        } catch { }
    };

    const dismissRulesOverlay = () => {
        if (countdown > 0) return;
        localStorage.setItem(`rules_seen_event_${id}`, 'true');
        setShowRulesOverlay(false);
    };

    const fetchChallenges = async () => {
        try {
            const res = await fetch(`/api/event/${id}/challenges/`);
            if (res.status === 403) {
                const d = await res.json();
                setError(d.error || 'Access Denied');
                if (d.event) setEventName(d.event);
                setEventStatus('pending');
                setLoading(false);
                return;
            }
            const data = await res.json();

            // Redirect to Team page if they require a team
            if (data.needs_team) {
                navigate(`/event/${id}/team`, { replace: true });
                return;
            }

            if (data.challenges) {
                setChallenges(data.challenges);
                setEventName(data.event);
                setIsBanned(data.is_banned || false);
                setEventStatus(data.status || 'live');
            }
            setLoading(false);
        } catch {
            setError('Failed to load challenges.');
            setLoading(false);
        }
    };

    const openChallenge = (ch) => {
        navigate(`/event/${id}/challenges/${ch.id}`);
    };

    const categories = ['All', ...new Set(challenges.map(c => c.category))];
    const filtered = challenges.filter(c => filter === 'All' || c.category === filter);
    const grouped = {};
    filtered.forEach(c => { if (!grouped[c.category]) grouped[c.category] = []; grouped[c.category].push(c); });

    const solved = challenges.filter(c => c.is_solved).length;
    const total = challenges.length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

    /* ── splash states ── */
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', fontFamily: 'Orbitron, sans-serif', color: '#9ACD32', letterSpacing: '4px', fontSize: '0.9rem' }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>INITIALIZING ARENA...</motion.div>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem', gap: '1.5rem', fontFamily: 'Orbitron, sans-serif' }}>
            <div style={{ fontSize: '3.5rem', color: '#9ACD32', opacity: 0.3 }}>
                {error.toLowerCase().includes('started') ? '⏳' : '🔒'}
            </div>
            <h1 style={{ fontSize: '2rem', margin: 0, color: '#9ACD32', letterSpacing: '2px', textShadow: '0 0 20px rgba(154,205,50,0.3)', textTransform: 'uppercase' }}>
                {error.toLowerCase().includes('started') ? 'EVENT NOT STARTED' : 'ACCESS DENIED'}
            </h1>
            <p style={{ fontSize: '1rem', color: '#888', maxWidth: '500px', lineHeight: '1.6', fontFamily: 'Inter, sans-serif', fontWeight: 'normal' }}>
                {error}
            </p>
            <button onClick={() => navigate(`/event/${id}`)} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(154,205,50,0.4)', color: '#9ACD32', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', letterSpacing: '1px' }}>
                ← BACK TO EVENT
            </button>
        </div>
    );

    if (isBanned) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', textAlign: 'center', fontFamily: 'Orbitron, sans-serif' }}>
            <FaBan style={{ fontSize: '3.5rem', color: '#f44336', opacity: 0.6 }} />
            <h1 style={{ margin: 0, color: '#f44336', fontSize: '1.8rem', letterSpacing: '2px' }}>ACCESS TERMINATED</h1>
            <p style={{ color: '#888', maxWidth: '480px', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', fontWeight: 'normal' }}>You are banned from this event. Contact the organizers for details.</p>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: '1.5rem 1.5rem 4rem' }}>

            {/* ── RULES OVERLAY ── */}
            <AnimatePresence>
                {showRulesOverlay && (
                    <motion.div key="rules-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(154,205,50,0.4)', borderRadius: '20px', boxShadow: '0 0 60px rgba(154,205,50,0.15), 0 20px 60px rgba(0,0,0,0.8)', width: '100%', maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(154,205,50,0.2)', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                                <div style={{ background: 'rgba(154,205,50,0.1)', padding: '10px', borderRadius: '10px', color: '#9ACD32', fontSize: '1.3rem' }}><FaGavel /></div>
                                <div>
                                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: '900' }}>Rules & Regulations</h2>
                                    <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>You must read these before participating.</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flexGrow: 1, lineHeight: '1.7' }}>
                                {rules.split('\n').map((line, i) => {
                                    if (line.startsWith('# ')) return <h1 key={i} style={{ color: '#9ACD32', fontSize: '1.5rem', margin: '1rem 0 0.5rem', borderBottom: '1px solid rgba(154,205,50,0.2)', paddingBottom: '0.4rem' }}>{line.slice(2)}</h1>;
                                    if (line.startsWith('## ')) return <h2 key={i} style={{ color: '#b5e853', fontSize: '1.15rem', margin: '0.9rem 0 0.3rem' }}>{line.slice(3)}</h2>;
                                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ color: '#ccc', marginLeft: '1.5rem', listStyle: 'disc', marginBottom: '4px' }}>{line.slice(2)}</li>;
                                    if (line.trim() === '') return <br key={i} />;
                                    return <p key={i} style={{ color: '#bbb', margin: '0.2rem 0' }}>{line}</p>;
                                })}
                            </div>
                            <div style={{ padding: '1.2rem 2rem', borderTop: '1px solid rgba(154,205,50,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                                        <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                            <circle cx="25" cy="25" r="20" fill="none" stroke={countdown > 0 ? '#9ACD32' : '#4CAF50'} strokeWidth="3"
                                                strokeDasharray={`${2 * Math.PI * 20}`}
                                                strokeDashoffset={`${2 * Math.PI * 20 * (countdown / 15)}`}
                                                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
                                        </svg>
                                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: countdown > 0 ? '#9ACD32' : '#4CAF50', fontWeight: 'bold', fontSize: '0.85rem' }}>{countdown}</span>
                                    </div>
                                    <span style={{ color: '#777', fontSize: '0.85rem' }}>
                                        {countdown > 0 ? `Please read carefully — ${countdown}s left` : 'You may now proceed.'}
                                    </span>
                                </div>
                                <motion.button onClick={dismissRulesOverlay} disabled={countdown > 0}
                                    whileHover={countdown === 0 ? { scale: 1.04, boxShadow: '0 0 25px rgba(154,205,50,0.6)' } : {}}
                                    whileTap={countdown === 0 ? { scale: 0.97 } : {}}
                                    style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: countdown > 0 ? 'rgba(255,255,255,0.05)' : '#9ACD32', color: countdown > 0 ? '#555' : '#000', fontWeight: 'bold', fontSize: '0.95rem', cursor: countdown > 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.4s, color 0.4s', boxShadow: countdown === 0 ? '0 0 20px rgba(154,205,50,0.4)' : 'none' }}>
                                    I Agree & Continue <FaArrowRight />
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── HEADER ── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '1.8rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '3px', color: '#555', fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase', marginBottom: '4px' }}>CTF Arena</div>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900 }}>{eventName}</h1>
                    <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.85rem' }}>Decryption protocols active. Good luck.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {[{ label: 'Solved', value: solved, color: '#9ACD32' }, { label: 'Remaining', value: total - solved, color: '#f59e0b' }, { label: 'Total', value: total, color: '#888' }].map(s => (
                            <div key={s.label} style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ position: 'relative', width: '54px', height: '54px' }}>
                        <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                            <circle cx="27" cy="27" r="22" fill="none" stroke="#9ACD32" strokeWidth="4"
                                strokeDasharray={`${2 * Math.PI * 22}`}
                                strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                        </svg>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ACD32', fontWeight: 900, fontSize: '0.75rem' }}>{pct}%</span>
                    </div>
                </div>
            </motion.div>



            {/* ── CHALLENGE GRID ── */}
            {Object.entries(grouped).map(([category, chs]) => (
                <div key={category} style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', paddingBottom: '8px', borderBottom: `1px solid ${catColor(category)}30` }}>
                        <span style={{ color: catColor(category), fontSize: '1.1rem' }}>{catIcon(category)}</span>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: '2px' }}>{category}</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
                        <AnimatePresence>
                            {chs.map((ch, idx) => (
                                <motion.div key={ch.id}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }} transition={{ delay: idx * 0.04 }}
                                    whileHover={{ y: -3 }}
                                    onClick={() => openChallenge(ch)}
                                    style={{
                                        background: '#0c0c0c',
                                        border: `1px solid ${ch.is_solved ? 'rgba(154,205,50,0.45)' : 'rgba(255,255,255,0.06)'}`,
                                        borderRadius: '16px',
                                        padding: '0',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        minHeight: '300px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}>
                                    {/* Colored top strip */}
                                    <div style={{ height: '4px', background: ch.is_solved ? '#9ACD32' : catColor(ch.category), flexShrink: 0 }} />

                                    {/* Top-right: points + solved tick */}
                                    <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {ch.is_solved && <FaCheckCircle style={{ color: '#9ACD32', fontSize: '1rem' }} />}
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: ch.is_solved ? '#9ACD32' : '#999', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>
                                            {ch.points} <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>PTS</span>
                                        </span>
                                    </div>

                                    {/* Card body */}
                                    <div style={{ padding: '1.4rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                        {/* Category pill */}
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: `${catColor(ch.category)}12`, border: `1px solid ${catColor(ch.category)}30`, borderRadius: '20px', color: catColor(ch.category), fontSize: '0.72rem', fontWeight: 700, alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {catIcon(ch.category)} {ch.category}
                                        </div>

                                        {/* Title */}
                                        <h3 style={{ margin: 0, color: ch.is_solved ? '#9ACD32' : '#f0f0f0', fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4, flex: 1 }}>
                                            {ch.title}
                                        </h3>

                                        {/* Meta row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.76rem', color: '#555' }}>
                                            <span>by <span style={{ color: '#777' }}>{ch.author || 'Unknown'}</span></span>
                                            <span style={{ marginLeft: 'auto', color: DIFF_COLOR[ch.difficulty] || '#888', background: `${DIFF_COLOR[ch.difficulty] || '#888'}12`, padding: '2px 10px', borderRadius: '20px', border: `1px solid ${DIFF_COLOR[ch.difficulty] || '#888'}25`, fontWeight: 600 }}>
                                                {DIFF_LABEL[ch.difficulty] || ch.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom button */}
                                    <div style={{ padding: '0 1.5rem 1.3rem' }}>
                                        <div style={{
                                            width: '100%', padding: '10px', borderRadius: '10px', textAlign: 'center',
                                            background: ch.is_solved ? 'rgba(154,205,50,0.08)' : `${catColor(ch.category)}10`,
                                            border: `1px solid ${ch.is_solved ? 'rgba(154,205,50,0.3)' : `${catColor(ch.category)}30`}`,
                                            color: ch.is_solved ? '#9ACD32' : catColor(ch.category),
                                            fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.5px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'all 0.2s', boxSizing: 'border-box'
                                        }}>
                                            {ch.is_solved ? <><FaCheckCircle /> Solved</> : <><FaFlag style={{ fontSize: '0.75rem' }} /> Attempt Challenge</>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            ))}

            {filtered.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#444' }}>
                    <FaFlag style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.2 }} />
                    <p style={{ color: '#555' }}>No challenges in this category yet.</p>
                </div>
            )}
        </div>
    );
};

export default Challenges;
