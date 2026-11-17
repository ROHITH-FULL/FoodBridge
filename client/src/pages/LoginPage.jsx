import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, LogIn, Sparkles, Utensils, Shield, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await login({ email, password });
      showToast(`Welcome back, ${data.user.full_name}!`, 'success');
      if (data.user.role === 'ORGANIZER') navigate('/organizer');
      else if (data.user.role === 'NGO') navigate('/ngo');
      else if (data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleType, redirectPath) => {
    setLoading(true);
    try {
      await demoLogin(roleType);
      showToast('Logged in with demo credentials!', 'success');
      navigate(redirectPath);
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: 520 }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="brand-icon-wrap" style={{ margin: '0 auto 1rem', width: '3rem', height: '3rem' }}>
            <Utensils size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.4rem', color: 'var(--primary)' }}>
            Welcome to FoodBridge
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sign in to manage surplus listings or coordinate relief pickups.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. organizer@foodbridge.org"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register as Organizer or NGO
          </Link>
        </div>

        {/* 1-Click Demo Evaluation Box */}
        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)', fontSize: '0.825rem', fontWeight: 700 }}>
            <Sparkles size={14} color="var(--emerald)" />
            <span>Prototype 1-Click Demo Logins</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('organizer', '/organizer')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', flexDirection: 'column', padding: '0.5rem 0.25rem' }}
            >
              <Utensils size={14} color="var(--primary)" />
              <span>Organizer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('ngo_hope', '/ngo')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', flexDirection: 'column', padding: '0.5rem 0.25rem' }}
            >
              <Building2 size={14} color="#059669" />
              <span>Verified NGO</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin', '/admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', flexDirection: 'column', padding: '0.5rem 0.25rem' }}
            >
              <Shield size={14} color="#2563EB" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
