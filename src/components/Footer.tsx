import React from 'react';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto py-10 px-4 text-center">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-center gap-1 font-bold tracking-tight text-xl text-slate-900 font-['Inter']">
          <span>immediate</span>
          <span className="text-blue-600 text-lg leading-none">♦</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Immediate is a multi-asset trading platform offering access to global financial markets. We provide secure, transparent, and efficient trading services to clients across Africa and beyond.
        </p>

        <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-700">
          <button className="hover:text-blue-600 transition-colors">About us</button>
          <button className="hover:text-blue-600 transition-colors">Terms of use</button>
          <button className="hover:text-blue-600 transition-colors">Privacy policy</button>
          <button className="hover:text-blue-600 transition-colors">Contact</button>
        </div>

        <p className="text-[11px] text-slate-400 pt-2 font-mono">
          © 2026 Immediate Payments Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
