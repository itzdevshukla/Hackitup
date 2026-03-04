import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBullhorn, FaInfoCircle, FaExclamationTriangle, FaBan, FaCheckCircle, FaClock } from 'react-icons/fa';

function EventAnnouncements() {
    const { id } = useParams();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventName, setEventName] = useState('');

    useEffect(() => {
        fetchAnnouncements();
        const poll = setInterval(fetchAnnouncements, 15000);
        return () => clearInterval(poll);
    }, [id]);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`/api/event/${id}/announcements/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();

            if (res.ok) {
                setAnnouncements(data.announcements || []);
                // If the event name isn't returned by this endpoint, we might have to fetch it or rely on context
                // but the previous component expected it, so let's set if available
                if (data.event) setEventName(data.event);

                // Clear the 'unread' indicator by saving the highest ID seen
                if (data.announcements && data.announcements.length > 0) {
                    localStorage.setItem(`lastSeenAnnouncement_${id}`, data.announcements[0].id.toString());
                }
            } else {
                setError(data.error || 'Failed to fetch announcements.');
            }
        } catch (err) {
            console.error('Announcements fetch error:', err);
            setError('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'danger': return <FaBan />;
            case 'warning': return <FaExclamationTriangle />;
            case 'success': return <FaCheckCircle />;
            case 'info':
            default: return <FaInfoCircle />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'danger': return '#ff4c4c'; // Red for Bans
            case 'warning': return '#ffb84d'; // Orange/Yellow 
            case 'success': return '#4cff4c'; // Neon Green for Waves
            case 'info':
            default: return '#4da6ff'; // Cyan for standard Info
        }
    };

    const getTypeGlow = (type) => {
        const color = getTypeColor(type);
        return `0 0 15px ${color}40`; // 40 is hex opacity
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#00ff41', fontFamily: '"Orbitron", sans-serif' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,255,65,0.1)', borderTopColor: '#00ff41', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
                <p style={{ letterSpacing: '2px' }}>DECRYPTING BROADCASTS...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ff4c4c', fontFamily: '"Orbitron", sans-serif' }}>
                <FaExclamationTriangle style={{ fontSize: '3rem', marginBottom: '15px' }} />
                <h3>CONNECTION INTERCEPTED</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '0 2rem 4rem', minHeight: '100vh', margin: '0' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <FaBullhorn style={{ color: '#4da6ff', filter: 'drop-shadow(0 0 8px rgba(77, 166, 255, 0.6))', fontSize: '1.5rem' }} />
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff', fontFamily: '"Orbitron", sans-serif' }}>System Broadcasts</h1>
                </div>
                {eventName && <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>Live updates for <span style={{ color: '#4da6ff' }}>{eventName}</span></p>}
            </motion.div>

            {announcements.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(145deg, rgba(10,10,10,0.8) 0%, rgba(5,5,5,0.9) 100%)', border: '1px dashed #333', borderRadius: '8px' }}>
                    <FaBullhorn style={{ fontSize: '3rem', color: '#333', marginBottom: '15px' }} />
                    <h3 style={{ fontFamily: '"Orbitron", sans-serif', color: '#666', margin: '0 0 10px 0', letterSpacing: '1px' }}>NO SIGNALS DETECTED</h3>
                    <p style={{ color: '#555', fontSize: '0.9rem' }}>The system is currently quiet. Check back later for event updates, wave releases, or security alerts.</p>
                </motion.div>
            ) : (
                <AnimatePresence>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {announcements.map((ann, idx) => {
                            const color = getTypeColor(ann.type);
                            const isLatest = idx === 0;

                            return (
                                <motion.div
                                    key={ann.id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                        background: 'linear-gradient(145deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.95) 100%)',
                                        border: `1px solid ${color}40`,
                                        borderLeft: `4px solid ${color}`,
                                        borderRadius: '8px',
                                        padding: '20px',
                                        boxShadow: isLatest ? getTypeGlow(ann.type) : 'none',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        ':hover': { transform: 'translateY(-2px)' }
                                    }}
                                >
                                    {/* Background Accent Glow */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, right: 0,
                                        width: '150px', height: '150px',
                                        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
                                        pointerEvents: 'none'
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
                                        <h3 style={{ margin: 0, color: color, fontFamily: '"Orbitron", sans-serif', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}>
                                                {getTypeIcon(ann.type)}
                                            </span>
                                            {ann.title}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#777', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <FaClock />
                                            <span>{formatTime(ann.created_at)}</span>
                                        </div>
                                    </div>

                                    <pre style={{
                                        margin: 0,
                                        color: '#ddd',
                                        fontFamily: '"Share Tech Mono", monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.6',
                                        fontSize: '0.95rem',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        {ann.content}
                                    </pre>

                                    <div style={{
                                        marginTop: '15px',
                                        paddingTop: '10px',
                                        borderTop: '1px dashed rgba(255,255,255,0.1)',
                                        fontSize: '0.75rem',
                                        color: '#555',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        display: 'flex',
                                        justifyContent: 'flex-end'
                                    }}>
                                        Auth_Signature: <span style={{ color: color, opacity: 0.8, marginLeft: '6px' }}>{ann.author || 'System'}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}

export default EventAnnouncements;
