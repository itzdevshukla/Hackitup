import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();

    // 🗓️ Event Status State
    const [eventStatus, setEventStatus] = useState(null);
    const [currentEventId, setCurrentEventId] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 🕵️ Detect Event Mode & Fetch Status
    useEffect(() => {
        const match = location.pathname.match(/^\/event\/(\d+)/);
        if (match) {
            const eventId = match[1];

            // Only fetch if we switched events or haven't fetched yet
            if (eventId !== currentEventId) {
                fetch(`/dashboard/api/event/${eventId}/`)
                    .then(res => res.json())
                    .then(data => {
                        setEventStatus(data.status);
                        setCurrentEventId(eventId);
                    })
                    .catch(err => console.error("Failed to fetch event status", err));
            }
        } else {
            // Reset if leaving event pages
            setEventStatus(null);
            setCurrentEventId(null);
        }
    }, [location.pathname, currentEventId]);

    // 🧑‍💻 User Dropdown State
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // 🧭 Determine Navigation Mode
    const match = location.pathname.match(/^\/event\/(\d+)/);
    const eventIdFromUrl = match ? match[1] : null;
    const isEventPage = !!eventIdFromUrl;

    // Arena pages are any /event/:id/* sub-routes (challenges, leaderboard, etc.)
    const isArenaPage = isEventPage && location.pathname !== `/event/${eventIdFromUrl}`;

    const isDashboardPage =
        location.pathname.startsWith('/dashboard') ||
        location.pathname === '/profile';

    const isAdminPage = location.pathname.startsWith('/administration');
    const isStandalonePage = location.pathname.startsWith('/classic-leaderboard');

    // Hide entirely on standalone pages
    if (isStandalonePage) return null;

    // 🔗 Define Link Sets
    let currentLinks = [];

    if (isAdminPage) {
        currentLinks = []; // Hide standard links on admin dashboard
    } else if (isArenaPage) {
        currentLinks = []; // Sidebar handles navigation inside the arena
    } else if (isEventPage) {
        // Only on the /event/:id detail page itself
        currentLinks = [
            { name: 'Exit Event', href: '/dashboard', isPage: true },
        ];
    } else if (isDashboardPage) {
        currentLinks = [];
    } else {
        // Landing Page
        currentLinks = [
            { name: 'Home', href: '/', isPage: true },
            { name: 'About', href: '/about', isPage: true },
            { name: 'Challenges', href: '/#challenges', isPage: false },
            // Login/Register are in CTA, Dashboard is in CTA
        ];
    }

    const handleNavClick = (e, link) => {
        if (link.isPage) {
            setMobileOpen(false);
        } else {
            e.preventDefault();
            const element = document.querySelector(link.href);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setMobileOpen(false);
            }
        }
    };

    return (
        <motion.nav
            className={`navbar ${scrolled ? 'scrolled' : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                background: scrolled ? 'rgba(0, 0, 0, 0.98)' : 'rgba(0, 0, 0, 0.95)',
                boxShadow: scrolled ? '0 4px 20px rgba(57, 255, 20, 0.1)' : 'none'
            }}
        >
            <div className="nav-container">
                <div className="logo">
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <span className="neon-text">Hack!t</span>UP
                    </Link>
                </div>

                {/* Desktop Nav */}
                <ul className="nav-links">
                    {currentLinks.map((link) => (
                        <li key={link.name}>
                            {link.isPage ? (
                                <Link
                                    to={link.href}
                                    className="nav-item"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ) : (
                                <a
                                    href={link.href}
                                    className="nav-item"
                                    onClick={(e) => handleNavClick(e, link)}
                                >
                                    {link.name}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="nav-cta" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {user ? (
                        <div
                            className="user-dropdown-container"
                            onMouseEnter={() => setDropdownOpen(true)}
                            onMouseLeave={() => setDropdownOpen(false)}
                            style={{ position: 'relative' }}
                        >
                            <button
                                className="nav-item"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Hi, {user.username || 'Hacker'} <span style={{ fontSize: '0.8rem' }}>▼</span>
                            </button>

                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '10px',
                                    background: '#080808',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    minWidth: '160px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    zIndex: 1000
                                }}>
                                    <Link to="/profile" style={{ padding: '12px 20px', color: '#ccc', textDecoration: 'none', borderBottom: '1px solid #222', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#111'} onMouseLeave={e => e.target.style.background = 'transparent'}>My Profile</Link>
                                    {!isAdminPage && user.is_staff && (
                                        <Link to="/administration" style={{ padding: '12px 20px', color: '#ccc', textDecoration: 'none', borderBottom: '1px solid #222', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#111'} onMouseLeave={e => e.target.style.background = 'transparent'}>Admin Panel</Link>
                                    )}
                                    <button onClick={logoutUser} style={{ padding: '12px 20px', color: '#ff3b30', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#111'} onMouseLeave={e => e.target.style.background = 'transparent'}>Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="nav-item">Login</Link>
                            <Link to="/register" className="btn-register">Register</Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <div className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <FaTimes /> : <FaBars />}
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <motion.div
                    className="mobile-menu"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    {currentLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.href}
                            className="mobile-nav-item"
                            onClick={() => setMobileOpen(false)}
                            style={{ display: 'block', padding: '1rem 2rem', color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            {link.name}
                        </Link>
                    ))}

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 2rem 0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {user ? (
                            <>
                                <Link to="/profile" onClick={() => setMobileOpen(false)} style={{ color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>My Profile</Link>
                                {!isAdminPage && user.is_staff && (
                                    <Link to="/administration" onClick={() => setMobileOpen(false)} style={{ color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>Admin Panel</Link>
                                )}
                                <button onClick={() => { logoutUser(); setMobileOpen(false); }} style={{ background: 'transparent', border: '1px solid #ff3b30', color: '#ff3b30', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', padding: '0.5rem', borderRadius: '4px', width: '100%', marginTop: '0.5rem' }}>
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)} style={{ color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
                                <Link to="/register" onClick={() => setMobileOpen(false)} style={{ color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>Register</Link>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
};

export default Navbar;
