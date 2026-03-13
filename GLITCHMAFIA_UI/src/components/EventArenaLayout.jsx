import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import EventArenaSidebar from './EventArenaSidebar';
import { useAuth } from '../context/AuthContext';

function EventArenaLayout({ children }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [eventLoading, setEventLoading] = useState(true);
    const [teamRequired, setTeamRequired] = useState(false);
    const [hasTeam, setHasTeam] = useState(false);

    useEffect(() => {
        if (!id) return;

        const checkEventStatus = async () => {
            try {
                // Fetch basic event details and determine team status
                const res = await fetch(`/api/event/${id}/challenges/`);
                if (res.ok) {
                    const data = await res.json();
                    setTeamRequired(data.is_team_mode || false);

                    if (data.is_team_mode) {
                        // If it's team mode, check if the user actually has a team
                        const teamRes = await fetch(`/api/teams/event/${id}/my-team/`);
                        if (teamRes.ok) {
                            const teamData = await teamRes.json();
                            setHasTeam(!!teamData.team);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to verify arena status", err);
            } finally {
                setEventLoading(false);
            }
        };

        checkEventStatus();
    }, [id]);

    useEffect(() => {
        // Enforce redirect if they are in a team event, have no team, and try to access challenges/leaderboard
        if (!eventLoading && teamRequired && !hasTeam) {
            const isTeamPage = location.pathname.endsWith(`/event/${id}/team`) || location.pathname.endsWith(`/event/${id}/team/`);
            if (!isTeamPage) {
                navigate(`/event/${id}/team`, { replace: true });
            }
        }
    }, [eventLoading, teamRequired, hasTeam, location.pathname, id, navigate]);

    if (authLoading || eventLoading) return <div className="loading-screen" style={{ color: '#9ACD32', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505' }}>INITIALIZING ARENA...</div>;
    if (!user) return <Navigate to="/login" replace />;

    // Hide sidebar if they are required to join a team but haven't yet
    const shouldShowSidebar = !(teamRequired && !hasTeam);

    return (
        <div className="user-dashboard-layout">
            {shouldShowSidebar && <EventArenaSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
            <main className="user-dashboard-content" onClick={() => setIsSidebarOpen(false)} style={{ margin: shouldShowSidebar ? undefined : '0', width: shouldShowSidebar ? undefined : '100vw' }}>
                {children || <Outlet />}
            </main>
        </div>
    );
}

export default EventArenaLayout;
