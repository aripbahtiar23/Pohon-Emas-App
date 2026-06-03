/**
 * GET /api/harga-emas
 * Ambil harga emas terbaru dari Supabase.
 * Cache 1 jam di Vercel Edge.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    // Ambil tanggal terbaru yang ada datanya
    const { data: latest, error: latestErr } = await supabase
      .from("harga_emas")
      .select("tanggal")
      .order("tanggal", { ascending: false })
      .limit(1)
      .single();

    if (latestErr || !latest) {
      return res.status(404).json({ error: "Data harga belum tersedia" });
    }

    const tanggal = latest.tanggal;

    // Ambil semua baris untuk tanggal tersebut
    const { data, error } = await supabase
      .from("harga_emas")
      .select("berat, berat_gram, harga_dasar, harga_pajak")
      .eq("tanggal", tanggal)
      .order("berat_gram", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ tanggal, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
