import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaSync, FaExpand, FaCompress, FaFlag } from 'react-icons/fa';

/* ── helpers ──────────────────────────────────────────────────── */
function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    });
}
function initials(name = '') {
    return name.split(/[\s_-]/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

const RANK_COL = ['#9ACD32', '#4ade80', '#86efac'];
const RANK_LABEL = ['1st', '2nd', '3rd'];

/* ── Constellation Canvas ─────────────────────────────────────── */
function ConstellationBg() {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        const nodes = Array.from({ length: 60 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2.2 + 0.8,
        }));
        const tris = Array.from({ length: 18 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            size: Math.random() * 14 + 5,
            rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.009,
            vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
            alpha: Math.random() * 0.5 + 0.15,
            color: ['#9ACD32', '#4ade80', '#22c55e', '#16a34a'][Math.floor(Math.random() * 4)],
        }));
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            nodes.forEach(n => {
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > W) n.vx *= -1;
                if (n.y < 0 || n.y > H) n.vy *= -1;
                ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(154,205,50,0.6)'; ctx.fill();
            });
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 145) {
                        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(154,205,50,${0.2 * (1 - d / 145)})`; ctx.lineWidth = 0.8; ctx.stroke();
                    }
                }
            }
            tris.forEach(t => {
                t.x += t.vx; t.y += t.vy; t.rot += t.vr;
                if (t.x < -50) t.x = W + 50; if (t.x > W + 50) t.x = -50;
                if (t.y < -50) t.y = H + 50; if (t.y > H + 50) t.y = -50;
                ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot);
                ctx.beginPath(); ctx.moveTo(0, -t.size);
                ctx.lineTo(t.size * 0.866, t.size * 0.5); ctx.lineTo(-t.size * 0.866, t.size * 0.5); ctx.closePath();
                ctx.strokeStyle = t.color; ctx.globalAlpha = t.alpha; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
            });
            animRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 30% 25%, #061008 0%, #020402 55%, #000 100%)', pointerEvents: 'none' }} />;
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function EventLeaderboard() {
    const { id } = useParams();
    const [board, setBoard] = useState([]);
    const [eventName, setEventName] = useState('');
    const [eventTotalPoints, setEventTotalPoints] = useState(0);
    const [eventTotalChallenges, setEventTotalChallenges] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const containerRef = useRef(null);
    const timerRef = useRef(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/event/${id}/leaderboard/`);
            if (res.ok) {
                const json = await res.json();
                setBoard(json.leaderboard || []);
                setEventName(json.event || '');
                setEventTotalPoints(json.event_total_points || 0);
                setEventTotalChallenges(json.event_total_challenges || 0);
                setLastUpdated(new Date());
            }
        } catch { }
        finally { if (!silent) setLoading(false); }
    }, [id]);

    useEffect(() => {
        fetchData();
        timerRef.current = setInterval(() => fetchData(true), 15000);
        return () => clearInterval(timerRef.current);
    }, [fetchData]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setFullscreen(true);
        } else {
            document.exitFullscreen();
            setFullscreen(false);
        }
    };
    useEffect(() => {
        const onFsChange = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const me = board.find(u => u.is_me);

    return (
        <div ref={containerRef} style={{ position: 'relative', minHeight: '100vh', zIndex: 1, background: fullscreen ? '#000' : 'transparent' }}>
            <ConstellationBg />

            <div style={{ position: 'relative', zIndex: 2, padding: fullscreen ? '2.5rem 3rem 3rem' : '1.8rem 1.8rem 4rem', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '8rem', color: '#9ACD32', fontFamily: 'Orbitron, sans-serif', letterSpacing: '3px', fontSize: '0.9rem' }}>
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                            LOADING LEADERBOARD...
                        </motion.div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ width: '100%', maxWidth: fullscreen ? '1000px' : '860px' }}>

                        {/* ── HEADER ── */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', letterSpacing: '4px', color: '#9ACD32', fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.7 }}>CTF Ranking · Classic Mode</div>
                                <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '2px', textShadow: '0 0 30px rgba(154,205,50,0.4)' }}>
                                    {eventName.toUpperCase()}
                                </h1>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {/* Stats */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[{ label: 'Total Points', val: eventTotalPoints.toLocaleString() }, { label: 'Challenges', val: eventTotalChallenges }].map(s => (
                                        <div key={s.label} style={{ padding: '8px 14px', background: 'rgba(154,205,50,0.07)', border: '1px solid rgba(154,205,50,0.2)', borderRadius: '10px', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#9ACD32', fontFamily: 'Orbitron' }}>{s.val}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Refresh */}
                                <button onClick={() => fetchData()} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#555', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                    <FaSync style={{ fontSize: '0.72rem' }} />
                                    {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
                                </button>
                                {/* Fullscreen */}
                                <button onClick={toggleFullscreen}
                                    style={{ padding: '8px 12px', background: 'rgba(154,205,50,0.08)', border: '1px solid rgba(154,205,50,0.3)', borderRadius: '8px', color: '#9ACD32', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s' }}>
                                    {fullscreen ? <FaCompress /> : <FaExpand />}
                                    {fullscreen ? 'Exit' : 'Fullscreen'}
                                </button>
                            </div>
                        </div>

                        {/* ── Your position banner ── */}
                        {me && me.rank > 10 && (
                            <div style={{ background: 'rgba(154,205,50,0.06)', border: '1px solid rgba(154,205,50,0.2)', borderRadius: '10px', padding: '10px 18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '14px', backdropFilter: 'blur(10px)', flexWrap: 'wrap' }}>
                                <span style={{ color: '#9ACD32', fontWeight: 700, fontSize: '0.78rem' }}>📍 Your Position</span>
                                <span style={{ color: '#fff', fontWeight: 900, fontFamily: 'Orbitron', fontSize: '0.95rem' }}>#{me.rank}</span>
                                <span style={{ color: '#666', fontSize: '0.78rem' }}>{me.points} pts · {me.flags} flags</span>
                                <span style={{ marginLeft: 'auto', color: '#555', fontSize: '0.72rem' }}>{formatTime(me.last_solve_time)}</span>
                            </div>
                        )}

                        {/* ── CARD outer dark wrapper ── */}
                        <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: '22px', padding: '10px', backdropFilter: 'blur(4px)', boxShadow: '0 0 80px rgba(0,0,0,0.9)' }}>
                            {/* ── CARD ── */}
                            <div style={{ background: 'rgba(4,8,4,0.97)', border: '1px solid rgba(154,205,50,0.22)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(154,205,50,0.06), inset 0 1px 0 rgba(154,205,50,0.08)' }}>

                                {/* col headers */}
                                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 28px', borderBottom: '1px solid rgba(154,205,50,0.1)', background: 'rgba(154,205,50,0.05)' }}>
                                    {['#', 'Player', 'Last Submit', 'Flags', 'Score'].map((h, i) => (
                                        <div key={i} style={{ flex: i === 1 ? 3 : i === 2 ? 3 : 1, fontSize: '0.72rem', color: 'rgba(154,205,50,0.5)', textTransform: 'uppercase', letterSpacing: '2.5px', fontWeight: 700, textAlign: i === 0 ? 'center' : i >= 3 ? 'center' : 'left' }}>{h}</div>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {board.map((player, idx) => {
                                        const isTop3 = idx < 3;
                                        const isFirst = idx === 0;
                                        const col = isTop3 ? RANK_COL[idx] : null;

                                        return (
                                            <motion.div key={player.id}
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center',
                                                    padding: isFirst ? '22px 28px' : isTop3 ? '18px 28px' : '14px 28px',
                                                    borderBottom: '1px solid rgba(154,205,50,0.05)',
                                                    borderLeft: isTop3 ? `4px solid ${col}` : '4px solid transparent',
                                                    background: isFirst
                                                        ? 'linear-gradient(90deg, rgba(154,205,50,0.15) 0%, rgba(154,205,50,0.05) 50%, transparent 100%)'
                                                        : isTop3
                                                            ? `linear-gradient(90deg, ${col}10 0%, transparent 60%)`
                                                            : player.is_me ? 'rgba(154,205,50,0.04)' : 'transparent',
                                                    gap: '0',
                                                    transition: 'background 0.2s',
                                                }}>

                                                {/* Rank: icon + number always visible */}
                                                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                                    {isFirst && <FaTrophy style={{ color: '#9ACD32', fontSize: '1.1rem', filter: 'drop-shadow(0 0 10px #9ACD32)' }} />}
                                                    {idx === 1 && <FaMedal style={{ color: '#4ade80', fontSize: '1rem' }} />}
                                                    {idx === 2 && <FaMedal style={{ color: '#86efac', fontSize: '0.95rem', opacity: 0.9 }} />}
                                                    <span style={{ color: isFirst ? '#9ACD32' : idx === 1 ? '#4ade80' : idx === 2 ? '#86efac' : '#6aaa6a', fontWeight: 900, fontSize: isTop3 ? '1.1rem' : '1rem', fontFamily: 'Orbitron', lineHeight: 1 }}>
                                                        {idx + 1}
                                                    </span>
                                                </div>

                                                {/* Name only — no avatar icon */}
                                                <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: col || (player.is_me ? '#9ACD32' : '#e8ffe8'), fontWeight: isTop3 || player.is_me ? 800 : 500, fontSize: isFirst ? '1.15rem' : isTop3 ? '1rem' : '0.95rem', textShadow: col ? `0 0 16px ${col}77` : isFirst ? '0 0 12px rgba(154,205,50,0.3)' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: isFirst ? '0.5px' : '0' }}>
                                                        {player.username}
                                                        {player.is_me && <span style={{ fontSize: '0.6rem', color: '#9ACD32', background: 'rgba(154,205,50,0.1)', padding: '1px 6px', borderRadius: '10px', border: '1px solid rgba(154,205,50,0.25)', fontWeight: 600, flexShrink: 0 }}>you</span>}
                                                    </div>
                                                </div>

                                                {/* Last submit */}
                                                <div style={{ flex: 3, fontSize: '0.78rem', color: isFirst ? 'rgba(154,205,50,0.9)' : '#557755', paddingRight: '8px' }}>
                                                    {formatTime(player.last_solve_time)}
                                                </div>

                                                {/* Flags */}
                                                <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: col || '#7acc7a', fontSize: '1rem', fontWeight: 800 }}>
                                                    <FaFlag style={{ fontSize: '0.7rem', opacity: 0.7 }} />{player.flags}
                                                </div>

                                                {/* Score */}
                                                <div style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: isFirst ? '1.35rem' : isTop3 ? '1.1rem' : '1rem', fontFamily: 'Orbitron', color: col || (player.is_me ? '#9ACD32' : '#9acc9a'), letterSpacing: '1px', textShadow: col ? `0 0 20px ${col}99` : isFirst ? '0 0 16px rgba(154,205,50,0.5)' : 'none' }}>
                                                    {player.points}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {board.length === 0 && (
                                    <div style={{ padding: '5rem', textAlign: 'center', color: '#4a7a4a' }}>
                                        <FaTrophy style={{ fontSize: '2.5rem', opacity: 0.1, marginBottom: '1rem' }} />
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>No submissions yet. Be the first!</p>
                                    </div>
                                )}
                            </div>
                        </div> {/* end outer dark wrapper */}

                        {/* Live dot */}
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '0.68rem', color: '#4a7a4a' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ACD32', display: 'inline-block', animation: 'lb-pulse 2s infinite' }} />
                            Live · auto-refreshes every 15s
                        </div>
                    </motion.div>
                )}
            </div>

            <style>{`
                @keyframes lb-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(154,205,50,0.5); }
                    50%       { opacity: 0.4; transform: scale(0.8); box-shadow: 0 0 0 6px rgba(154,205,50,0); }
                }
                :fullscreen { background: #000; }
            `}</style>
        </div>
    );
}
