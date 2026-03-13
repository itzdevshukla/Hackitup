import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaPlus, FaSignInAlt, FaKey, FaCopy, FaCheck, FaUserMinus, FaSkull, FaChevronRight, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { postJson } from '../utils/csrf';

// ─────────────────────────────────────────────────────────
// TEAM CARD — Shown when user already has a team
// ─────────────────────────────────────────────────────────
const TeamCard = ({ team, eventId, currentUsername, onUpdate }) => {
    const [copied, setCopied] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [kicking, setKicking] = useState(null);
    const [error, setError] = useState('');

    const isCaptain = team.captain === currentUsername;

    const copyCode = () => {
        navigator.clipboard.writeText(team.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeave = async () => {
        const result = await Swal.fire({
            title: isCaptain ? 'Disband Team?' : 'Leave Team?',
            text: isCaptain
                ? "You are the captain. If you are the only member, the team will run out of existence. Otherwise, leadership passes to the next oldest member."
                : "Are you sure you want to leave this team?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#333',
            confirmButtonText: isCaptain ? 'Yes, let me out' : 'Yes, leave team',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        setLeaving(true);
        setError('');
        try {
            const data = await postJson(`/api/teams/${team.id}/leave/`);
            if (data.success) {
                Swal.fire({
                    title: 'Left Team',
                    text: data.message || 'You have successfully left the team.',
                    icon: 'success',
                    background: '#1a1a1a',
                    color: '#fff',
                    confirmButtonColor: '#9ACD32',
                    timer: 2000,
                    showConfirmButton: false
                });
                onUpdate(null);
            } else {
                setError(data.error || 'Failed to leave team.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setLeaving(false);
        }
    };

    const handleKick = async (username) => {
        const result = await Swal.fire({
            title: `Kick ${username}?`,
            text: "They will be removed from your team roster.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, kick them!',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        setKicking(username);
        setError('');
        try {
            const data = await postJson(`/api/teams/${team.id}/kick/`, { username });
            if (data.success) {
                onUpdate({ ...team, members: team.members.filter(m => m.username !== username) });
            } else {
                setError(data.error || 'Failed to kick member.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setKicking(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(145deg, rgba(30,30,30,0.9), rgba(15,15,15,0.95))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(154,205,50,0.4)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 0 40px rgba(154,205,50,0.05)',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(154,205,50,0.1)', padding: '10px', borderRadius: '10px', color: '#9ACD32' }}>
                    <FaUsers size={20} />
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '1px', marginBottom: '2px' }}>YOUR TEAM</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>{team.name}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#9ACD32', background: 'rgba(154,205,50,0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(154,205,50,0.3)' }}>
                    {team.member_count} / {team.max_team_size || '—'} members
                </div>
            </div>

            {/* Invite code */}
            {isCaptain && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', border: '1px dashed rgba(154,205,50,0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '1px', marginBottom: '8px' }}>INVITE CODE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <code style={{ flex: 1, fontSize: '1.15rem', color: '#9ACD32', fontFamily: 'monospace', letterSpacing: '2px' }}>
                            {team.invite_code}
                        </code>
                        <button
                            onClick={copyCode}
                            title="Copy invite code"
                            style={{ background: copied ? 'rgba(154,205,50,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#9ACD32' : '#888', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                        >
                            {copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#555' }}>Share this code with your teammates to invite them.</div>
                </div>
            )}

            {/* Members Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>ROSTER</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                    {team.members.map(m => (
                        <div key={m.username} style={{
                            background: m.is_me ? 'rgba(154,205,50,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${m.is_me ? 'rgba(154,205,50,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            position: 'relative',
                            transition: 'transform 0.2s',
                            boxShadow: m.is_me ? 'inset 0 0 20px rgba(154,205,50,0.05)' : 'none'
                        }}>

                            {/* Member Header (Avatar + Role) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '46px', height: '46px', borderRadius: '12px',
                                    background: `linear-gradient(135deg, hsl(${m.username.charCodeAt(0) * 13 % 360}, 80%, 60%), hsl(${m.username.charCodeAt(0) * 23 % 360}, 70%, 40%))`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.4rem', fontWeight: '900', color: '#fff',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                }}>
                                    {m.username[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ color: m.is_me ? '#9ACD32' : '#fff', fontWeight: m.is_me ? '800' : '700', fontSize: '1.1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', letterSpacing: '0.5px' }}>
                                            {m.username}
                                        </div>
                                        {m.is_me && <span style={{ fontSize: '0.6rem', color: '#000', background: '#9ACD32', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>YOU</span>}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: m.is_captain ? '#f0a500' : '#888', marginTop: '4px', fontWeight: m.is_captain ? 700 : 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {m.is_captain && <span style={{ fontSize: '0.8rem' }}>★</span>} {m.is_captain ? 'CAPTAIN' : 'MEMBER'}
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />

                            {/* Member Stats & Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: '#666', letterSpacing: '1px', textTransform: 'uppercase' }}>Contributed</div>
                                    <div style={{ color: '#9ACD32', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Orbitron, sans-serif' }}>
                                        {m.points || 0} <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>PTS</span>
                                    </div>
                                </div>

                                {isCaptain && !m.is_captain && (
                                    <button
                                        onClick={() => handleKick(m.username)}
                                        disabled={kicking === m.username}
                                        title={`Kick ${m.username}`}
                                        style={{
                                            background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)',
                                            color: '#ff4d4d', padding: '6px 10px', borderRadius: '8px',
                                            cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.15)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.08)'; }}
                                    >
                                        {kicking === m.username ? '...' : <><FaUserMinus /> Kick</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '1rem', padding: '8px 12px', borderLeft: '3px solid #ff4d4d', background: 'rgba(255,77,77,0.08)' }}>
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leave button */}
            <button
                onClick={handleLeave}
                disabled={leaving}
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,77,77,0.07)', border: '1px solid rgba(255,77,77,0.25)', color: '#ff4d4d', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: leaving ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.07)'; }}
            >
                <FaSkull size={14} />
                {leaving ? 'LEAVING...' : isCaptain ? 'DISBAND / LEAVE TEAM' : 'LEAVE TEAM'}
            </button>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────
// TEAM PANEL — Borderless 3D Float Redesign (No Central Box)
// ─────────────────────────────────────────────────────────
const TeamPanel = ({ eventId, maxTeamSize, onTeamJoined }) => {
    const [mode, setMode] = useState(null); // 'create' | 'join' | null
    const [teamName, setTeamName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) { setError('Team name is required.'); return; }
        setLoading(true); setError('');
        try {
            const data = await postJson(`/api/teams/event/${eventId}/create/`, { name: teamName.trim() });
            if (data.success) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Team Created!', showConfirmButton: false, timer: 3000, background: '#1a1a1a', color: '#9ACD32' });
                window.location.reload();
            } else {
                setError(data.error || 'Failed to create team.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) { setError('Invite code is required.'); return; }
        setLoading(true); setError('');
        try {
            const data = await postJson(`/api/teams/event/${eventId}/join/`, { invite_code: inviteCode.trim() });
            if (data.success) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Joined Team!', showConfirmButton: false, timer: 3000, background: '#1a1a1a', color: '#9ACD32' });
                window.location.reload();
            } else {
                setError(data.error || 'Invalid invite code.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setMode(null);
        setError('');
        setTeamName('');
        setInviteCode('');
    };

    // Very dark, soft, easy-on-the-eyes 3D background
    return (
        <div style={{
            minHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#050505', // Deep black base
        }}>
            {/* Soft, non-intrusive 3D background elements */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                background: 'radial-gradient(circle at 50% -20%, rgba(154,205,50,0.06) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(0,191,255,0.03) 0%, transparent 50%)',
            }} />

            {/* Subtle floating 3D grid line illusion (perspective) */}
            <div style={{
                position: 'absolute', bottom: '-50%', left: '-50%', right: '-50%', height: '100%',
                backgroundImage: 'linear-gradient(transparent 95%, rgba(255,255,255,0.02) 100%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.02) 100%)',
                backgroundSize: '50px 50px',
                transform: 'perspective(500px) rotateX(75deg)',
                transformOrigin: 'top center',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.6
            }} />

            {/* Content Wrapper (No enclosing border box, directly floating) */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Floating Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#9ACD32', marginBottom: '1.2rem', filter: 'drop-shadow(0 0 20px rgba(154,205,50,0.3))' }}>
                        <FaUsers size={48} />
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '3.2rem', fontFamily: 'Orbitron, sans-serif', color: '#fff', letterSpacing: '4px', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                        TEAM PROTOCOL
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                        <span style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, rgba(154,205,50,0.4))' }} />
                        <span style={{ color: '#888', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', fontWeight: 400, letterSpacing: '2px', textTransform: 'uppercase' }}>
                            Capacity: <strong style={{ color: '#ccc', fontWeight: 600 }}>{maxTeamSize} Combatants</strong>
                        </span>
                        <span style={{ height: '1px', width: '60px', background: 'linear-gradient(270deg, transparent, rgba(154,205,50,0.4))' }} />
                    </div>
                </motion.div>

                {/* Interactive State Area */}
                <div style={{ width: '100%' }}>
                    <AnimatePresence mode="wait">
                        {!mode ? (
                            <motion.div
                                key="selection"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }} transition={{ duration: 0.4 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', perspective: '1200px' }}
                            >
                                {/* Floating 3D Create Card */}
                                <div
                                    onClick={() => { setMode('create'); setError(''); }}
                                    onMouseEnter={() => setHoveredCard('create')}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(20, 22, 24, 0.4) 0%, rgba(10, 11, 12, 0.6) 100%)',
                                        backdropFilter: 'blur(10px)',
                                        borderTop: `1px solid ${hoveredCard === 'create' ? 'rgba(154,205,50,0.4)' : 'rgba(255,255,255,0.04)'}`,
                                        borderLeft: `1px solid ${hoveredCard === 'create' ? 'rgba(154,205,50,0.1)' : 'rgba(255,255,255,0.02)'}`,
                                        borderRight: '1px solid rgba(0,0,0,0.8)',
                                        borderBottom: '1px solid rgba(0,0,0,0.8)',
                                        borderRadius: '24px',
                                        padding: '3.5rem 2.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        transform: hoveredCard === 'create' ? 'translateY(-15px) rotateX(5deg) scale(1.02)' : 'translateY(0) rotateX(0deg) scale(1)',
                                        boxShadow: hoveredCard === 'create'
                                            ? '0 30px 60px rgba(0,0,0,0.9), 0 10px 30px rgba(154,205,50,0.1)'
                                            : '0 20px 40px rgba(0,0,0,0.5)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle at top right, rgba(154,205,50,0.05), transparent 70%)', pointerEvents: 'none' }} />

                                    <div style={{
                                        color: hoveredCard === 'create' ? '#9ACD32' : '#666',
                                        marginBottom: '1.5rem',
                                        transition: 'all 0.4s ease',
                                        filter: hoveredCard === 'create' ? 'drop-shadow(0 0 15px rgba(154,205,50,0.4))' : 'none'
                                    }}>
                                        <FaPlus size={40} />
                                    </div>
                                    <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '1.6rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>CREATE SQUAD</h3>
                                    <p style={{ color: '#888', fontSize: '1.05rem', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>Forge a new path. Stand as the leader and invite allies to your customized squadron.</p>

                                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: hoveredCard === 'create' ? '#9ACD32' : '#444', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s' }}>
                                        Initialize <FaChevronRight size={12} style={{ transform: hoveredCard === 'create' ? 'translateX(5px)' : 'translateX(0)', transition: 'all 0.3s' }} />
                                    </div>
                                </div>

                                {/* Floating 3D Join Card */}
                                <div
                                    onClick={() => { setMode('join'); setError(''); }}
                                    onMouseEnter={() => setHoveredCard('join')}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(20, 22, 24, 0.4) 0%, rgba(10, 11, 12, 0.6) 100%)',
                                        backdropFilter: 'blur(10px)',
                                        borderTop: `1px solid ${hoveredCard === 'join' ? 'rgba(0,191,255,0.4)' : 'rgba(255,255,255,0.04)'}`,
                                        borderLeft: `1px solid ${hoveredCard === 'join' ? 'rgba(0,191,255,0.1)' : 'rgba(255,255,255,0.02)'}`,
                                        borderRight: '1px solid rgba(0,0,0,0.8)',
                                        borderBottom: '1px solid rgba(0,0,0,0.8)',
                                        borderRadius: '24px',
                                        padding: '3.5rem 2.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        transform: hoveredCard === 'join' ? 'translateY(-15px) rotateX(5deg) scale(1.02)' : 'translateY(0) rotateX(0deg) scale(1)',
                                        boxShadow: hoveredCard === 'join'
                                            ? '0 30px 60px rgba(0,0,0,0.9), 0 10px 30px rgba(0,191,255,0.1)'
                                            : '0 20px 40px rgba(0,0,0,0.5)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle at top right, rgba(0,191,255,0.05), transparent 70%)', pointerEvents: 'none' }} />

                                    <div style={{
                                        color: hoveredCard === 'join' ? '#00bfff' : '#666',
                                        marginBottom: '1.5rem',
                                        transition: 'all 0.4s ease',
                                        filter: hoveredCard === 'join' ? 'drop-shadow(0 0 15px rgba(0,191,255,0.4))' : 'none'
                                    }}>
                                        <FaSignInAlt size={40} style={{ marginLeft: '4px' }} />
                                    </div>
                                    <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '1.6rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>JOIN SQUAD</h3>
                                    <p style={{ color: '#888', fontSize: '1.05rem', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>Have an encrypted key? Skip configuration and directly reinforce an active combat unit.</p>

                                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: hoveredCard === 'join' ? '#00bfff' : '#444', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s' }}>
                                        Authenticate <FaChevronRight size={12} style={{ transform: hoveredCard === 'join' ? 'translateX(5px)' : 'translateX(0)', transition: 'all 0.3s' }} />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key={mode}
                                initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -30, filter: 'blur(5px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                onSubmit={mode === 'create' ? handleCreate : handleJoin}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16, 17, 19, 0.7) 0%, rgba(8, 9, 10, 0.9) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    borderTop: `1px solid ${mode === 'create' ? 'rgba(154,205,50,0.3)' : 'rgba(0,191,255,0.3)'}`,
                                    borderLeft: '1px solid rgba(255,255,255,0.04)',
                                    borderRight: '1px solid rgba(0,0,0,0.8)',
                                    borderRadius: '24px',
                                    padding: '4rem 3rem',
                                    maxWidth: '550px',
                                    margin: '0 auto',
                                    boxShadow: '0 40px 80px rgba(0,0,0,0.9), 0 10px 20px rgba(0,0,0,0.5)',
                                    position: 'relative'
                                }}
                            >
                                <button
                                    type="button" onClick={goBack}
                                    style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'transparent', border: 'none', color: '#666', padding: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#666'}
                                >
                                    <FaArrowLeft size={14} /> 返回 Selection
                                </button>

                                <div style={{ textAlign: 'center', marginBottom: '3rem', mt: '1rem' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: mode === 'create' ? '#9ACD32' : '#00bfff', marginBottom: '1.2rem', filter: mode === 'create' ? 'drop-shadow(0 0 10px rgba(154,205,50,0.3))' : 'drop-shadow(0 0 10px rgba(0,191,255,0.3))' }}>
                                        {mode === 'create' ? <FaPlus size={36} /> : <FaSignInAlt size={36} />}
                                    </div>
                                    <h2 style={{ margin: 0, color: '#fff', fontFamily: 'Orbitron, sans-serif', fontSize: '2rem', letterSpacing: '2px' }}>
                                        {mode === 'create' ? 'NEW SQUADRON' : 'ENTER KEY'}
                                    </h2>
                                </div>

                                <div style={{ marginBottom: '3rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', letterSpacing: '3px', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 500 }}>
                                        {mode === 'create' ? 'Squadron Designation' : 'Access Code'}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        {mode === 'join' && <FaKey style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '1.2rem', pointerEvents: 'none' }} />}
                                        <input
                                            type="text"
                                            value={mode === 'create' ? teamName : inviteCode}
                                            onChange={e => mode === 'create' ? setTeamName(e.target.value) : setInviteCode(e.target.value.toUpperCase())}
                                            placeholder={mode === 'create' ? "e.g. Phantom Operatives" : "TEAM-XXXXXXXX"}
                                            maxLength={100}
                                            autoFocus
                                            style={{
                                                width: '100%', padding: mode === 'join' ? '20px 20px 20px 65px' : '20px 25px',
                                                background: 'rgba(0,0,0,0.4)', border: 'none', borderBottom: `2px solid rgba(255,255,255,0.05)`,
                                                color: '#fff',
                                                borderTopLeftRadius: '12px', borderTopRightRadius: '12px', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px',
                                                fontSize: '1.2rem', outline: 'none', transition: 'all 0.3s',
                                                boxSizing: 'border-box', fontFamily: mode === 'join' ? 'monospace' : 'Inter, sans-serif',
                                                letterSpacing: mode === 'join' ? '5px' : '1px'
                                            }}
                                            onFocus={e => {
                                                e.currentTarget.style.borderBottomColor = mode === 'create' ? '#9ACD32' : '#00bfff';
                                                e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                                            }}
                                            onBlur={e => {
                                                e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.background = 'rgba(0,0,0,0.4)';
                                            }}
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -5, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '2.5rem' }}>
                                            <div style={{ color: '#ff6b6b', fontSize: '0.95rem', padding: '14px 18px', borderRadius: '10px', background: 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <FaSkull size={16} /> {error}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit" disabled={loading}
                                    style={{
                                        width: '100%', padding: '20px',
                                        background: mode === 'create' ? 'rgba(154,205,50,0.1)' : 'rgba(0,191,255,0.1)',
                                        border: `1px solid ${mode === 'create' ? 'rgba(154,205,50,0.3)' : 'rgba(0,191,255,0.3)'}`,
                                        color: mode === 'create' ? '#9ACD32' : '#00bfff',
                                        borderRadius: '14px', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '3px', textTransform: 'uppercase',
                                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                        transition: 'all 0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                                    }}
                                    onMouseEnter={e => {
                                        if (!loading) {
                                            e.currentTarget.style.background = mode === 'create' ? '#9ACD32' : '#00bfff';
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.boxShadow = mode === 'create' ? '0 10px 25px rgba(154,205,50,0.4)' : '0 10px 25px rgba(0,191,255,0.4)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!loading) {
                                            e.currentTarget.style.background = mode === 'create' ? 'rgba(154,205,50,0.1)' : 'rgba(0,191,255,0.1)';
                                            e.currentTarget.style.color = mode === 'create' ? '#9ACD32' : '#00bfff';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
                                >
                                    {loading && <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'fa-spin 1s linear infinite' }} />}
                                    {loading ? 'PROCESSING...' : (mode === 'create' ? 'INITIALIZE SQUAD' : 'VERIFY & ENTER')}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// TEAM SECTION — Main export — wraps both states
// ─────────────────────────────────────────────────────────
const TeamSection = ({ eventId, maxTeamSize, currentUsername }) => {
    const [team, setTeam] = useState(undefined); // undefined = loading
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const fetchMyTeam = async () => {
            try {
                const res = await fetch(`/api/teams/event/${eventId}/my-team/`, { credentials: 'include' });
                const data = await res.json();
                setTeam(data.team); // null if no team
            } catch {
                setLoadError('Failed to load team info.');
                setTeam(null);
            }
        };
        fetchMyTeam();
    }, [eventId]);

    if (team === undefined) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontFamily: 'monospace' }}>
                LOADING TEAM DATA...
            </div>
        );
    }

    if (loadError) {
        return <div style={{ color: '#ff4d4d', padding: '1rem' }}>{loadError}</div>;
    }

    if (team) {
        return (
            <TeamCard
                team={{ ...team, max_team_size: maxTeamSize }}
                eventId={eventId}
                currentUsername={currentUsername}
                onUpdate={setTeam}
            />
        );
    }

    return (
        <TeamPanel
            eventId={eventId}
            maxTeamSize={maxTeamSize}
            onTeamJoined={setTeam}
        />
    );
};

export default TeamSection;
