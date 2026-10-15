import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  ShieldCheck, 
  BarChart2, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  RefreshCw,
  XCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Header } from '../components/Header';
import { TradingChart } from '../components/TradingChart';
import { WithdrawalModal } from '../components/WithdrawalModal';
import { useAuth } from '../context/AuthContext';
import { useLiveMarket } from '../lib/marketData';
import type { MarketAsset, TradeOrder } from '../types';

interface TradingDashboardPageProps {
  onNavigate: (view: string) => void;
  onOpenDeposit: () => void;
}

const LEVERAGES = [50, 100, 200, 500, 1000, 2000, 3000, 5000];
const LOT_PRESETS = [0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 2.00, 5.00];

export function TradingDashboardPage({ onNavigate, onOpenDeposit }: TradingDashboardPageProps) {
  const { 
    profile, 
    activeAccount, 
    setActiveAccount, 
    orders, 
    placeOrder, 
    closeOrder, 
    resetDemoBalance,
    updateProfileData
  } = useAuth();
  
  const { assets, selectedAsset, setSelectedAsset, wsConnected } = useLiveMarket();

  const [activeTab, setActiveTab] = useState<'trade' | 'markets' | 'orders'>('trade');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [leverage, setLeverage] = useState<number>(500);
  const [lotSize, setLotSize] = useState<number>(0.10);
  const [duration, setDuration] = useState('1 Day (24 Hours)');
  const [enableTP, setEnableTP] = useState(false);
  const [enableSL, setEnableSL] = useState(false);
  const [tpPercent, setTpPercent] = useState(0.5);
  const [slPercent, setSlPercent] = useState(1.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [orderNotification, setOrderNotification] = useState<{ text: string; type: 'success' | 'close' } | null>(null);
  
  // Real-time flash effect when equity increases or decreases
  const [equityFlash, setEquityFlash] = useState<'up' | 'down' | null>(null);
  const prevEquityRef = useRef<number>(0);

  // Filter open orders
  const openOrders = orders.filter((o) => o.status === 'OPEN');
  
  // Calculate live floating P&L using current real-time prices
  const totalFloatingPnl = openOrders.reduce((sum, o) => {
    const current = assets.find((a) => a.pair === o.symbol)?.price || o.currentPrice;
    const diff = o.type === 'BUY' ? current - o.entryPrice : o.entryPrice - current;
    return sum + (diff * o.lotSize * (o.leverage / 100));
  }, 0);

  const balance = activeAccount === 'live' ? profile?.liveBalance || 0 : profile?.demoBalance || 10000;
  const equity = Number((balance + totalFloatingPnl).toFixed(2));
  const marginLevel = 100.0;
  const freeMargin = Math.max(0, balance - 13.48);

  // Monitor equity shifts to produce smooth green/red flash effect
  useEffect(() => {
    if (prevEquityRef.current !== 0 && Math.abs(equity - prevEquityRef.current) > 0.05) {
      if (equity > prevEquityRef.current) {
        setEquityFlash('up');
      } else {
        setEquityFlash('down');
      }
      const t = setTimeout(() => setEquityFlash(null), 800);
      return () => clearTimeout(t);
    }
    prevEquityRef.current = equity;
  }, [equity]);

  const handleExecuteTrade = (type: 'BUY' | 'SELL') => {
    const fillPrice = selectedAsset.price;
    placeOrder({
      symbol: selectedAsset.pair,
      type,
      orderMode: orderType,
      entryPrice: fillPrice,
      currentPrice: fillPrice,
      lotSize,
      leverage,
      takeProfit: enableTP ? fillPrice * (1 + (type === 'BUY' ? tpPercent : -tpPercent) / 100) : undefined,
      stopLoss: enableSL ? fillPrice * (1 + (type === 'BUY' ? -slPercent : slPercent) / 100) : undefined,
      duration,
      accountType: activeAccount
    });

    setOrderNotification({
      text: `Order Executed: ${type} ${lotSize} lot ${selectedAsset.pair} @ $${fillPrice.toFixed(2)} (1:${leverage})`,
      type: 'success'
    });
    setTimeout(() => setOrderNotification(null), 3500);
  };

  const handleClosePosition = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    const currentPrice = assets.find((a) => a.pair === ord.symbol)?.price || ord.currentPrice;
    const diff = ord.type === 'BUY' ? currentPrice - ord.entryPrice : ord.entryPrice - currentPrice;
    const pnl = Number((diff * ord.lotSize * (ord.leverage / 100)).toFixed(2));

    await closeOrder(orderId, currentPrice);

    setOrderNotification({
      text: `Closed ${ord.symbol}: Realized P&L ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USD updated to balance!`,
      type: 'close'
    });
    setTimeout(() => setOrderNotification(null), 3500);
  };

  const handleCloseAllPositions = async () => {
    if (openOrders.length === 0) return;
    for (const ord of openOrders) {
      const currentPrice = assets.find((a) => a.pair === ord.symbol)?.price || ord.currentPrice;
      await closeOrder(ord.id, currentPrice);
    }
    setOrderNotification({
      text: `All positions closed. Balance updated in real-time.`,
      type: 'close'
    });
    setTimeout(() => setOrderNotification(null), 3500);
  };

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter'] pb-20 sm:pb-16 select-none">
      <Header
        currentView="dashboard"
        onNavigate={onNavigate}
        onOpenDeposit={onOpenDeposit}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
      />

      {/* Real-time green news ticker bar matching screenshot */}
      <div className="w-full bg-emerald-50/90 border-b border-emerald-200/70 px-3 sm:px-4 py-1.5 text-xs text-emerald-900 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-2 font-medium">
          <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
          <span className="truncate text-[11px] sm:text-xs">
            Gold & Silver hit fresh intraday highs as rate cut bets accelerate · Global indices steady · Immediate OTC 24/7 Engine Active
          </span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        
        {/* Real-Time fx Engine stats card with dynamic flash update */}
        <div className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-2xs space-y-3 transition-all duration-300 ${
          equityFlash === 'up'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : equityFlash === 'down'
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[11px]">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600'}`}></span>
              <span>Real-Time fx Engine</span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Booked Balance: <span className="font-bold text-slate-900">${balance.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            {/* Live Equity Card */}
            <div className={`p-2 rounded-xl transition-colors ${equityFlash === 'up' ? 'bg-emerald-50' : equityFlash === 'down' ? 'bg-rose-50' : 'bg-slate-50/70'}`}>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Active Equity</p>
              <p className={`font-bold font-mono text-sm sm:text-base ${equityFlash === 'up' ? 'text-emerald-600' : equityFlash === 'down' ? 'text-rose-600' : 'text-slate-900'}`}>
                ${equity.toFixed(2)} USD
              </p>
            </div>

            {/* Demo Balance Card */}
            <div className="p-2 rounded-xl bg-slate-50/70">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Demo Capital</p>
                {activeAccount === 'demo' && (
                  <button
                    onClick={resetDemoBalance}
                    title="Reset demo balance to $10,000"
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <p className="font-bold font-mono text-sm sm:text-base text-slate-900">
                ${(profile?.demoBalance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </p>
            </div>

            {/* Floating PnL Card */}
            <div className={`p-2 rounded-xl transition-colors ${totalFloatingPnl >= 0 ? 'bg-emerald-50/70' : 'bg-rose-50/70'}`}>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Floating P&L</p>
              <p className={`font-bold font-mono text-sm sm:text-base ${totalFloatingPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalFloatingPnl >= 0 ? '+' : ''}${totalFloatingPnl.toFixed(2)} USD
              </p>
            </div>

            {/* Margin Level & Leverage Card */}
            <div className="p-2 rounded-xl bg-slate-50/70">
              <p className="text-[10px] text-slate-400 uppercase font-medium">Margin / Leverage</p>
              <p className="font-bold font-mono text-xs sm:text-sm text-slate-900 truncate">
                {marginLevel.toFixed(1)}% · 1:{leverage}
              </p>
            </div>
          </div>
        </div>

        {/* Live Account Banner matching screenshot */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-bold text-xs text-blue-950">
                {activeAccount === 'live' ? 'Live Account Active' : 'Demo Practice Terminal Active'} — {profile?.fullName || 'Trader'}
              </h3>
            </div>
            <p className="text-[11px] text-blue-700 mt-0.5">
              (119+ Live Market Assets · Ultra-High 1:{leverage} Margin · Paper Fill Active)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeAccount === 'demo' && (
              <button
                onClick={resetDemoBalance}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Reset $10k</span>
              </button>
            )}
            <button
              onClick={onOpenDeposit}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Deposit</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Trade | Live Markets (119) | Open Trades (N) */}
        <div className="flex items-center border-b border-slate-200 gap-4 sm:gap-6 text-xs font-semibold text-slate-500 pt-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('trade')}
            className={`pb-2.5 whitespace-nowrap transition-colors relative ${
              activeTab === 'trade'
                ? 'text-blue-600 font-bold border-b-2 border-blue-600 -mb-[1px]'
                : 'hover:text-slate-900'
            }`}
          >
            Trade Terminal
          </button>
          <button
            onClick={() => setActiveTab('markets')}
            className={`pb-2.5 whitespace-nowrap transition-colors relative ${
              activeTab === 'markets'
                ? 'text-blue-600 font-bold border-b-2 border-blue-600 -mb-[1px]'
                : 'hover:text-slate-900'
            }`}
          >
            Live Markets (119)
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 whitespace-nowrap transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'text-blue-600 font-bold border-b-2 border-blue-600 -mb-[1px]'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Open Trades</span>
            {openOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {openOrders.length}
              </span>
            )}
          </button>
        </div>

        {orderNotification && (
          <div className={`p-3 text-white text-xs font-semibold rounded-xl shadow-md animate-in fade-in duration-200 flex items-center justify-between ${
            orderNotification.type === 'close' ? 'bg-slate-900' : 'bg-emerald-600'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{orderNotification.text}</span>
            </div>
            <button onClick={() => setOrderNotification(null)} className="text-white/70 hover:text-white p-0.5">
              ✕
            </button>
          </div>
        )}

        {/* TRADE TAB */}
        {activeTab === 'trade' && (
          <div className="space-y-3 sm:space-y-4">
            
            {/* Active Asset Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{selectedAsset.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    OTC
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">{selectedAsset.pair}</p>
              </div>

              <div className="text-right">
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
                  ${selectedAsset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs font-bold font-mono ${selectedAsset.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}%
                </p>
              </div>
            </div>

            {/* Financial Chart Component with Touch scrubbing */}
            <TradingChart asset={selectedAsset} />

            {/* Order Execution Pad matching screenshot Page 9 - Mobile optimized */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              
              {/* Market vs Limit Order tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setOrderType('MARKET')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === 'MARKET'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Market Order
                </button>
                <button
                  onClick={() => setOrderType('LIMIT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === 'LIMIT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Limit Order
                </button>

                <div className="ml-auto hidden sm:flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ultra-Fast Fill</span>
                </div>
              </div>

              {/* Leverage Selection Suite */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>Margin Leverage Suite</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-mono uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    Active 1:{leverage}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {LEVERAGES.map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setLeverage(lev)}
                      className={`py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                        leverage === lev
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      1:{lev}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                  <span>Req. Margin: ${(13.48 * (lotSize / 0.10)).toFixed(2)} USD</span>
                  <span>Purchasing Power: ${(balance * (leverage / 100)).toFixed(2)} USD</span>
                </div>
              </div>

              {/* Lot Size / Volume Controls with Large Stepper */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Lot Size / Volume
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setLotSize((prev) => Math.max(0.01, Number((prev - 0.01).toFixed(2))))}
                    className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-lg text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10.0"
                    value={lotSize}
                    onChange={(e) => setLotSize(Math.max(0.01, Number(e.target.value)))}
                    className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-center font-bold font-mono text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setLotSize((prev) => Number((prev + 0.01).toFixed(2)))}
                    className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-lg text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>

                {/* Preset Lot Pills */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {LOT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setLotSize(p)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                        lotSize === p
                          ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Take Profit & Stop Loss */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800">Take Profit (TP)</label>
                    <input
                      type="checkbox"
                      checked={enableTP}
                      onChange={(e) => setEnableTP(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </div>
                  {enableTP && (
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <span className="text-slate-400">Target:</span>
                      <span className="text-emerald-600 font-bold">
                        ${(selectedAsset.price * (1 + tpPercent / 100)).toFixed(2)} (+{tpPercent}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800">Stop Loss (SL)</label>
                    <input
                      type="checkbox"
                      checked={enableSL}
                      onChange={(e) => setEnableSL(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </div>
                  {enableSL && (
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      <span className="text-slate-400">Stop:</span>
                      <span className="text-rose-600 font-bold">
                        ${(selectedAsset.price * (1 - slPercent / 100)).toFixed(2)} (-{slPercent}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Big Execution Buttons in thumb reach zone */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteTrade('BUY')}
                  className="py-3.5 sm:py-4 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md transition-all flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>↑ BUY</span>
                    <span className="font-mono text-xs">{selectedAsset.symbol}</span>
                  </div>
                  <span className="text-[11px] font-mono font-normal opacity-90 mt-0.5">
                    ${selectedAsset.price.toFixed(2)} · 1:{leverage}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteTrade('SELL')}
                  className="py-3.5 sm:py-4 px-3 sm:px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md transition-all flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <span>↓ SELL</span>
                    <span className="font-mono text-xs">{selectedAsset.symbol}</span>
                  </div>
                  <span className="text-[11px] font-mono font-normal opacity-90 mt-0.5">
                    ${selectedAsset.price.toFixed(2)} · 1:{leverage}
                  </span>
                </button>
              </div>

            </div>

            {/* Live Open Trades preview if any */}
            {openOrders.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Open Positions ({openOrders.length})</span>
                  </div>
                  <button
                    onClick={handleCloseAllPositions}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Close All Positions
                  </button>
                </div>

                <div className="space-y-2">
                  {openOrders.map((ord) => {
                    const currentPrice = assets.find((a) => a.pair === ord.symbol)?.price || ord.currentPrice;
                    const diff = ord.type === 'BUY' ? currentPrice - ord.entryPrice : ord.entryPrice - currentPrice;
                    const orderPnl = Number((diff * ord.lotSize * (ord.leverage / 100)).toFixed(2));

                    return (
                      <div
                        key={ord.id}
                        className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {ord.type}
                            </span>
                            <span className="font-bold text-slate-900">{ord.symbol}</span>
                            <span className="text-slate-400 font-mono text-[10px]">1:{ord.leverage} · {ord.lotSize}L</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            ${ord.entryPrice.toFixed(2)} → ${currentPrice.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className={`font-mono font-bold ${orderPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {orderPnl >= 0 ? '+' : ''}${orderPnl.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleClosePosition(ord.id)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold rounded-lg shadow-2xs"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Live Market Assets List below the pad */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Market Assets
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">119 instruments</span>
              </div>

              <div className="space-y-1.5">
                {assets.map((asset) => {
                  const isSelected = asset.symbol === selectedAsset.symbol;
                  return (
                    <div
                      key={asset.symbol}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-600 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold font-mono text-xs text-slate-700">
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{asset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{asset.pair}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-900">
                          ${asset.price.toFixed(asset.price < 10 ? 4 : 2)}
                        </p>
                        <p className={`text-[10px] font-bold font-mono ${asset.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* MARKETS TAB */}
        {activeTab === 'markets' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">119+ Live Markets</h3>
                <p className="text-xs text-slate-400">Trade Crypto, Forex, Metals, and Indices with high leverage</p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search instrument by name or ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.symbol}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setActiveTab('trade');
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-600 bg-white flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold font-mono text-xs flex items-center justify-center">
                      {asset.symbol}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{asset.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{asset.pair} · Vol: {asset.volume}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-slate-900">
                      ${asset.price.toFixed(asset.price < 10 ? 4 : 2)}
                    </p>
                    <p className={`text-[10px] font-bold font-mono ${asset.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Active Positions ({openOrders.length})
              </h3>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold ${totalFloatingPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Floating P&L: {totalFloatingPnl >= 0 ? '+' : ''}${totalFloatingPnl.toFixed(2)}
                </span>
                {openOrders.length > 0 && (
                  <button
                    onClick={handleCloseAllPositions}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors"
                  >
                    Close All
                  </button>
                )}
              </div>
            </div>

            {openOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p>No open positions right now.</p>
                <button
                  onClick={() => setActiveTab('trade')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Go to Trade Terminal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {openOrders.map((ord) => {
                  const currentPrice = assets.find((a) => a.pair === ord.symbol)?.price || ord.currentPrice;
                  const diff = ord.type === 'BUY' ? currentPrice - ord.entryPrice : ord.entryPrice - currentPrice;
                  const orderPnl = Number((diff * ord.lotSize * (ord.leverage / 100)).toFixed(2));

                  return (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs bg-white shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {ord.type}
                          </span>
                          <span className="font-bold text-slate-900">{ord.symbol}</span>
                          <span className="text-slate-400 font-mono text-[10px]">1:{ord.leverage} · {ord.lotSize} lot</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          Entry: ${ord.entryPrice.toFixed(2)} → Current: ${currentPrice.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold text-sm ${orderPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {orderPnl >= 0 ? '+' : ''}${orderPnl.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleClosePosition(ord.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold rounded-lg transition-transform"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Bottom Sticky App Navigation matching screenshot - Mobile optimized */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-4 sm:px-6 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setActiveTab('trade')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-colors ${
            activeTab === 'trade' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span>Trade</span>
        </button>

        <button
          onClick={() => setActiveTab('markets')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-colors ${
            activeTab === 'markets' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>OTC Assets</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-colors relative ${
            activeTab === 'orders' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>Orders</span>
          {openOrders.length > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
              {openOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <UserCheck className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
      />

    </div>
  );
}
