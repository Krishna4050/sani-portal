'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ShieldCheck, LogOut, Users, QrCode, MessageSquare, PhoneCall, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({ twilio_sms_enabled: false, twilio_call_enabled: false });
  const [stats, setStats] = useState({ totalUsers: 0, totalTags: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Supabase to handle the secure logout
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        
        // Fetch Settings & Stats at the same time
        const [settingsRes, statsRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/settings`),
          fetch(`${backendUrl}/api/admin/stats`)
        ]);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings({
            twilio_sms_enabled: settingsData.twilio_sms_enabled || false,
            twilio_call_enabled: settingsData.twilio_call_enabled || false,
          });
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            totalUsers: statsData.totalUsers || 0,
            totalTags: statsData.totalTags || 0,
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  
  // IDLE AUTO-LOGOUT (5 MINUTES)
  
  useEffect(() => {
    // 5 minutes = 300,000 milliseconds
    const INACTIVITY_TIME = 5 * 60 * 1000; 
    let timeoutId: number;

    const logoutUser = async () => {
      console.log("User idle for 5 minutes. Executing secure auto-logout...");
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    };

    const resetTimer = () => {
      // Clear the old timer
      if (timeoutId) window.clearTimeout(timeoutId);
      // Start a fresh 5-minute timer
      timeoutId = window.setTimeout(logoutUser, INACTIVITY_TIME);
    };

    // Events that prove the user is still at their computer
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    // Attach the listeners to the browser window
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Start the timer the moment the dashboard loads
    resetTimer();

    // Clean up the listeners if the user leaves the page manually
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router, supabase.auth]);

  
  // SECURE LOGOUT FUNCTION
 
  const handleSignOut = async () => {
    await supabase.auth.signOut(); // Destroys the secure cookie
    router.push('/login');
    router.refresh(); // Forces the Bouncer to re-check the locks
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-800" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg">
            <ShieldCheck className="text-green-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Control Panel</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Stealth Operations</p>
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-sm transition-colors border border-red-100"
        >
          <LogOut size={16} />
          Secure Sign Out
        </button>
      </nav>

      <div className="max-w-5xl mx-auto mt-8 px-6 space-y-8">
        
        {/* HERO ANALYTICS SECTION */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Live Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Total Users Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <Users className="text-blue-600" size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Registered Users</p>
                <p className="text-3xl font-extrabold text-slate-800">{stats.totalUsers}</p>
              </div>
            </div>

            {/* Total Tags Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <QrCode className="text-purple-600" size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Active QR Tags</p>
                <p className="text-3xl font-extrabold text-slate-800">{stats.totalTags}</p>
              </div>
            </div>

          </div>
        </section>

        {/* TWILIO ARCHITECTURE SECTION */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Architecture & Integrations</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center gap-2">
              <ShieldCheck className="text-yellow-400" size={20} />
              <h3 className="text-white font-semibold">Twilio Proxy Architecture</h3>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* SMS Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-200 p-2 rounded-lg mt-1">
                    <MessageSquare className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">SMS OTP Verification</h4>
                    <p className="text-sm text-gray-600 mt-1 max-w-lg">
                      When active, the system sends real texts via Twilio. When paused, texts are intercepted and printed to the server terminal to save credits (Mock Mode).
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {/* Note: This is visually static for now, you can re-attach your toggle logic here! */}
                  <div className={`w-14 h-8 flex items-center rounded-full p-1 cursor-not-allowed ${settings.twilio_sms_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.twilio_sms_enabled ? 'translate-x-6' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Call Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-200 p-2 rounded-lg mt-1">
                    <PhoneCall className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Anonymous Proxy Calls</h4>
                    <p className="text-sm text-gray-600 mt-1 max-w-lg">
                      When active, Finders and Owners are bridged together via live phone call. When paused, users hear a maintenance message and the call drops immediately.
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`w-14 h-8 flex items-center rounded-full p-1 cursor-not-allowed ${settings.twilio_call_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.twilio_call_enabled ? 'translate-x-6' : ''}`} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}