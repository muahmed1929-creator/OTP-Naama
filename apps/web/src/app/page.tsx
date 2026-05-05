'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';

const StatsCard = dynamic(() => import('@/components/StatsCard').then(mod => mod.StatsCard), { ssr: false });
const LogTable = dynamic(() => import('@/components/LogTable').then(mod => mod.LogTable), { ssr: false });
const AreaChart = dynamic(() => import('@/components/AreaChart').then(mod => mod.AreaChart), { ssr: false });
import {
  Key,
  Send,
  AlertCircle,
  Zap,
  RefreshCw,
  LayoutDashboard,
  Settings,
  Layers,
  X,
  Plus,
  ArrowRight,
  Search
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { useRouter } from 'next/navigation';

const API_URL = '/api';

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Djibouti", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [area, setArea] = useState('');
  const [panelId, setPanelId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generatedOtpCode, setGeneratedOtpCode] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'manual' | 'auto'>('manual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'panels' | 'settings'>('dashboard');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('otp_token');
    localStorage.removeItem('otp_api_key');
    localStorage.removeItem('otp_user');
    router.push('/login');
  }, [router]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('otp_token');
    const apiKey = localStorage.getItem('otp_api_key');

    if (!token || !apiKey) {
      setLoading(false);
      return;
    }

    try {
      const logsEndpoint = searchQuery ? `/otp/search?q=${encodeURIComponent(searchQuery)}` : '/otp/logs';
      const [statsRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/otp/stats`, { headers: { 'x-api-key': apiKey }, timeout: 15000 }),
        axios.get(`${API_URL}${logsEndpoint}`, { headers: { 'x-api-key': apiKey }, timeout: 15000 })
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
    } catch (error: any) {
      if (error.response?.status === 401) handleLogout();
      // Silently handle network errors — dashboard will retry on next interval
    } finally {
      setLoading(false);
    }
  }, [API_URL, handleLogout]);

  useEffect(() => {
    const token = localStorage.getItem('otp_token');
    const apiKey = localStorage.getItem('otp_api_key');

    if (!token || !apiKey) {
      router.push('/login');
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('otp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s (faster for search feedback)

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Safety timeout: if API hangs, at least show the UI after 5s
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
      clearTimeout(safetyTimeout);
    };
  }, []); // Run only once on mount

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area) return;

    setIsGenerating(true);
    try {
      const apiKey = localStorage.getItem('otp_api_key');
      const response = await axios.post(`${API_URL}/otp/generate`,
        { area, mode: generationMode, phoneNumber, panel_id: panelId || undefined },
        { headers: { 'x-api-key': apiKey }, timeout: 15000 }
      );

      const otpCode = response.data?.data?.otpCode || '000000';
      setGeneratedOtpCode(otpCode);
      fetchData(); // Refresh stats
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to generate OTP. Please try again.';
      alert(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery, fetchData]);



  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] p-6 flex flex-col gap-8 animate-pulse">
        <div className="h-24 bg-white rounded-dashboard w-full" />
        <div className="flex-1 flex gap-8">
          <div className="w-24 bg-white rounded-dashboard" />
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-card" />)}
            </div>
            <div className="h-64 bg-white rounded-card" />
            <div className="h-96 bg-white rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] overflow-hidden p-6">
      <div className="flex w-full bg-white rounded-dashboard shadow-2xl overflow-hidden border border-white/50">
        {/* Sidebar */}
        <aside className="w-24 bg-[#121212] flex flex-col items-center py-10 justify-between">
          <div className="flex flex-col items-center gap-10">
            <div className="w-14 h-14 relative flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Naama Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <nav className="flex flex-col gap-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`p-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-white'}`}
              >
                <LayoutDashboard className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`p-3 rounded-2xl transition-all ${activeTab === 'logs' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-white'}`}
              >
                <Send className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveTab('panels')}
                className={`p-3 rounded-2xl transition-all ${activeTab === 'panels' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-white'}`}
              >
                <Layers className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-white'}`}
              >
                <Settings className="w-6 h-6" />
              </button>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 text-gray-500 hover:text-rose-500 transition-all"
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="px-12 py-10 flex justify-between items-start relative">
            <div>
              <div className="mb-6 h-24 w-96 relative">
                <Image
                  src="/logo.png"
                  alt="Naama Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Monitor health of <br /> your business
              </h1>
              <p className="text-gray-400 font-medium mt-3">Control and analyze your data in the easiest way</p>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <p className="text-xl font-black text-gray-900 tracking-tight">
                {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
              </p>
              <p className="text-sm font-bold text-blue-600 tabular-nums">
                {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '--:--:--'}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search number or OTP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    className="bg-gray-100/50 border-none rounded-2xl py-3 pl-12 pr-4 w-64 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <X 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                    onClick={() => {
                      setSearchQuery('');
                      // fetchData will be triggered by useEffect
                    }}
                  />
                </div>
                <button
                  onClick={() => fetchData()}
                  className="px-4 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              <button
                onClick={() => {
                  setArea('Global');
                  setPhoneNumber('');
                  setPanelId('');
                  setGeneratedOtpCode(null);
                  setGenerationMode('manual');
                  setIsModalOpen(true);
                }}
                className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white hover:bg-black transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* Scrollable Workspace */}
          <main className="flex-1 px-12 pb-12 overflow-y-auto custom-scrollbar">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-12 gap-8">
                {/* Left Column: Stats and Charts */}
                <div className="col-span-8 space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-6">
                    <StatsCard
                      title="Daily OTPs"
                      value={stats?.metrics?.daily || 0}
                      icon={Key}
                      gradient="grad-purple"
                      subtitle="Last 24 hours"
                    />
                    <StatsCard
                      title="Weekly OTPs"
                      value={stats?.metrics?.weekly || 0}
                      icon={LayoutDashboard}
                      gradient="grad-cyan"
                      subtitle="Last 7 days"
                    />
                    <StatsCard
                      title="Monthly OTPs"
                      value={stats?.metrics?.monthly || 0}
                      icon={AlertCircle}
                      subtitle="Last 30 days"
                    />
                  </div>

                  {/* Big Chart Section */}
                  <AreaChart data={stats?.areaStats || []} />
                </div>

                {/* Right Column: Performance and Profile */}
                <div className="col-span-4 space-y-8">
                  {/* Hero Card/Image Placeholder */}
                  <div className="aspect-square bg-[#bae6fd] rounded-card overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 text-white">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Featured Area</p>
                      <h4 className="text-2xl font-black">Global Expansion</h4>
                    </div>
                  </div>

                  {/* Panel Performance List */}
                  <div className="bg-white rounded-card shadow-soft p-8 border border-white/40">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold text-gray-900">Panels</h3>
                      <button
                        onClick={() => setActiveTab('panels')}
                        className="text-gray-400 hover:text-black transition-all"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      {stats?.panelStats?.length > 0 ? stats.panelStats.map((panel: any, idx: number) => (
                        <div key={panel.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                              {panel.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{panel.name}</p>
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{panel.total} Requests</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-sm font-black ${idx === 0 ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                              {panel.total > 0 ? Math.round((panel.success / panel.total) * 100) : 0}%
                            </span>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-500">+{idx + 2}%</span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-gray-400 text-sm italic py-4">No panels active yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Logs Section (Full Width) */}
                <div className="col-span-12">
                  <LogTable logs={logs} onViewAll={() => setActiveTab('logs')} onRefresh={fetchData} />
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-gray-900">OTP Logs</h2>
                  <div className="flex gap-4">
                    <button onClick={fetchData} className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                      <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-card shadow-soft overflow-hidden border border-white/40">
                  <LogTable logs={logs} onRefresh={fetchData} />
                </div>
              </div>
            )}

            {activeTab === 'panels' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black text-gray-900">Panels Management</h2>
                  <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all">
                    <Plus className="w-5 h-5" /> Add Panel
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-8">
                  {stats?.panelStats?.map((panel: any) => (
                    <div key={panel.id} className="bg-white rounded-card p-8 shadow-soft border border-white/40 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-600/20">
                          {panel.name[0]}
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-500 transition-all"><Settings className="w-5 h-5" /></button>
                          <button className="p-2 text-gray-400 hover:text-rose-500 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{panel.name}</h3>
                        <p className="text-gray-400 text-sm font-medium mt-1">API Endpoint: {panel.apiUrl || 'https://api.panel.com'}</p>
                      </div>
                      <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Success Rate</p>
                          <p className="text-lg font-black text-emerald-500">{panel.total > 0 ? Math.round((panel.success / panel.total) * 100) : 0}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Otps</p>
                          <p className="text-lg font-black text-gray-900">{panel.total}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-card p-8 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all group">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                      <Plus className="w-8 h-8" />
                    </div>
                    <span className="font-bold">Add New Panel</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl space-y-8">
                <h2 className="text-3xl font-black text-gray-900">Settings</h2>

                {/* Profile Section */}
                <div className="bg-white rounded-card p-8 shadow-soft border border-white/40">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Full Name</label>
                      <input type="text" value={user?.name || ''} readOnly className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Email Address</label>
                      <input type="text" value={user?.email || ''} readOnly className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900" />
                    </div>
                  </div>
                </div>

                {/* API Security Section */}
                <div className="bg-white rounded-card p-8 shadow-soft border border-white/40">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">API Access</h3>
                    <button className="text-blue-600 font-bold text-sm hover:underline">Rotate Key</button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm font-medium">Use this key to authenticate your external requests.</p>
                    <div className="relative group">
                      <input
                        type="password"
                        value={localStorage.getItem('otp_api_key') || ''}
                        readOnly
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-mono text-sm tracking-widest text-gray-900 pr-12"
                      />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
                        <Key className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="bg-gray-900 rounded-card p-8 shadow-3xl text-white">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold">Admin Console</h3>
                        <p className="text-gray-400 text-sm mt-1">Manage employees and system-wide settings</p>
                      </div>
                      <button className="bg-blue-600 px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">Add Employee</button>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <p className="text-sm font-bold text-blue-400 mb-2">Notice</p>
                      <p className="text-gray-300 text-sm">You are currently logged in as a Super Admin. You have full access to panels, logs, and user management.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          <footer className="px-12 py-8 bg-[#1C222E] flex justify-center items-center text-white text-sm font-medium">
            <p>© 2026 Naama. All rights reserved.</p>
          </footer>
        </div>
      </div>

      {/* Modal remains largely the same but styled for the new theme */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-3xl border border-white"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">New Request</h2>
                  <p className="text-gray-400 text-sm font-medium">Generate a new OTP sequence</p>
                </div>
              </div>

              {!generatedOtpCode ? (
                <form onSubmit={handleGenerateOtp} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Target Region / Country (Optional)</label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Global">🌍 Global (Any Country)</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Panel (Optional)</label>
                    <select
                      value={panelId}
                      onChange={(e) => setPanelId(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">All Panels (Auto-Distribute)</option>
                      {stats?.panelStats?.map((panel: any) => (
                        <option key={panel.id} value={panel.id}>{panel.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                      {generationMode === 'auto' ? '📱 Phone Numbers (Any Country — Paste Bulk)' : '📱 Phone Number (Any Country)'}
                    </label>
                    {generationMode === 'auto' ? (
                      <textarea
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={"Paste numbers from ANY country, separated by comma or new line...\n+1 234 567 8900 (USA)\n+44 7911 123456 (UK)\n+92 311 5907063 (PK)\n+971 50 123 4567 (UAE)\n+91 98765 43210 (India)\n+86 139 1234 5678 (China)"}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-300 min-h-[180px] resize-y custom-scrollbar text-sm"
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Any number: +1..., +44..., +92..., +971..., +91..."
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-300"
                        required
                      />
                    )}
                    <p className="text-[11px] text-gray-400 mt-2 font-medium">🌍 Works with any international number — USA, UK, Pakistan, UAE, India, China, etc.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Generation Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setGenerationMode('auto')}
                        className={`py-4 px-6 rounded-2xl font-black text-sm border-2 transition-all ${generationMode === 'auto'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                      >
                        🔄 Auto (Bulk)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerationMode('manual')}
                        className={`py-4 px-6 rounded-2xl font-black text-sm border-2 transition-all ${generationMode === 'manual'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                      >
                        ⚡ Manual (Single)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <>🌍 Generate OTP <ArrowRight className="w-6 h-6" /></>
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Generated OTP</p>
                  <div className="bg-emerald-50 text-emerald-600 text-5xl font-black tracking-[0.25em] px-10 py-8 rounded-3xl border-2 border-emerald-100 shadow-inner">
                    {generatedOtpCode}
                  </div>
                  <p className="text-emerald-500 text-sm font-medium mt-6 text-center">
                    {generationMode === 'auto'
                      ? 'Bulk generation started! Background workers are securely processing.'
                      : 'Ready to connect with panels later'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full mt-10 py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-lg transition-all shadow-xl"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
