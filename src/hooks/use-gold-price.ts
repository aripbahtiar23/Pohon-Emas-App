import { useState, useCallback } from "react";

export type GoldPriceData = {
  pricePerGram: number;
  source: string;
  fetchedAt: string;
};

const STANDARD_WEIGHTS: { weight: string; gramMultiplier: number }[] = [
  { weight: "0.5", gramMultiplier: 0.55 },
  { weight: "1", gramMultiplier: 1 },
  { weight: "2", gramMultiplier: 1.98 },
  { weight: "3", gramMultiplier: 2.94 },
  { weight: "5", gramMultiplier: 4.85 },
  { weight: "10", gramMultiplier: 9.6 },
  { weight: "25", gramMultiplier: 23.8 },
  { weight: "50", gramMultiplier: 47.2 },
  { weight: "100", gramMultiplier: 93.5 },
];

const FALLBACK_PRICE_PER_GRAM = 1_960_000;

const fetchGoldPrice = async (): Promise<GoldPriceData> => {
  try {
    const res = await fetch("https://logam-mulia-api.vercel.app/prices/anekalogam", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("API not OK");
    const json = (await res.json()) as { data?: Array<{ type: string; sell: number }> };
    const oneGram = json.data?.find((d) => d.type === "1.0");
    if (!oneGram?.sell) throw new Error("Price not found");
    return { pricePerGram: oneGram.sell, source: "Logam Mulia Antam", fetchedAt: new Date().toISOString() };
  } catch {
    return { pricePerGram: FALLBACK_PRICE_PER_GRAM, source: "Estimasi (offline)", fetchedAt: new Date().toISOString() };
  }
};

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
      const data = await fetchGoldPrice();
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
