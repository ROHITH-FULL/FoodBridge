import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import ReportModal from '../components/ReportModal';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  PackageCheck,
  ShieldAlert,
  ArrowLeft,
  Key,
  Scale,
  XCircle,
  FileText
} from 'lucide-react';

const STEPS = [
  { key: 'ACCEPTED', label: 'Claim Accepted' },
  { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
  { key: 'COLLECTED', label: 'Food Collected' },
  { key: 'HANDED_OVER', label: 'Handed Over' }
];

export default function RequestManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const { showToast } = useToast();

  const [requestData, setRequestData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Form
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Confirmation Form
  const [inputPickupCode, setInputPickupCode] = useState('');
  const [collectedKg, setCollectedKg] = useState('');
  const [handoverKg, setHandoverKg] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Report Modal
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequest = async () => {
    try {
      const data = await api.getRequestById(id);
      if (data.success) {
        setRequestData(data.request);
        setTimeline(data.timeline || []);

        if (data.request.listed_quantity_kg) {
          if (!collectedKg) setCollectedKg(data.request.collected_quantity_kg || data.request.listed_quantity_kg);
          if (!handoverKg) setHandoverKg(data.request.handed_over_quantity_kg || data.request.collected_quantity_kg || data.request.listed_quantity_kg);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load request details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading request details...</p>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Request not found.</p>
        <Link to="/" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>Return Home</Link>
      </div>
    );
  }

  const isDonor = user?.id === requestData.organizer_id;
  const isReceiver = organization?.id === requestData.organization_id;
  const isAdmin = user?.role === 'ADMIN';

  // Step index calculation
  const getStepIndex = (status) => {
    switch (status) {
      case 'ACCEPTED': return 0;
      case 'PICKUP_SCHEDULED': return 1;
      case 'COLLECTED': return 2;
      case 'HANDED_OVER': return 3;
      default: return -1;
    }
  };

  const currentStepIdx = getStepIndex(requestData.request_status);

  // 1. Schedule Pickup
  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!scheduledTime) {
      showToast('Please select a scheduled pickup time', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.schedulePickup(id, {
        scheduled_pickup_time: scheduledTime,
        notes: scheduleNotes,
      });
      showToast('Pickup successfully scheduled!', 'success');
      loadRequest();
    } catch (err) {
      showToast(err.message || 'Failed to schedule pickup', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Confirm Collection with Code & Weight
  const handleConfirmPickup = async (e) => {
    e.preventDefault();
    if (!inputPickupCode) {
      showToast('Please enter the pickup confirmation code', 'error');
      return;
    }
    if (!collectedKg || Number(collectedKg) <= 0) {
      showToast('Please record a positive collected weight in kg', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await api.confirmPickup(id, {
        pickup_code: inputPickupCode.trim().toUpperCase(),
        collected_quantity_kg: Number(collectedKg),
        notes: actionNotes,
      });
      showToast('Collection confirmed! Quantity recorded.', 'success');
      loadRequest();
    } catch (err) {
      showToast(err.message || 'Failed to confirm pickup', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Complete Final Handover
  const handleCompleteHandover = async (e) => {
    e.preventDefault();
    if (!handoverKg || Number(handoverKg) <= 0) {
      showToast('Please record handed over weight in kg', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await api.completeHandover(id, {
        handed_over_quantity_kg: Number(handoverKg),
        notes: actionNotes,
      });
      showToast('Handover completed! Social impact stats updated.', 'success');
      loadRequest();
    } catch (err) {
      showToast(err.message || 'Failed to complete handover', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Cancel Request
  const handleCancel = async () => {
    const reason = window.prompt('Reason for cancelling this donation pickup:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.cancelRequest(id, reason);
      showToast('Request cancelled and listing reopened.', 'info');
      loadRequest();
    } catch (err) {
      showToast(err.message || 'Failed to cancel request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: 960 }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {/* Main Request Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                {requestData.food_category}
              </span>
              <StatusBadge status={requestData.request_status} />
            </div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              {requestData.food_title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Request ID: #{requestData.id} &bull; Requested on: {new Date(requestData.requested_at).toLocaleString()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setIsReportOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              <ShieldAlert size={14} />
              <span>Report Issue</span>
            </button>

            {['ACCEPTED', 'PICKUP_SCHEDULED'].includes(requestData.request_status) && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn btn-secondary btn-sm"
              >
                <XCircle size={14} />
                <span>Cancel Request</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Visual Progress Bar */}
        <div style={{ margin: '2rem 0 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', position: 'relative' }}>
            {STEPS.map((step, idx) => {
              const isDone = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step.key} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: isDone ? 'var(--emerald)' : 'var(--border)',
                      marginBottom: '0.75rem',
                      transition: 'background 0.3s ease',
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--primary)' : isDone ? 'var(--text-main)' : 'var(--text-light)' }}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Details & Actions */}
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        {/* Left Card: Coordination Details */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} />
            <span>Coordination Information</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <strong>Surplus Quantities:</strong>
              <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Originally Listed:</span>
                <strong>{requestData.listed_quantity_kg} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: requestData.collected_quantity_kg ? 'var(--primary)' : 'inherit' }}>
                <span>Actually Collected:</span>
                <strong>{requestData.collected_quantity_kg ? `${requestData.collected_quantity_kg} kg` : 'Pending pickup'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: requestData.handed_over_quantity_kg ? '#047857' : 'inherit' }}>
                <span>Handed Over to Shelter:</span>
                <strong>{requestData.handed_over_quantity_kg ? `${requestData.handed_over_quantity_kg} kg` : 'Pending handover'}</strong>
              </div>
            </div>

            <div>
              <strong>Pickup Location:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {requestData.pickup_address}, {requestData.pickup_area ? `${requestData.pickup_area}, ` : ''}{requestData.pickup_city} {requestData.pickup_postal_code}
              </p>
            </div>

            <div>
              <strong>Food Safety & Storage:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {requestData.storage_information}
              </p>
            </div>

            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Donor Contact</span>
                <strong>{requestData.donor_contact_name || requestData.donor_name}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{requestData.donor_contact_phone}</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Receiving Organization</span>
                <strong>{requestData.organization_name}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{requestData.receiver_user_name} ({requestData.receiver_mobile})</div>
              </div>
            </div>

            {/* Scheduled Arrival Time if set */}
            {requestData.scheduled_pickup_time && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.85rem', borderRadius: 'var(--radius-md)', color: '#1E40AF' }}>
                <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
                Scheduled Arrival: <strong>{new Date(requestData.scheduled_pickup_time).toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Interactive Action Workflow */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} />
            <span>Workflow Actions & Verification</span>
          </h3>

          {/* Status 1: ACCEPTED -> Schedule Pickup */}
          {requestData.request_status === 'ACCEPTED' && (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                The request has been claimed. The receiving organization must now specify an expected arrival window.
              </p>

              <form onSubmit={handleSchedule}>
                <div className="form-group">
                  <label className="form-label">Scheduled Pickup Arrival Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                  <span className="form-hint">Must be before deadline: {new Date(requestData.pickup_deadline).toLocaleString()}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Driver / Vehicle Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="e.g. Volunteer van driver arriving at South Loading Dock"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Truck size={16} />
                  <span>{actionLoading ? 'Scheduling...' : 'Confirm Pickup Schedule'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Status 2: PICKUP_SCHEDULED -> Verify with Code & Log Weight */}
          {requestData.request_status === 'PICKUP_SCHEDULED' && (
            <div>
              {/* Pickup Code Display */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                  Pickup Confirmation Code
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>
                  {requestData.pickup_confirmation_code}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block', marginTop: '0.25rem' }}>
                  Provide this code upon physical handover at the pickup venue.
                </span>
              </div>

              <form onSubmit={handleConfirmPickup}>
                <div className="form-group">
                  <label className="form-label">Enter Pickup Confirmation Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. FB-XXXX"
                    value={inputPickupCode}
                    onChange={(e) => setInputPickupCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Actual Collected Quantity (kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="form-input"
                    value={collectedKg}
                    onChange={(e) => setCollectedKg(e.target.value)}
                    placeholder="e.g. 25.0"
                    required
                  />
                  <span className="form-hint">Listed was {requestData.listed_quantity_kg} kg. Record actual weight verified.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Handover Notes / Condition</label>
                  <input
                    type="text"
                    className="form-input"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Inspected temperature, packed into 2 clean insulated boxes."
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-emerald"
                  style={{ width: '100%' }}
                >
                  <PackageCheck size={16} />
                  <span>{actionLoading ? 'Verifying...' : 'Verify Code & Confirm Collection'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Status 3: COLLECTED -> Final Handover Distribution */}
          {requestData.request_status === 'COLLECTED' && (
            <div>
              <div style={{ background: '#CCFBF1', border: '1px solid #99F6E4', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', color: '#115E59', fontSize: '0.875rem' }}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6 }} />
                Food successfully collected ({requestData.collected_quantity_kg} kg). Complete the final distribution to update public impact metrics.
              </div>

              <form onSubmit={handleCompleteHandover}>
                <div className="form-group">
                  <label className="form-label">Quantity Distributed to Beneficiaries (kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="form-input"
                    value={handoverKg}
                    onChange={(e) => setHandoverKg(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Redistribution Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Served hot dinner to 55 residents at Hope Center shelter."
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{actionLoading ? 'Recording...' : 'Mark Handover Complete'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Status 4: HANDED_OVER -> Finished */}
          {requestData.request_status === 'HANDED_OVER' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', background: '#DCFCE7', color: '#15803D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Surplus Recovery Completed
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <strong>{requestData.handed_over_quantity_kg} kg</strong> of surplus food was successfully collected and served to people in need.
              </p>
              <Link to="/impact" className="btn btn-secondary btn-sm" style={{ marginTop: '1.25rem' }}>
                View Updated Impact Metrics
              </Link>
            </div>
          )}

          {requestData.request_status === 'CANCELLED' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#DC2626' }}>
              <XCircle size={36} style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem' }}>Request Cancelled</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Reason: {requestData.cancellation_reason || 'Not specified'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Status History Timeline */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} />
          <span>Status Audit History & Timeline</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
          {timeline.map((entry) => (
            <div key={entry.id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-1.65rem', top: 3, width: 10, height: 10, borderRadius: '50%', background: 'var(--emerald)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {entry.new_status}
                  {entry.changed_by_name && (
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 6 }}>
                      by {entry.changed_by_name} ({entry.changed_by_role})
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              {entry.notes && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {entry.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        listingId={requestData.food_listing_id}
        requestId={requestData.id}
      />
    </div>
  );
}
