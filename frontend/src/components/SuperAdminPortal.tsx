import React, { useState, useEffect, useRef } from 'react';
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
  Wheat,
  Download,
  UploadCloud,
  KeyRound,
  Copy,
  Check,
  RotateCcw,
  Archive,
  CheckCircle2,
  Calendar,
  Layers
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

interface BackupSnapshotItem {
  _id: string;
  name: string;
  type: 'AUTOMATED_DAILY' | 'MANUAL_ON_DEMAND' | 'PRE_MIGRATION';
  counts: {
    articles: number;
    mandiRates: number;
    reporters: number;
    videos: number;
    reels: number;
    advertisements: number;
  };
  totalRecords: number;
  sizeBytes: number;
  createdBy: string;
  createdAt: string;
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

  // 2FA Login Challenge State
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [temp2FAToken, setTemp2FAToken] = useState('');
  const [twoFactorInput, setTwoFactorInput] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

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

  // Navigation State
  const [activeTab, setActiveTab] = useState<'security' | 'database' | 'backup' | 'twoFactor'>('security');

  // Database Overview State
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Backup & Disaster Recovery States
  const [snapshots, setSnapshots] = useState<BackupSnapshotItem[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupActionMsg, setBackupActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  // 2FA Management States
  const [twoFactorConfig, setTwoFactorConfig] = useState<{
    enabled: boolean;
    remainingBackupCodes: number;
    enabledAt?: string | null;
  } | null>(null);
  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [pendingSetup, setPendingSetup] = useState<{
    secret: string;
    otpAuthUrl: string;
    emergencyBackupCodes: string[];
  } | null>(null);
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [twoFactorMgmtMsg, setTwoFactorMgmtMsg] = useState<string | null>(null);

  // Fetch Database Metrics
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

  // Fetch Backup Snapshots
  const fetchSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const res = await api.get('/super-admin/backup/snapshots');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setSnapshots(res.data.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  // Fetch 2FA Status
  const fetch2FAStatus = async () => {
    setIsLoading2FA(true);
    try {
      const res = await api.get('/super-admin/2fa/status');
      if (res.data?.success && res.data?.data) {
        setTwoFactorConfig(res.data.data);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading2FA(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'database') fetchDbMetrics();
    if (activeTab === 'backup') fetchSnapshots();
    if (activeTab === 'twoFactor') fetch2FAStatus();
  }, [isAuthenticated, activeTab]);

  // Master Login Handler (Step 1)
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
      
      // Step 2 Required: 2FA is active
      if (res.data?.require2FA) {
        setIs2FARequired(true);
        setTemp2FAToken(res.data.tempToken);
        setAuthError(null);
        return;
      }

      // Direct Login (2FA not enabled)
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

  // 2FA Verification Handler (Step 2)
  const handleVerify2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorInput.trim()) {
      setTwoFactorError('कृपया 6-अंकों का Authenticator कोड या बैकअप कोड दर्ज करें');
      return;
    }

    setIsVerifying2FA(true);
    setTwoFactorError(null);

    try {
      const res = await api.post('/super-admin/auth/verify-2fa', {
        tempToken: temp2FAToken,
        code: twoFactorInput.trim()
      });

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
        setIs2FARequired(false);
        setTwoFactorInput('');
        setMasterPin('');
      } else {
        setTwoFactorError(res.data?.message || 'अमान्य 2FA कोड');
      }
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.message || '2FA कोड सत्यापन विफल। कृपया ताज़ा कोड दर्ज करें।');
    } finally {
      setIsVerifying2FA(false);
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
    setIs2FARequired(false);
    setMasterPin('');
  };

