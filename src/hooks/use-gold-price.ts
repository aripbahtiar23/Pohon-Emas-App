import { useState, useCallback } from "react";

export type GoldPriceData = {
  pricePerGram: number;
  spotUSD: number;
  usdToIDR: number;
  source: string;
  fetchedAt: string;
  movement?: number;      // selisih IDR vs kemarin (positif = naik, negatif = turun)
  movementPct?: number;   // persentase perubahan
};

const CACHE_KEY = "pohon-emas:gold-price-history";
type CacheEntry = { date: string; price: number };

function todayStr() { return new Date().toISOString().slice(0, 10); }

function loadCache(): { today: CacheEntry | null; yesterday: CacheEntry | null } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : { today: null, yesterday: null };
  } catch { return { today: null, yesterday: null }; }
}

function saveCache(price: number) {
  try {
    const cache = loadCache();
    const today = todayStr();
    const next = {
      yesterday: cache.today?.date !== today ? cache.today : cache.yesterday,
      today: { date: today, price },
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

function calcMovement(current: number): { movement: number; movementPct: number } | null {
  const { yesterday, today } = loadCache();
  // Jika cache hari ini sudah ada dari sebelumnya, bandingkan dengan kemarin
  const prev = yesterday?.price ?? (today?.date !== todayStr() ? today?.price : null);
  if (!prev || prev === current) return null;
  const movement = current - prev;
  const movementPct = (movement / prev) * 100;
  return { movement, movementPct };
}

const TROY_OZ_TO_GRAM = 31.1035;
const FALLBACK_PRICE_PER_GRAM = 2_584_000; // Antam buyback Juni 2026
const FALLBACK_USD_IDR = 16_400;
const FALLBACK_SPOT_USD = 4_900; // ~$4,900/oz

/** Fetch gold spot price USD/troy oz */
async function fetchSpotUSD(): Promise<number> {
  // Source 1: metals.live
  try {
    const res = await fetch("https://api.metals.live/v1/spot/gold", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      // Format: [{gold: 4900}] or {gold: 4900} or {price: 4900}
      const val = Array.isArray(data) ? data[0]?.gold : data?.gold ?? data?.price;
      if (typeof val === "number" && val > 0) return val;
    }
  } catch { /* fallthrough */ }

  // Source 2: goldprice.org data endpoint
  try {
    const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      signal: AbortSignal.timeout(5000),
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    if (res.ok) {
      const data = await res.json();
      const oz = data?.items?.[0]?.xauPrice;
      if (typeof oz === "number" && oz > 0) return oz;
    }
  } catch { /* fallthrough */ }

  throw new Error("No gold spot source available");
}

/** Fetch USD → IDR rate */
async function fetchUSDToIDR(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const idr = data?.rates?.IDR;
      if (typeof idr === "number" && idr > 0) return idr;
    }
  } catch { /* fallthrough */ }

  // Fallback: frankfurter
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=IDR", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const idr = data?.rates?.IDR;
      if (typeof idr === "number" && idr > 0) return idr;
    }
  } catch { /* fallthrough */ }

  return FALLBACK_USD_IDR;
}

export const fetchGoldPriceData = async (): Promise<GoldPriceData> => {
  try {
    // Prioritas: Vercel proxy (no CORS issue)
    let spotUSD: number | null = null;
    let usdToIDR: number | null = null;
    let srcLabel = "";

    try {
      const proxyRes = await fetch("/api/gold-price", { signal: AbortSignal.timeout(10000) });
      if (proxyRes.ok) {
        const d = await proxyRes.json();
        if (d.pricePerGram) {
          // Proxy sudah hitung pricePerGram langsung
          const mov = calcMovement(d.pricePerGram);
          saveCache(d.pricePerGram);
          return {
            pricePerGram: d.pricePerGram,
            spotUSD: d.spotUSD ?? 0,
            usdToIDR: d.usdToIDR ?? 0,
            source: d.source ?? "proxy",
            fetchedAt: d.fetchedAt ?? new Date().toISOString(),
            movement: mov?.movement,
            movementPct: mov?.movementPct,
          };
        }
      }
    } catch {}

    // Fallback: direct call (dev mode / non-Vercel)
    if (!spotUSD || !usdToIDR) {
      [spotUSD, usdToIDR] = await Promise.all([fetchSpotUSD(), fetchUSDToIDR()]);
      srcLabel = "direct";
    }

    const pricePerGram = Math.round((spotUSD! / TROY_OZ_TO_GRAM) * usdToIDR! / 1000) * 1000;
    const mov = calcMovement(pricePerGram);
    saveCache(pricePerGram);
    return {
      pricePerGram,
      spotUSD: spotUSD!,
      usdToIDR: usdToIDR!,
      source: `Spot $${spotUSD!.toLocaleString("en", { maximumFractionDigits: 0 })}/oz × Rp${Math.round(usdToIDR!).toLocaleString("id-ID")} (${srcLabel})`,
      fetchedAt: new Date().toISOString(),
      movement: mov?.movement,
      movementPct: mov?.movementPct,
    };
  } catch {
    // Gunakan harga terakhir dari cache, atau hardcoded jika belum ada
    const cache = loadCache();
    const lastPrice = cache.today?.price ?? cache.yesterday?.price ?? FALLBACK_PRICE_PER_GRAM;
    const lastDate  = cache.today?.date ?? cache.yesterday?.date;
    const sourceLabel = lastDate
      ? `Harga terakhir (${lastDate})`
      : "Estimasi (offline)";

    const fallback: GoldPriceData = {
      pricePerGram: lastPrice,
      spotUSD: FALLBACK_SPOT_USD,
      usdToIDR: FALLBACK_USD_IDR,
      source: sourceLabel,
      fetchedAt: new Date().toISOString(),
    };
    const mov = calcMovement(lastPrice);
    if (mov) { fallback.movement = mov.movement; fallback.movementPct = mov.movementPct; }
    return fallback;
  }
};

// ── Standard weights preset (untuk Story Generator) ──────────────────────────

const STANDARD_WEIGHTS = [
  { weight: "0.5", gramMultiplier: 0.55 },
  { weight: "1",   gramMultiplier: 1 },
  { weight: "2",   gramMultiplier: 1.98 },
  { weight: "3",   gramMultiplier: 2.94 },
  { weight: "5",   gramMultiplier: 4.85 },
  { weight: "10",  gramMultiplier: 9.6 },
  { weight: "25",  gramMultiplier: 23.8 },
  { weight: "50",  gramMultiplier: 47.2 },
  { weight: "100", gramMultiplier: 93.5 },
];

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const useGoldPrice = () => {
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<GoldPriceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePriceRows = useCallback((pricePerGram: number) => {
    return STANDARD_WEIGHTS.map(({ weight, gramMultiplier }) => ({
      id: newId(),
      weight,
      unit: "gram",
      price: String(Math.round((pricePerGram * gramMultiplier) / 1000) * 1000),
    }));
  }, []);

  const fetchAndFill = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGoldPriceData();
      setLastFetch(data);
      const rows = generatePriceRows(data.pricePerGram);
      return { data, rows };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengambil harga");
      return null;
    } finally {
      setLoading(false);
    }
  }, [generatePriceRows]);

  return { fetchAndFill, loading, lastFetch, error };
};
