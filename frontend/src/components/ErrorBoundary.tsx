import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/mockData';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleReportError = () => {
    const errorText = `*Ambition News Portal Error Report*\n\nError: ${this.state.error?.message || 'Unknown error'}\nURL: ${window.location.href}\nTime: ${new Date().toLocaleString()}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(errorText)}`, '_blank');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-devanagari select-none">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
            
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 mx-auto">
              <img src="/logo-96.webp" alt="Logo" width="20" height="20" className="w-5 h-5 rounded-full object-cover" />
              <span className="font-black text-sm text-white tracking-wider">एम्बिशन न्यूज़</span>
              <span className="text-[10px] bg-red-950 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-800">
                कवर्धा
              </span>
            </div>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-900/80 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={32} />
            </div>

            {/* Error Message in Hindi */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                पेज लोड करने में रुकावट आई
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                तकनीकी समस्या के कारण यह स्क्रीन सही तरीके से प्रदर्शित नहीं हो सकी। कृपया पुनः लोड करें या मुख्य पृष्ठ पर जाएं।
              </p>
            </div>

            {/* Technical Detail Collapsible (For debugging) */}
            {this.state.error && (
              <details className="text-left bg-slate-950 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <summary className="cursor-pointer text-slate-300 font-medium hover:text-white">
                  तकनीकी विवरण (Technical Details)
                </summary>
                <div className="mt-2 text-red-400 break-words whitespace-pre-wrap font-sans">
                  {this.state.error.toString()}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition active:scale-98"
              >
                <RefreshCw size={16} />
                <span>पुनः लोड करें (Reload Page)</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 transition active:scale-98"
              >
                <Home size={16} />
                <span>मुख्य पृष्ठ पर जाएं (Home)</span>
              </button>

              <button
                onClick={this.handleReportError}
                className="w-full bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 font-bold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <MessageSquare size={14} />
                <span>व्हाट्सऐप पर तकनीकी टीम को बताएं</span>
              </button>
            </div>

            {/* Footer */}
            <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/80">
              Ambition News • कवर्धा (कबीरधाम) • {SOCIAL_LINKS.headquarters}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
