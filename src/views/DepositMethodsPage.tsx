import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, ChevronLeft, ChevronRight, ShieldCheck, ArrowRight, Settings, Coins } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { OwnerEditModal } from '../components/OwnerEditModal';
import { useAuth } from '../context/AuthContext';
import type { PaymentMethodConfig } from '../types';

interface DepositMethodsPageProps {
  onNavigate: (view: string, data?: any) => void;
}

const DEFAULT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'bank-transfer-ng',
    name: 'Bank Transfer NG',
    type: 'bank',
    category: 'main',
    bankName: 'Pagaaaaa',
    accountNumber: '0469216912',
    accountOwnerName: 'Uthman',
    currency: 'NGN',
    exchangeRate: 1330,
    minDeposit: 50,
    maxDeposit: 50000,
    instructions: 'Transfer the exact converted amount to complete your deposit securely.',
    isActive: true
  },
  {
    id: 'card-payment',
    name: 'Visa / Mastercard',
    type: 'card',
    category: 'main',
    bankName: 'Direct Card Gateway',
    accountNumber: '•••• •••• •••• 4022',
    accountOwnerName: 'Immediate Global Checkout',
    currency: 'USD',
    exchangeRate: 1.0,
    minDeposit: 50,
    maxDeposit: 10000,
    instructions: 'Instant debit or credit card clearance with 3D Secure 2.0.',
    isActive: true
  },
  {
    id: 'crypto-usdt',
    name: 'Tether (USDT TRC20)',
    type: 'crypto',
    category: 'alternative',
    bankName: 'TRON TRC20 Network',
    accountNumber: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE',
    accountOwnerName: 'Immediate Hot Wallet TRC20',
    currency: 'USDT',
    exchangeRate: 1.0,
    minDeposit: 50,
    maxDeposit: 100000,
    instructions: 'Send exact USDT TRC20 to destination address. 1-3 network confirmations.',
    cryptoAddress: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE',
    cryptoNetwork: 'TRC20',
    isActive: true
  }
];

export function DepositMethodsPage({ onNavigate }: DepositMethodsPageProps) {
  const { user, profile } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodConfig[]>(DEFAULT_METHODS);
  const [tab, setTab] = useState<'main' | 'alternative'>('main');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('bank-transfer-ng');
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Fetch real-time payment methods from API / Firestore
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/payment-methods');
        if (res.ok) {
          const data = await res.json();
          if (data.methods && data.methods.length > 0) {
            setMethods(data.methods);
          }
        }
      } catch (e) {
        console.warn('Payment methods fetch fallback to defaults');
      }
    };
    fetchMethods();

    // Polling interval to ensure real-time admin sync across open client windows
    const interval = setInterval(fetchMethods, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeMethods = methods.filter((m) => m.isActive !== false);
  const selectedMethod = activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0] || DEFAULT_METHODS[0];

  const handleContinue = () => {
    onNavigate('deposit-amount', {
      selectedMethodId: selectedMethod.id,
      exchangeRate: selectedMethod.exchangeRate || 1330
    });
  };

  const handleSkip = () => {
    // If onboarding not completed, go to questionnaire (Questionnaire comes after deposit!)
    if (!profile?.onboardingCompleted) {
      onNavigate('questionnaire');
    } else {
      onNavigate('dashboard');
    }
  };

  const isOwnerOrAdmin = profile?.role === 'owner' || user?.email === 'a99782428@gmail.com';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Header currentView="deposit-methods" onNavigate={onNavigate} showBack backDestination={profile?.onboardingCompleted ? "dashboard" : "personal-details"} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span>STEP 3 OF 4 · FUND YOUR ACCOUNT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-1.5 tracking-tight">
              Choose how to deposit
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Select a verified payment method to securely add funds to your trading account.
            </p>
          </div>

          {/* Admin / Owner quick edit bar */}
          <div className="flex items-center justify-between bg-slate-100/80 border border-slate-200/80 rounded-xl px-3 py-2 mb-5">
            <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
              <span>💳</span> Deposit Payment Gateways
            </span>
            <button
              onClick={() => setIsOwnerModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
            >
              <Settings className="w-3 h-3 text-slate-500" />
              <span>Admin Edit</span>
            </button>
          </div>

          {/* Segmented control tabs matching screenshot */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setTab('main')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                tab === 'main'
                  ? 'bg-blue-50/80 border-blue-600 text-blue-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Main payment</span>
            </button>
            <button
              onClick={() => setTab('alternative')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                tab === 'alternative'
                  ? 'bg-blue-50/80 border-blue-600 text-blue-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Alternative payment</span>
            </button>
          </div>

          {/* Cards Carousel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
            {/* Bank Transfer Card */}
            <div
              onClick={() => setSelectedMethodId('bank-transfer-ng')}
              className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all relative ${
                selectedMethod.id === 'bank-transfer-ng'
                  ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {selectedMethod.id === 'bank-transfer-ng' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 truncate">Bank Transfer</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedMethod.bankName || 'Direct deposit'}</p>
            </div>

            {/* Visa / Mastercard Card */}
            <div
              onClick={() => setSelectedMethodId('card-payment')}
              className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all relative ${
                selectedMethod.id === 'card-payment'
                  ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {selectedMethod.id === 'card-payment' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
              )}
              <div className="h-9 flex items-center justify-center gap-1 mb-2">
                <span className="font-extrabold text-blue-800 tracking-tighter text-xs italic">VISA</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block -mr-1"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block opacity-90"></span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate">Card Gateway</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Debit / Credit</p>
            </div>

            {/* Crypto Card */}
            <div
              onClick={() => setSelectedMethodId('crypto-usdt')}
              className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all relative col-span-2 sm:col-span-1 ${
                selectedMethod.id === 'crypto-usdt'
                  ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {selectedMethod.id === 'crypto-usdt' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
              )}
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Coins className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 truncate">USDT (TRC20)</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Crypto Instant</p>
            </div>
          </div>

          {/* Secure method indicator banner matching screenshot */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-6 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 truncate">
                Secure deposit using {selectedMethod.name}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-900 text-white text-[9px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" />
              {selectedMethod.type === 'crypto' ? 'CRYPTO' : selectedMethod.type === 'card' ? 'INSTANT CARD' : 'BANK TRANSFER'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue to Amount Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>🕒 Not Now — Continue to Investor Questionnaire</span>
            </button>
          </div>

        </div>
      </main>

      {/* Admin / Owner payment method editor modal */}
      <OwnerEditModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        currentConfig={selectedMethod}
        onConfigSaved={(updated) => {
          setMethods((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }}
        ownerUid={user?.uid}
      />

      <Footer />
    </div>
  );
}
