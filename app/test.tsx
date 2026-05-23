'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ShieldCheck, LogOut, Users, QrCode, MessageSquare, 
  PhoneCall, Loader2, Search, Tag, Mail, Calendar, Ban, Trash2, CheckCircle, Store, Check, X 
} from 'lucide-react';

interface AdminTag { tagId: string; ownerId: string; isClaimed: boolean; createdAt: string; }
interface AdminUser { id: string; email: string; phoneNumber: string; createdAt: string; isBanned: boolean; }
interface AdminHost { companyId: string; managerId: string; managerEmail: string; companyName: string; registrationId: string; status: string; createdAt: string; }

export default function DashboardPage() {
  const router = useRouter();
  
  // All UI State
  type TabType = 'overview' | 'tags' | 'users' | 'hosts' | 'logs';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // All Data State
  const [settings, setSettings] = useState({ twilio_sms_enabled: false, twilio_call_enabled: false });
  const [stats, setStats] = useState({ totalUsers: 0, totalTags: 0, totalProxyCalls: 0 });
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [hosts, setHosts] = useState<AdminHost[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
      console.error("Failed to load users or hosts:", error);
    }
  };

  const fetchAllData = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const timestamp = new Date().getTime(); 

    try {
      const [settingsRes, statsRes, tagsRes, logsRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/settings`),
        fetch(`${backendUrl}/api/admin/stats`),
        fetch(`${backendUrl}/api/admin/tags`),
        fetch(`${backendUrl}/api/admin/logs?t=${timestamp}`)
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      
      await fetchUsersAndHosts();
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleUserAction = async (userId: string, action: 'delete' | 'suspend' | 'activate') => {
    const confirmMsg = action === 'delete' 
      ? "Are you sure you want to PERMANENTLY delete this user? This cannot be undone."
      : `Are you sure you want to ${action} this user?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/user-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      if (res.ok) {
        await fetchUsersAndHosts();
      } else {
        alert("Action failed. Check backend logs.");
      }
    } catch (error) {
      console.error("Failed user action:", error);
      alert("Network error.");
    }
  };

  const handleHostVerification = async (companyId: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action.toUpperCase()} this host? An email will be sent.`)) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/hosts/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action })
      });
      if (res.ok) {
        await fetchAllData(); // Refresh list to show new status and logs
      }
    } catch (error) {
      console.error("Host verification failed:", error);
      alert("Verification failed.");
    }
  };

  const handleToggleSetting = async (settingName: 'twilio_sms_enabled' | 'twilio_call_enabled') => {
    const newValue = !settings[settingName];
    setSettings(prev => ({ ...prev, [settingName]: newValue })); 
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/admin/update-setting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_name: settingName, setting_value: newValue })
      });
      if (!res.ok) throw new Error("Failed to save to database");
    } catch (error) {
      console.error("Settings update failed:", error);
      alert("Failed to update setting. Reverting...");
      setSettings(prev => ({ ...prev, [settingName]: !newValue })); 
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.tagId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (tag.ownerId && tag.ownerId.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <button onClick={() => setActiveTab('overview')} className={`pb-4 px-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>System Overview</button>
          <button onClick={() => setActiveTab('tags')} className={`pb-4 px-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'tags' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>Tag Directory</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 px-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>User Manager</button>
          <button onClick={() => setActiveTab('hosts')} className={`pb-4 px-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'hosts' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>Host Applications</button>
          <button onClick={() => setActiveTab('logs')} className={`pb-4 px-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}>System Logs</button>
        </div>

        {/* SYSTEM OVERVIEW  */}
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
                  <button onClick={() => handleToggleSetting('twilio_sms_enabled')} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 ${settings.twilio_sms_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
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
                 <button onClick={() => handleToggleSetting('twilio_call_enabled')} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 ${settings.twilio_call_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.twilio_call_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/*  TAG DIRECTORY */}
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

        {/* USER MANAGER */}
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

        {/* HOST APPLICATIONS */}
        {activeTab === 'hosts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-slate-800">Partner Host Verifications</h2>
              <p className="text-sm text-gray-500">Approve or reject companies applying to host shop locations. Approvals trigger an automated email.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Manager Email</th>
                    <th className="px-6 py-4">Business Reg. ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hosts.map((host) => (
                    <tr key={host.companyId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2 mt-1">
                        <Store size={18} className="text-gray-400" /> {host.companyName}
                      </td>
                      <td className="px-6 py-4">{host.managerEmail}</td>
                      <td className="px-6 py-4 font-mono text-xs">{host.registrationId}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          host.status === 'verified' ? 'bg-green-100 text-green-700' :
                          host.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {host.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {host.status === 'pending_verification' ? (
                          <>
                            <button onClick={() => handleHostVerification(host.companyId, 'approve')} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors" title="Approve & Send Email">
                              <Check size={18} />
                            </button>
                            <button onClick={() => handleHostVerification(host.companyId, 'reject')} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Reject Application">
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {hosts.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No host applications found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/*  SYSTEM LOGS */}
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