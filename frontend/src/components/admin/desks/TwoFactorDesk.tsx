import React from 'react';
import { KeyRound, ShieldCheck, Check, Copy } from 'lucide-react';

export interface TwoFactorDeskProps {
  isDark: boolean;
  isLoading2FAStatus: boolean;
  admin2FAStatus: {
    enabled: boolean;
    remainingBackupCodes: number;
    enabledAt: string | null;
  } | null;
  admin2FAMsg: string | null;
  adminPending2FASetup: {
    secret: string;
    otpAuthUrl: string;
    emergencyBackupCodes: string[];
  } | null;
  copiedAdminSecret: boolean;
  setCopiedAdminSecret: (val: boolean) => void;
  copiedAdminCodes: boolean;
  setCopiedAdminCodes: (val: boolean) => void;
  adminVerifyOtpInput: string;
  setAdminVerifyOtpInput: (val: string) => void;
  handleStartAdmin2FASetup: () => void;
  handleDisableAdmin2FA: () => void;
  handleVerifyAndEnableAdmin2FA: () => void;
}

export const TwoFactorDesk: React.FC<TwoFactorDeskProps> = ({
  isDark,
  isLoading2FAStatus,
  admin2FAStatus,
  admin2FAMsg,
  adminPending2FASetup,
  copiedAdminSecret,
  setCopiedAdminSecret,
  copiedAdminCodes,
  setCopiedAdminCodes,
  adminVerifyOtpInput,
  setAdminVerifyOtpInput,
  handleStartAdmin2FASetup,
  handleDisableAdmin2FA,
  handleVerifyAndEnableAdmin2FA
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <KeyRound className="text-indigo-500" size={20} />
            <span>एडमिन 2-स्टेप सत्यापन (RFC 6238 TOTP 2FA Desk)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Google Authenticator / Microsoft Authenticator व ऑफ़लाइन इमरजेंसी रिकवरी कोड्स
          </p>
        </div>

        {isLoading2FAStatus ? (
          <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold animate-pulse self-start sm:self-center">
            लोड हो रहा है...
          </span>
        ) : admin2FAStatus?.enabled ? (
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center">
            <ShieldCheck size={14} />
            <span>2FA सुरक्षा सक्रिय (Active)</span>
          </span>
        ) : (
          <span className={`px-3 py-1 rounded-xl text-xs font-bold self-start sm:self-center ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}>
            2FA निष्क्रिय (Disabled)
          </span>
        )}
      </div>

      {/* Status Message */}
      {admin2FAMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>✅</span>
          <span>{admin2FAMsg}</span>
        </div>
      )}

      {/* Active Status Overview Card */}
      {admin2FAStatus?.enabled ? (
        <div className={`p-6 rounded-3xl border space-y-4 shadow-md ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                आपका मुख्य एडमिन खाता 2FA द्वारा सुरक्षित है
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                प्रत्येक लॉगिन पर आपके Google Authenticator ऐप से 6-अंकों का डायनामिक कोड आवश्यक होगा। यह पासवर्ड लीक होने पर भी अनधिकृत एक्सेस को 100% रोकता है।
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>• शेष आपातकालीन बैकअप कोड: <strong className="text-amber-400">{admin2FAStatus.remainingBackupCodes}</strong></span>
                {admin2FAStatus.enabledAt && (
                  <span>• सक्रिय दिनांक: {new Date(admin2FAStatus.enabledAt).toLocaleDateString('hi-IN')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartAdmin2FASetup}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              नया सीक्रेट व बैकअप कोड्स बनाएं (Regenerate)
            </button>
            <button
              onClick={handleDisableAdmin2FA}
              className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-xs font-bold text-red-300 transition cursor-pointer"
            >
              2FA सुरक्षा निष्क्रिय करें
            </button>
          </div>
        </div>
      ) : null}

      {/* Setup Wizard (When inactive or regenerating) */}
      {(!admin2FAStatus?.enabled || adminPending2FASetup) && (
        <div className={`p-6 rounded-3xl border space-y-6 shadow-md ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {!adminPending2FASetup ? (
            <div className="space-y-4">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                2-फैक्टर ऑथेंटिकेशन (2FA) सेटअप प्रारंभ करें
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                2FA चालू करने पर आपको अपने फोन में <strong>Google Authenticator</strong> या <strong>Microsoft Authenticator</strong> ऐप जोड़ना होगा। बस्तर या ग्रामीण क्षेत्रों में नेटवर्क न होने पर भी यह 100% ऑफ़लाइन काम करता है।
              </p>
              <button
                onClick={handleStartAdmin2FASetup}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
              >
                <KeyRound size={15} />
                <span>नया 2FA सीक्रेट व 5 इमरजेंसी बैकअप कोड्स जनरेट करें</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-slate-800/60 pb-3">
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  चरण 1: Authenticator ऐप में खाता जोड़ें
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  नीचे दिए गए सीक्रेट कोड को अपने Google Authenticator ऐप में 'मैन्युअल की (Enter a setup key)' के रूप में दर्ज करें:
                </p>
              </div>

              {/* Secret Key Display */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Base32 Secret Key (RFC 6238)
                  </div>
                  <div className="text-base font-mono font-black text-indigo-400 tracking-wider mt-0.5 select-all">
                    {adminPending2FASetup.secret}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(adminPending2FASetup.secret);
                    setCopiedAdminSecret(true);
                    setTimeout(() => setCopiedAdminSecret(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition text-slate-200 self-start sm:self-center cursor-pointer"
                >
                  {copiedAdminSecret ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedAdminSecret ? 'कॉपी हो गया' : 'सीक्रेट कॉपी करें'}</span>
                </button>
              </div>

              {/* Emergency Offline Backup Codes */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                      navigator.clipboard.writeText(adminPending2FASetup.emergencyBackupCodes.join('\n'));
                      setCopiedAdminCodes(true);
                      setTimeout(() => setCopiedAdminCodes(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition text-slate-200 self-start sm:self-center cursor-pointer"
                  >
                    {copiedAdminCodes ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedAdminCodes ? 'कॉपी हो गए' : 'सभी कोड्स कॉपी करें'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  {adminPending2FASetup.emergencyBackupCodes.map((code, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center font-bold text-amber-300">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Verification Input */}
              <div className="border-t border-slate-800/60 pt-4 space-y-3">
                <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  चरण 2: 6-अंकों का टेस्ट कोड डालकर 2FA चालू करें
                </h4>
                <div className="flex items-center gap-3 max-w-md">
                  <input
                    type="text"
                    value={adminVerifyOtpInput}
                    onChange={(e) => setAdminVerifyOtpInput(e.target.value)}
                    placeholder="उदा. 592014"
                    maxLength={6}
                    className={`flex-1 rounded-xl p-2.5 text-center text-sm font-mono font-bold tracking-widest outline-none transition border ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                  <button
                    onClick={handleVerifyAndEnableAdmin2FA}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer shrink-0"
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
  );
};
