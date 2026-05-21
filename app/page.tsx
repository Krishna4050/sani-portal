'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ShieldCheck, LogOut, Users, QrCode, MessageSquare, 
  PhoneCall, Loader2, Search, Tag, Mail, Calendar 
} from 'lucide-react';

// Type Definitions
interface AdminTag { tagId: string; ownerId: string; isClaimed: boolean; createdAt: string; }
interface AdminUser { id: string; email: string; phoneNumber: string; createdAt: string; }

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'tags' | 'users'>('overview');
  
  // Data State
  const [settings, setSettings] = useState({ twilio_sms_enabled: false, twilio_call_enabled: false });
  const [stats, setStats] = useState({ totalUsers: 0, totalTags: 0, totalProxyCalls: 0 });
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

 
  // FETCH ALL DATA
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        
        const [settingsRes, statsRes, tagsRes, usersRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/settings`),
          fetch(`${backendUrl}/api/admin/stats`),
          fetch(`${backendUrl}/api/admin/tags`),
          fetch(`${backendUrl}/api/admin/users`)
        ]);

        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (tagsRes.ok) setTags(await tagsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());

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
    const INACTIVITY_TIME = 5 * 60 * 1000; 
    let timeoutId: number;

    const logoutUser = async () => {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    };

    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutUser, INACTIVITY_TIME);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [router, supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Filter tags based on search query
  const filteredTags = tags.filter(tag => 
    tag.tagId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tag.ownerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="max-w-6xl mx-auto mt-8 px-6">
        
        {/* TAB NAVIGATION */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            System Overview
          </button>
          <button 
            onClick={() => setActiveTab('tags')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${activeTab === 'tags' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tag Directory
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            User Manager
          </button>
        </div>

       
        {/* SYSTEM OVERVIEW                     */}
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* HERO ANALYTICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-xl"><Users className="text-blue-600" size={28} /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Registered Users</p>
                  <p className="text-3xl font-extrabold text-slate-800">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-purple-50 p-4 rounded-xl"><QrCode className="text-purple-600" size={28} /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Tags</p>
                  <p className="text-3xl font-extrabold text-slate-800">{stats.totalTags}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-green-50 p-4 rounded-xl"><PhoneCall className="text-green-600" size={28} /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Proxy Calls Made</p>
                  <p className="text-3xl font-extrabold text-slate-800">{stats.totalProxyCalls}</p>
                </div>
              </div>
            </div>

            {/* TWILIO ARCHITECTURE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                <ShieldCheck className="text-yellow-400" size={20} />
                <h3 className="text-white font-semibold">Twilio Proxy Architecture</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-2 rounded-lg mt-1"><MessageSquare className="text-gray-600" size={20} /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">SMS OTP Verification</h4>
                      <p className="text-sm text-gray-600 mt-1 max-w-lg">System texts via Twilio. Paused mode intercepts texts to terminal (Mock Mode).</p>
                    </div>
                  </div>
                  <div className={`w-14 h-8 flex items-center rounded-full p-1 cursor-not-allowed ${settings.twilio_sms_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.twilio_sms_enabled ? 'translate-x-6' : ''}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

       
        {/* TAG DIRECTORY                       */}
      
        {activeTab === 'tags' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-slate-800">Global Tag Directory</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search Tag ID..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Tag ID</th>
                    <th className="px-6 py-4">Owner UID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTags.map((tag) => (
                    <tr key={tag.tagId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-800 flex items-center gap-2">
                        <Tag size={16} className="text-gray-400" />
                        {tag.tagId}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{tag.ownerId || 'Unassigned'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tag.isClaimed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {tag.isClaimed ? 'Active' : 'Unclaimed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(tag.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredTags.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No tags found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

       
        {/* USER MANAGER                        */}
        
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-slate-800">Registered Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4">User UID</th>
                    <th className="px-6 py-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        {user.email}
                      </td>
                      <td className="px-6 py-4 font-mono">{user.phoneNumber}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{user.id}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}