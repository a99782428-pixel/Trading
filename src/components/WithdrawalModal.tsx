import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const { user, profile, activeAccount, submitWithdrawal } = useAuth();

  const [amount, setAmount] = useState(100);
  const [bankName, setBankName] = useState('First Bank of Nigeria');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(profile?.fullName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableBalance = activeAccount === 'live' ? profile?.liveBalance || 0 : profile?.demoBalance || 10000;
  const fee = 5.00; // standard withdrawal handling fee
  const netAmount = Math.max(0, amount - fee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount < 50) {
      setError('Minimum withdrawal amount is $50.00 USD.');
      return;
    }

    if (amount > availableBalance) {
      setError(`Requested amount exceeds available balance ($${availableBalance.toFixed(2)} USD).`);
      return;
    }

    if (!accountNumber.trim() || !accountHolderName.trim()) {
      setError('Please provide destination bank account details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitWithdrawal({
        userId: user?.uid || 'guest_user',
        userEmail: profile?.email || user?.email || 'trader@example.com',
        amount,
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        fee
      });

      setSuccessMsg(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
              PAYOUT PIPELINE
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Request Withdrawal
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Withdrawal Request Queued</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your request for <strong>${amount.toFixed(2)} USD</strong> (Net payout: <strong>${netAmount.toFixed(2)} USD</strong>) has been saved to Firestore with <strong>pending</strong> verification status. Payout clearance typically executes within 24 hours.
            </p>
            <button
              onClick={() => {
                setSuccessMsg(false);
                onClose();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Balance banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Available Balance</p>
                <p className="text-base font-extrabold font-mono text-slate-900">
                  ${availableBalance.toFixed(2)} USD
                </p>
              </div>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                {activeAccount.toUpperCase()}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Withdrawal Amount ($ USD)
              </label>
              <input
                type="number"
                min={50}
                max={availableBalance || 100000}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-base font-bold font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Fee: ${fee.toFixed(2)}</span>
                <span>Net: ${netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Bank or Payout Provider
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                <option value="Access Bank">Access Bank</option>
                <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="Paga">Paga</option>
                <option value="Standard Chartered">Standard Chartered</option>
                <option value="Barclays UK">Barclays UK</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Account Number / IBAN
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter 10-digit account or IBAN"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Full legal name on bank account"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Withdrawals require compliance sign-off and execute securely to verified beneficiaries only.</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit Withdrawal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
