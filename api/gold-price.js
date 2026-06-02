const TROY_OZ_TO_GRAM = 31.1035;

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
};

/** Gold spot price in USD/troy oz via Yahoo Finance GC=F */
async function fetchSpotUSD() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
      { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const d = await res.json();
      const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === "number" && price > 0) return { price, source: "Yahoo Finance" };
    }
  } catch {}

  // Backup: query2
  try {
    const res = await fetch(
      "https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
      { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const d = await res.json();
      const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === "number" && price > 0) return { price, source: "Yahoo Finance" };
    }
  } catch {}

  return null;
}

/** USD to IDR rate via Yahoo Finance USDIDR=X */
async function fetchUSDToIDR() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/USDIDR%3DX?interval=1d&range=1d",
      { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const d = await res.json();
      const rate = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof rate === "number" && rate > 0) return rate;
    }
  } catch {}

  // Fallback: frankfurter (ECB data)
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=IDR",
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const d = await res.json();
      const idr = d?.rates?.IDR;
      if (typeof idr === "number" && idr > 0) return idr;
    }
  } catch {}

  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  // Cache 1 jam di Vercel Edge
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const [spotResult, usdToIDR] = await Promise.all([
      fetchSpotUSD(),
      fetchUSDToIDR(),
    ]);

    if (!spotResult || !usdToIDR) {
      return res.status(503).json({
        error: "Price data unavailable",
        detail: { spot: !!spotResult, idr: !!usdToIDR },
      });
    }

    const spotUSD      = spotResult.price;
    const pricePerGram = Math.round((spotUSD / TROY_OZ_TO_GRAM) * usdToIDR / 1000) * 1000;

    return res.status(200).json({
      pricePerGram,
      spotUSD,
      usdToIDR: Math.round(usdToIDR),
      source: spotResult.source,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
