import React, { useState } from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import EventArenaSidebar from './EventArenaSidebar';
import { useAuth } from '../context/AuthContext';

function EventArenaLayout({ children }) {
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (loading) return <div className="loading-screen">Loading Arena...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="user-dashboard-layout">
            <EventArenaSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="user-dashboard-content" onClick={() => setIsSidebarOpen(false)}>
                {children || <Outlet />}
            </main>
        </div>
    );
}

export default EventArenaLayout;
