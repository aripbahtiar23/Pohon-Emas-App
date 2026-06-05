/**
 * Scraper harga emas harian dari logammulia.com
 * Jalankan: node scripts/scrape-harga-emas.js
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_URL                = "https://www.logammulia.com/id/harga-emas-hari-ini";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** Parse "1 gr" → 1.0, "0.5 gr" → 0.5, "100 gr" → 100 */
function parseBerat(str) {
  const match = str.replace(",", ".").match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/** Parse "Rp 2.774.000" atau "2.774.000" → 2774000 */
function parseHarga(str) {
  return parseInt(str.replace(/[^\d]/g, ""), 10) || 0;
}

async function scrape() {
  console.log(`🔍 Fetching ${TARGET_URL}`);

  const res = await fetch(TARGET_URL, {
    headers: {
      "User-Agent":                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language":           "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding":           "gzip, deflate, br",
      "Cache-Control":             "no-cache",
      "Pragma":                    "no-cache",
      "Referer":                   "https://www.google.com/",
      "Sec-Ch-Ua":                 '"Chromium";v="125", "Not.A/Brand";v="24", "Google Chrome";v="125"',
      "Sec-Ch-Ua-Mobile":          "?0",
      "Sec-Ch-Ua-Platform":        '"Windows"',
      "Sec-Fetch-Dest":            "document",
      "Sec-Fetch-Mode":            "navigate",
      "Sec-Fetch-Site":            "cross-site",
      "Sec-Fetch-User":            "?1",
      "Upgrade-Insecure-Requests": "1",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $    = cheerio.load(html);
  const rows = [];

  // Cari tabel harga — logammulia.com biasanya punya <table> dengan header Berat/Harga
  // Hanya proses tabel PERTAMA yang berisi Berat + Harga (Emas Batangan utama)
  let found = false;
  $("table").each((_, table) => {
    if (found) return; // stop setelah tabel pertama
    const headers = [];
    $(table).find("th").each((_, th) => {
      headers.push($(th).text().trim().toLowerCase());
    });

    const isHargaTable = headers.some((h) => h.includes("berat")) &&
                         headers.some((h) => h.includes("harga"));
    if (!isHargaTable) return;
    found = true;

    $(table).find("tr").each((_, tr) => {
      const cols = $(tr).find("td").map((_, td) => $(td).text().trim()).get();
      if (cols.length < 2) return;

      // cols[0] = Berat, cols[1] = Harga Dasar, cols[2] = Harga+Pajak
      const berat      = cols[0];
      const beratGram  = parseBerat(berat);
      const hargaDasar = parseHarga(cols[1] || "0");
      const hargaPajak = parseHarga(cols[2] || cols[1] || "0");

      if (beratGram && hargaDasar) {
        rows.push({ berat, berat_gram: beratGram, harga_dasar: hargaDasar, harga_pajak: hargaPajak });
      }
    });
  });

  if (rows.length === 0) {
    throw new Error("Tidak ada data harga ditemukan di halaman. Struktur HTML mungkin berubah.");
  }

  // Deduplikasi: ambil harga pertama per berat (= Emas Batangan standard)
  const seen = new Set();
  const unique = rows.filter((r) => {
    if (seen.has(r.berat)) return false;
    seen.add(r.berat);
    return true;
  });

  console.log(`✅ Parsed ${unique.length} baris harga (dari ${rows.length} total)`);
  unique.forEach((r) => console.log(`   ${r.berat}: Rp ${r.harga_dasar.toLocaleString("id-ID")}`));

  return unique;
}

async function upsertToSupabase(rows) {
  const tanggal = new Date().toISOString().slice(0, 10);
  const payload = rows.map((r) => ({ tanggal, ...r }));

  const { error, count } = await supabase
    .from("harga_emas")
    .upsert(payload, { onConflict: "tanggal,berat", count: "exact" });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  console.log(`💾 Upsert ${count} baris ke Supabase (tanggal: ${tanggal})`);
}

(async () => {
  try {
    const rows = await scrape();
    await upsertToSupabase(rows);
    console.log("🎉 Selesai.");
  } catch (err) {
    console.error("❌ Gagal:", err.message);
    process.exit(1);
  }
})();
