import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import {
  Utensils,
  PlusCircle,
  Clock,
  CheckCircle2,
  PackageCheck,
  Search,
  Sparkles,
  Eye,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Matched NGOs Modal State
  const [selectedListingForMatch, setSelectedListingForMatch] = useState(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchedOrgs, setMatchedOrgs] = useState([]);

  const loadData = async () => {
    try {
      const data = await api.getOrganizerDashboard();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelListing = async (listingId) => {
    const reason = window.prompt('Please provide a reason for cancelling this listing:');
    if (!reason) return;

    try {
      await api.cancelFoodListing(listingId, reason);
      showToast('Listing cancelled.', 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel listing', 'error');
    }
  };

  const handleViewMatches = async (listing) => {
    setSelectedListingForMatch(listing);
    setMatchesLoading(true);
    try {
      const data = await api.getListingMatches(listing.id);
      if (data.success) {
        setMatchedOrgs(data.matches || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to calculate smart matches', 'error');
    } finally {
      setMatchesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading organizer dashboard...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const listings = dashboardData?.recent_listings || [];

  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.area && item.area.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      {/* Header and Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
            Organizer Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Welcome, <strong>{user?.full_name}</strong> &bull; Manage surplus food recovery, live matches, and pickup verification.
          </p>
        </div>

        <Link to="/add-food" className="btn btn-primary btn-lg">
          <PlusCircle size={20} />
          <span>Add Surplus Food</span>
        </Link>
      </div>

      {/* Real Database Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Utensils size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total_listings}</div>
            <div className="stat-label">Total Listings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.available_listings}</div>
            <div className="stat-label">Available for NGOs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.in_progress_listings}</div>
            <div className="stat-label">In Pickup / Scheduled</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            <PackageCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total_kg_listed} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg</span></div>
            <div className="stat-label">Total Volume Logged</div>
          </div>
        </div>
      </div>

      {/* Active Requests Alert Banner if any */}
      {dashboardData?.active_requests?.length > 0 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: '#1E40AF', fontWeight: 700 }}>
            <Truck size={20} />
            <span>Active Coordinated Pickups ({dashboardData.active_requests.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dashboardData.active_requests.map((req) => (
              <div key={req.id} style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{req.food_title} ({req.quantity_kg} kg)</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Receiver: <strong>{req.organization_name}</strong> &bull; Contact: {req.ngo_phone}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={req.request_status} />
                  {req.pickup_confirmation_code && (
                    <div style={{ background: '#F1F5F9', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed #CBD5E1', fontSize: '0.85rem' }}>
                      Verification Code: <strong style={{ color: 'var(--primary)', letterSpacing: '0.05em' }}>{req.pickup_confirmation_code}</strong>
                    </div>
                  )}
                  <Link to={`/requests/${req.id}`} className="btn btn-secondary btn-sm">
                    Track Workflow
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings Table / Management */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)' }}>
            Your Surplus Food Listings
          </h2>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#94A3B8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 180 }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Cooked meals">Cooked meals</option>
              <option value="Rice and other grains">Rice & grains</option>
              <option value="Bread and bakery">Bakery</option>
              <option value="Fruits">Fruits</option>
              <option value="Vegetables">Vegetables</option>
            </select>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Utensils size={36} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
            <p>No listings found matching your filters.</p>
            <Link to="/add-food" className="btn btn-emerald btn-sm" style={{ marginTop: '1rem' }}>
              Create a Surplus Listing
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title & Category</th>
                  <th>Quantity / Servings</th>
                  <th>Pickup Deadline</th>
                  <th>Safety Status</th>
                  <th>Listing Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.category} &bull; {item.area || item.city}
                      </div>
                    </td>
                    <td>
                      <strong>{item.quantity_kg} kg</strong>
                      {item.estimated_servings && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                          ~{item.estimated_servings} servings
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {new Date(item.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.pickup_deadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.eligibility_status} />
                    </td>
                    <td>
                      <StatusBadge status={item.listing_status} />
                      {item.current_status && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Req: {item.current_status}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {/* View Smart Matches */}
                        <button
                          onClick={() => handleViewMatches(item)}
                          className="btn btn-secondary btn-sm"
                          title="View rule-based smart matches for this food listing"
                        >
                          <Sparkles size={14} color="var(--primary)" />
                          <span>Matches</span>
                        </button>

                        {/* View Request Details if claimed */}
                        {item.current_request_id && (
                          <Link
                            to={`/requests/${item.current_request_id}`}
                            className="btn btn-secondary btn-sm"
                            title="View request progress"
                          >
                            <Eye size={14} />
                            <span>Progress</span>
                          </Link>
                        )}

                        {/* Cancel Listing if available */}
                        {item.listing_status === 'AVAILABLE' && (
                          <button
                            onClick={() => handleCancelListing(item.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#DC2626' }}
                            title="Cancel this surplus listing"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Smart Matches Modal */}
      {selectedListingForMatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="var(--emerald)" />
                  <span>Rule-Based Smart Matches</span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Scoring for: <strong>{selectedListingForMatch.title}</strong> ({selectedListingForMatch.quantity_kg} kg)
                </p>
              </div>
              <button onClick={() => setSelectedListingForMatch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {matchesLoading ? (
              <p style={{ padding: '2rem 0', textAlign: 'center' }}>Calculating deterministic compatibility factors...</p>
            ) : matchedOrgs.length === 0 ? (
              <p style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No receiving organizations registered yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {matchedOrgs.map((match) => (
                  <div key={match.organization.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {match.organization.organization_name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {match.organization.city} &bull; Capacity: <strong>{match.organization.collection_capacity_kg} kg</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: match.score >= 80 ? '#047857' : match.score >= 50 ? '#B45309' : '#64748B' }}>
                          {match.score}/100
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: match.score >= 80 ? '#047857' : '#B45309' }}>
                          {match.matchTier}
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Factors List */}
                    <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Transparent Compatibility Factors:</div>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {match.factors.map((f, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: f.points > 0 ? '#10B981' : '#94A3B8', fontWeight: 700 }}>+{f.points}pts</span>
                            <span>&bull; {f.factor}: {f.detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
