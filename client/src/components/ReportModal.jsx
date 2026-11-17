import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, listingId, requestId, title = 'Report Concern or Dispute' }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please specify a reason for the report', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.createReport({
        listing_id: listingId,
        request_id: requestId,
        reason,
        details,
      });
      showToast('Report submitted for administrative review', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#DC2626' }}>
            <AlertTriangle size={22} />
            <h3 style={{ fontSize: '1.25rem' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          If food is suspected to be improperly stored, spoiled, contaminated, or if there is a pickup coordination issue, report it immediately to protect beneficiaries.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category / Primary Reason *</label>
            <select
              className="form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">-- Select Report Reason --</option>
              <option value="Food Safety Concern (Temperature/Smell)">Food Safety Concern (Improper temperature / off-odor / spoiled)</option>
              <option value="Packaging & Hygiene Compromise">Packaging Compromise (Uncovered, pest contact, unhygienic)</option>
              <option value="Pickup No-Show or Unresponsive Donor">Pickup No-Show / Unresponsive Counterpart</option>
              <option value="Significant Quantity Mismatch">Significant Quantity Mismatch (Less/different than listed)</option>
              <option value="Expired Food Items">Food Past Safe Consumption Window</option>
              <option value="Other Protocol Dispute">Other Protocol Dispute</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Additional Details / Observations</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide exact facts: temperature reading if available, time of arrival, container condition, etc."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-danger">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
