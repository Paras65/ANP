import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Activity, 
  Server, 
  Cpu, 
  Clock, 
  Copy, 
  Check, 
  Database, 
  Sparkles, 
  Lock
} from 'lucide-react';
import api from '../api/client';

export interface SecurityIncident {
  _id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  details?: string;
  repeatCount: number;
  blocked: boolean;
  createdAt: string;
}

export interface SecurityStats {
  totalBlocked: number;
  last24hCount: number;
  topAttackerIPs: Array<{ ip: string; count: number; lastSeen: string }>;
  threatBreakdown: Array<{ eventType: string; count: number }>;
  recentLogs: SecurityIncident[];
  systemStatus: {
    uptimeSeconds: number;
    memoryUsageMB: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
    dbStatus: string;
    nodeEnv: string;
    geminiConfigured: boolean;
  };
}

interface SecurityMonitorViewProps {
  isDark: boolean;
}

export const SecurityMonitorView: React.FC<SecurityMonitorViewProps> = ({ isDark }) => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [flushing, setFlushing] = useState<boolean>(false);
  const [testingProbe, setTestingProbe] = useState<boolean>(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/super-admin/security/stats');
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load security telemetry:', err);
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || 'सुरक्षा आंकड़े लोड करने में विफल'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-poll security stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFlushLogs = async () => {
    if (!window.confirm('क्या आप सचमुच सभी सुरक्षा लॉग साफ़ करना चाहते हैं?')) return;
    setFlushing(true);
    try {
      const res = await api.delete('/super-admin/security/logs');
      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'सुरक्षा लॉग सफलतापूर्वक साफ़ कर दिए गए'
      });
      fetchStats();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || 'लॉग साफ़ करने में त्रुटि हुई'
      });
    } finally {
      setFlushing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleTestProbe = async () => {
    setTestingProbe(true);
    try {
      const res = await api.post('/super-admin/security/test-probe');
      setStatusMessage({
        type: 'success',
        text: res.data?.message || 'सुरक्षा टेस्ट प्रोब रिकॉर्ड किया गया'
      });
      fetchStats();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || 'प्रोब भेजने में विफल'
      });
    } finally {
      setTestingProbe(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs} घंटे ${mins} मिनट`;
  };

  const getThreatLabel = (eventType: string) => {
    switch (eventType) {
      case 'AI_SERVICE_ERROR':
        return { label: '🤖 Gemini AI सेवा त्रुटि (API Fail)', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      case 'AI_RATE_LIMIT_EXCEEDED':
        return { label: '⏳ Gemini AI दर सीमा (429 Quota)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'UNAUTHORIZED_ACCESS':
        return { label: '🚫 अनधिकृत प्रवेश (401 Unauthorized)', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'TOKEN_EXPIRED_OR_INVALID':
        return { label: '🔑 टोकन समाप्त / अमान्य (401)', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      case 'FORBIDDEN_ROLE_ACCESS':
        return { label: '🚫 वर्जित भूमिका पहुंच (403 Forbidden)', color: 'bg-amber-600/20 text-amber-400 border-amber-600/30' };
      case 'SUPER_ADMIN_UNAUTHORIZED':
      case 'SUPER_ADMIN_PRIVILEGE_VIOLATION':
        return { label: '🚨 सुपर एडमिन रूट उल्लंघन', color: 'bg-red-600/30 text-red-300 border-red-500/40' };
      case 'SUPER_ADMIN_PIN_FAILED':
        return { label: '🔐 गलत सुपर एडमिन मास्टर पिन', color: 'bg-rose-600/30 text-rose-300 border-rose-500/40' };
      case 'BASE64_PAYLOAD_FORBIDDEN':
        return { label: '🛑 Base64 इमेज बम (Storage Bloat)', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'PAYLOAD_TOO_LARGE':
        return { label: '📦 पेलोड > 500KB (Buffer Attack)', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'RATE_LIMIT_TRIPPED':
      case 'CONTENT_WRITE_LIMIT_EXCEEDED':
        return { label: '⚠️ रेट लिमिट उल्लंघन (Intruder/Runner)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'NOSQL_INJECTION_DEFLECTED':
        return { label: '🛡️ NoSQL इंजेक्शन (Operator Strip)', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case 'AUTH_PIN_FAILED':
      case 'AUTH_RATE_LIMIT_EXCEEDED':
        return { label: '🔒 गलत एडमिन पासवर्ड / पिन', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      case 'INTERNAL_SERVER_ERROR':
        return { label: '💥 सर्वर आंतरिक त्रुटि (500 Error)', color: 'bg-red-600/20 text-red-400 border-red-600/30' };
      case 'SECURITY_AUDIT_PROBE':
        return { label: '🧪 एडमिन टेस्ट प्रोब', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: eventType, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white font-black';
      case 'HIGH':
        return 'bg-amber-600 text-white font-bold';
      case 'MEDIUM':
        return 'bg-blue-600 text-white font-medium';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="animate-spin text-red-500" size={32} />
        <p className="text-xs text-slate-400">सुरक्षा टेलीमेट्री और लॉग्स लोड हो रहे हैं...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER & LIVE STATUS BAR */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2">
                <span>🛡️ सुपर एडमिन सुरक्षा व सिस्टम कंट्रोल सेंटर</span>
              </h2>
              <p className="text-xs text-slate-400">
                MongoDB Atlas M0 सुरक्षा (512MB रक्षा), Base64 ब्लॉकर्स, रेट लिमिटर्स व लाइव अटैक फ़ॉरेंसिक्स
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>रीयल-टाइम सुरक्षा सक्रिय</span>
          </div>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
              isDark ? 'border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-200' : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>रीफ़्रेश</span>
          </button>

          <button
            onClick={handleTestProbe}
            disabled={testingProbe}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-600/20"
          >
            <Sparkles size={13} />
            <span>{testingProbe ? 'प्रोब जारी...' : 'सुरक्षा टेस्ट करें'}</span>
          </button>

          <button
            onClick={handleFlushLogs}
            disabled={flushing || (stats?.totalBlocked || 0) === 0}
            className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span>{flushing ? 'साफ़ हो रहा है...' : 'लॉग्स साफ़ करें'}</span>
          </button>
        </div>
      </div>

      {/* STATUS BANNER */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition animate-in fade-in ${
          statusMessage.type === 'success' ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300' : 'bg-red-950/80 border border-red-600 text-red-300'
        }`}>
          {statusMessage.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. 4 KEY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Blocked Attacks */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">कुल रोके गए हमले</span>
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-red-500">
            {stats?.totalBlocked || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Burp Suite / Postman ब्लॉक</div>
        </div>

        {/* Card 2: 24h Threat Velocity */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">पिछले 24 घंटे में</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-amber-400">
            {stats?.last24hCount || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">सक्रिय खतरा स्तर: {stats?.last24hCount ? (stats.last24hCount > 50 ? 'उच्च' : 'सामान्य') : 'सुरक्षित'}</div>
        </div>

        {/* Card 3: Top Attacker IP */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">शीर्ष अटैकर IP</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Activity size={15} />
            </div>
          </div>
          <div className="mt-2 text-sm font-black tracking-tight truncate text-purple-400">
            {stats?.topAttackerIPs?.[0]?.ip || 'कोई नहीं'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats?.topAttackerIPs?.[0] ? `${stats.topAttackerIPs[0].count} संदिग्ध अनुरोध` : '100% साफ़ नेटवर्क'}
          </div>
        </div>

        {/* Card 4: System RAM & Health */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Node RAM उपयोग</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Cpu size={15} />
            </div>
          </div>
          <div className="mt-2 text-lg font-black tracking-tight text-emerald-400">
            {stats?.systemStatus?.memoryUsageMB?.heapUsed || 0} MB
            <span className="text-[11px] font-normal text-slate-400 ml-1">/ {stats?.systemStatus?.memoryUsageMB?.heapTotal || 0} MB</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            अपटाइम: {stats ? formatUptime(stats.systemStatus.uptimeSeconds) : '0'}
          </div>
        </div>
      </div>

      {/* 3. SYSTEM HEALTH TELEMETRY BAR */}
      {stats?.systemStatus && (
        <div className={`p-4 rounded-2xl border grid grid-cols-2 md:grid-cols-4 gap-3 text-xs ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Database size={16} className="text-emerald-500" />
            <div>
              <div className="text-[10px] text-slate-400">डेटाबेस स्थिति</div>
              <div className="font-bold text-emerald-400">MongoDB Atlas ({stats.systemStatus.dbStatus})</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-400">Gemini AI असिस्टेंट</div>
              <div className="font-bold text-indigo-400">
                {stats.systemStatus.geminiConfigured ? '🟢 सक्रिय (Gemini 3.5 Flash)' : '🔴 कुँजी अनुपलब्ध'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Server size={16} className="text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400">एनवायरनमेंट</div>
              <div className="font-bold uppercase text-blue-400">{stats.systemStatus.nodeEnv}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">स्टोरेज ऑटो-क्लीनअप</div>
              <div className="font-bold text-amber-400">14 दिन TTL (Auto-Purge)</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. THREAT BREAKDOWN PILLS */}
      {stats?.threatBreakdown && stats.threatBreakdown.length > 0 && (
        <div className={`p-4 rounded-2xl border space-y-2.5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs font-bold text-slate-400">खतरे के प्रकार व रोकथाम आंकड़े:</div>
          <div className="flex flex-wrap gap-2">
            {stats.threatBreakdown.map((item, idx) => {
              const meta = getThreatLabel(item.eventType);
              return (
                <div 
                  key={idx}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${meta.color}`}
                >
                  <span>{meta.label}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-black">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. LIVE INCIDENTS TABLE */}
      <div className={`rounded-2xl border overflow-hidden shadow-xl ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2 border-inherit">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-red-500" />
            <h3 className="text-sm font-black">लाइव सुरक्षा घटनाएं व अटैक लॉग्स (Live Incident Feed)</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            नवीनतम {stats?.recentLogs?.length || 0} घटनाएं प्रदर्शित
          </span>
        </div>

        {(!stats?.recentLogs || stats.recentLogs.length === 0) ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} />
            </div>
            <div className="text-sm font-bold text-slate-200">शानदार! वर्तमान में कोई सुरक्षा खतरा दर्ज नहीं है।</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              सभी एंडपॉइंट्स 500KB बॉडी लिमिट, Base64 ब्लॉकर्स और रेट लिमिटर्स द्वारा सुरक्षित हैं।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-bold text-slate-400 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <tr>
                  <th className="p-3">समय</th>
                  <th className="p-3">खतरे का प्रकार</th>
                  <th className="p-3">गंभीरता</th>
                  <th className="p-3">अटैकर IP</th>
                  <th className="p-3">टूल / User-Agent</th>
                  <th className="p-3">एंडपॉइंट</th>
                  <th className="p-3">स्थिति</th>
                  <th className="p-3">विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {stats.recentLogs.map((log) => {
                  const threatMeta = getThreatLabel(log.eventType);
                  const timeAgo = new Date(log.createdAt).toLocaleTimeString('hi-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr 
                      key={log._id}
                      className={`hover:bg-slate-800/30 transition ${
                        log.severity === 'CRITICAL' ? 'bg-red-500/5' : ''
                      }`}
                    >
                      {/* Time */}
                      <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {timeAgo}
                      </td>

                      {/* Event Type */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${threatMeta.color}`}>
                          {threatMeta.label}
                        </span>
                        {log.repeatCount > 1 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black">
                            x{log.repeatCount}
                          </span>
                        )}
                      </td>

                      {/* Severity */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>

                      {/* IP */}
                      <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-400 font-bold">{log.ip}</span>
                          <button
                            onClick={() => copyToClipboard(log.ip)}
                            title="IP कॉपी करें"
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          >
                            {copiedIp === log.ip ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* User-Agent */}
                      <td className="p-3 text-[11px] text-slate-400 max-w-[140px] truncate" title={log.userAgent}>
                        {log.userAgent.includes('Postman') ? (
                          <span className="font-bold text-amber-400">Postman Runner</span>
                        ) : log.userAgent.includes('Burp') ? (
                          <span className="font-bold text-red-400">Burp Suite</span>
                        ) : log.userAgent.includes('python') || log.userAgent.includes('curl') ? (
                          <span className="font-bold text-purple-400">CLI / Script Bot</span>
                        ) : (
                          log.userAgent
                        )}
                      </td>

                      {/* Endpoint */}
                      <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                        <span className="text-slate-300 font-bold">{log.method}</span>{' '}
                        <span className="text-slate-400">{log.path}</span>
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.statusCode === 429 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : log.statusCode === 413 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                            : log.statusCode >= 500
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {log.statusCode} {log.statusCode >= 500 ? 'FAIL' : 'BLOCKED'}
                        </span>
                      </td>

                      {/* Message */}
                      <td className="p-3 text-[11px] text-slate-300 max-w-[260px] truncate" title={log.message}>
                        {log.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
