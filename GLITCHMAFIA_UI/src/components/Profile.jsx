import { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';


const Profile = () => {
    const { logoutUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Mock Profile Data
        const mockProfile = {
            username: 'GhostAgent',
            email: 'agent@glitch.com',
            date_joined: new Date().toISOString(),
            total_points: 1250,
            solved_challenges_count: 15,
            recent_activity: [
                {
                    challenge: { title: 'Binary Exploitation 101', points: 100 },
                    submitted_at: new Date().toISOString(),
                    is_correct: true
                },
                {
                    challenge: { title: 'SQL Injection Basics', points: 50 },
                    submitted_at: new Date(Date.now() - 86400000).toISOString(),
                    is_correct: true
                },
                {
                    challenge: { title: 'Crypto Cipher', points: 200 },
                    submitted_at: new Date(Date.now() - 172800000).toISOString(),
                    is_correct: false
                }
            ]
        };

        setProfile(mockProfile);
        setLoading(false);
    }, []);

    return (
        <div className="profile-container">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="profile-content-wrapper"
                >
                    {/* --- HEADER --- */}
                    <div className="profile-header">
                        <div className="profile-avatar">
                            <img
                                src={`https://ui-avatars.com/api/?name=${profile?.username}&background=0D0D0D&color=39FF14&size=200`}
                                alt="Profile"
                            />
                            <div className="avatar-glitch-effect"></div>
                        </div>
                        <h2 className="profile-username glitch" data-text={profile?.username || 'GHOST'}>
                            {profile?.username || 'GHOST'}
                        </h2>
                        <div className="profile-badge">ELITE OPERATIVE</div>
                        <p className="profile-email">{profile?.email || 'N/A'}</p>
                    </div>

                    <div className="profile-grid">
                        {/* --- LEFT COLUMN: STATS --- */}
                        <div className="profile-left-col">
                            <motion.div
                                className="glass-panel stats-panel"
                                whileHover={{ scale: 1.02, borderColor: '#39FF14' }}
                            >
                                <h3 className="panel-title">Combat Stats</h3>
                                <div className="stat-row">
                                    <div className="stat-item">
                                        <span className="stat-value neon-text">{profile?.total_points || 0}</span>
                                        <span className="stat-label">Total Points</span>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="stat-item">
                                        <span className="stat-value neon-cyan">{profile?.solved_challenges_count || 0}</span>
                                        <span className="stat-label">Flags Captured</span>
                                    </div>
                                </div>
                                <div className="rank-display">
                                    <span className="rank-label">Current Rank</span>
                                    <span className="rank-value">CYBER_PHANTOM</span>
                                </div>
                            </motion.div>

                            {/* --- ACTIONS --- */}
                            <div className="profile-actions-wrapper">
                                <motion.button
                                    className="cyber-btn"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    EDIT PROFILE
                                </motion.button>
                                <motion.button
                                    className="cyber-btn danger-btn"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={logoutUser}
                                >
                                    DISCONNECT
                                </motion.button>
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: ACTIVITY --- */}
                        <div className="profile-right-col">
                            <div className="glass-panel activity-panel">
                                <h3 className="panel-title">Mission Log</h3>
                                <div className="activity-feed">
                                    {profile?.recent_activity?.length > 0 ? (
                                        profile.recent_activity.map((activity, index) => (
                                            <div key={index} className={`activity-card ${activity.is_correct ? 'success' : 'failure'}`}>
                                                <div className="activity-icon">
                                                    {activity.is_correct ? 'Completed' : 'Failed'}
                                                </div>
                                                <div className="activity-details">
                                                    <h4>{activity.challenge.title}</h4>
                                                    <span className="activity-time">
                                                        {new Date(activity.submitted_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="activity-points">
                                                    {activity.is_correct ? `+${activity.challenge.points} XP` : 'FAILED'}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-activity">No recent missions recorded.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
