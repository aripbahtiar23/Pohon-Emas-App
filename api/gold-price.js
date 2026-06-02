const TROY_OZ_TO_GRAM = 31.1035;

async function fetchSpotUSD() {
  // Source 1: metals.live
  try {
    const res = await fetch("https://api.metals.live/v1/spot/gold", {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      const val = Array.isArray(data) ? data[0]?.gold : data?.gold ?? data?.price;
      if (typeof val === "number" && val > 0) return { price: val, source: "metals.live" };
    }
  } catch {}

  // Source 2: goldprice.org
  try {
    const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0", "X-Requested-With": "XMLHttpRequest" },
    });
    if (res.ok) {
      const data = await res.json();
      const oz = data?.items?.[0]?.xauPrice;
      if (typeof oz === "number" && oz > 0) return { price: oz, source: "goldprice.org" };
    }
  } catch {}

  return null;
}

async function fetchUSDToIDR() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      const idr = data?.rates?.IDR;
      if (typeof idr === "number" && idr > 0) return idr;
    }
  } catch {}

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=IDR", {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      const idr = data?.rates?.IDR;
      if (typeof idr === "number" && idr > 0) return idr;
    }
  } catch {}

  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const [spotResult, usdToIDR] = await Promise.all([
      fetchSpotUSD(),
      fetchUSDToIDR(),
    ]);

    if (!spotResult || !usdToIDR) {
      res.status(503).json({ error: "Price data unavailable" });
      return;
    }

    const spotUSD   = spotResult.price;
    const pricePerGram = Math.round((spotUSD / TROY_OZ_TO_GRAM) * usdToIDR / 1000) * 1000;

    res.status(200).json({
      pricePerGram,
      spotUSD,
      usdToIDR,
      source: spotResult.source,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
