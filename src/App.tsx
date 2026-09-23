import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { LandingPage } from './pages/LandingPage';
import { OwnerPage } from './pages/OwnerPage';
import { PublicGhostPage } from './pages/PublicGhostPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LegalNoticePage } from './pages/LegalNoticePage';

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash screen on first visit of current session
    return !sessionStorage.getItem('ghost_splash_shown');
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('ghost_splash_shown', 'true');
    setShowSplash(false);
  };

  // Register Service Worker for PWA & offline cache
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Ghost PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Ghost Service Worker registration skipped/failed:', err);
        });
    }
  }, []);

  return (
    <AuthProvider>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <BrowserRouter>
        <div className="min-h-screen bg-[#0F0F0F] text-[#F0F0F0] selection:bg-[#00FF88]/30 selection:text-[#00FF88]">
          <Routes>
            {/* Landing page for GHOST creation */}
            <Route path="/" element={<LandingPage />} />

            {/* Owner private management dashboard */}
            <Route path="/owner/:pseudo" element={<OwnerPage />} />

            {/* Public guest view */}
            <Route path="/p/:pseudo" element={<PublicGhostPage />} />

            {/* Dedicated How It Works Page */}
            <Route path="/comment-ca-marche" element={<HowItWorksPage />} />

            {/* Redirects to Accueil */}
            <Route path="/vue-d-ensemble" element={<Navigate to="/" replace />} />
            <Route path="/overview" element={<Navigate to="/" replace />} />

            {/* Legal Pages */}
            <Route path="/cgu" element={<TermsPage />} />
            <Route path="/confidentialite" element={<PrivacyPage />} />
            <Route path="/mentions-legales" element={<LegalNoticePage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
