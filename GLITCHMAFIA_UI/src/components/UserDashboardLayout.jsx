import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import { useAuth } from '../context/AuthContext';

function UserDashboardLayout({ children }) {
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="user-dashboard-layout">
            <UserSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="user-dashboard-content" onClick={() => setIsSidebarOpen(false)}>
                {children || <Outlet />}
            </main>
        </div>
    );
}

export default UserDashboardLayout;