  // ---------------- BACKUP HANDLERS ----------------
  const handleDownloadBackupExport = async () => {
    setIsExporting(true);
    setBackupActionMsg(null);
    try {
      const res = await api.get('/super-admin/backup/export', { responseType: 'blob' });
      const dateStr = new Date().toISOString().split('T')[0];
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `anp-database-backup-${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setBackupActionMsg({ type: 'success', text: '🎉 पूर्ण डेटाबेस बैकअप (.json) सफलतापूर्वक डाउनलोड हो गया!' });
    } catch {
      setBackupActionMsg({ type: 'error', text: 'बैकअप फ़ाइल डाउनलोड करने में विफलता हुई।' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateManualSnapshot = async () => {
    setBackupActionMsg(null);
    try {
      const res = await api.post('/super-admin/backup/snapshots/run');
      if (res.data?.success) {
        setBackupActionMsg({ type: 'success', text: '✅ नया डेटाबेस स्नैपशॉट सफलतापूर्वक तैयार और संग्रहीत हो गया!' });
        fetchSnapshots();
      }
    } catch {
      setBackupActionMsg({ type: 'error', text: 'स्नैपशॉट बनाने में समस्या आई।' });
    }
  };

  const handleFileRestoreSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!confirm('⚠️ चेतावनी: क्या आप सच में इस बैकअप स्नैपशॉट से डेटाबेस रिस्टोर करना चाहते हैं? यह सभी खबरों और मंडी भावों को बैकअप डेटा से सिंक कर देगा।')) {
          return;
        }
        setIsRestoring(true);
        setBackupActionMsg(null);
        const res = await api.post('/super-admin/backup/restore', json);
        if (res.data?.success) {
          const stats = res.data.data;
          setBackupActionMsg({
            type: 'success',
            text: `🎉 सफलतापूर्वक रिस्टोर हुआ! (${stats.restoredArticles} खबरें, ${stats.restoredMandi} मंडी भाव, ${stats.restoredReporters} रिपोर्टर्स)`
          });
          fetchDbMetrics();
        }
      } catch (err: any) {
        setBackupActionMsg({ type: 'error', text: err.response?.data?.message || 'अमान्य बैकअप फ़ाइल या पार्सिंग त्रुटि।' });
      } finally {
        setIsRestoring(false);
        if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFromSnapshotId = async (id: string, name: string) => {
    if (!confirm(`क्या आप स्नैपशॉट '${name}' से डेटाबेस रिस्टोर करना चाहते हैं?`)) return;
    setIsRestoring(true);
    setBackupActionMsg(null);
    try {
      const res = await api.post(`/super-admin/backup/snapshots/${id}/restore`);
      if (res.data?.success) {
        setBackupActionMsg({ type: 'success', text: `🎉 स्नैपशॉट '${name}' से डेटाबेस सफलतापूर्वक पुनर्स्थापित हुआ!` });
        fetchDbMetrics();
      }
    } catch {
      setBackupActionMsg({ type: 'error', text: 'स्नैपशॉट रिस्टोर करने में विफलता हुई।' });
    } finally {
      setIsRestoring(false);
    }
  };

  // ---------------- 2FA HANDLERS ----------------
  const handleStart2FASetup = async () => {
    setTwoFactorMgmtMsg(null);
    try {
      const res = await api.post('/super-admin/2fa/setup');
      if (res.data?.success && res.data?.data) {
        setPendingSetup(res.data.data);
      }
    } catch {
      alert('2FA सेटअप प्रारंभ करने में विफल');
    }
  };

  const handleVerifyAndEnable2FA = async () => {
    if (!verifyOtpInput.trim()) return;
    try {
      const res = await api.post('/super-admin/2fa/verify-and-enable', { code: verifyOtpInput.trim() });
      if (res.data?.success) {
        setTwoFactorMgmtMsg('🎉 2-फैक्टर ऑथेंटिकेशन (2FA) सफलतापूर्वक सक्रिय हो गया!');
        setPendingSetup(null);
        setVerifyOtpInput('');
        fetch2FAStatus();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'अमान्य कोड। कृपया ऐप से ताज़ा 6-अंकों का कोड दर्ज करें।');
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('क्या आप सच में 2-फैक्टर सुरक्षा निष्क्रिय करना चाहते हैं?')) return;
    try {
      const res = await api.post('/super-admin/2fa/disable');
      if (res.data?.success) {
        setTwoFactorMgmtMsg('2FA सुरक्षा निष्क्रिय कर दी गई।');
        setPendingSetup(null);
        fetch2FAStatus();
      }
    } catch {
      alert('2FA अक्षम करने में विफल');
    }
  };

  // -------------------------------------------------------------
  // LOGIN SCREEN (Step 1: PIN | Step 2: 2FA Authenticator)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              {is2FARequired ? <KeyRound size={32} /> : <Lock size={32} />}
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              {is2FARequired ? '2-फैक्टर ऑथेंटिकेशन (2FA)' : 'रूट सुरक्षा व सुपर एडमिन पोर्टल'}
            </h1>
            <p className="text-xs text-slate-400">
              {is2FARequired 
                ? 'मास्टर पिन सत्यापित। कृपया अपने Google Authenticator या बैकअप कोड से लॉगिन पूर्ण करें।'
                : 'केवल अधिकृत चीफ सिक्योरिटी ऑफिसर व रूट एडमिनिस्ट्रेटर हेतु'}
            </p>
          </div>

          {!is2FARequired ? (
            /* STEP 1: PIN LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  सुपर एडमिन मास्टर पिन (Root Master PIN)
                </label>
                <div className="relative">
                  <input
                    type={showMasterPass ? 'text' : 'password'}
                    value={masterPin}
                    onChange={(e) => {
                      setMasterPin(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl py-3.5 pl-4 pr-11 text-sm font-mono tracking-widest bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 outline-none transition"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPass(!showMasterPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showMasterPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {authError && (
                  <div className="mt-2 text-xs font-bold p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>इस ब्राउज़र पर सेशन याद रखें</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 active:scale-98 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>सत्यापित किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>रूट एक्सेस अनलॉक करें</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 2FA TOTP CHALLENGE */
            <form onSubmit={handleVerify2FALogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  6-अंकों का Authenticator कोड (या 8-अंकों का बैकअप कोड)
                </label>
                <input
                  type="text"
                  value={twoFactorInput}
                  onChange={(e) => {
                    setTwoFactorInput(e.target.value);
                    if (twoFactorError) setTwoFactorError(null);
                  }}
                  placeholder="उदा. 482910 या ANP-4829-1049"
                  className="w-full rounded-2xl py-3.5 px-4 text-center text-lg font-mono font-black tracking-widest bg-slate-950 border border-indigo-500/50 text-indigo-300 focus:border-indigo-400 outline-none transition"
                  autoFocus
                  required
                />

                {twoFactorError && (
                  <div className="mt-2 text-xs font-bold p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{twoFactorError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying2FA}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30 active:scale-98 disabled:opacity-50"
              >
                {isVerifying2FA ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>कोड सत्यापित हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>2FA सत्यापित कर लॉगिन करें</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIs2FARequired(false);
                  setTwoFactorInput('');
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
              >
                ← वापस मास्टर पिन पर जाएं
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onBackToPublic}
              className="text-xs text-slate-400 hover:text-indigo-400 font-bold transition flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft size={13} />
              <span>पब्लिक पोर्टल पर वापस जाएं</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED SUPER ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. TOP SECURE BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-sm">
              👑
            </div>
            <div>
              <div className="text-xs font-black tracking-wide text-white flex items-center gap-2">
                <span>AMBITION SUPER ADMIN & GOVERNANCE DESK</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  ROOT SESSION ACTIVE
                </span>
              </div>
              <div className="text-[10px] text-slate-400">छत्तीसगढ़ व मध्य प्रदेश 88 ज़िले • केंद्रीय सुरक्षा नियंत्रण</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition text-slate-300"
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
            <span>💾 Atlas स्टोरेज व क्षमता</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Archive size={14} />
            <span>📦 बैकअप व डिजास्टर रिकवरी</span>
          </button>

          <button
            onClick={() => setActiveTab('twoFactor')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'twoFactor'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <KeyRound size={14} />
            <span>🔐 2-फैक्टर (2FA) ऑथेंटिकेशन</span>
            {twoFactorConfig?.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
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

        {/* TAB 3: BACKUP & DISASTER RECOVERY DESK */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-white">
                  <Archive className="text-indigo-400" size={18} />
                  <span>डेटाबेस बैकअप व संपूर्ण रिकवरी डेस्क (Disaster Recovery Engine)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  1-क्लिक पूर्ण डेटाबेस स्नैपशॉट डाउनलोड, ऑफ़लाइन संग्रह, व आपातकालीन रोलबैक
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateManualSnapshot}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <Layers size={14} />
                  <span>+ नया आंतरिक स्नैपशॉट</span>
                </button>

                <button
                  onClick={handleDownloadBackupExport}
                  disabled={isExporting}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>{isExporting ? 'डाउनलोड हो रहा...' : '📥 1-क्लिक बैकअप डाउनलोड (.json)'}</span>
                </button>
              </div>
            </div>

            {backupActionMsg && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                backupActionMsg.type === 'success' 
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-950/50 border-red-500/40 text-red-300'
              }`}>
                <span>{backupActionMsg.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{backupActionMsg.text}</span>
              </div>
            )}

