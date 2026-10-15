import React, { useState } from 'react';
import { 
  UserCircle2, 
  ShieldCheck, 
  ExternalLink, 
  Moon, 
  Sun, 
  Lock, 
  Mail, 
  Building2, 
  ArrowLeft, 
  ArrowRight,
  LogOut,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getDriveAccessToken } from '../lib/firebase';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, profile, questionnaire, logOut, activeAccount, setActiveAccount, orders } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [driveExportStatus, setDriveExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const openOrdersCount = orders.filter((o) => o.status === 'OPEN').length;

  const handleExportGoogleDrive = async () => {
    setIsExporting(true);
    setDriveExportStatus(null);

    const token = getDriveAccessToken();
    const dossierData = {
      platform: 'Immediate Multi-Asset Trading Platform',
      user: {
        uid: profile?.uid || user?.uid,
        email: profile?.email || user?.email,
        fullName: profile?.fullName,
        country: profile?.country,
        address: profile?.address,
        city: profile?.city,
        postalCode: profile?.postalCode,
        nationality: profile?.nationality,
        dateOfBirth: profile?.dateOfBirth,
        idType: profile?.idType,
        idNumber: profile?.idNumber,
        verificationStatus: profile?.verificationStatus || 'verified'
      },
      questionnaire: questionnaire || {},
      balances: {
        liveBalance: profile?.liveBalance || 0,
        demoBalance: profile?.demoBalance || 10000
      },
      exportedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/drive/export-dossier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          dossierData,
          fileName: `Immediate_KYC_Dossier_${profile?.fullName?.replace(/\s+/g, '_') || 'User'}.json`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.status === 'pending_authorization') {
          setDriveExportStatus('Google Drive credentials pending. To enable direct export, sign in with Google or authorize your OAuth client.');
        } else {
          setDriveExportStatus(data.error || 'Failed to sync to Google Drive.');
        }
      } else {
        setDriveExportStatus(`Dossier exported to Google Drive: ${data.name}`);
      }
    } catch (err: any) {
      setDriveExportStatus(err.message || 'Error communicating with Google Drive service.');
    } finally {
      setIsExporting(false);
    }
  };

  const formattedUid = profile?.uid ? `IMD-${profile.uid.substring(0, 8).toUpperCase()}` : 'IMD-84729103';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter'] select-none">
      
      {/* Profile Header */}
      <header className="w-full bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Trading</span>
        </button>

        <div className="flex items-center gap-1 font-bold tracking-tight text-lg text-slate-900">
          <span>immediate</span>
          <span className="text-blue-600 text-base leading-none">♦</span>
        </div>

        <button
          onClick={async () => {
            await logOut();
            onNavigate('signin');
          }}
          className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-4 py-8 space-y-5">
        
        {/* User Card matching screenshot Page 10 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <UserCircle2 className="w-10 h-10 stroke-[1.5]" />
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {profile?.fullName || 'Trader Account'}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{profile?.email || user?.email || 'trader@example.com'}</p>

          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              ID: {formattedUid}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>KYC Verified</span>
            </span>
          </div>

          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 font-semibold">
            {activeAccount === 'live' ? 'Live Production Account' : 'Demo Virtual Account'}
          </p>

          {/* Account Switcher pills matching screenshot */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => setActiveAccount('live')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeAccount === 'live'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Live OTC ($0)
            </button>
            <button
              onClick={() => setActiveAccount('demo')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeAccount === 'demo'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Demo ($10,000)
            </button>
          </div>
        </div>

        {/* PERSONAL & RESIDENTIAL DATA */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>👤</span> PERSONAL & RESIDENTIAL DATA
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Full Legal Name</span>
              <span className="font-semibold text-slate-900">{profile?.fullName || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Email Address</span>
              <span className="font-semibold text-slate-900 font-mono">{profile?.email || user?.email || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Phone Number</span>
              <span className="font-semibold text-slate-900 font-mono">{profile?.phoneNumber || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Country of Residence</span>
              <span className="font-semibold text-slate-900">{profile?.country || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Residential Address</span>
              <span className="font-semibold text-slate-900">{profile?.address || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">City & Postal Code</span>
              <span className="font-semibold text-slate-900">
                {profile?.city ? `${profile.city}${profile.postalCode ? `, ${profile.postalCode}` : ''}` : '—'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Date of Birth</span>
              <span className="font-semibold text-slate-900 font-mono">{profile?.dateOfBirth || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Nationality</span>
              <span className="font-semibold text-slate-900">{profile?.nationality || '—'}</span>
            </div>
          </div>
        </div>

        {/* IDENTITY & VERIFICATION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🛡️</span> IDENTITY & VERIFICATION
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Document Type</span>
              <span className="font-semibold text-slate-900">{profile?.idType || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Document Reference</span>
              <span className="font-semibold text-slate-900 font-mono">{profile?.idNumber || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Tax Identification (TIN)</span>
              <span className="font-semibold text-slate-900">Exempt (Non-US Citizen)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Regulatory Clearance</span>
              <span className="font-semibold text-emerald-600">
                {profile?.verificationStatus === 'verified' ? '✓ RCRA / SEC Compliant' : 'Pending Review'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Account Protection</span>
              <span className="font-semibold text-slate-900">Segregated Client Funds</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Member Since</span>
              <span className="font-semibold text-slate-900 font-mono">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* INVESTOR SUITABILITY PROFILE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>📈</span> INVESTOR SUITABILITY PROFILE
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Age Bracket</span>
              <span className="font-semibold text-slate-900 font-mono">{questionnaire?.q1_age || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Profession / Occupation</span>
              <span className="font-semibold text-slate-900">{questionnaire?.q2_profession || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Trading Experience</span>
              <span className="font-semibold text-slate-900">{questionnaire?.q3_tradingExperience || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Investment Objective</span>
              <span className="font-semibold text-slate-900">{questionnaire?.q5_investmentGoals || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Trading Method</span>
              <span className="font-semibold text-slate-900">Self-Directed Execution</span>
            </div>
          </div>
        </div>

        {/* BALANCES & DEPOSIT HISTORY */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>💳</span> BALANCES & DEPOSIT HISTORY
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Live OTC Equity</span>
              <span className="font-bold font-mono text-slate-900">${(profile?.liveBalance || 0).toFixed(2)} USD</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Demo Virtual Equity</span>
              <span className="font-bold font-mono text-slate-900">${(profile?.demoBalance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Latest Deposit Method</span>
              <span className="font-semibold text-blue-600 font-mono">$200 via bank-transfer-ng</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Active Open Trades</span>
              <span className="font-semibold text-slate-900 font-mono">{openOrdersCount} Open Position(s)</span>
            </div>
          </div>
        </div>

        {/* APP PREFERENCES & SECURITY CONTROLS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>⚙️</span> APP PREFERENCES & SECURITY CONTROLS
          </h2>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
              Display Theme
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
              Permanent Passcode
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Update your permanent credential.</p>
            <button
              onClick={() => alert('Password reset link sent to your registered email.')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              Change Password
            </button>
          </div>

          {/* Google Drive Integration Button matching screenshot */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">
              Cloud Storage & Sync
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Google Drive Statements & Dossier</p>

            <button
              onClick={handleExportGoogleDrive}
              disabled={isExporting}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span>{isExporting ? 'Syncing to Drive...' : 'Open Google Drive'}</span>
            </button>

            {driveExportStatus && (
              <p className="text-[11px] text-slate-600 mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                {driveExportStatus}
              </p>
            )}
          </div>

          {/* Regulatory Assistance */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">
              Regulatory Assistance
            </label>
            <p className="text-[11px] text-slate-400 mb-2 font-mono">support@immediate.com (24/7 Active)</p>
            <button
              onClick={() => alert('Contacting Immediate regulatory compliance team at support@immediate.com')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <span>Return to Trading Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </main>

      <Footer />
    </div>
  );
}
