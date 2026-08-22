import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <Utensils size={24} />
          <span>MessPortal</span>
        </NavLink>

        <div className="navbar-links">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end className="nav-link">
                Dashboard
              </NavLink>
              <NavLink to="/admin/menu" className="nav-link">
                Manage Menu
              </NavLink>
              <NavLink to="/admin/feedback" className="nav-link">
                View Feedback
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/student" end className="nav-link">
                Dashboard
              </NavLink>
              <NavLink to="/student/menu" className="nav-link">
                Weekly Menu
              </NavLink>
              <NavLink to="/student/give-feedback" className="nav-link">
                Give Feedback
              </NavLink>
              <NavLink to="/student/my-feedback" className="nav-link">
                My Feedback
              </NavLink>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={16} />
              {profile.name} ({profile.role})
            </span>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
