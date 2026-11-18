
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import {
  Truck,
  PackageCheck,
  Sparkles,
  MapPin,
  TrendingUp,
  Eye,
  AlertTriangle,
  HeartHandshake
} from 'lucide-react';

export default function NgoDashboard() {
  const { user, organization } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dashRes, matchRes] = await Promise.all([
        api.getNgoDashboard(),
        api.getNgoMatches().catch(() => ({ matches: [] })),
      ]);

      if (dashRes.success) {
        setDashboardData(dashRes);
      }
      if (matchRes.success) {
        setMatches(matchRes.matches || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load NGO dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading NGO dashboard...</p>
      </div>
    );
  }

  const org = dashboardData?.organization || organization;
  const stats = dashboardData?.stats || {};
  const activePickups = dashboardData?.active_pickups || [];
  const isVerified = org?.verification_status === 'VERIFIED';

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--primary)' }}>
              {org?.organization_name || 'NGO Relief Dashboard'}
            </h1>
            <StatusBadge status={org?.verification_status || 'PENDING'} />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Representative: <strong>{user?.full_name}</strong> &bull; Operating in <strong>{org?.city} ({org?.postal_code})</strong> &bull; Max capacity: <strong>{org?.collection_capacity_kg} kg</strong>
          </p>
        </div>

        <Link to="/available-food" className="btn btn-emerald btn-lg">
          <HeartHandshake size={20} />
          <span>Browse Available Surplus</span>
        </Link>
      </div>

      {!isVerified && (
        <div style={{ background: 'var(--amber-light)', border: '1px solid #FCD34D', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#92400E', marginBottom: '0.35rem' }}>
                Account Verification in Progress
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#78350F', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                To maintain strict food safety standards and accountability for surplus redistribution, our administrators review every relief agency. During review, you can browse listings and evaluate rule-based compatibility scores, but claiming food is temporarily held until approval.
              </p>
              <div style={{ fontSize: '0.8rem', color: '#92400E' }}>
                <em>Tip: In this demo prototype, you can log in as <strong>Admin</strong> using the top demo switcher and approve your organization in seconds.</em>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.active_pickups}</div>
            <div className="stat-label">Active Pickups</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
            <PackageCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.completed_handovers}</div>
            <div className="stat-label">Completed Handovers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total_kg_handed_over} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg</span></div>
            <div className="stat-label">Redistributed Food</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.nearby_available_count}</div>
            <div className="stat-label">Surplus In Your City</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Truck size={20} color="var(--primary)" />
          <span>Active Pickup Schedules & Confirmations</span>
        </h2>

        {activePickups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <PackageCheck size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem' }} />
            <p>You have no active pickups scheduled currently.</p>
            <Link to="/available-food" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
              Find Food to Recover
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Surplus Title & Donor</th>
                  <th>Quantity (kg)</th>
                  <th>Pickup Location</th>
                  <th>Status</th>
                  <th>Pickup Code</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activePickups.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{req.food_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Donor: {req.donor_name} (
                        {req.contact_phone ? (
                          <a
                            href={`tel:${req.contact_phone}`}
                            style={{ color: 'var(--primary)', fontWeight: 600 }}
                          >
                            {req.contact_phone}
                          </a>
                        ) : (
                          'Phone unavailable'
                        )}
                        )
                      </div>
                    </td>
                    <td>
                      <strong>{req.quantity_kg} kg</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{req.pickup_address}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {req.pickup_area ? `${req.pickup_area}, ` : ''}{req.pickup_city}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={req.request_status} />
                    </td>
                    <td>
                      {req.pickup_confirmation_code ? (
                        <strong style={{ color: 'var(--primary)', letterSpacing: '0.05em' }}>
                          {req.pickup_confirmation_code}
                        </strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/requests/${req.id}`} className="btn btn-primary btn-sm">
                        <Eye size={14} />
                        <span>Manage Pickup</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="var(--emerald)" />
              <span>Recommended Surplus (Rule-Based Matching)</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Deterministic compatibility ranking based on your capacity ({org?.collection_capacity_kg} kg), proximity ({org?.city}), and urgency.
            </p>
          </div>

          <Link to="/available-food" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
            View Full Directory &rarr;
          </Link>
        </div>

        {matches.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            No recommended matches at this moment.
          </p>
        ) : (
          <div className="grid-2">
            {matches.slice(0, 4).map((match) => (
              <div key={match.listing.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    {match.listing.category}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: match.score >= 80 ? '#047857' : '#B45309' }}>
                      {match.score}/100
                    </span>
                    <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {match.matchTier}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  {match.listing.title}
                </h3>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Quantity: <strong>{match.listing.quantity_kg} kg</strong> &bull; Location: {match.listing.city} ({match.listing.postal_code})
                </p>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.775rem', marginBottom: '1rem' }}>
                  {match.factors.map((f, i) => (
                    <div key={i} style={{ color: f.points > 0 ? '#065F46' : '#64748B' }}>
                      &bull; {f.factor}: {f.detail}
                    </div>
                  ))}
                </div>

                <Link
                  to="/available-food"
                  className="btn btn-outline-primary btn-sm"
                  style={{ width: '100%' }}
                >
                  Inspect & Claim Listing
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
