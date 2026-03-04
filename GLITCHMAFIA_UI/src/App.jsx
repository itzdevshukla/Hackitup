import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import HostEvent from './components/HostEvent';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import EventLeaderboard from './components/EventLeaderboard';
import ClassicLeaderboard from './components/ClassicLeaderboard';


import EventDetails from './components/EventDetails';
import Challenges from './components/Challenges';
import AdminDashboard from './components/AdminDashboard';
import EventAnnouncements from './components/EventAnnouncements';
import EventWriteUps from './components/EventWriteUps';

import UserDashboardLayout from './components/UserDashboardLayout';
import EventArenaLayout from './components/EventArenaLayout';
import UserOverview from './components/UserOverview';
import RegisteredEvents from './components/RegisteredEvents';
import NotFound from './components/NotFound';

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Dashboard layout wraps these routes */}
          <Route path="/dashboard" element={<UserDashboardLayout />}>
            <Route index element={<UserOverview />} />
            <Route path="explore" element={<Dashboard />} />
            <Route path="registered" element={<RegisteredEvents />} />
            <Route path="host-event" element={<HostEvent />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/profile" element={
            <UserDashboardLayout>
              <Profile />
            </UserDashboardLayout>
          } />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Event Details page (before joining) */}
          <Route path="/event/:id" element={
            <UserDashboardLayout>
              <EventDetails />
            </UserDashboardLayout>
          } />

          {/* Event Arena – dedicated sidebar layout */}
          <Route path="/event/:id/*" element={<EventArenaLayout />}>
            <Route path="challenges" element={<Challenges />} />
            <Route path="leaderboard" element={<EventLeaderboard />} />

            <Route path="announcements" element={<EventAnnouncements />} />
            <Route path="writeups" element={<EventWriteUps />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin Dashboard Catch-All Route */}
          <Route path="/administration/*" element={<AdminDashboard />} />

          {/* Standalone Classic Leaderboard – no layout, opens in new tab */}
          <Route path="/classic-leaderboard/:id" element={<ClassicLeaderboard />} />

          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
