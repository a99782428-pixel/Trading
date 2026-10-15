import React, { useState } from 'react';
import { Lock, X, Check, AlertCircle, Shield, Coins, Building2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PaymentMethodConfig } from '../types';

interface OwnerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: PaymentMethodConfig;
  onConfigSaved: (newConfig: PaymentMethodConfig) => void;
  ownerUid?: string;
}

export function OwnerEditModal({
  isOpen,
  onClose,
  currentConfig,
  onConfigSaved,
  ownerUid
}: OwnerEditModalProps) {
  const [step, setStep] = useState<'passcode' | 'editor'>('passcode');
  const [passcode, setPasscode] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPrompt, setConfirmPrompt] = useState(false);

  // Form edit states
  const [name, setName] = useState(currentConfig.name || 'Bank Transfer NG');
  const [type, setType] = useState<'bank' | 'crypto' | 'card'>(currentConfig.type || 'bank');
  const [bankName, setBankName] = useState(currentConfig.bankName || '');
  const [accountNumber, setAccountNumber] = useState(currentConfig.accountNumber || '');
  const [accountOwnerName, setAccountOwnerName] = useState(currentConfig.accountOwnerName || '');
  const [exchangeRate, setExchangeRate] = useState(currentConfig.exchangeRate || 1330);
  const [minDeposit, setMinDeposit] = useState(currentConfig.minDeposit || 50);
  const [maxDeposit, setMaxDeposit] = useState(currentConfig.maxDeposit || 50000);
  const [instructions, setInstructions] = useState(currentConfig.instructions || '');
  const [cryptoAddress, setCryptoAddress] = useState(currentConfig.cryptoAddress || '');
  const [cryptoNetwork, setCryptoNetwork] = useState(currentConfig.cryptoNetwork || 'TRC20');
  const [isActive, setIsActive] = useState(currentConfig.isActive !== false);

  if (!isOpen) return null;

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/owner/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: passcode, userId: ownerUid })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication error.');
      }

      setSessionToken(data.sessionToken);
      setStep('editor');
    } catch (err: any) {
      setError(err.message || 'Invalid passcode credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const updates: Partial<PaymentMethodConfig> = {
        name,
        type,
        bankName,
        accountNumber,
        accountOwnerName,
        exchangeRate: Number(exchangeRate),
        minDeposit: Number(minDeposit),
        maxDeposit: Number(maxDeposit),
        instructions,
        cryptoAddress,
        cryptoNetwork,
        isActive
      };

      // 1. Save to server backend with audit log & file persistence
      const res = await fetch('/api/owner/update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          methodId: currentConfig.id,
          updates,
          ownerUid
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update payment destination.');
      }

      // 2. Also sync to Firestore in real time
      try {
        await setDoc(doc(db, 'paymentMethods', currentConfig.id), {
          ...currentConfig,
          ...updates,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore direct write fallback notice:', fsErr);
      }

      onConfigSaved(data.paymentMethod);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setIsLoading(false);
      setConfirmPrompt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Passcode verification view */}
        {step === 'passcode' ? (
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Admin Deposit Gateways Editor</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Enter your authorized admin passcode to update banking destinations, crypto addresses, and exchange rates in real time.
            </p>

            <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl mb-4 text-[11px] text-blue-800">
              Passcode hint: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">immediate2026</code> or <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">admin123</code>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter admin passcode"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-center text-base tracking-widest font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !passcode}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Unlock Editor'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Payment method editor */
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Configure Deposit Method ({currentConfig.id})</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Method Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Gateway Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="card">Card Gateway</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bank / Gateway / Network Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Account Number / Destination Wallet
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Account Owner / Beneficiary Name
                </label>
                <input
                  type="text"
                  value={accountOwnerName}
                  onChange={(e) => setAccountOwnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Exchange Rate (1 USD = NGN)
                  </label>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Active Status
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="true">Enabled (Visible)</option>
                    <option value="false">Disabled (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Min Deposit ($ USD)
                  </label>
                  <input
                    type="number"
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Max Deposit ($ USD)
                  </label>
                  <input
                    type="number"
                    value={maxDeposit}
                    onChange={(e) => setMaxDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Customer Transfer Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {confirmPrompt ? (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-900 mb-1">
                  Save and publish in real time?
                </p>
                <p className="text-[11px] text-amber-700 mb-3">
                  All active users and deposit pages will update immediately with this bank account and rate.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmPrompt(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    {isLoading ? 'Publishing...' : 'Confirm & Publish'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPrompt(true)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Save & Publish Real-Time
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
