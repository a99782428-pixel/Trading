import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Globe, TrendingUp, Lock, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Header currentView="landing" onNavigate={onNavigate} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-4 pt-12 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Multi-Asset Institutional Liquidity
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            A World-Leading <br className="hidden sm:inline" />
            <span className="text-blue-600">Trading Experience</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Trade cryptocurrencies, forex, and OTC indices with ultra-fast execution, zero hidden fees, and flexible local funding.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Open Live Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('signin')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-sm border border-slate-200 shadow-2xs transition-all"
            >
              Sign In
            </button>
          </div>

          {/* Platform preview metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto mt-12 pt-8 border-t border-slate-200 text-left">
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">$10B+</p>
              <p className="text-xs text-slate-500 mt-0.5">Monthly Volume</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">0.001s</p>
              <p className="text-xs text-slate-500 mt-0.5">Instant Execution</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">180+</p>
              <p className="text-xs text-slate-500 mt-0.5">Countries Supported</p>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5 text-base">Lightning Fast</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Execute market and limit orders with high-leverage tier options and real-time tick streaming.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5 text-base">Local Bank Transfer</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct deposits in NGN and USD via verified local bank transfers with instant rate calculation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5 text-base">Regulated KYC Vault</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete 7-question suitability onboarding and secure document archiving in Google Drive.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
