const TROY_OZ_TO_GRAM = 31.1035;

/**
 * XAU/IDR dari fawazahmed0/currency-api (GitHub → jsDelivr CDN)
 * 1 XAU = 1 troy oz emas dalam IDR
 */
async function fetchXAUtoIDR() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${today}/currencies/xau/idr.json`,
    `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/xau/idr.json`,
    `https://raw.githubusercontent.com/fawazahmed0/currency-api/1/${today}/currencies/xau/idr.json`,
    `https://raw.githubusercontent.com/fawazahmed0/currency-api/1/latest/currencies/xau/idr.json`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const d = await res.json();
        const idr = d?.idr;
        if (typeof idr === "number" && idr > 0) return { xauToIDR: idr, source: "fawazahmed0/currency-api" };
      }
    } catch {}
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const result = await fetchXAUtoIDR();

    if (!result) {
      return res.status(503).json({ error: "Price data unavailable" });
    }

    // 1 XAU = 1 troy oz → bagi untuk dapat harga per gram
    const pricePerGram = Math.round(result.xauToIDR / TROY_OZ_TO_GRAM / 1000) * 1000;
    const spotUSD      = Math.round(result.xauToIDR / 16400); // estimasi untuk display

    return res.status(200).json({
      pricePerGram,
      xauToIDR: Math.round(result.xauToIDR),
      spotUSD,
      usdToIDR: Math.round(result.xauToIDR / spotUSD),
      source: result.source,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
