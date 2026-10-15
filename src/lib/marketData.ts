import { useEffect, useState } from 'react';
import type { MarketAsset } from '../types';

export const INITIAL_ASSETS: MarketAsset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    pair: 'BTC/USD',
    price: 67384.58,
    change24h: 2.42,
    sparkline: [66200, 66500, 66100, 66900, 67100, 66800, 67200, 67384.58],
    high24h: 68150.00,
    low24h: 65900.00,
    volume: '$42.8B'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    pair: 'ETH/USD',
    price: 3523.70,
    change24h: -0.86,
    sparkline: [3590, 3570, 3540, 3510, 3530, 3520, 3523.70],
    high24h: 3610.00,
    low24h: 3480.00,
    volume: '$19.2B'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    pair: 'SOL/USD',
    price: 178.91,
    change24h: 5.68,
    sparkline: [168, 171, 169, 174, 176, 175, 178.91],
    high24h: 182.50,
    low24h: 167.00,
    volume: '$8.4B'
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    pair: 'XRP/USD',
    price: 0.6281,
    change24h: 1.31,
    sparkline: [0.612, 0.615, 0.620, 0.618, 0.625, 0.6281],
    high24h: 0.6410,
    low24h: 0.6090,
    volume: '$2.1B'
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    pair: 'BNB/USD',
    price: 588.92,
    change24h: 0.45,
    sparkline: [584, 586, 582, 587, 589, 588.92],
    high24h: 594.00,
    low24h: 580.00,
    volume: '$1.5B'
  }
];

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate realistic starting candle history
export function generateCandles(basePrice: number, count: number = 30): Candle[] {
  const candles: Candle[] = [];
  let current = basePrice * 0.98;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const delta = (Math.random() - 0.49) * (basePrice * 0.004);
    const open = current;
    const close = open + delta;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.002);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.002);
    const volume = Math.floor(Math.random() * 50) + 10;

    candles.push({ time, open, high, low, close, volume });
    current = close;
  }
  return candles;
}

// React hook for live WebSocket pricing
export function useLiveMarket() {
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(INITIAL_ASSETS[0]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const tickers = JSON.parse(event.data);
          if (Array.isArray(tickers)) {
            const symbolMap: Record<string, { price: number; change: number }> = {};
            for (const t of tickers) {
              if (['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT'].includes(t.s)) {
                const clean = t.s.replace('USDT', '');
                symbolMap[clean] = {
                  price: parseFloat(t.c),
                  change: parseFloat(t.w) // or relative change
                };
              }
            }

            setAssets((prev) =>
              prev.map((asset) => {
                const live = symbolMap[asset.symbol];
                if (live && live.price > 0) {
                  const updatedSpark = [...asset.sparkline.slice(1), live.price];
                  return {
                    ...asset,
                    price: live.price,
                    sparkline: updatedSpark
                  };
                }
                return asset;
              })
            );
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch {
      setWsConnected(false);
    }

    // Simulated micro-tick engine as fallback or supplementary smooth animation
    fallbackInterval = setInterval(() => {
      setAssets((prev) =>
        prev.map((asset) => {
          // Micro drift ~0.05%
          const drift = (Math.random() - 0.495) * (asset.price * 0.0006);
          const newPrice = Math.max(0.01, asset.price + drift);
          return {
            ...asset,
            price: Number(newPrice.toFixed(asset.price < 10 ? 4 : 2)),
            sparkline: [...asset.sparkline.slice(1), newPrice]
          };
        })
      );
    }, 700);

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // Update selected asset when assets list updates
  useEffect(() => {
    const current = assets.find((a) => a.symbol === selectedAsset.symbol);
    if (current) setSelectedAsset(current);
  }, [assets, selectedAsset.symbol]);

  return { assets, selectedAsset, setSelectedAsset, wsConnected };
}
