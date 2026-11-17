import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Thermometer,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ExternalLink,
  Utensils
} from 'lucide-react';

export default function FoodSafetyGuide() {
  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--emerald-subtle)', color: '#065F46', padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-full)', fontSize: '0.825rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          <ShieldAlert size={16} />
          <span>Food Safety & Hygiene Protocol</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
          Safe Surplus Food Redistribution
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
          Food safety is an uncompromising requirement. FoodBridge facilitates logistics, but the health of community recipients depends on strict adherence to safe food-handling practices.
        </p>
      </div>

      {/* Critical Core Warning Box */}
      <div style={{ background: '#FEF2F2', border: '2px solid #F87171', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <AlertTriangle size={28} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#991B1B', marginBottom: '0.5rem' }}>
              The Golden Rule: "When in Doubt, Reject It"
            </h3>
            <p style={{ fontSize: '0.925rem', color: '#7F1D1D', lineHeight: 1.6 }}>
              Surplus food recovery must never endanger vulnerable recipients. If any food shows signs of spoilage, abnormal odor, compromised packaging, pest contact, or has remained in the Temperature Danger Zone beyond safe limits, <strong>it must not be redistributed</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Surplus Safety */}
      <div className="grid-2" style={{ gap: '1.75rem', marginBottom: '3rem' }}>
        {/* Pillar 1: Temperature Control */}
        <div className="card">
          <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Thermometer size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            1. The Temperature Danger Zone
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
            Bacteria multiply rapidly between <strong>5°C and 60°C (41°F - 140°F)</strong>.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> Hot cooked foods must be held <strong>above 60°C</strong>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> Chilled items (dairy, salads) must be held <strong>below 5°C</strong>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> Use insulated thermoboxes during vehicle transit
            </li>
          </ul>
        </div>

        {/* Pillar 2: 2-Hour / 4-Hour Window */}
        <div className="card">
          <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Clock size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            2. The 2-Hour / 4-Hour Rule
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
            Standard food safety benchmarks (WHO / FSSAI standards) for potentially hazardous food:
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> <strong>Under 2 hours:</strong> Safe to consume or chill immediately
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> <strong>2 to 4 hours:</strong> Must be consumed immediately; cannot re-chill
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#DC2626" /> <strong>Over 4 hours:</strong> Must be safely discarded
            </li>
          </ul>
        </div>

        {/* Pillar 3: Sanitary Vessels & Packaging */}
        <div className="card">
          <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Package size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            3. Food-Grade Packaging & Separation
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
            Physical protection prevents contamination during loading and transit:
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> Use clean, sealed food-grade containers or foil pans
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> Keep vegetarian and non-vegetarian dishes strictly segregated
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> Label containers with food name, prep date & time
            </li>
          </ul>
        </div>

        {/* Pillar 4: Physical Sensory Verification */}
        <div className="card">
          <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)', background: 'var(--emerald-subtle)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <FileCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            4. On-Site Sensory Inspection
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
            Receiving volunteers must perform a 4-point visual check upon arrival:
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> <strong>Sight:</strong> Normal color, no discoloration or mould
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> <strong>Smell:</strong> Fresh aroma without sourness or rancidity
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10B981" /> <strong>Touch / Texture:</strong> Intact consistency without slime
            </li>
          </ul>
        </div>
      </div>

      {/* Platform Disclaimer & References */}
      <div className="card" style={{ background: '#F8FAFC', border: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          Authoritative Reference Standards & Platform Limits
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
          These guidelines synthesize authoritative principles from the <strong>World Health Organization (Five Keys to Safer Food)</strong> and surplus food recovery frameworks (such as FSSAI Food Safety and Standards Regulation for surplus distribution). FoodBridge is a logistics coordination tool and does not conduct physical laboratory testing. Responsibility for hygienic preparation and safe consumption remains with participating donors and receiving relief personnel.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/available-food" className="btn btn-primary btn-sm">
            <span>Explore Surplus Food</span>
          </Link>
          <Link to="/" className="btn btn-secondary btn-sm">
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
