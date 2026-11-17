import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Sparkles, RefreshCw, UserCheck, Shield, Building2, UtensilsCrossed } from 'lucide-react';

export default function DemoBanner() {
  const { user, demoLogin } = useAuth();
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);

  const handleDemoSwitch = async (roleType, label) => {
    try {
      await demoLogin(roleType);
      showToast(`Switched demo role to: ${label}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to switch demo account', 'error');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all demo listings, pickups, and reports back to original initial sample state?')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoData();
      showToast('Demo data reset to clean initial state!', 'success');
      window.location.reload();
    } catch (err) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="demo-banner">
      <div className="demo-banner-title">
        <Sparkles size={16} color="#10B981" />
        <span><strong>IDE Prototype Demo Mode:</strong> 1-Click Role Switcher</span>
        {user && (
          <span style={{ opacity: 0.85, fontSize: '0.75rem', marginLeft: '0.25rem' }}>
            (Active: <strong>{user.full_name}</strong> - <em>{user.role}</em>)
          </span>
        )}
      </div>

      <div className="demo-switch-btns">
        <button
          onClick={() => handleDemoSwitch('organizer', 'Organizer (Grand Palace)')}
          className={`demo-btn ${user?.email === 'organizer@foodbridge.org' ? 'active' : ''}`}
          title="Log in as Wedding Event Organizer (Donor)"
        >
          <UtensilsCrossed size={12} style={{ display: 'inline', marginRight: 4 }} />
          Organizer (Anita)
        </button>

        <button
          onClick={() => handleDemoSwitch('catering', 'Caterer Donor (Apex)')}
          className={`demo-btn ${user?.email === 'catering@foodbridge.org' ? 'active' : ''}`}
          title="Log in as Corporate Catering Donor"
        >
          Caterer (Marcus)
        </button>

        <button
          onClick={() => handleDemoSwitch('ngo_hope', 'Verified NGO (Hope Food Bank)')}
          className={`demo-btn ${user?.email === 'ngo.hope@foodbridge.org' ? 'active' : ''}`}
          title="Log in as Verified Receiving Food Bank"
        >
          <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
          Verified NGO (Hope)
        </button>

        <button
          onClick={() => handleDemoSwitch('ngo_shelter', 'Verified NGO (Harbor Shelter)')}
          className={`demo-btn ${user?.email === 'ngo.shelter@foodbridge.org' ? 'active' : ''}`}
          title="Log in as Verified Emergency Shelter"
        >
          Verified NGO (Harbor)
        </button>

        <button
          onClick={() => handleDemoSwitch('ngo_new', 'Pending NGO (New Dawn)')}
          className={`demo-btn ${user?.email === 'ngo.new@foodbridge.org' ? 'active' : ''}`}
          title="Log in as Unverified NGO awaiting verification"
        >
          Pending NGO
        </button>

        <button
          onClick={() => handleDemoSwitch('admin', 'Admin')}
          className={`demo-btn ${user?.role === 'ADMIN' ? 'active' : ''}`}
          title="Log in as Administrator"
        >
          <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
          Admin
        </button>

        <button
          onClick={handleResetData}
          disabled={resetting}
          className="demo-btn"
          style={{ background: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          title="Reset database to initial demo state"
        >
          <RefreshCw size={12} className={resetting ? 'animate-spin' : ''} style={{ display: 'inline', marginRight: 4 }} />
          Reset Demo Data
        </button>
      </div>
    </div>
  );
}
