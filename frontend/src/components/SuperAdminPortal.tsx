import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye,
  EyeOff,
  Database, 
  Users, 
  LogOut, 
  ArrowLeft, 
  AlertTriangle, 
  RefreshCw, 
  FileText,
  Tv,
  Film,
  Wheat
} from 'lucide-react';
import api, { setSuperAdminToken } from '../api/client';
import { SecurityMonitorView } from './SecurityMonitorView';

interface SuperAdminPortalProps {
  onBackToPublic: () => void;
  isDark?: boolean;
}

interface DatabaseMetrics {
  collections: {
    articles: number;
    videos: number;
    reels: number;
    mandiRates: number;
    users: number;
    securityLogs: number;
  };
  storage: {
    tier: string;
    totalLimitMB: number;
    estimatedUsedMB: number;
    safeCapacityPercent: number;
  };
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  onBackToPublic,
  isDark = true
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem('anp_super_admin_token') || localStorage.getItem('anp_super_admin_token');
    return Boolean(token);
  });
  const [masterPin, setMasterPin] = useState('');
  const [showMasterPass, setShowMasterPass] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  // Restore session token if available
  useEffect(() => {
    const token = sessionStorage.getItem('anp_super_admin_token') || localStorage.getItem('anp_super_admin_token');
    if (token) {
      setSuperAdminToken(token);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Navigation State (Strict ENV Control — No setup/reset tabs)
  const [activeTab, setActiveTab] = useState<'security' | 'database'>('security');

  // Database Overview State
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Fetch Database Metrics when database tab is opened
  const fetchDbMetrics = async () => {
    setIsLoadingDb(true);
    try {
      const res = await api.get('/super-admin/database/overview');
      if (res.data?.success && res.data?.data) {
        setDbMetrics(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load database overview:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'database') {
      fetchDbMetrics();
    }
  }, [isAuthenticated, activeTab]);

  // Master Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPin || masterPin.trim().length < 4) {
      setAuthError('कृपया कम से कम 6 अंकों का मास्टर पिन दर्ज करें');
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await api.post('/super-admin/auth/login', { pin: masterPin.trim() });
      if (res.data?.success && res.data?.token) {
        setSuperAdminToken(res.data.token);
        if (rememberSession) {
          localStorage.setItem('anp_super_admin_token', res.data.token);
          localStorage.setItem('anp_super_admin_auth', 'true');
        } else {
          sessionStorage.setItem('anp_super_admin_token', res.data.token);
          sessionStorage.setItem('anp_super_admin_auth', 'true');
        }
        setIsAuthenticated(true);
        setMasterPin('');
      } else {
        setAuthError(res.data?.message || 'गलत सुपर एडमिन मास्टर पिन');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.response?.data?.error || 'प्रमाणीकरण विफल। पुनः प्रयास करें।');
    } finally {
      setIsVerifying(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setSuperAdminToken(null);
    localStorage.removeItem('anp_super_admin_token');
    sessionStorage.removeItem('anp_super_admin_token');
    localStorage.removeItem('anp_super_admin_auth');
    sessionStorage.removeItem('anp_super_admin_auth');
    setIsAuthenticated(false);
    setMasterPin('');
  };

  // -------------------------------------------------------------
  // DEDICATED SUPER ADMIN LOGIN SCREEN (Strict ENV Authentication)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock size={30} />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              Root Level Access
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">सुपर एडमिन सुरक्षा पोर्टल</h1>
            <p className="text-xs text-slate-400">
              यह संपादकीय डेस्क से अलग, अलग क्रेडेंशियल्स वाला मास्टर कंट्रोल पोर्टल है।
            </p>
            <p className="text-[11px] text-indigo-400/80 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-xl">
              🔒 प्रमाणीकरण केवल सर्वर एनवायरनमेंट (SUPER_ADMIN_PIN) से मान्य है।
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-600 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">
                सुपर एडमिन मास्टर पासवर्ड (Root Password)
              </label>
              <div className="relative">
                <input
                  type={showMasterPass ? 'text' : 'password'}
                  value={masterPin}
                  onChange={(e) => setMasterPin(e.target.value)}
                  placeholder="अपना मास्टर पासवर्ड दर्ज करें"
                  className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm tracking-wider focus:border-indigo-500 focus:outline-none shadow-inner transition"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMasterPass(!showMasterPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition"
                  title={showMasterPass ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
                >
                  {showMasterPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>इस डिवाइस पर सत्र याद रखें</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {isVerifying ? 'सत्यापन जारी...' : 'सुरक्षित रूट लॉगिन'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <button onClick={onBackToPublic} className="hover:text-slate-300 flex items-center gap-1">
              <ArrowLeft size={13} />
              <span>पब्लिक पोर्टल</span>
            </button>
            <span className="text-[10px]">सुरक्षित पोर्टल</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW C: FULL SUPER ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. SUPER ADMIN TOP HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-4 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm md:text-base text-white tracking-tight">AMBITION NEWS ROOT</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400">सुरक्षा गवर्नेंस, MongoDB स्टोरेज व सिस्टम टेलीमेट्री</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">पब्लिक पोर्टल</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <LogOut size={13} />
              <span>लॉग आउट</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. TABS NAVIGATION */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto text-xs font-bold no-scrollbar py-2">
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck size={14} />
            <span>🛡️ सुरक्षा व अटैक मॉनिटर</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database size={14} />
            <span>💾 Atlas स्टोरेज व संग्रह</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        
        {/* TAB 1: SECURITY & ATTACK MONITOR */}
        {activeTab === 'security' && (
          <SecurityMonitorView isDark={isDark} />
        )}

        {/* TAB 2: DATABASE STORAGE & COLLECTIONS GAUGES */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Database className="text-emerald-400" size={18} />
                  <span>MongoDB Atlas M0 (512MB) स्टोरेज हेल्थ व क्षमता</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">डेटाबेस ओवरफ्लो और ब्लोट अटैक्स से सुरक्षा आंकड़े</p>
              </div>
              <button
                onClick={fetchDbMetrics}
                disabled={isLoadingDb}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw size={13} className={isLoadingDb ? 'animate-spin' : ''} />
                <span>रीफ़्रेश</span>
              </button>
            </div>

            {/* Storage Meter */}
            {dbMetrics?.storage && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Atlas स्टोरेज क्षमता मीटर</span>
                  <span className="text-emerald-400">{dbMetrics.storage.estimatedUsedMB} MB / {dbMetrics.storage.totalLimitMB} MB (लगभग)</span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, dbMetrics.storage.safeCapacityPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>सुरक्षित क्षमता: {100 - dbMetrics.storage.safeCapacityPercent}% शेष</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    🟢 स्वास्थ्य: अत्यंत सुरक्षित (Safe)
                  </span>
                </div>
              </div>
            )}

            {/* Collections Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">प्रकाशित लेख</div>
                  <div className="text-xl font-black text-white">{dbMetrics?.collections?.articles || 0}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                  <Tv size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">यूट्यूब बुलेटिन</div>
                  <div className="text-xl font-black text-white">{dbMetrics?.collections?.videos || 0}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Film size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">रील्स व शॉर्ट्स</div>
                  <div className="text-xl font-black text-white">{dbMetrics?.collections?.reels || 0}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Wheat size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">मंडी भाव रिकॉर्ड्स</div>
                  <div className="text-xl font-black text-white">{dbMetrics?.collections?.mandiRates || 0}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">उपयोगकर्ता व रिपोर्टर्स</div>
                  <div className="text-xl font-black text-white">{dbMetrics?.collections?.users || 0}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">सुरक्षा ऑडिट लॉग्स (14d TTL)</div>
                  <div className="text-xl font-black text-white">{dbMetrics?.collections?.securityLogs || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
