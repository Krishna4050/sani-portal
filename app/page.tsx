'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ShieldCheck, LogOut, Users, QrCode, MessageSquare, PhoneCall, Loader2, Search, Tag, 
  Mail, Calendar, Ban, Trash2, CheckCircle, Store, Check, X, ChevronDown, ChevronUp, 
  MapPin, FileText, Image as ImageIcon, PauseCircle, AlertTriangle, PlayCircle, Send, 
  Paperclip, AlertOctagon, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface AdminTag { tagId: string; ownerId: string; isClaimed: boolean; createdAt: string; }
interface AdminUser { id: string; email: string; phoneNumber: string; createdAt: string; isBanned: boolean; }
interface AdminHost {
  shopId: string; managerId: string; managerEmail: string; shopName: string; status: string;
  createdAt: string; street: string; city: string; phone: string; documentUrl: string;
  shopTypes: string[]; amenities: string[]; photos: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  
  type TabType = 'overview' | 'tags' | 'users' | 'hosts' | 'logs';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHostId, setExpandedHostId] = useState<string | null>(null);
  
  // NEW: Photo Carousel State
  const [lightboxData, setLightboxData] = useState<{ photos: string[], index: number } | null>(null);
  const [composeHost, setComposeHost] = useState<AdminHost | null>(null);
  const [msgSending, setMsgSending] = useState(false);

  const [settings, setSettings] = useState({ twilio_sms_enabled: false, twilio_call_enabled: false });
  const [flightSettings, setFlightSettings] = useState({ markup_enabled: false, markup_percentage: 0, markup_fixed: 0 });
  const [stats, setStats] = useState({ totalUsers: 0, totalTags: 0, totalProxyCalls: 0 });
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [hosts, setHosts] = useState<AdminHost[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchUsersAndHosts = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    try {
      const [usersRes, hostsRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/users`),
        fetch(`${backendUrl}/api/admin/hosts`)
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (hostsRes.ok) setHosts(await hostsRes.json());
    } catch (error) { 
      console.error("Failed to load users or hosts",error); 
    }
  };

  const fetchAllData = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const t = new Date().getTime(); 
    try {
      const [settingsRes, flightSettingsRes, statsRes, tagsRes, logsRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/settings`),
        fetch(`${backendUrl}/api/admin/flight-settings`),
        fetch(`${backendUrl}/api/admin/stats`),
        fetch(`${backendUrl}/api/admin/tags`),
        fetch(`${backendUrl}/api/admin/logs?t=${t}`)
      ]);
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (flightSettingsRes.ok) setFlightSettings(await flightSettingsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      await fetchUsersAndHosts();
    } catch (error) { console.error("Data fetch failed", error); } 
    finally { setIsLoading(false); }
  };

    useEffect(() => {
    // eslint-disable-next-line
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHostAction = async (shopId: string, action: 'approve' | 'reject' | 'pause' | 'suspend' | 'delete') => {
    const messages = {
      'approve': 'Approve and activate this shop?',
      'reject': 'Reject this application?',
      'pause': 'Pause this shop? (Temporarily hides them from the public map)',
      'suspend': 'Suspend this shop? (Severe violation)',
      'delete': 'Delete this shop? (Soft delete for legal compliance, allows host to re-register)'
    };
    if (!window.confirm(messages[action])) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/hosts/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopId, action })
      });
      if (res.ok) { setExpandedHostId(null); await fetchAllData(); }
    } catch (error) { alert("Action failed.");
      console.log("Action failed", error)
     }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!composeHost) return;
    setMsgSending(true);

    const formData = new FormData(e.currentTarget);
    formData.append('shopId', composeHost.shopId);
    formData.append('to', composeHost.managerEmail);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/communicate`, { method: 'POST', body: formData });
      if (res.ok) { alert("Message sent successfully!"); setComposeHost(null); fetchAllData(); } 
      else { alert("Failed to send message. Check backend logs."); }
    } catch (error) { alert("Network error.");
      console.log("Network error:", error)
     } 
    finally { setMsgSending(false); }
  };

  // CAROUSEL NAVIGATORS
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxData(prev => prev ? { ...prev, index: (prev.index + 1) % prev.photos.length } : null);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxData(prev => prev ? { ...prev, index: (prev.index - 1 + prev.photos.length) % prev.photos.length } : null);
  };

  // ... (Other functions kept identical for brevity: handleUserAction, handleToggleSetting, StatusBadge)
  const handleUserAction = async (userId: string, action: 'delete' | 'suspend' | 'activate') => {
    const confirmMsg = action === 'delete' ? "Are you sure you want to PERMANENTLY delete this user? This cannot be undone." : `Are you sure you want to ${action} this user?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/user-action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action }) });
      if (res.ok) await fetchUsersAndHosts();
    } catch (error) { console.error("Failed to load data");
      console.log("Failed to load data", error)
     }
  };

  const handleToggleSetting = async (settingName: 'twilio_sms_enabled' | 'twilio_call_enabled') => {
    const newValue = !settings[settingName];
    setSettings(prev => ({ ...prev, [settingName]: newValue })); 
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      await fetch(`${backendUrl}/api/admin/update-setting`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setting_name: settingName, setting_value: newValue }) });
    } catch (error) { setSettings(prev => ({ ...prev, [settingName]: !newValue }));
  console.log("error", error) }
  };

  const handleSaveFlightSettings = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/flight-settings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(flightSettings) 
      });
      if (res.ok) alert("Flight markup settings saved successfully!");
      else alert("Failed to save flight settings.");
    } catch (error) {
      console.error("Flight settings save failed", error);
      alert("Network error saving flight settings.");
    }
  };

  const filteredTags = tags.filter(tag => tag.tagId.toLowerCase().includes(searchQuery.toLowerCase()) || (tag.ownerId && tag.ownerId.toLowerCase().includes(searchQuery.toLowerCase())));

  const StatusBadge = ({ status }: { status: string }) => {
    switch(status) {
      case 'verified': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">Verified & Active</span>;
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wider">Awaiting Review</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">Rejected</span>;
      case 'paused': return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider">Paused</span>;
      case 'suspended': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">Suspended</span>;
      case 'deleted': return <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">Soft Deleted</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login'); router.refresh(); };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-slate-800" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      
      {/* 1. INTERACTIVE PHOTO CAROUSEL */}
      {lightboxData && lightboxData.photos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-95 p-4" onClick={() => setLightboxData(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors" onClick={(e) => { e.stopPropagation(); setLightboxData(null); }}><X size={36} /></button>
          
          {lightboxData.photos.length > 1 && (
            <button className="absolute left-6 text-white hover:text-gray-300 p-4 transition-transform hover:scale-110" onClick={prevImage}><ChevronLeft size={48} /></button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxData.photos[lightboxData.index]} alt="Shop Gallery" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200" />
          
          {lightboxData.photos.length > 1 && (
            <button className="absolute right-6 text-white hover:text-gray-300 p-4 transition-transform hover:scale-110" onClick={nextImage}><ChevronRight size={48} /></button>
          )}

          <div className="absolute bottom-6 text-white text-sm font-semibold tracking-wider bg-black bg-opacity-50 px-4 py-1 rounded-full">
            {lightboxData.index + 1} / {lightboxData.photos.length}
          </div>
        </div>
      )}

      {/* 2. COMMUNICATION COMPOSER OVERLAY */}
      {composeHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-60 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2"><Mail size={18}/> Contact {composeHost.shopName}</h3>
              <button onClick={() => setComposeHost(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                  <input type="text" disabled value={composeHost.managerEmail} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CC (Optional)</label>
                  <input type="text" name="cc" defaultValue={composeHost.phone !== composeHost.managerEmail ? "" : ""} placeholder="additional@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                <input type="text" name="subject" required placeholder="Subject of your message" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                  <select name="priority" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="alert">Security Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Multi-Channel</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" name="sendSms" value="true" className="w-4 h-4 text-slate-800 rounded border-gray-300 focus:ring-slate-800" />
                    <span className="text-sm text-gray-700 font-medium">Also send via SMS text</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message Body</label>
                <textarea name="body" required rows={5} placeholder="Type your message here..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-800 outline-none resize-none" />
              </div>

              <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
                <Paperclip size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Attach files, images, or videos (Optional)</span>
                <input type="file" name="attachments" multiple className="hidden" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setComposeHost(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={msgSending} className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50">
                  {msgSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Communication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NAV BAR */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg"><ShieldCheck className="text-green-400" size={24} /></div>
          <div><h1 className="text-xl font-bold text-slate-800 tracking-tight">System Control Panel</h1><p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Stealth Operations</p></div>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-sm transition-colors border border-red-100">
          <LogOut size={16} /> Secure Sign Out
        </button>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 px-6">
        <div className="flex space-x-4 mb-8 border-b border-gray-200 overflow-x-auto">
          {(['overview', 'tags', 'users', 'hosts', 'logs'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 font-medium text-sm capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'hosts' ? 'Partner Lifecycle' : tab}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: SYSTEM OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-xl"><Users className="text-blue-600" size={28} /></div>
                <div><p className="text-sm font-medium text-gray-500">Registered Users</p><p className="text-3xl font-extrabold text-slate-800">{stats.totalUsers}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-purple-50 p-4 rounded-xl"><QrCode className="text-purple-600" size={28} /></div>
                <div><p className="text-sm font-medium text-gray-500">Active Tags</p><p className="text-3xl font-extrabold text-slate-800">{stats.totalTags}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="bg-green-50 p-4 rounded-xl"><PhoneCall className="text-green-600" size={28} /></div>
                <div><p className="text-sm font-medium text-gray-500">Proxy Calls Made</p><p className="text-3xl font-extrabold text-slate-800">{stats.totalProxyCalls}</p></div>
              </div>
            </div>

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
                  <button onClick={() => handleToggleSetting('twilio_sms_enabled')} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.twilio_sms_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.twilio_sms_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-2 rounded-lg mt-1"><PhoneCall className="text-gray-600" size={20} /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">Anonymous Proxy Calls</h4>
                      <p className="text-sm text-gray-600 mt-1 max-w-lg">When active, users are bridged via live phone call. When paused, calls are dropped.</p>
                    </div>
                  </div>
                 <button onClick={() => handleToggleSetting('twilio_call_enabled')} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.twilio_call_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.twilio_call_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
                </div>
              </div>
            </div>

            {/* Flight Settings Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={20} />
                <h3 className="text-white font-semibold">Duffel Flight Markup Control</h3>
              </div>
              <div className="p-6 space-y-6">
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-2 rounded-lg mt-1"><CheckCircle className="text-gray-600" size={20} /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">Enable Flight Markups</h4>
                      <p className="text-sm text-gray-600 mt-1 max-w-lg">If enabled, markup will be automatically integrated into flight search prices and checkout securely on the backend.</p>
                    </div>
                  </div>
                  <button onClick={() => setFlightSettings(p => ({...p, markup_enabled: !p.markup_enabled}))} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${flightSettings.markup_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${flightSettings.markup_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Percentage Markup (%)</label>
                    <input type="number" step="0.01" min="0" value={flightSettings.markup_percentage} onChange={(e) => setFlightSettings(p => ({...p, markup_percentage: parseFloat(e.target.value) || 0}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition-shadow" placeholder="e.g. 10" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fixed Amount Markup (€)</label>
                    <input type="number" step="0.01" min="0" value={flightSettings.markup_fixed} onChange={(e) => setFlightSettings(p => ({...p, markup_fixed: parseFloat(e.target.value) || 0}))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition-shadow" placeholder="e.g. 50" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={handleSaveFlightSettings} className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm">
                    Save Markup Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: TAG DIRECTORY ================= */}
        {activeTab === 'tags' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-slate-800">Global Tag Directory</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" placeholder="Search Tag ID..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 w-64"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr><th className="px-6 py-4">Tag ID</th><th className="px-6 py-4">Owner UID</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Created</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTags.map((tag) => (
                    <tr key={tag.tagId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-slate-800 flex items-center gap-2"><Tag size={16} className="text-gray-400" />{tag.tagId}</td>
                      <td className="px-6 py-4 font-mono text-xs">{tag.ownerId || 'Unassigned'}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${tag.isClaimed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{tag.isClaimed ? 'Active' : 'Unclaimed'}</span></td>
                      <td className="px-6 py-4">{new Date(tag.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredTags.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No tags found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: USER MANAGER ================= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-lg font-bold text-slate-800">Registered Users</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr><th className="px-6 py-4">Status</th><th className="px-6 py-4">Email Address</th><th className="px-6 py-4">Phone Number</th><th className="px-6 py-4">Joined Date</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {user.isBanned ? <span className="flex items-center gap-1 text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded-md w-max"><Ban size={14}/> Suspended</span> : <span className="flex items-center gap-1 text-green-600 font-semibold text-xs bg-green-50 px-2 py-1 rounded-md w-max"><CheckCircle size={14}/> Active</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2"><Mail size={16} className="text-gray-400" /> {user.email}</td>
                      <td className="px-6 py-4 font-mono">{user.phoneNumber}</td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" />{new Date(user.createdAt).toLocaleDateString()}</div></td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {user.isBanned ? <button onClick={() => handleUserAction(user.id, 'activate')} className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-semibold">Reactivate</button> : <button onClick={() => handleUserAction(user.id, 'suspend')} className="px-3 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-md text-xs font-semibold">Suspend</button>}
                        <button onClick={() => handleUserAction(user.id, 'delete')} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete User">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PARTNER LIFECYCLE ================= */}
        {activeTab === 'hosts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Partner Lifecycle Management</h2>
                <p className="text-sm text-gray-500">Click any row to reveal deep diagnostics and lifecycle controls.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 border-collapse">
                <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                  <tr><th className="px-6 py-4">Shop Identity</th><th className="px-6 py-4">Manager Contact</th><th className="px-6 py-4">Current Status</th><th className="px-6 py-4 text-right">Details</th></tr>
                </thead>
                <tbody>
                  {hosts.map((host) => (
                    <React.Fragment key={host.shopId}>
                      <tr 
                        className={`transition-colors cursor-pointer border-b border-gray-50 ${expandedHostId === host.shopId ? 'bg-slate-50' : 'hover:bg-gray-50'}`}
                        onClick={() => setExpandedHostId(expandedHostId === host.shopId ? null : host.shopId)}
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2"><Store size={18} className="text-gray-400" /> {host.shopName}</td>
                        <td className="px-6 py-4 text-gray-500">{host.managerEmail}</td>
                        <td className="px-6 py-4"><StatusBadge status={host.status} /></td>
                        <td className="px-6 py-4 text-right text-gray-400">{expandedHostId === host.shopId ? <ChevronUp size={20} className="inline"/> : <ChevronDown size={20} className="inline"/>}</td>
                      </tr>

                      {expandedHostId === host.shopId && (
                        <tr className="bg-slate-50 border-b border-gray-200">
                          <td colSpan={4} className="px-8 py-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                              <div className="space-y-4">
                                <div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin size={14}/> Location</h4><p className="text-slate-800 font-medium">{host.street}, {host.city}</p></div>
                                <div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><PhoneCall size={14}/> Support Contact</h4><p className="text-slate-800 font-mono">{host.phone || 'N/A'}</p></div>
                                <div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Tag size={14}/> Categories & Amenities</h4>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {host.shopTypes?.map((t, i) => <span key={i} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium">{t}</span>)}
                                    {host.amenities?.map((a, i) => <span key={i} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-500">{a}</span>)}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><FileText size={14}/> Verification Document</h4>
                                  {host.documentUrl ? (<a href={host.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium underline">Open Secure Document</a>) : (<span className="text-gray-400 text-sm italic">No document uploaded</span>)}
                                </div>
                                <div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><ImageIcon size={14}/> Location Photos</h4>
                                  {host.photos && host.photos.length > 0 && host.photos[0] !== "" ? (
                                    <div className="flex gap-3 mt-2 overflow-x-auto pb-2">
                                      {/* LIGHTBOX TRIGGER IS HERE */}
                                      {host.photos.map((p, i) => (
                                        <button key={i} onClick={() => setLightboxData({ photos: host.photos, index: i })} className="shrink-0 relative group outline-none focus:ring-2 focus:ring-slate-800 rounded-lg">
                                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center"><Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} /></div>
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={p} alt="Shop Thumbnail" className="w-20 h-20 rounded-lg object-cover border border-gray-200 shadow-sm" />
                                        </button>
                                      ))}
                                    </div>
                                  ) : (<span className="text-gray-400 text-sm italic">No photos available</span>)}
                                </div>
                              </div>
                            </div>

                            {/* LIFECYCLE ACTION BAR */}
                            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mr-2">Lifecycle Controls:</span>
                              
                              {host.status === 'pending' && (
                                <><button onClick={() => handleHostAction(host.shopId, 'approve')} className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"><Check size={16}/> Approve & Activate</button>
                                <button onClick={() => handleHostAction(host.shopId, 'reject')} className="flex items-center gap-1 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"><X size={16}/> Reject Application</button></>
                              )}

                              {host.status === 'verified' && (
                                <><button onClick={() => handleHostAction(host.shopId, 'pause')} className="flex items-center gap-1 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-semibold transition-colors"><PauseCircle size={16}/> Pause Visibility</button>
                                <button onClick={() => handleHostAction(host.shopId, 'suspend')} className="flex items-center gap-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-semibold transition-colors"><AlertTriangle size={16}/> Suspend Account</button></>
                              )}

                              {host.status === 'paused' && (
                                <button onClick={() => handleHostAction(host.shopId, 'approve')} className="flex items-center gap-1 px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50 rounded-lg text-sm font-semibold transition-colors"><PlayCircle size={16}/> Resume Shop Visibility</button>
                              )}
                              
                              {host.status === 'suspended' && (
                                <button onClick={() => handleHostAction(host.shopId, 'approve')} className="flex items-center gap-1 px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50 rounded-lg text-sm font-semibold transition-colors"><AlertOctagon size={16}/> Lift Suspension</button>
                              )}

                              <div className="flex-1" />
                              
                              {/* IN-APP COMPOSER TRIGGER */}
                              <button onClick={() => setComposeHost(host)} className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"><Mail size={16}/> Message Hub</button>
                              
                              {host.status !== 'deleted' && (
                                <button onClick={() => handleHostAction(host.shopId, 'delete')} className="flex items-center gap-1 px-3 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-sm font-semibold transition-colors"><Trash2 size={16}/> Wipe Record</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {hosts.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No host applications found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SYSTEM LOGS ================= */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-lg font-bold text-slate-800">System Audit Trail</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr><th className="px-6 py-4">Date & Time</th><th className="px-6 py-4">Action Type</th><th className="px-6 py-4">Details / Mock Data</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    let displayDetails = log.details;
                    try {
                      displayDetails = Object.entries(JSON.parse(log.details)).map(([k, v]) => `${k}: ${v}`).join(' | ');
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {}
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800"><span className="bg-slate-100 px-2 py-1 rounded-md">{log.actionType}</span></td>
                        <td className="px-6 py-4 font-mono text-xs text-blue-600">{displayDetails}</td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No system logs found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}