import React, { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaFlag, FaChevronDown, FaChevronRight, FaTrophy, FaBullhorn,
    FaPencilAlt, FaArrowLeft, FaBars, FaSignOutAlt, FaShieldAlt,
    FaBug, FaLock, FaCode, FaDatabase
} from 'react-icons/fa';
import './UserSidebar.css';

const categoryIcons = {
    web: <FaBug />,
    crypto: <FaLock />,
    pwn: <FaCode />,
    forensics: <FaDatabase />,
    default: <FaShieldAlt />
};

function getCategoryIcon(cat) {
    return categoryIcons[cat?.toLowerCase()] || categoryIcons.default;
}

function EventArenaSidebar({ isOpen, setIsOpen }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [categories, setCategories] = useState([]);
    const [eventName, setEventName] = useState('');
    const [challengesOpen, setChallengesOpen] = useState(true);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!id) return;
        fetchChallengeCategories();
        fetchUnreadAnnouncements();

        // Poll for new announcements every 30 seconds
        const pollInterval = setInterval(fetchUnreadAnnouncements, 30000);
        return () => clearInterval(pollInterval);
    }, [id]);

    const fetchUnreadAnnouncements = async () => {
        try {
            const res = await fetch(`/api/event/${id}/announcements/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.announcements && data.announcements.length > 0) {
                    const latestId = data.announcements[0].id;
                    const lastSeenId = parseInt(localStorage.getItem(`lastSeenAnnouncement_${id}`) || '0');

                    // Count how many are newer than the last seen ID
                    const unread = data.announcements.filter(a => a.id > lastSeenId).length;
                    setUnreadCount(unread);
                }
            }
        } catch (err) {
            console.error('Failed to fetch unread announcements', err);
        }
    };

    const fetchChallengeCategories = async () => {
        try {
            const res = await fetch(`/api/event/${id}/challenges/`);
            if (res.ok) {
                const data = await res.json();
                setEventName(data.event || '');
                const unique = ['All', ...new Set((data.challenges || []).map(c => c.category))];
                setCategories(unique);
            }
        } catch (err) {
            console.error('Failed to fetch challenge categories', err);
        }
    };

    const navItemStyle = (isActive) => ({
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 20px', color: isActive ? '#9ACD32' : '#888',
        background: isActive ? 'rgba(154,205,50,0.1)' : 'transparent',
        borderLeft: `4px solid ${isActive ? '#9ACD32' : 'transparent'}`,
        cursor: 'pointer', fontSize: '0.95rem', fontWeight: isActive ? 600 : 500,
        transition: 'all 0.2s', textDecoration: 'none', userSelect: 'none',
        boxShadow: isActive ? 'inset 5px 0 15px -5px rgba(154,205,50,0.2)' : 'none'
    });

    const subItemStyle = (isActive) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px',
        padding: '9px 16px 9px 32px', color: isActive ? '#9ACD32' : '#777',
        background: isActive ? 'rgba(154,205,50,0.07)' : 'transparent',
        borderLeft: `4px solid ${isActive ? '#9ACD32' : 'transparent'}`,
        cursor: 'pointer', fontSize: '0.85rem', fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s', textDecoration: 'none', userSelect: 'none',
        overflow: 'hidden', textAlign: 'left', width: '100%', boxSizing: 'border-box'
    });

    const sectionTitleStyle = {
        padding: '10px 20px 4px', fontSize: '0.72rem', color: '#555',
        letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif'
    };

    const isCategoryActive = (cat) => {
        const url = new URL(window.location.href);
        return url.searchParams.get('category') === cat || (cat === 'All' && !url.searchParams.get('category'));
    };

    const navigateToCategory = (cat) => {
        setActiveCategory(cat);
        if (cat === 'All') {
            navigate(`/event/${id}/challenges`);
        } else {
            navigate(`/event/${id}/challenges?category=${cat}`);
        }
    };

    return (
        <>
            <aside className={`user-sidebar ${isOpen ? 'mobile-open' : ''}`} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Event Name Header */}
                <div style={{ padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif', marginBottom: '4px' }}>ARENA</div>
                    <div style={{ color: '#9ACD32', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eventName || 'Loading...'}</div>
                </div>

                {/* Main nav list — grows to fill space */}
                <ul className="sidebar-menu" style={{ gap: 0, flex: 1 }}>

                    {/* ───── CHALLENGES SECTION ───── */}
                    <li>
                        <div
                            style={navItemStyle(false)}
                            onClick={() => setChallengesOpen(o => !o)}
                        >
                            <span style={{ fontSize: '1.1rem' }}><FaFlag /></span>
                            <span style={{ flex: 1 }}>Challenges</span>
                            <span style={{ fontSize: '0.8rem', transition: 'transform 0.2s', transform: challengesOpen ? 'rotate(180deg)' : 'none' }}>
                                <FaChevronDown />
                            </span>
                        </div>

                        {challengesOpen && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {categories.map(cat => (
                                    <div
                                        key={cat}
                                        style={subItemStyle(activeCategory === cat)}
                                        onClick={() => navigateToCategory(cat)}
                                    >
                                        <span style={{ fontSize: '0.82rem', opacity: 0.6, flexShrink: 0 }}>{getCategoryIcon(cat)}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </li>

                    {/* ───── LEADERBOARD SECTION ───── */}
                    <li style={{ marginTop: '4px' }}>
                        <div
                            style={navItemStyle(false)}
                            onClick={() => setLeaderboardOpen(o => !o)}
                        >
                            <span style={{ fontSize: '1.1rem' }}><FaTrophy /></span>
                            <span style={{ flex: 1 }}>Leaderboard</span>
                            <span style={{ fontSize: '0.8rem', transition: 'transform 0.2s', transform: leaderboardOpen ? 'rotate(180deg)' : 'none' }}>
                                <FaChevronDown />
                            </span>
                        </div>

                        {leaderboardOpen && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <a
                                    href={`/classic-leaderboard/${id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={subItemStyle(false)}
                                >
                                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}><FaTrophy /></span>
                                    <span>Classic</span>
                                    <span style={{ fontSize: '0.6rem', color: '#9ACD32', marginLeft: 'auto', opacity: 0.7 }}>↗</span>
                                </a>

                            </div>
                        )}
                    </li>

                    {/* ───── ANNOUNCEMENTS ───── */}
                    <li style={{ marginTop: '4px' }}>
                        <NavLink
                            to={`/event/${id}/announcements`}
                            style={({ isActive }) => navItemStyle(isActive)}
                        >
                            <span style={{ fontSize: '1.1rem', position: 'relative' }}>
                                <FaBullhorn />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '-4px', right: '-6px',
                                        background: '#ff4c4c', color: 'white', borderRadius: '50%',
                                        width: '14px', height: '14px', fontSize: '0.6rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', boxShadow: '0 0 5px rgba(255, 76, 76, 0.8)'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                            <span>Announcements</span>
                        </NavLink>
                    </li>

                    {/* ───── WRITEUPS ───── */}
                    <li>
                        <NavLink
                            to={`/event/${id}/writeups`}
                            style={({ isActive }) => navItemStyle(isActive)}
                        >
                            <span style={{ fontSize: '1.1rem' }}><FaPencilAlt /></span>
                            <span>My WriteUps</span>
                        </NavLink>
                    </li>
                </ul>

                {/* ───── EXIT ARENA — pinned to bottom ───── */}
                <div
                    style={{
                        flexShrink: 0, borderTop: '1px solid rgba(180,30,30,0.2)',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '13px 20px', color: '#cc4444', cursor: 'pointer',
                        fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
                        userSelect: 'none', background: 'rgba(180,30,30,0.08)'
                    }}
                    onClick={() => navigate('/dashboard')}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff6666'; e.currentTarget.style.background = 'rgba(180,30,30,0.16)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#cc4444'; e.currentTarget.style.background = 'rgba(180,30,30,0.08)'; }}
                >
                    <span style={{ fontSize: '0.9rem' }}><FaArrowLeft /></span>
                    <span>Exit Arena</span>
                </div>
            </aside>
            <button className="mobile-menu-btn" onClick={() => setIsOpen(o => !o)}><FaBars /></button>
        </>
    );
}

export default EventArenaSidebar;
