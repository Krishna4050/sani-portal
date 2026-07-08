"use client";

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

const CONSENT_KEY = '@gdpr_cookie_consent';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setIsVisible(true);
      }
    } catch (e) {
      console.error('Failed to read consent from localStorage', e);
    }
  }, []);

  const saveConsent = (prefs: { analytics: boolean; marketing: boolean }) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        necessary: true,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        timestamp: new Date().toISOString()
      }));
      setIsVisible(false);
    } catch (e) {
      console.error('Failed to save consent', e);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[#0F2D4D]" />
            <h2 className="text-2xl font-bold text-gray-900">Your Privacy Choices</h2>
          </div>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            We and our partners use technologies, such as cookies, and gather browsing data to give you the best online experience and to personalize the content and advertising shown to you.
          </p>

          {!showDetails ? (
            <button 
              onClick={() => setShowDetails(true)}
              className="text-blue-600 font-semibold hover:underline mb-8"
            >
              Customize Preferences
            </button>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 space-y-6">
              {/* Strictly Necessary */}
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="font-semibold text-gray-900">Strictly Necessary</h3>
                  <p className="text-sm text-gray-500 mt-1">Required for the website/app to function. Cannot be disabled.</p>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-500">
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="font-semibold text-gray-900">Analytics & Statistics</h3>
                  <p className="text-sm text-gray-500 mt-1">Help us improve our services by collecting anonymous usage data.</p>
                </div>
                <button 
                  onClick={() => setAnalytics(!analytics)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${analytics ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analytics ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Marketing</h3>
                  <p className="text-sm text-gray-500 mt-1">Used to deliver personalized advertisements across different platforms.</p>
                </div>
                <button 
                  onClick={() => setMarketing(!marketing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${marketing ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${marketing ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <button 
                onClick={() => saveConsent({ analytics, marketing })}
                className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
              >
                Save Preferences
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => saveConsent({ analytics: false, marketing: false })}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-full transition-colors"
            >
              Reject All
            </button>
            <button 
              onClick={() => saveConsent({ analytics: true, marketing: true })}
              className="flex-1 bg-[#0F2D4D] hover:bg-[#1a4b7f] text-white font-semibold py-3.5 rounded-full transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
