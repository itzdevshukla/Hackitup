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

import EventDetails from './components/EventDetails';
import Challenges from './components/Challenges';
import AdminDashboard from './components/AdminDashboard'; // IMPORT ADMIN

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/host-event" element={<HostEvent />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/event/:id/challenges" element={<Challenges />} />
          <Route path="/event/:id/leaderboard" element={<Leaderboard />} />

          {/* Admin Dashboard Catch-All Route */}
          <Route path="/administration/*" element={<AdminDashboard />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
