import React, { useState, useEffect } from 'react';
import { CheckCircle2, Copy, Check, ShieldCheck, ArrowRight, Settings, ExternalLink } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { OwnerEditModal } from '../components/OwnerEditModal';
import { useAuth } from '../context/AuthContext';
import type { PaymentMethodConfig } from '../types';

interface PaymentDetailsPageProps {
  onNavigate: (view: string) => void;
  depositAmount: number;
}

const DEFAULT_PAYMENT_METHOD: PaymentMethodConfig = {
  id: 'bank-transfer-ng',
  name: 'Bank Transfer NG',
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
};

export function PaymentDetailsPage({ onNavigate, depositAmount }: PaymentDetailsPageProps) {
  const { user, profile, submitDeposit } = useAuth();

  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodConfig>(DEFAULT_PAYMENT_METHOD);
  const [confirmationPasscode, setConfirmationPasscode] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discreet owner editor state
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Fetch and sync live configured payment method in real time
  useEffect(() => {
    const fetchLiveConfig = async () => {
      try {
        const res = await fetch('/api/payment-methods');
        if (res.ok) {
          const data = await res.json();
          if (data.methods && data.methods.length > 0) {
            const found = data.methods.find((m: any) => m.id === 'bank-transfer-ng') || data.methods[0];
            setPaymentConfig(found);
          }
        }
      } catch {}
    };

    fetchLiveConfig();
    const interval = setInterval(fetchLiveConfig, 3000);
    return () => clearInterval(interval);
  }, []);

  const convertedNgn = Math.round(depositAmount * (paymentConfig.exchangeRate || 1330));

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!confirmationPasscode.trim()) {
      setError('Please enter your transaction confirmation remark or passcode.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitDeposit({
        userId: user?.uid || 'guest_user',
        userEmail: profile?.email || user?.email || 'trader@example.com',
        usdAmount: depositAmount,
        convertedAmount: convertedNgn,
        currency: 'NGN',
        paymentMethodId: paymentConfig.id,
        paymentMethodName: paymentConfig.name,
        confirmationPasscode: confirmationPasscode.trim()
      });

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit deposit verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Header currentView="payment-details" onNavigate={onNavigate} showBack backDestination="deposit-amount" />

      <main className="flex-1 flex flex-col items-center justify-center p-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">

          {/* Top circle checkmark matching screenshot */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full border border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          <div className="text-center mb-5">
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              STEP 3 OF 4 · PAYMENT INSTRUCTIONS
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 mb-2 tracking-tight">
              Complete your deposit
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Transfer the converted amount below using the bank details provided. Tap any row to copy it.
            </p>
          </div>

          {/* Amount Overview Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 mb-4 text-center">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              You selected
            </p>
            <p className="text-2xl font-extrabold font-mono text-slate-900 mb-3">
              ${depositAmount} USD
            </p>

            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Converted amount
              </p>
              <p className="text-2xl font-extrabold font-mono text-slate-900">
                ₦{convertedNgn.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Bank Details Card matching screenshot */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 mb-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🏛️</span> Bank Details
                </span>
                
                {/* Admin edit button */}
                <button
                  type="button"
                  onClick={() => setIsOwnerModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded-md text-[10px] font-semibold border border-slate-200 transition-colors"
                  title="Admin configure bank details"
                >
                  <Settings className="w-3 h-3 text-slate-500" />
                  <span>Admin Edit</span>
                </button>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold lowercase">
                {paymentConfig.bankName.toLowerCase()}
              </span>
            </div>

            {/* Bank Name */}
            <div
              onClick={() => copyToClipboard(paymentConfig.bankName, 'bank')}
              className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-xs text-slate-400">Bank name</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <span>{paymentConfig.bankName}</span>
                {copiedField === 'bank' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Account Number */}
            <div
              onClick={() => copyToClipboard(paymentConfig.accountNumber, 'account')}
              className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-xs text-slate-400">Account number</span>
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-900">
                <span>{paymentConfig.accountNumber}</span>
                {copiedField === 'account' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Account Owner Name */}
            <div
              onClick={() => copyToClipboard(paymentConfig.accountOwnerName, 'owner')}
              className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-xs text-slate-400">Account owner name</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <span>{paymentConfig.accountOwnerName}</span>
                {copiedField === 'owner' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          {/* Security notice banner matching screenshot */}
          <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 mb-5 flex items-start gap-2.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-800 leading-relaxed">
              {paymentConfig.instructions || 'Transfer the exact converted amount to complete your deposit securely.'}
            </p>
          </div>

          {/* Submission and Confirmation Form */}
          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 shadow-xs animate-in fade-in">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-bold text-emerald-950">Deposit Request Submitted</h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your deposit request for <strong>${depositAmount} USD (₦{convertedNgn.toLocaleString()})</strong> has been registered with pending status.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => onNavigate('questionnaire')}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Investor Questionnaire (Step 4 of 4)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors"
                >
                  Go to Trading Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                    <span>🛡️</span> Enter Confirmation Passcode / Remark
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    To activate and credit ${depositAmount} USD into your live trading account, enter your secret confirmation passcode or bank payment reference.
                  </p>

                  <input
                    type="text"
                    required
                    value={confirmationPasscode}
                    onChange={(e) => setConfirmationPasscode(e.target.value)}
                    placeholder="Enter confirmation passcode or bank reference"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono transition-all"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Submitting Request...' : 'Submit & Proceed to Questionnaire'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('questionnaire')}
                    className="text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium"
                  >
                    Skip to Investor Questionnaire →
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Owner Edit Passcode & Configuration Modal */}
      <OwnerEditModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        currentConfig={paymentConfig}
        onConfigSaved={(updated) => setPaymentConfig(updated)}
        ownerUid={user?.uid}
      />

      <Footer />
    </div>
  );
}
