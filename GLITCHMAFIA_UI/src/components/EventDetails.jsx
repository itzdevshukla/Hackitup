import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaCalendarAlt, FaClock, FaUsers, FaTrophy, FaGamepad, FaArrowRight, FaArrowLeft
} from 'react-icons/fa';

const EventDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessCode, setAccessCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/dashboard/event/${id}/`);
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                } else {
                    setError("Failed to load event data.");
                }
            } catch (err) {
                console.error(err);
                setError("Connection error.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!accessCode.trim()) return;
        if (!agreed) {
            setError("Please agree to the terms.");
            return;
        }

        setJoining(true);
        setError('');

        try {
            const response = await fetch(`/api/dashboard/event/${id}/join/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
                },
                body: JSON.stringify({ accessCode })
            });
            const data = await response.json();

            if (data.success) {
                // Refresh data to update status
                const res = await fetch(`/api/dashboard/event/${id}/`);
                const updated = await res.json();
                setEvent(updated);
            } else {
                setError(data.message || "Invalid Access Code");
            }
        } catch (err) {
            setError('Connection Failed');
        } finally {
            setJoining(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black text-[#55ff00] font-mono">
            <div className="animate-pulse">LOADING_DATA...</div>
        </div>
    );

    if (!event) return (
        <div className="flex items-center justify-center h-screen bg-black text-red-500 font-mono">
            <div>EVENT NOT FOUND</div>
        </div>
    );

    return (
        <div className="event-details-container">
            {/* Background elements */}
            <div className="event-details-bg"></div>

            <div className="event-content">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="back-btn"
                >
                    <FaArrowLeft /> Back to Dashboard
                </button>

                <div className="event-hero">
                    <h1 className="event-hero-title">
                        {event.title}
                    </h1>
                    <p className="event-hero-subtitle">Cybersecurity Challenge</p>
                    <div className="event-hero-desc">
                        {event.description}
                    </div>
                    <div className="mt-6">
                        <span className={`event-status-indicator ${(event.status || '').toLowerCase()}`}>
                            • {(event.status || '').toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="details-grid">
                    {/* LEFT: Season Details */}
                    <div className="details-panel">
                        <h2 className="panel-heading">Season Details</h2>

                        <div className="season-grid">
                            <DetailItem
                                icon={<FaCalendarAlt />}
                                label="Start Date"
                                value={event.start_date}
                                subValue={`${event.start_time} GMT+5:30`}
                            />
                            <DetailItem
                                icon={<FaClock />}
                                label="End Date"
                                value={event.end_date || "TBA"}
                                subValue={event.end_date ? `${event.end_time || '00:00'} GMT+5:30` : ''}
                            />
                            <DetailItem
                                icon={<FaGamepad />}
                                label="Challenges"
                                value={`${event.challenges_count} Available`}
                            />
                            <DetailItem
                                icon={<FaUsers />}
                                label="Participants"
                                value={`${event.participants_count} Registered`}
                            />
                        </div>

                        <div className="timezone-info">
                            Your timezone: Asia/Calcutta<br />
                            All times are shown in your local timezone for convenience.
                        </div>
                    </div>

                    {/* RIGHT: Join Competition */}
                    <div className="details-panel">
                        <div className="join-panel-content">
                            <div className="trophy-glow">
                                <FaTrophy />
                            </div>
                            <h2 className="panel-heading" style={{ marginBottom: '0.5rem' }}>Join the Competition</h2>
                            <p className="join-desc">Register now to participate in this CTF</p>

                            <div className="status-rows">
                                <div className="status-row">
                                    <span style={{ color: '#888' }}>Registration</span>
                                    <span className={event.is_registration_open ? "status-open" : "status-closed"}>
                                        {event.is_registration_open ? "Open" : "Closed"}
                                    </span>
                                </div>
                                <div className="status-row">
                                    <span style={{ color: '#888' }}>Organizer</span>
                                    <span style={{ color: 'white' }}>{event.organizer}</span>
                                </div>
                                <div className="status-row">
                                    <span style={{ color: '#888' }}>Total Players</span>
                                    <span className="status-open">{event.participants_count}</span>
                                </div>
                            </div>

                            {event.is_registered ? (
                                <div className="access-form">
                                    <div className="registered-msg">
                                        ALREADY REGISTERED
                                    </div>
                                    <button
                                        onClick={() => navigate(`/event/${event.id}/challenges`)}
                                        className="action-btn"
                                    >
                                        Enter Arena
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleJoin} className="access-form">
                                    <label className="input-label">Access Code *</label>
                                    <input
                                        type="text"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        placeholder="Hack!t............."
                                        className="access-input"
                                    />

                                    <div className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                        />
                                        <p className="checkbox-text">
                                            I agree to the <span>Terms of Service</span> and <span>Privacy Policy</span>.
                                            I understand that I will compete fairly and ethically in accordance with the CTF rules.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="error-msg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={joining || !event.is_registration_open}
                                        className="action-btn"
                                    >
                                        {joining ? 'Verifying...' : 'Register Now'} <FaArrowRight />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value, subValue }) => (
    <div className="season-item">
        <div className="season-icon">
            {icon}
        </div>
        <div className="season-info">
            <h4>{label}</h4>
            <p>{value}</p>
            {subValue && <div className="season-sub">{subValue}</div>}
        </div>
    </div>
);

export default EventDetails;
