import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBroadcastTower, FaUsers, FaTrophy, FaServer, FaClock, FaSignal, FaShieldAlt, FaSearch, FaFilter } from 'react-icons/fa';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");

    const [liveEvents, setLiveEvents] = useState([]);

    useEffect(() => {
        fetch('/api/dashboard/events/')
            .then(res => res.json())
            .then(data => {
                if (data.events) setLiveEvents(data.events);
            })
            .catch(err => console.error("Error fetching events:", err));
    }, []);

    const filteredEvents = useMemo(() => {
        return liveEvents.filter(event => {
            const status = event.status ? event.status.toLowerCase() : '';
            const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());

            if (filter === "All") return matchesSearch && status !== 'completed'; // Hide completed by default in All? Or show? User said "upcoming mein hi aa rhe hai". Let's show all.
            // Actually, usually "All" shows everything.
            if (filter === "All") return matchesSearch;

            if (filter === "Live") return matchesSearch && status === "live";
            if (filter === "Upcoming") return matchesSearch && status === "upcoming";
            if (filter === "Past") return matchesSearch && status === "completed";

            return matchesSearch;
        });
    }, [searchTerm, filter, liveEvents]); // Added liveEvents to dependency

    const counts = {
        All: liveEvents.length,
        Live: liveEvents.filter(e => (e.status || '').toLowerCase() === "live").length,
        Upcoming: liveEvents.filter(e => (e.status || '').toLowerCase() === "upcoming").length,
        Past: liveEvents.filter(e => (e.status || '').toLowerCase() === "completed").length
    };

    return (
        <div className="dashboard-container">
            {/* Reference Style Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="arena-header"
            >
                <h1 className="arena-title">CTF ARENA</h1>
                <div className="arena-underline"></div>
                <p className="arena-description">
                    Master the art of cybersecurity through immersive seasonal challenges.
                    Each CTF brings unique themes, cutting-edge security scenarios, and real-world
                    penetration testing experiences.
                </p>

            </motion.div>

            {/* Search Bar (Centered) */}
            <div className="arena-search-container">
                <input
                    type="text"
                    className="arena-search-input"
                    placeholder="Search Events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filter Pills */}
            <div className="arena-filters-container">
                {["All", "Live", "Upcoming", "Past"].map(f => (
                    <button
                        key={f}
                        className={`arena-filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f} <span className="filter-count">({counts[f]})</span>
                    </button>
                ))}
            </div>

            <motion.div className="events-grid" layout>
                <AnimatePresence mode='popLayout'>
                    {filteredEvents.map((event) => (
                        <motion.div
                            layout
                            key={event.id}
                            className="event-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ y: -8, boxShadow: '0 10px 30px -10px rgba(0,255,65,0.2)' }}
                        >
                            <div className="card-inner group">
                                <div className="card-glow" />

                                {/* Header: Status & Creator */}
                                <div className="card-header-row relative z-10">
                                    <div className={`status-pill ${(event.status || '').toLowerCase() === 'live'
                                        ? 'status-live'
                                        : 'status-upcoming'
                                        }`}>
                                        {(event.status || 'UPCOMING').toUpperCase()}
                                    </div>

                                    <div className="creator-badge">
                                        <FaShieldAlt className="text-neon-green" />
                                        <span>{event.creator || 'Admin'}</span>
                                    </div>
                                </div>

                                {/* Content: Title & Desc */}
                                <div className="card-body relative z-10">
                                    <h3 className="event-title">
                                        {event.title}
                                    </h3>
                                    <p className="event-desc">
                                        {event.description}
                                    </p>
                                </div>

                                {/* Action: Join Button */}
                                <div className="join-btn-container relative z-10">
                                    <button
                                        onClick={() => navigate(`/event/${event.id}`)}
                                        className="join-btn"
                                    >
                                        {(event.status || '').toLowerCase() === 'completed' ? 'View Results' :
                                            (event.status || '').toLowerCase() === 'upcoming' ? 'View Details' : 'Join Challenge'}
                                    </button>
                                </div>

                                {/* Footer: Dates */}
                                <div className="card-footer-row relative z-10">
                                    <span>Starts: {event.start_date}</span>
                                    <span>Ends: {event.end_date || 'TBA'}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Dashboard;
