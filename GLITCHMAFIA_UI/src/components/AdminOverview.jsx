import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaBullseye, FaServer, FaCalendarAlt, FaPlus, FaTrash, FaChartLine } from 'react-icons/fa';

function AdminOverview() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/dashboard/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Adapt to your project's auth if needed
                }
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data.stats);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-text">Loading Overview...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    return (
        <>
            <div className="admin-content-header">
                <h1>Dashboard Overview</h1>
                <p className="admin-content-subtitle">System Status: <span>Online</span></p>
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <Link to="/dashboard/host-event" className="action-btn">
                        <span className="action-icon"><FaPlus /></span>
                        <span>Create New Event</span>
                    </Link>
                    <Link to="/administration/users" className="action-btn">
                        <span className="action-icon"><FaUsers /></span>
                        <span>View All Users</span>
                    </Link>
                    <Link to="/administration/events" className="action-btn">
                        <span className="action-icon"><FaTrash /></span>
                        <span>Manage Events</span>
                    </Link>
                    <Link to="#" className="action-btn">
                        <span className="action-icon"><FaChartLine /></span>
                        <span>Analytics</span>
                    </Link>
                </div>
            </div>
        </>
    );
}

export default AdminOverview;
