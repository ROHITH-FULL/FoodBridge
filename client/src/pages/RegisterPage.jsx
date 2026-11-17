import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, Utensils, HeartHandshake, Building2, MapPin, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState('ORGANIZER'); // 'ORGANIZER' or 'NGO'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // NGO Specific fields
  const [orgName, setOrgName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metro City');
  const [postalCode, setPostalCode] = useState('10001');
  const [capacityKg, setCapacityKg] = useState('75');
  const [regDetails, setRegDetails] = useState('');
  const [availability, setAvailability] = useState('Everyday 08:00 - 21:00');

  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    const payload = {
      full_name: fullName,
      email,
      mobile,
      password,
      role,
    };

    if (role === 'NGO') {
      payload.organization = {
        organization_name: orgName,
        address,
        city,
        postal_code: postalCode,
        collection_capacity_kg: Number(capacityKg) || 50,
        registration_details: regDetails,
        availability_information: availability,
      };
    }

    setLoading(true);
    try {
      const data = await register(payload);
      showToast('Registration successful! Welcome to FoodBridge.', 'success');
      if (role === 'ORGANIZER') navigate('/organizer');
      else navigate('/ngo');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: 640 }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.85rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
            Join the FoodBridge Network
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Choose your role to get started recovering surplus or feeding communities.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => setRole('ORGANIZER')}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${role === 'ORGANIZER' ? 'var(--primary)' : 'var(--border)'}`,
              background: role === 'ORGANIZER' ? 'var(--primary-light)' : '#FFFFFF',
              color: role === 'ORGANIZER' ? 'var(--primary)' : 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
            }}
          >
            <Utensils size={22} color={role === 'ORGANIZER' ? 'var(--primary)' : '#64748B'} />
            <span>Event Host / Food Donor</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
              Weddings, caterers, corporations
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole('NGO')}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${role === 'NGO' ? 'var(--emerald)' : 'var(--border)'}`,
              background: role === 'NGO' ? 'var(--emerald-subtle)' : '#FFFFFF',
              color: role === 'NGO' ? '#065F46' : 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
            }}
          >
            <HeartHandshake size={22} color={role === 'NGO' ? 'var(--emerald)' : '#64748B'} />
            <span>NGO / Relief Organization</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
              Food banks, shelters, soup kitchens
            </span>
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. maya@organization.org"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contact Mobile *</label>
              <input
                type="tel"
                className="form-input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +1 555-0145"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operating City *</label>
              <input
                type="text"
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Metro City"
                required
              />
            </div>
          </div>

          {/* NGO Organization Specific Section */}
          {role === 'NGO' && (
            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#065F46', fontWeight: 700 }}>
                <Building2 size={18} />
                <span>Organization & Capacity Details</span>
              </div>

              <div className="form-group">
                <label className="form-label">Organization Legal Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. St. Jude Community Food Pantry"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Collection Capacity (kg) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(e.target.value)}
                    placeholder="e.g. 80"
                    min="1"
                    required
                  />
                  <span className="form-hint">Approximate vehicle or storage capacity per trip</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Postal / ZIP Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 10001"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Physical Operating Address *</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 142 Charity Avenue"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration / Non-profit License Details</label>
                <input
                  type="text"
                  className="form-input"
                  value={regDetails}
                  onChange={(e) => setRegDetails(e.target.value)}
                  placeholder="e.g. 501(c)(3) ID #849-204 / Food Relief License"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: '#B45309' }}>
                <ShieldCheck size={14} />
                <span>Note: Newly registered NGOs undergo administrative verification prior to live claims.</span>
              </div>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password (min 6 characters) *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            <UserPlus size={16} />
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
