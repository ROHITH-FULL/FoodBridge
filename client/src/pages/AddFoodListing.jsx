import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Utensils,
  PlusCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  MapPin,
  Calendar,
  CheckCircle2,
  Info
} from 'lucide-react';

const CATEGORIES = [
  'Cooked meals',
  'Rice and other grains',
  'Bread and bakery',
  'Fruits',
  'Vegetables',
  'Packaged food',
  'Dairy and beverages',
  'Other'
];

export default function AddFoodListing() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Helper: default preparation time (1 hour ago) and deadline (4 hours ahead)
  const now = new Date();
  const defaultPrep = new Date(now.getTime() - 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cooked meals');
  const [description, setDescription] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [estimatedServings, setEstimatedServings] = useState('');
  const [preparationTime, setPreparationTime] = useState(defaultPrep);
  const [dietaryType, setDietaryType] = useState('VEGETARIAN');
  const [storageInformation, setStorageInformation] = useState('');
  const [address, setAddress] = useState('700 Grand Ballroom Avenue');
  const [area, setArea] = useState('Downtown Convention Center');
  const [city, setCity] = useState('Metro City');
  const [postalCode, setPostalCode] = useState('10001');
  const [pickupDeadline, setPickupDeadline] = useState(defaultDeadline);
  const [contactPerson, setContactPerson] = useState(user?.full_name || 'Anita Sharma');
  const [contactPhone, setContactPhone] = useState(user?.mobile || '+1 555-0101');
  const [imageUrl, setImageUrl] = useState('');
  const [safetyDeclaration, setSafetyDeclaration] = useState(false);

  const [loading, setLoading] = useState(false);

  // Real-time Conservative Safety Warning
  const prepTimeMs = new Date(preparationTime).getTime();
  const elapsedHours = !isNaN(prepTimeMs) ? (Date.now() - prepTimeMs) / (1000 * 60 * 60) : 0;
  const isCookedMealOld = category === 'Cooked meals' && elapsedHours > 4;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!safetyDeclaration) {
      showToast('You must review and accept the Food Safety & Hygiene Declaration.', 'error');
      return;
    }

    if (new Date(pickupDeadline).getTime() <= Date.now()) {
      showToast('Pickup deadline cannot be in the past.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createFoodListing({
        title,
        category,
        description,
        quantity_kg: Number(quantityKg),
        estimated_servings: estimatedServings ? Number(estimatedServings) : null,
        preparation_time: preparationTime,
        dietary_type: dietaryType,
        storage_information: storageInformation,
        address,
        area,
        city,
        postal_code: postalCode,
        pickup_deadline: pickupDeadline,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        image_url: imageUrl,
        safety_declaration: safetyDeclaration,
      });

      showToast('Surplus food listing published successfully!', 'success');
      navigate('/organizer');
    } catch (err) {
      showToast(err.message || 'Failed to submit food listing', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: 840 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          List Surplus Food
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Log untouched banquet, catering, or event meals for fast rule-based matching with verified relief shelters.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Food Details */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <Utensils size={20} />
            <span>Food Description & Category</span>
          </h3>

          <div className="form-group">
            <label className="form-label">Food Title / Name *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wedding Banquet Feast - Vegetable Biryani & Paneer Curry"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Food Category *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dietary Classification *</label>
              <select
                className="form-select"
                value={dietaryType}
                onChange={(e) => setDietaryType(e.target.value)}
                required
              >
                <option value="VEGETARIAN">Vegetarian (No meat / poultry)</option>
                <option value="NON_VEGETARIAN">Non-Vegetarian (Poultry / Meat / Fish)</option>
                <option value="VEGAN">Strictly Vegan (100% Plant-Based)</option>
                <option value="OTHER">Other / Mixed Assortment</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Quantity in Kilograms (kg) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="form-input"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder="e.g. 25.0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Servings (Persons)</label>
              <input
                type="number"
                className="form-input"
                value={estimatedServings}
                onChange={(e) => setEstimatedServings(e.target.value)}
                placeholder="e.g. 50"
              />
              <span className="form-hint">Standard assumption: ~0.45 kg per meal serving</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Food Description & Packaging</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify dish items, whether untouched from buffet line or prep kitchen, containers used, allergens present, etc."
            />
          </div>
        </div>

        {/* Section 2: Preparation, Storage & Food Safety */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <ShieldCheck size={20} />
            <span>Time, Temperature & Hygiene Protocols</span>
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Preparation Date & Time *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                required
              />
              <span className="form-hint">When the meal was initially cooked or portioned</span>
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Deadline *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={pickupDeadline}
                onChange={(e) => setPickupDeadline(e.target.value)}
                required
              />
              <span className="form-hint">Strict cut-off time when venue closes or food must be consumed</span>
            </div>
          </div>

          {/* Conservative Eligibility Warning */}
          {isCookedMealOld && (
            <div style={{ background: 'var(--amber-light)', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={22} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.85rem', color: '#92400E' }}>
                <strong>Conservative Safety Alert:</strong> This cooked meal was prepared over {elapsedHours.toFixed(1)} hours ago. Under food safety standards (such as FSSAI / WHO 2-hour hot-holding guidance), cooked food held at ambient temperatures degrades rapidly. Please verify that this food is maintained strictly above 60°C in commercial hot boxes or below 5°C in active refrigeration.
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Storage & Handling Method *</label>
            <input
              type="text"
              className="form-input"
              value={storageInformation}
              onChange={(e) => setStorageInformation(e.target.value)}
              placeholder="e.g. Held in sealed chafing dishes above 60°C; requires thermal transport boxes"
              required
            />
          </div>
        </div>

        {/* Section 3: Pickup Location & Contact */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <MapPin size={20} />
            <span>Pickup Address & Contact Person</span>
          </h3>

          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 700 Grand Ballroom Avenue, Service Entrance Gate 3"
              required
            />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Neighborhood / Area</label>
              <input
                type="text"
                className="form-input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Downtown Convention Center"
              />
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Metro City"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Postal / ZIP Code *</label>
              <input
                type="text"
                className="form-input"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 10001"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contact Person Name *</label>
              <input
                type="text"
                className="form-input"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Anita Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +1 555-0101"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Mandatory Food-Safety Declaration */}
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <input
              type="checkbox"
              id="safety-declaration"
              checked={safetyDeclaration}
              onChange={(e) => setSafetyDeclaration(e.target.checked)}
              style={{ width: 22, height: 22, marginTop: 3, accentColor: 'var(--primary)', cursor: 'pointer' }}
              required
            />
            <label htmlFor="safety-declaration" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.5 }}>
              <strong>Food Safety & Hygiene Acknowledgment:</strong> I declare that this surplus food is untouched, stored in clean food-grade vessels, maintained within appropriate thermal zones, and has not been contaminated by patrons. I understand FoodBridge connects surplus logistics and does not independently inspect food; safe redistribution requires donor integrity.
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/organizer')}
            className="btn btn-secondary btn-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            <PlusCircle size={20} />
            <span>{loading ? 'Publishing...' : 'Publish Surplus Food Listing'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
