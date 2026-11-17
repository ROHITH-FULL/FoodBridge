import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Utensils, HeartHandshake, LogOut, PlusCircle, LayoutDashboard, Shield, AlertTriangle } from 'lucide-react';

export default function Navbar() {
  const { user, organization, logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand">
          <div className="brand-icon-wrap">
            <Utensils size={20} />
          </div>
          <div>
            <span>Food</span><span style={{ color: 'var(--emerald)' }}>Bridge</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            Home
          </NavLink>
          <NavLink to="/available-food" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Available Food
          </NavLink>
          <NavLink to="/food-safety" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Food Safety
          </NavLink>
          <NavLink to="/impact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Impact Dashboard
          </NavLink>

          {/* Role-Specific Dashboard Links */}
          {user?.role === 'ORGANIZER' && (
            <NavLink to="/organizer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Organizer Dashboard
            </NavLink>
          )}

          {user?.role === 'NGO' && (
            <NavLink to="/ngo" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              NGO Dashboard
            </NavLink>
          )}

          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Action Controls */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {user.role === 'ORGANIZER' && (
                <Link to="/add-food" className="btn btn-emerald btn-sm">
                  <PlusCircle size={15} />
                  <span>List Food</span>
                </Link>
              )}

              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user.role === 'NGO' && organization ? organization.organization_name : user.role}
                </div>
              </div>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
