import React from 'react';
import { ArrowLeft, ChevronDown, UserCircle2, ShieldCheck, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  showBack?: boolean;
  backDestination?: string;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  minimal?: boolean;
}

export function Header({
  currentView,
  onNavigate,
  showBack,
  backDestination = 'dashboard',
  onOpenDeposit,
  onOpenWithdraw,
  minimal = false
}: HeaderProps) {
  const { user, profile, activeAccount, setActiveAccount } = useAuth();

  const isTradeView = currentView === 'dashboard';

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Back button + Brand logo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => onNavigate(backDestination)}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-1 cursor-pointer font-bold tracking-tight text-xl text-slate-900 font-['Inter']"
          >
            <span>immediate</span>
            <span className="text-blue-600 text-lg leading-none">♦</span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user && isTradeView && (
            <>
              {/* Live vs Demo Account toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setActiveAccount('live')}
                  className={`px-2 sm:px-2.5 py-1 rounded-md transition-all ${
                    activeAccount === 'live'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  LIVE <span className="font-mono text-[10px] sm:text-[11px] font-normal">${(profile?.liveBalance || 0).toFixed(2)}</span>
                </button>
                <button
                  onClick={() => setActiveAccount('demo')}
                  className={`px-2 sm:px-2.5 py-1 rounded-md transition-all ${
                    activeAccount === 'demo'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  DEMO <span className="font-mono text-[10px] sm:text-[11px] font-normal">${(profile?.demoBalance || 10000).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                </button>
              </div>

              {/* Deposit quick action (always visible for phone and desktop) */}
              <button
                onClick={onOpenDeposit}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Deposit</span>
              </button>

              <button
                onClick={onOpenWithdraw}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Withdraw</span>
              </button>

              {/* Profile Pill */}
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-800 border border-slate-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline">Profile</span>
              </button>
            </>
          )}

          {/* Region / Language pill matching screenshot 'UK En v' */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[8px]">
              UK
            </span>
            <span>En</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

      </div>
    </header>
  );
}
