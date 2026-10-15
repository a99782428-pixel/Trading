import React, { useState, useEffect } from 'react';
import { Building2, Banknote, ArrowRight, Settings } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { OwnerEditModal } from '../components/OwnerEditModal';
import { useAuth } from '../context/AuthContext';
import type { PaymentMethodConfig } from '../types';

interface DepositAmountPageProps {
  onNavigate: (view: string, data?: any) => void;
  depositAmount: number;
  setDepositAmount: (amt: number) => void;
}

const DEFAULT_CONFIG: PaymentMethodConfig = {
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

export function DepositAmountPage({ onNavigate, depositAmount, setDepositAmount }: DepositAmountPageProps) {
  const { user } = useAuth();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodConfig>(DEFAULT_CONFIG);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Fetch live configured payment method
  useEffect(() => {
    fetch('/api/payment-methods')
      .then((res) => res.json())
      .then((data) => {
        if (data.methods && data.methods.length > 0) {
          const found = data.methods.find((m: any) => m.id === 'bank-transfer-ng') || data.methods[0];
          setPaymentConfig(found);
        }
      })
      .catch(() => {});
  }, []);

  const exchangeRate = paymentConfig.exchangeRate || 1330;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (depositAmount < (paymentConfig.minDeposit || 50)) {
      setError(`Minimum deposit amount is $${paymentConfig.minDeposit || 50} USD.`);
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the deposit declaration and terms.');
      return;
    }

    onNavigate('payment-details', { amount: depositAmount, exchangeRate });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Header currentView="deposit-amount" onNavigate={onNavigate} showBack backDestination="deposit-methods" />

      <main className="flex-1 flex flex-col items-center justify-center p-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              STEP 3 OF 4 · AMOUNT SELECTION
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 mb-2 tracking-tight">
              Secure deposit using {paymentConfig.name}
            </h1>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-900 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3 h-3" />
              <span>{paymentConfig.bankName.toUpperCase()}</span>
            </div>

            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Choose an amount to continue with a secure local bank transfer.
            </p>
          </div>

          {/* Admin edit button */}
          <div className="flex items-center justify-end mb-3">
            <button
              type="button"
              onClick={() => setIsOwnerModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
            >
              <Settings className="w-3 h-3 text-slate-500" />
              <span>Admin Rate & Bank Settings</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
            <form onSubmit={handleDeposit} className="space-y-5">
              
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                  <Banknote className="w-4 h-4 text-slate-600" />
                  <span>Deposit amount</span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
                  <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                    Amount in USD
                  </label>
                  <div className="flex items-center">
                    <span className="text-xl font-bold font-mono text-slate-900 mr-1">$</span>
                    <input
                      type="number"
                      required
                      min={paymentConfig.minDeposit || 50}
                      max={paymentConfig.maxDeposit || 50000}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full text-2xl font-bold font-mono text-slate-900 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Preset buttons matching screenshot: $200, $300, $400 */}
              <div className="grid grid-cols-3 gap-2.5">
                {[200, 300, 400].map((preset) => {
                  const isActive = depositAmount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(preset)}
                      className={`py-2.5 rounded-xl border text-xs font-bold font-mono transition-all ${
                        isActive
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs ring-1 ring-blue-600/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      ${preset}
                    </button>
                  );
                })}
              </div>

              {/* Exchange rate notice */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your selected amount will be converted to Nigerian Naira at the current rate (1 USD = {exchangeRate.toLocaleString()} NGN) on the next step.
              </p>

              {/* Checkbox declaration */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  I have read and accept the terms, conditions, and declaration of this deposit.
                </span>
              </label>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Deposit & View Payment Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          </div>

        </div>
      </main>

      {/* Admin / Owner payment method editor modal */}
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
