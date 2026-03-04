import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaSearch, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';

const RegisteredEvents = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/registered-events/')
            .then(res => res.json())
            .then(data => {
                if (data.events) setRegisteredEvents(data.events);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching registered events:", err);
                setLoading(false);
            });
    }, []);

    const filteredEvents = useMemo(() => {
        return registeredEvents.filter(event => {
            const status = event.status ? event.status.toLowerCase() : '';
            const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());

            if (filter === "All") return matchesSearch;
            if (filter === "Live") return matchesSearch && status === "live";
            if (filter === "Upcoming") return matchesSearch && status === "upcoming";
            if (filter === "Past") return matchesSearch && status === "completed";

            return matchesSearch;
        });
    }, [searchTerm, filter, registeredEvents]);

    const counts = {
        All: registeredEvents.length,
        Live: registeredEvents.filter(e => (e.status || '').toLowerCase() === "live").length,
        Upcoming: registeredEvents.filter(e => (e.status || '').toLowerCase() === "upcoming").length,
        Past: registeredEvents.filter(e => (e.status || '').toLowerCase() === "completed").length
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="explore-events-container"
            style={{
                padding: '0.5rem 2rem 2rem',
                color: '#fff',
                width: '100%'
            }}
        >
            {/* Header Section (Inline with Layout) */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: 'linear-gradient(90deg, rgba(154,205,50,0.1), transparent)',
                padding: '1.5rem',
                borderRadius: '8px',
                borderLeft: '4px solid #9ACD32',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ flex: '1 1 auto' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        margin: 0,
                        color: '#fff',
                        textShadow: '0 0 10px rgba(255,255,255,0.2)',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        Registered <span style={{ color: '#9ACD32' }}>Events</span>
                    </h1>
                </div>

                {/* Controls right aligned inside header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Filter Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                appearance: 'none',
                                background: 'rgba(20, 20, 20, 0.8)',
                                border: '1px solid rgba(154, 205, 50, 0.5)',
                                color: '#9ACD32',
                                padding: '0.6rem 2.5rem 0.6rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                fontWeight: 'bold',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}
                            onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(154, 205, 50, 0.3)'}
                            onBlur={(e) => e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'}
                        >
                            <option value="All">All ({counts["All"]})</option>
                            <option value="Live">Live ({counts["Live"]})</option>
                            <option value="Upcoming">Upcoming ({counts["Upcoming"]})</option>
                            <option value="Past">Past ({counts["Past"]})</option>
                        </select>
                        {/* Custom Dropdown Arrow */}
                        <div style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: '#9ACD32'
                        }}>
                            ▼
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '250px' }}>
                        <FaSearch style={{ position: 'absolute', top: '50%', left: '15px', transform: 'translateY(-50%)', color: '#9ACD32', fontSize: '0.9rem' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 40px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(154, 205, 50, 0.3)',
                                borderRadius: '50px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#9ACD32'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(154, 205, 50, 0.3)'}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#9ACD32', fontSize: '1.2rem' }}>
                    Loading your registered missions...
                </div>
            ) : (
                /* Events Grid */
                <motion.div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                    gap: '2rem',
                    width: '100%'
                }} layout>
                    <AnimatePresence mode='popLayout'>
                        {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                            <motion.div
                                layout
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                whileHover={{ y: -5 }}
                                style={{
                                    background: 'rgba(20, 20, 20, 0.6)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(154, 205, 50, 0.15)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(154, 205, 50, 0.5)';
                                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(154, 205, 50, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(154, 205, 50, 0.15)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                                }}
                            >
                                {/* Card Header (Status + Creator) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 1.5rem 0', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        background: (event.status || '').toLowerCase() === 'live' ? 'rgba(154, 205, 50, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: (event.status || '').toLowerCase() === 'live' ? '#9ACD32' : '#aaa',
                                        border: `1px solid ${(event.status || '').toLowerCase() === 'live' ? '#9ACD32' : 'rgba(255,255,255,0.1)'}`
                                    }}>
                                        {(event.status || 'UPCOMING')}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '0.85rem' }}>
                                        <FaShieldAlt style={{ color: '#9ACD32' }} />
                                        <span>{event.creator || 'Admin'}</span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '1.5rem', flexGrow: 1 }}>
                                    <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px', lineHeight: 1.3 }}>
                                        {event.title}
                                    </h3>
                                    <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                        {event.description}
                                    </p>
                                </div>

                                {/* Card Footer (Action button + Dates) */}
                                <div style={{
                                    padding: '1.5rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', color: '#888' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaCalendarAlt style={{ color: '#9ACD32' }} /> {event.start_date}</span>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/event/${event.id}`)}
                                        style={{
                                            background: 'transparent',
                                            color: '#9ACD32',
                                            border: '1px solid #9ACD32',
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#9ACD32';
                                            e.currentTarget.style.color = '#000';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#9ACD32';
                                        }}
                                    >
                                        {(event.status || '').toLowerCase() === 'completed' ? 'View Results' : 'Enter Arena'} <FaChevronRight size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: '#666' }}>
                                <h2>{searchTerm || filter !== "All" ? "No events found matching your criteria." : "You haven't registered for any events yet!"}</h2>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
};

export default RegisteredEvents;