            {/* Restore Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">बाहरी बैकअप फ़ाइल से डेटाबेस रिस्टोर करें</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    पूर्व में डाउनलोड की गई JSON बैकअप फ़ाइल चुनें। सिस्टम सभी खबरों, रिपोर्टर्स व मंडी भावों को सुरक्षित रूप से पुनर्स्थापित कर देगा।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="file" 
                  ref={restoreFileInputRef}
                  accept=".json" 
                  onChange={handleFileRestoreSelect} 
                  className="hidden" 
                />
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={() => restoreFileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  <span>{isRestoring ? 'डेटाबेस रिस्टोर हो रहा है...' : '📤 बैकअप फ़ाइल चुनें व रिस्टोर करें'}</span>
                </button>
                <span className="text-[11px] text-slate-500 font-mono">समर्थित प्रारूप: .json (Ambition News v2.0 Snapshot)</span>
              </div>
            </div>

            {/* Rolling Automated Snapshots List */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Calendar size={16} className="text-indigo-400" />
                  <span>स्वचालित दैनिक स्नैपशॉट इतिहास (Rolling 14-Day Snapshots)</span>
                </div>
                <button
                  onClick={fetchSnapshots}
                  disabled={isLoadingSnapshots}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold transition"
                >
                  <RefreshCw size={12} className={isLoadingSnapshots ? 'animate-spin' : ''} />
                  <span>ताज़ा करें</span>
                </button>
              </div>

              {snapshots.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  {isLoadingSnapshots ? 'स्नैपशॉट लोड हो रहे हैं...' : 'कोई आंतरिक स्नैपशॉट नहीं मिला। ऊपर "+ नया आंतरिक स्नैपशॉट" पर क्लिक करें या 24 घंटे के ऑटो-शेड्यूलर की प्रतीक्षा करें।'}
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {snapshots.map((snap) => (
                    <div key={snap._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{snap.name}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-md ${
                            snap.type === 'AUTOMATED_DAILY' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {snap.type === 'AUTOMATED_DAILY' ? 'दैनिक ऑटो-बैकअप' : 'मैन्युअल स्नैपशॉट'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-2">
                          <span>📅 {new Date(snap.createdAt).toLocaleString('hi-IN')}</span>
                          <span>•</span>
                          <span>📄 {snap.counts.articles} लेख</span>
                          <span>•</span>
                          <span>🌾 {snap.counts.mandiRates} मंडी भाव</span>
                          <span>•</span>
                          <span>👥 {snap.counts.reporters} रिपोर्टर्स</span>
                          <span>•</span>
                          <span>💾 {Math.round(snap.sizeBytes / 1024)} KB</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestoreFromSnapshotId(snap._id, snap.name)}
                        disabled={isRestoring}
                        className="px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-center active:scale-95 disabled:opacity-50"
                      >
                        <RotateCcw size={12} />
                        <span>इस स्नैपशॉट पर रोलबैक करें</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: 2-FACTOR AUTHENTICATION & EMERGENCY CODES DESK */}
        {activeTab === 'twoFactor' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-white">
                  <KeyRound className="text-emerald-400" size={18} />
                  <span>बैंक-ग्रेड 2-फैक्टर ऑथेंटिकेशन (RFC 6238 TOTP Engine)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Google Authenticator / Microsoft Authenticator व ऑफ़लाइन इमरजेंसी रिकवरी कोड्स
                </p>
              </div>

              {isLoading2FA ? (
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold animate-pulse">
                  लोड हो रहा है...
                </span>
              ) : twoFactorConfig?.enabled ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>2FA सुरक्षा सक्रिय (Active)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                  2FA निष्क्रिय (Disabled)
                </span>
              )}
            </div>

            {twoFactorMgmtMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                {twoFactorMgmtMsg}
              </div>
            )}

            {/* Status Card */}
            {twoFactorConfig?.enabled ? (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">आपका सुपर एडमिन खाता 2FA द्वारा सुरक्षित है</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      प्रत्येक लॉगिन पर आपके Google Authenticator ऐप से 6-अंकों का डायनामिक कोड आवश्यक होगा। यह पासवर्ड लीक होने पर भी अनधिकृत एक्सेस को रोकता है।
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-300">
                      <span>• शेष आपातकालीन बैकअप कोड: <strong className="text-amber-400">{twoFactorConfig.remainingBackupCodes}</strong></span>
                      {twoFactorConfig.enabledAt && (
                        <span>• सक्रिय दिनांक: {new Date(twoFactorConfig.enabledAt).toLocaleDateString('hi-IN')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                  <button
                    onClick={handleStart2FASetup}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
                  >
                    नया सीक्रेट व बैकअप कोड्स बनाएं (Regenerate)
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-xs font-bold text-red-300 transition"
                  >
                    2FA सुरक्षा निष्क्रिय करें
                  </button>
                </div>
              </div>
            ) : null}

            {/* Setup Wizard (When inactive or regenerating) */}
            {(!twoFactorConfig?.enabled || pendingSetup) && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                {!pendingSetup ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white">2-फैक्टर ऑथेंटिकेशन (2FA) सेटअप प्रारंभ करें</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      2FA चालू करने पर आपको अपने फोन में <strong>Google Authenticator</strong> या <strong>Microsoft Authenticator</strong> ऐप जोड़ना होगा। बस्तर या ग्रामीण क्षेत्रों में नेटवर्क न होने पर भी यह 100% ऑफ़लाइन काम करता है।
                    </p>
                    <button
                      onClick={handleStart2FASetup}
                      className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
                    >
                      <KeyRound size={15} />
                      <span>नया 2FA सीक्रेट व 5 इमरजेंसी बैकअप कोड्स जनरेट करें</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white">चरण 1: Authenticator ऐप में खाता जोड़ें</h3>
                      <p className="text-xs text-slate-400 mt-0.5">नीचे दिए गए सीक्रेट कोड को अपने Google Authenticator ऐप में 'मैन्युअल की' के रूप में दर्ज करें:</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Base32 Secret Key (RFC 6238)</div>
                        <div className="text-base font-mono font-black text-indigo-400 tracking-wider mt-0.5 select-all">
                          {pendingSetup.secret}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pendingSetup.secret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition text-slate-200 self-start sm:self-center"
                      >
                        {copiedSecret ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedSecret ? 'कॉपी हो गया' : 'सीक्रेट कॉपी करें'}</span>
                      </button>
                    </div>

                    {/* Emergency Offline Backup Codes */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <span>🛡️ 5 आपातकालीन ऑफ़लाइन बैकअप कोड्स (Single-Use Recovery Codes)</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            यदि आपका फोन खो जाए या नेटवर्क न हो, तो इनमें से किसी भी 1 कोड का उपयोग करके लॉगिन कर सकते हैं।
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(pendingSetup.emergencyBackupCodes.join('\n'));
                            setCopiedCodes(true);
                            setTimeout(() => setCopiedCodes(false), 2000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition text-slate-200"
                        >
                          {copiedCodes ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          <span>{copiedCodes ? 'कॉपी हो गए' : 'सभी कोड्स कॉपी करें'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                        {pendingSetup.emergencyBackupCodes.map((code, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center font-bold text-amber-300">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Verification Input */}
                    <div className="border-t border-slate-800 pt-4 space-y-3">
                      <h4 className="text-xs font-bold text-white">चरण 2: 6-अंकों का टेस्ट कोड डालकर 2FA चालू करें</h4>
                      <div className="flex items-center gap-3 max-w-md">
                        <input
                          type="text"
                          value={verifyOtpInput}
                          onChange={(e) => setVerifyOtpInput(e.target.value)}
                          placeholder="उदा. 592014"
                          maxLength={6}
                          className="flex-1 rounded-xl p-2.5 text-center text-sm font-mono font-bold tracking-widest bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 outline-none"
                        />
                        <button
                          onClick={handleVerifyAndEnable2FA}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95"
                        >
                          सत्यापित कर 2FA चालू करें
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};
