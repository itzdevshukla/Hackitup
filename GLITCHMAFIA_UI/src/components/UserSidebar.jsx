import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaCompass, FaCalendarCheck, FaUser, FaSignOutAlt, FaBars, FaPlusSquare } from 'react-icons/fa';
import './UserSidebar.css';

function UserSidebar({ isOpen, setIsOpen }) {
    const { logout } = useAuth();

    return (
        <>
            <aside className={`user-sidebar ${isOpen ? 'mobile-open' : ''}`}>
                <ul className="sidebar-menu">
                    <li>
                        <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="sidebar-icon"><FaHome /></span>
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/explore" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="sidebar-icon"><FaCompass /></span>
                            <span>Explore Events</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/registered" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="sidebar-icon"><FaCalendarCheck /></span>
                            <span>Registered Events</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/host-event" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="sidebar-icon"><FaPlusSquare /></span>
                            <span>Host Event</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="sidebar-icon"><FaUser /></span>
                            <span>My Profile</span>
                        </NavLink>
                    </li>

                    <li className="sidebar-logout">
                        <div onClick={logout} className="logout-button">
                            <span className="sidebar-icon"><FaSignOutAlt /></span>
                            <span>Logout</span>
                        </div>
                    </li>
                </ul>
            </aside>
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}><FaBars /></button>
        </>
    );
}

export default UserSidebar;
