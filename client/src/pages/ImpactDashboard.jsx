import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  Utensils,
  PackageCheck,
  Building2,
  Clock,
  Download,
  AlertCircle,
  Sparkles,
  PieChart,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function ImpactDashboard() {
  const [dataScope, setDataScope] = useState('all'); // 'all', 'live_only', 'demo_only'
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchImpact = async (scope) => {
    setLoading(true);
    try {
      const data = await api.getImpactStats(scope);
      if (data.success) {
        setImpactData(data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch impact metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpact(dataScope);
  }, [dataScope]);

  const handleExportCsv = async () => {
    try {
      const csvText = await api.exportImpactCsv();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foodbridge_impact_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Impact metrics exported to CSV successfully!', 'success');
    } catch (err) {
      showToast('Failed to export CSV report', 'error');
    }
  };

  const metrics = impactData?.metrics || {};
  const categories = impactData?.category_breakdown || [];

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem' }}>
      {/* Header and Scope Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
            Impact & Transparency Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 700 }}>
            Verifiable surplus food metrics. Only food that completed physical handover to relief centers is counted as redistributed.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Data Scope Toggle */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.25rem', display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setDataScope('all')}
              className={`btn btn-sm ${dataScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              All Records (Demo & Live)
            </button>
            <button
              onClick={() => setDataScope('live_only')}
              className={`btn btn-sm ${dataScope === 'live_only' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              Live Sessions Only
            </button>
          </div>

          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Honest Scientific / Prototype Disclaimer Callout */}
      <div style={{ background: impactData?.is_sample_data ? '#FEF3C7' : '#EFF6FF', border: `1px solid ${impactData?.is_sample_data ? '#FCD34D' : '#BFDBFE'}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <AlertCircle size={22} color={impactData?.is_sample_data ? '#B45309' : '#1D4ED8'} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: impactData?.is_sample_data ? '#78350F' : '#1E3A8A', lineHeight: 1.5 }}>
          <strong>Transparency Notice:</strong> {impactData?.disclaimer}
        </div>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Utensils size={26} />
          </div>
          <div>
            <div className="stat-value">{metrics.total_kg_listed || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg</span></div>
            <div className="stat-label">Total Surplus Registered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#CCFBF1', color: '#0F766E' }}>
            <PackageCheck size={26} />
          </div>
          <div>
            <div className="stat-value">{metrics.total_kg_collected || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg</span></div>
            <div className="stat-label">Collected by Volunteers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
            <TrendingUp size={26} />
          </div>
          <div>
            <div className="stat-value">{metrics.total_kg_handed_over || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg</span></div>
            <div className="stat-label">Safely Handed Over to Shelters</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
            <Users size={26} />
          </div>
          <div>
            <div className="stat-value">{metrics.estimated_meals_served || 0}</div>
            <div className="stat-label">Estimated Meal Portions (~450g)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            <Building2 size={26} />
          </div>
          <div>
            <div className="stat-value">{metrics.participating_verified_ngos || 0}</div>
            <div className="stat-label">Verified NGO Partners</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <Clock size={26} />
          </div>
          <div>
            <div className="stat-value">{metrics.handover_success_rate || '100%'}</div>
            <div className="stat-label">Successful Handover Rate</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Audit Table */}
      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Category Breakdown */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <PieChart size={20} />
            <span>Surplus Recovery by Food Category</span>
          </h2>

          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No category data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.map((cat) => {
                const maxKg = Math.max(...categories.map(c => c.total_kg), 1);
                const pct = Math.round((cat.total_kg / maxKg) * 100);

                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>{cat.category}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <strong>{cat.total_kg} kg</strong> ({cat.count} listings)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: 'var(--bg-subtle)', borderRadius: 5, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), var(--emerald))',
                          borderRadius: 5,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Methodology & Formula Definition */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <CheckCircle2 size={20} />
            <span>Accounting Formulas & Methodology</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Recovered vs Listed Separation
              </strong>
              Listed kilograms represent intent. Only kilograms confirmed during physical pickup and marked handed over to relief shelters are tallied in recovered metrics.
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Portion Conversion Benchmark
              </strong>
              Estimated meal portions use the international food security standard benchmark of <strong>1 meal &approx; 0.45 kg (450 grams)</strong> of balanced prepared food.
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Handover Success Formula
              </strong>
              <code>Success Rate = (Completed Handovers / Total Processed Requests) &times; 100</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
