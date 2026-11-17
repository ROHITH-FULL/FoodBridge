import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DemoBanner from './components/DemoBanner';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AddFoodListing from './pages/AddFoodListing';
import AvailableFood from './pages/AvailableFood';
import NgoDashboard from './pages/NgoDashboard';
import RequestManagement from './pages/RequestManagement';
import FoodSafetyGuide from './pages/FoodSafetyGuide';
import ImpactDashboard from './pages/ImpactDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-container">
            <DemoBanner />
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/available-food" element={<AvailableFood />} />
                <Route path="/food-safety" element={<FoodSafetyGuide />} />
                <Route path="/impact" element={<ImpactDashboard />} />

                {/* Organizer Workflows */}
                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-food"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <AddFoodListing />
                    </ProtectedRoute>
                  }
                />

                {/* NGO Workflows */}
                <Route
                  path="/ngo"
                  element={
                    <ProtectedRoute allowedRoles={['NGO', 'ADMIN']}>
                      <NgoDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Request & Pickup Management */}
                <Route
                  path="/requests/:id"
                  element={
                    <ProtectedRoute>
                      <RequestManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Platform Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
