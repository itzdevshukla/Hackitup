import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaUsers, FaFlag, FaTrophy } from 'react-icons/fa';

function UserOverview() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        events_registered: 0,
        challenges_solved: 0,
        total_score: 0,
        upcoming_events: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/overview/')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching overview stats:", err);
                setLoading(false);
            });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="user-overview"
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: 'linear-gradient(90deg, rgba(154,205,50,0.1), transparent)',
                padding: '1.5rem',
                borderRadius: '8px',
                borderLeft: '4px solid #9ACD32'
            }}>
                <div>
                    <h1 className="arena-title" style={{
                        fontSize: '2.5rem',
                        textAlign: 'left',
                        margin: 0,
                        color: '#fff',
                        textShadow: '0 0 10px rgba(255,255,255,0.2)',
                        letterSpacing: '1px'
                    }}>
                        Welcome back, <span style={{ color: '#9ACD32' }}>{user?.username || 'Cadet'}</span>
                    </h1>
                    <p style={{ color: '#aaa', marginTop: '0.5rem', fontFamily: "'Share Tech Mono', monospace" }}>
                        Hack!tUp Central Command Ready.
                    </p>
                </div>
                <div style={{
                    padding: '0.5rem 1.5rem',
                    background: 'rgba(154, 205, 50, 0.1)',
                    border: '1px solid #9ACD32',
                    borderRadius: '50px',
                    color: '#9ACD32',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    boxShadow: '0 0 15px rgba(154,205,50,0.2)'
                }}>
                    RANK: RECRUIT
                </div>
            </div>

            <div className="overview-layout">
                {/* Stats Grid - Left Side */}
                <div className="overview-stats-grid">
                    {/* Card 1: Events Registered */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-title">Events Registered</span>
                            <div className="stat-card-icon">
                                <FaCalendarAlt />
                            </div>
                        </div>
                        <div className="stat-card-value">
                            {loading ? '...' : stats.events_registered}
                        </div>
                    </div>

                    {/* Card 2: Teams */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-title">Teams</span>
                            <div className="stat-card-icon">
                                <FaUsers />
                            </div>
                        </div>
                        <div className="stat-card-value">N/A</div>
                    </div>

                    {/* Card 3: Challenges Solved */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-title">Challenges Solved</span>
                            <div className="stat-card-icon">
                                <FaFlag />
                            </div>
                        </div>
                        <div className="stat-card-value">
                            {loading ? '...' : stats.challenges_solved}
                        </div>
                    </div>

                    {/* Card 4: Total Score (replaced Organizations) */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-title">Total Score</span>
                            <div className="stat-card-icon">
                                <FaTrophy />
                            </div>
                        </div>
                        <div className="stat-card-value" style={{ color: '#9ACD32' }}>
                            {loading ? '...' : stats.total_score}
                        </div>
                    </div>
                </div>

                {/* Upcoming Events - Right Side */}
                <div className="overview-sidebar">
                    <div className="upcoming-events-card">
                        <div className="upcoming-events-header">
                            <h3>Upcoming Events</h3>
                        </div>
                        <div className="upcoming-events-body" style={{ alignItems: stats.upcoming_events?.length ? 'flex-start' : 'center', padding: stats.upcoming_events?.length ? '1rem' : '2rem' }}>
                            {loading ? (
                                <p className="no-events-text">Loading...</p>
                            ) : stats.upcoming_events?.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
                                    {stats.upcoming_events.map(event => (
                                        <li key={event.id} style={{
                                            background: 'rgba(20, 20, 20, 0.8)',
                                            border: '1px solid rgba(154, 205, 50, 0.2)',
                                            borderRadius: '6px',
                                            padding: '1rem',
                                            marginBottom: '1rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.4rem',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#9ACD32'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(154, 205, 50, 0.2)'; }}
                                        >
                                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{event.title}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <FaCalendarAlt style={{ color: '#aaa', fontSize: '0.8rem' }} />
                                                <span style={{ color: '#9ACD32', fontSize: '0.85rem', fontFamily: "'Share Tech Mono', monospace" }}>
                                                    {event.date} • {event.time}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-events-text">No Upcoming events</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default UserOverview;
