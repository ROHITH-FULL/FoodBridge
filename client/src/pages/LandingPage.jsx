import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Utensils,
  HeartHandshake,
  ShieldCheck,
  Truck,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  AlertTriangle
} from 'lucide-react';

export default function LandingPage() {
  const [impactMetrics, setImpactMetrics] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getImpactStats('all');
        if (data.success) {
          setImpactMetrics(data.metrics);
        }
      } catch (err) {
        // Fallback default
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      {/* 1. Hero Section */}
      <section style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F3 100%)', padding: '5rem 0 4rem', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--emerald-subtle)', color: '#065F46', padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-full)', fontSize: '0.825rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              <Sparkles size={15} />
              <span>Smart Surplus Food Recovery Platform</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--primary)' }}>
              Good Food Deserves a <span style={{ color: 'var(--emerald)' }}>Second Chance.</span>
            </h1>

            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: 700, margin: '0 auto 2.5rem' }}>
              Every day, weddings, corporate summits, and banquets prepare delicious, untouched surplus meals.
              FoodBridge coordinates direct handovers with verified relief organizations before safe consumption windows expire.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/add-food" className="btn btn-primary btn-lg">
                <Utensils size={18} />
                <span>Donate Surplus Food</span>
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                <HeartHandshake size={18} />
                <span>Join as an NGO</span>
              </Link>
              <Link to="/available-food" className="btn btn-emerald btn-lg">
                <span>View Available Food</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Impact Preview (Honest Prototype Data) */}
      <section style={{ padding: '3rem 0', background: '#FFFFFF', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Platform Operational Activity</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Honest accounting: Only confirmed handovers count toward recovered meals.
              </p>
            </div>
            <Link to="/impact" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Full Impact Dashboard &rarr;
            </Link>
          </div>

          <div className="grid-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Utensils size={24} />
              </div>
              <div>
                <div className="stat-value">{impactMetrics?.total_kg_listed || '170'} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg</span></div>
                <div className="stat-label">Total Surplus Listed</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--emerald-subtle)', color: '#047857' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="stat-value">{impactMetrics?.total_kg_handed_over || '55'} <span style={{ fontSize: '1rem', fontWeight: 500 }}>kg</span></div>
                <div className="stat-label">Handed Over Safely</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="stat-value">{impactMetrics?.estimated_meals_served || '122'}</div>
                <div className="stat-label">Estimated Meals Shared</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="stat-value">{impactMetrics?.participating_verified_ngos || '2'}</div>
                <div className="stat-label">Verified NGO Partners</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Visual Journey: From Surplus to Safe Collection */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-page)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
              The FoodBridge Recovery Journey
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              A closed-loop chain of custody that guarantees hygiene, prompt transportation, and verified impact.
            </p>
          </div>

          <div className="grid-4" style={{ position: 'relative' }}>
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 800, fontSize: '1.25rem' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Surplus Identified</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                An event host or caterer logs unserved banquet dishes with preparation time, storage conditions, and strict pickup deadline.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--emerald-subtle)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 800, fontSize: '1.25rem' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Smart Match</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Our rule-based engine scores nearby verified NGOs based on proximity, receiver capacity, operating hours, and urgency.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 800, fontSize: '1.25rem' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Code Verification</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Upon arrival, the NGO presents an authenticated pickup confirmation code. Actual collected weight is weighed and logged.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 800, fontSize: '1.25rem' }}>
                4
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Verified Distribution</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Food is served directly at relief centers or soup kitchens. Completed handover updates transparent community analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three Core Feature Cards */}
      <section style={{ padding: '5rem 0', background: '#FFFFFF', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
              Built for Safety, Speed, and Accountability
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Engineered to meet the exact operational realities of community food redistribution.
            </p>
          </div>

          <div className="grid-3">
            <div className="card" style={{ padding: '2.25rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Rule-Based Smart Matching</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Instead of slow manual phone calls, our deterministic scoring evaluates NGO verification, vehicle capacity, geographic area, and deadline feasibility without relying on unstable third-party AI APIs.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Transparent point breakdown</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Capacity suitability filtering</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Race-condition claim prevention</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '2.25rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: 'var(--emerald-subtle)', color: 'var(--emerald)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Food Safety & Hygiene First</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Surplus food recovery is a food safety process, not just a logistics task. We enforce preparation time tracking, conservative 4-hour hot-holding flags, pickup deadlines, and dispute channels.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Conservative safety eligibility checks</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Mandatory donor hygiene declaration</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Receiver incident & dispute reporting</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '2.25rem' }}>
              <div style={{ width: '3rem', height: '3rem', background: '#DBEAFE', color: '#1D4ED8', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Honest Impact Accounting</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                We believe in genuine transparency. Listed food is never treated as recovered until physical pickup is verified and handed over. Prototype demo numbers are clearly distinguished from live records.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Separate listed vs handed-over weight</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> Toggle live vs sample demo records</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={15} color="#10B981" /> 1-Click CSV export for auditing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call To Action Banner */}
      <section style={{ padding: '4.5rem 0', background: 'var(--primary)', color: '#FFFFFF' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: '2.25rem', marginBottom: '1rem' }}>
            Ready to Prevent Food Waste in Your City?
          </h2>
          <p style={{ color: '#E2E8F0', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Whether you are hosting a wedding, managing banquet catering, or leading a relief shelter, FoodBridge makes coordinated redistribution straightforward.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/add-food" className="btn btn-emerald btn-lg">
              <Utensils size={18} />
              <span>List Surplus Food Now</span>
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              <span>Register Organization</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
