import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import {
  Shield,
  Users,
  Building2,
  Utensils,
  PackageCheck,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, repRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getReports().catch(() => ({ reports: [] })),
      ]);

      if (dashRes.success) setAdminData(dashRes);
      if (repRes.success) setReports(repRes.reports || []);
    } catch (err) {
      showToast(err.message || 'Failed to load administrator panel', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerification = async (orgId, status) => {
    const notes = window.prompt(`Enter review notes for marking this organization as ${status}:`, `Reviewed organization registration and credentials.`);
    if (notes === null) return;

    setActionLoading(true);
    try {
      await api.updateVerification(orgId, status, notes);
      showToast(`Organization updated to ${status}!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update verification', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = async (reportId, status) => {
    setActionLoading(true);
    try {
      await api.resolveReport(reportId, status, 'Resolved by platform administrator.');
      showToast(`Report marked as ${status}.`, 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update report status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demonstration data back to original prototype state? Any newly created listings during this session will be restored to seed values.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.resetDemoData();
      showToast('Database reset to clean baseline successfully!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading administrator panel...</p>
      </div>
    );
  }

  const users = adminData?.users || {};
  const orgs = adminData?.organizations || {};
  const listings = adminData?.listings || {};
  const requests = adminData?.requests || {};
  const pendingOrgs = adminData?.pending_verifications || [];

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Shield size={24} color="#2563EB" />
            <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)' }}>
              Platform Administration
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Supervise relief organizations, verify credentials, monitor dispute reports, and maintain demo data.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={actionLoading}
          className="btn btn-secondary"
          style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
        >
          <RefreshCw size={16} />
          <span>Reset Sample Demo Data</span>
        </button>
      </div>

      {/* System Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{users.total_users || 0}</div>
            <div className="stat-label">Users ({users.organizers_count} Donors, {users.ngos_count} NGOs)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="stat-value">{orgs.pending_count || 0}</div>
            <div className="stat-label">Pending NGO Verifications</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Utensils size={24} />
          </div>
          <div>
            <div className="stat-value">{listings.total_listings || 0}</div>
            <div className="stat-label">Listings ({listings.total_kg_listed} kg registered)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
            <PackageCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{requests.completed_handovers || 0}</div>
            <div className="stat-label">Completed Handovers</div>
          </div>
        </div>
      </div>

      {/* Pending NGO Verifications Queue */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="var(--primary)" />
            <span>Organization Verification Queue ({pendingOrgs.length})</span>
          </h2>
        </div>

        {pendingOrgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Shield size={32} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
            <p>All NGO registration applications have been verified. No pending items.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Organization Name & City</th>
                  <th>Contact Person & Phone</th>
                  <th>Capacity (kg)</th>
                  <th>Registration / License Details</th>
                  <th>Verification Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{org.organization_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {org.address}, {org.city} ({org.postal_code})
                      </div>
                    </td>
                    <td>
                      <div>{org.contact_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {org.contact_email} &bull; {org.contact_mobile}
                      </div>
                    </td>
                    <td>
                      <strong>{org.collection_capacity_kg} kg</strong>
                    </td>
                    <td style={{ maxWidth: 220, fontSize: '0.85rem' }}>
                      {org.registration_details || <span style={{ color: 'var(--text-muted)' }}>None provided</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleVerification(org.id, 'VERIFIED')}
                          disabled={actionLoading}
                          className="btn btn-emerald btn-sm"
                          title="Approve NGO application"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleVerification(org.id, 'REJECTED')}
                          disabled={actionLoading}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#DC2626' }}
                          title="Reject NGO application"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reports & Safety Disputes Monitor */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span>Reported Concerns & Disputes ({reports.length})</span>
        </h2>

        {reports.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            No incident reports submitted.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Reason & Details</th>
                  <th>Reporter</th>
                  <th>Listing / Subject</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep) => (
                  <tr key={rep.id}>
                    <td>
                      <strong style={{ color: '#DC2626' }}>{rep.reason}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {rep.details || 'No additional notes provided.'}
                      </div>
                    </td>
                    <td>
                      <div>{rep.reporter_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rep.reporter_role} &bull; {rep.reporter_email}
                      </div>
                    </td>
                    <td>
                      {rep.listing_title ? <span>{rep.listing_title}</span> : <span style={{ color: 'var(--text-muted)' }}>Listing #{rep.listing_id || 'N/A'}</span>}
                    </td>
                    <td>
                      <StatusBadge status={rep.report_status} />
                    </td>
                    <td>
                      {rep.report_status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                            disabled={actionLoading}
                            className="btn btn-secondary btn-sm"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
