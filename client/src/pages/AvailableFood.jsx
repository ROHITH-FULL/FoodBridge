import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import {
  Utensils,
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Filter,
  Eye,
  X
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Cooked meals',
  'Rice and other grains',
  'Bread and bakery',
  'Fruits',
  'Vegetables',
  'Packaged food',
  'Dairy and beverages'
];

export default function AvailableFood() {
  const { user, organization, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [minQty, setMinQty] = useState('');

  // Details Modal
  const [selectedListing, setSelectedListing] = useState(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedCity) params.city = selectedCity;
      if (minQty) params.min_quantity = minQty;
      if (searchTerm) params.search = searchTerm;

      const data = await api.getFoodListings(params);
      if (data.success) {
        setListings(data.listings || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load food listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedCity, minQty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleClaim = async (listingId) => {
    if (!isAuthenticated) {
      showToast('Please sign in as a verified NGO to claim surplus food.', 'info');
      navigate('/login');
      return;
    }

    if (user.role !== 'NGO') {
      showToast('Only registered NGO relief organizations can claim food listings.', 'error');
      return;
    }

    if (organization?.verification_status !== 'VERIFIED') {
      showToast('Your NGO account is pending administrative verification. Unverified NGOs cannot claim live donations.', 'error');
      return;
    }

    if (!window.confirm('Do you want to claim this surplus food listing? You will be assigned a pickup code and must coordinate pickup before the deadline.')) {
      return;
    }

    setClaimingId(listingId);
    try {
      const data = await api.acceptListing(listingId);
      showToast(`Listing claimed! Pickup code: ${data.pickup_code}`, 'success');
      navigate(`/requests/${data.request_id}`);
    } catch (err) {
      showToast(err.message || 'Failed to claim listing', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Available Surplus Food Directory
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 800 }}>
          Explore live surplus food offered by local event organizers and caterers. Verified relief NGOs can claim food for safe, prompt redistribution.
        </p>
      </div>

      {/* Verification Notice for Pending NGOs */}
      {user?.role === 'NGO' && organization?.verification_status === 'PENDING' && (
        <div style={{ background: 'var(--amber-light)', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="#B45309" />
          <div style={{ fontSize: '0.875rem', color: '#92400E' }}>
            <strong>Account Verification Notice:</strong> Your NGO account (<em>{organization.organization_name}</em>) is currently pending review by our administrator. You can view all listings, but claiming requires verification.
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Keywords</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#94A3B8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                placeholder="Dish name, venue, area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">City</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Metro City"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Min Quantity (kg)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 10"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '2.65rem' }}>
            <Filter size={16} />
            <span>Filter Results</span>
          </button>
        </form>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Searching available surplus listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Utensils size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Available Surplus Listings Found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 1.5rem' }}>
            There are currently no active surplus listings matching your filters. Check back soon or reset your filter criteria.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedCity('');
              setMinQty('');
              setSearchTerm('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {listings.map((item) => {
            const deadlineDate = new Date(item.pickup_deadline);
            const hoursLeft = ((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60)).toFixed(1);

            return (
              <div key={item.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Card Header & Category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    {item.category}
                  </span>
                  <StatusBadge status={item.listing_status} />
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.15rem', lineHeight: 1.35, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem', flex: 1 }}>
                  {item.description || 'Surplus untouched food from organized event, maintained under sanitary conditions.'}
                </p>

                {/* Highlights Details */}
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.9rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Quantity:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{item.quantity_kg} kg {item.estimated_servings ? `(~${item.estimated_servings} servings)` : ''}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Dietary:</span>
                    <span style={{ fontWeight: 600 }}>{item.dietary_type}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Deadline:</span>
                    <span style={{ color: Number(hoursLeft) < 3 ? '#DC2626' : 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} />
                      {hoursLeft > 0 ? `${hoursLeft}h left` : 'Expired'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                    <MapPin size={13} color="var(--primary)" />
                    <span>{item.area ? `${item.area}, ` : ''}{item.city} ({item.postal_code})</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setSelectedListing(item)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Eye size={14} />
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => handleClaim(item.id)}
                    disabled={claimingId === item.id}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1.2 }}
                  >
                    <HeartHandshake size={14} />
                    <span>{claimingId === item.id ? 'Claiming...' : 'Claim Food'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Food Details Modal */}
      {selectedListing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  {selectedListing.category}
                </span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '0.4rem' }}>
                  {selectedListing.title}
                </h3>
              </div>
              <button onClick={() => setSelectedListing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <strong>Description:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {selectedListing.description || 'No additional description provided.'}
                </p>
              </div>

              <div className="grid-2">
                <div>
                  <strong>Quantity:</strong> {selectedListing.quantity_kg} kg
                </div>
                <div>
                  <strong>Dietary:</strong> {selectedListing.dietary_type}
                </div>
                <div>
                  <strong>Prepared:</strong> {new Date(selectedListing.preparation_time).toLocaleString()}
                </div>
                <div>
                  <strong>Pickup Deadline:</strong> {new Date(selectedListing.pickup_deadline).toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} />
                  <span>Storage & Handling Specifications:</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {selectedListing.storage_information}
                </p>
              </div>

              <div>
                <strong>Pickup Location:</strong>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {selectedListing.address}, {selectedListing.area ? `${selectedListing.area}, ` : ''}{selectedListing.city} {selectedListing.postal_code}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setSelectedListing(null)} className="btn btn-secondary">
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    handleClaim(selectedListing.id);
                  }}
                  className="btn btn-primary"
                >
                  <HeartHandshake size={16} />
                  <span>Claim this Food</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
