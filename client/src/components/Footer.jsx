import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Heart, ShieldAlert, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#0F172A', color: '#94A3B8', borderTop: '1px solid #1E293B', marginTop: '4rem', padding: '3.5rem 0 2rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ width: '2rem', height: '2rem', background: '#10B981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Utensils size={16} color="#FFFFFF" />
              </div>
              <span>Food<span style={{ color: '#10B981' }}>Bridge</span></span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#94A3B8' }}>
              "From Food Waste to Food for All."<br />
              Connecting surplus event food with verified local food banks and shelters before it goes to waste.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748B' }}>
              Student Innovation Prototype &bull; IDE Boot Camp
            </div>
          </div>

          <div>
            <h4 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Platform Navigation</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><Link to="/available-food" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#10B981'} onMouseLeave={e => e.target.style.color='#94A3B8'}>Explore Available Food</Link></li>
              <li><Link to="/food-safety" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#10B981'} onMouseLeave={e => e.target.style.color='#94A3B8'}>Food Safety Guidelines</Link></li>
              <li><Link to="/impact" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#10B981'} onMouseLeave={e => e.target.style.color='#94A3B8'}>Honest Impact Metrics</Link></li>
              <li><Link to="/register" style={{ color: '#94A3B8', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#10B981'} onMouseLeave={e => e.target.style.color='#94A3B8'}>Register as NGO or Donor</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Food Safety & Hygiene</h4>
            <p style={{ fontSize: '0.825rem', lineHeight: 1.6, color: '#94A3B8', marginBottom: '0.75rem' }}>
              Food safety is our primary requirement. Organizers must adhere to temperature controls, 2-hour limits for hot foods, and sanitary packaging.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F59E0B', fontSize: '0.775rem' }}>
              <ShieldAlert size={14} />
              <span>When in doubt, never redistribute unverified food.</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Demo Presentation Info</h4>
            <p style={{ fontSize: '0.825rem', lineHeight: 1.6, color: '#94A3B8' }}>
              This platform demonstrates end-to-end surplus recovery: donor listing &rarr; rule-based matching &rarr; pickup scheduling &rarr; code confirmation &rarr; impact accounting.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.775rem', color: '#64748B' }}>
          <div>
            &copy; {new Date().getFullYear()} FoodBridge Prototype. Created for Social Innovation & Food Waste Prevention.
          </div>
          <div>
            Built with React, Express, and SQLite. Zero paid APIs required.
          </div>
        </div>
      </div>
    </footer>
  );
}
