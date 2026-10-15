import React, { useState, useEffect, useRef } from 'react';
import type { MarketAsset } from '../types';
import { generateCandles, type Candle } from '../lib/marketData';

interface TradingChartProps {
  asset: MarketAsset;
}

export function TradingChart({ asset }: TradingChartProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('1m');
  const [chartType, setChartType] = useState<'area' | 'candle'>('area');
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(asset.price, 36));
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [touchX, setTouchX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update last candle smoothly on price change
  useEffect(() => {
    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const last = { ...prev[prev.length - 1] };
      last.close = asset.price;
      if (asset.price > last.high) last.high = asset.price;
      if (asset.price < last.low) last.low = asset.price;
      return [...prev.slice(0, -1), last];
    });
  }, [asset.price]);

  // Regenerate on asset or timeframe change
  useEffect(() => {
    setCandles(generateCandles(asset.price, 36));
  }, [asset.symbol, timeframe]);

  const minPrice = Math.min(...candles.map((c) => c.low));
  const maxPrice = Math.max(...candles.map((c) => c.high));
  const priceRange = maxPrice - minPrice || 1;

  const width = 640;
  const height = 240;
  const paddingBottom = 35;
  const paddingTop = 20;
  const plotHeight = height - paddingBottom - paddingTop;

  const points = candles.map((c, i) => {
    const x = (i / (candles.length - 1)) * (width - 70) + 12;
    const y = paddingTop + plotHeight - ((c.close - minPrice) / priceRange) * plotHeight;
    return { x, y, candle: c };
  });

  // Smooth bezier curve generator
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const smoothPathD = points.length > 2 ? createSmoothPath(points) : points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const areaD = `${smoothPathD} L ${points[points.length - 1]?.x || width} ${height - paddingBottom} L ${points[0]?.x || 0} ${height - paddingBottom} Z`;

  const isPositive = asset.change24h >= 0;
  const strokeColor = isPositive ? '#10B981' : '#F43F5E';
  const lastPoint = points[points.length - 1];

  // Touch and mouse scrubber
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : 0;
    const relativeX = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, relativeX / rect.width));
    const index = Math.round(percent * (candles.length - 1));
    if (candles[index]) {
      setHoveredCandle(candles[index]);
      setTouchX(points[index]?.x || null);
    }
  };

  const handlePointerLeave = () => {
    setHoveredCandle(null);
    setTouchX(null);
  };

  return (
    <div className="w-full bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs font-['Inter'] select-none">
      {/* Top Controls: Timeframe & Chart Type */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
          {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setChartType(chartType === 'area' ? 'candle' : 'area')}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1"
          >
            <span>{chartType === 'area' ? '📊 Candles' : '📈 Line'}</span>
          </button>
        </div>
      </div>

      {/* Real-time OHLC readout */}
      {(() => {
        const activeCandle = hoveredCandle || candles[candles.length - 1];
        const openVal = activeCandle ? activeCandle.open : asset.price;
        const highVal = activeCandle ? activeCandle.high : (asset.high24h || asset.price * 1.002);
        const lowVal = activeCandle ? activeCandle.low : (asset.low24h || asset.price * 0.998);
        const closeVal = activeCandle ? activeCandle.close : asset.price;

        return (
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2 px-1 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span>O: <strong className="text-slate-800">${openVal.toFixed(2)}</strong></span>
              <span>H: <strong className="text-slate-800">${highVal.toFixed(2)}</strong></span>
              <span>L: <strong className="text-slate-800">${lowVal.toFixed(2)}</strong></span>
              <span>C: <strong className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>${closeVal.toFixed(2)}</strong></span>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live WebSocket Feed</span>
            </div>
          </div>
        );
      })()}

      {/* Responsive SVG Chart with Touch/Mouse scrubbing */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative w-full h-[220px] sm:h-[250px] overflow-hidden cursor-crosshair touch-none"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={`chart-grad-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={paddingTop} x2={width} y2={paddingTop} stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1="0" y1={paddingTop + plotHeight * 0.33} x2={width} y2={paddingTop + plotHeight * 0.33} stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1="0" y1={paddingTop + plotHeight * 0.66} x2={width} y2={paddingTop + plotHeight * 0.66} stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1="0" y1={height - paddingBottom} x2={width} y2={height - paddingBottom} stroke="#E2E8F0" />

          {/* Price labels right edge */}
          <text x={width - 5} y={paddingTop + 10} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono, monospace">
            ${maxPrice.toFixed(asset.price < 10 ? 4 : 2)}
          </text>
          <text x={width - 5} y={paddingTop + plotHeight * 0.5} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono, monospace">
            ${((minPrice + maxPrice) / 2).toFixed(asset.price < 10 ? 4 : 2)}
          </text>
          <text x={width - 5} y={height - paddingBottom - 4} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono, monospace">
            ${minPrice.toFixed(asset.price < 10 ? 4 : 2)}
          </text>

          {/* Current horizontal price line */}
          {lastPoint && (
            <line
              x1="0"
              y1={lastPoint.y}
              x2={width - 70}
              y2={lastPoint.y}
              stroke={strokeColor}
              strokeDasharray="2 2"
              strokeWidth="1"
              opacity="0.8"
            />
          )}

          {chartType === 'area' ? (
            <>
              <path d={areaD} fill={`url(#chart-grad-${asset.symbol})`} />
              <path d={smoothPathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            candles.map((c, i) => {
              const x = (i / (candles.length - 1)) * (width - 70) + 12;
              const yHigh = paddingTop + plotHeight - ((c.high - minPrice) / priceRange) * plotHeight;
              const yLow = paddingTop + plotHeight - ((c.low - minPrice) / priceRange) * plotHeight;
              const yOpen = paddingTop + plotHeight - ((c.open - minPrice) / priceRange) * plotHeight;
              const yClose = paddingTop + plotHeight - ((c.close - minPrice) / priceRange) * plotHeight;
              const isGreen = c.close >= c.open;
              const candleColor = isGreen ? '#10B981' : '#F43F5E';
              const candleTop = Math.min(yOpen, yClose);
              const candleHeight = Math.max(2, Math.abs(yClose - yOpen));

              return (
                <g key={i}>
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1.2" />
                  <rect
                    x={x - 4}
                    y={candleTop}
                    width="8"
                    height={candleHeight}
                    fill={candleColor}
                    rx="1"
                  />
                </g>
              );
            })
          )}

          {/* Pulse marker at current price tip */}
          {lastPoint && (
            <g>
              <circle cx={lastPoint.x} cy={lastPoint.y} r="6" fill={strokeColor} opacity="0.3" className="animate-ping" />
              <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill={strokeColor} />
            </g>
          )}

          {/* Active touch vertical crosshair */}
          {touchX !== null && (
            <line
              x1={touchX}
              y1={paddingTop}
              x2={touchX}
              y2={height - paddingBottom}
              stroke="#64748B"
              strokeDasharray="2 2"
              strokeWidth="1.2"
            />
          )}
        </svg>

        {/* Hover Tooltip card floating on chart */}
        {hoveredCandle && touchX !== null && (
          <div
            className="absolute top-2 bg-slate-900/90 text-white text-[10px] font-mono px-2 py-1 rounded-lg pointer-events-none shadow-md"
            style={{
              left: `${Math.min(80, Math.max(10, (touchX / width) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div>{hoveredCandle.time}</div>
            <div className="font-bold text-emerald-400">${hoveredCandle.close.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
