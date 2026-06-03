/**
 * app/api/harga-emas/route.ts  (Next.js App Router)
 * Salin file ini ke project Next.js kamu.
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const revalidate = 3600; // cache 1 jam

export async function GET() {
  try {
    const { data: latest, error: latestErr } = await supabase
      .from("harga_emas")
      .select("tanggal")
      .order("tanggal", { ascending: false })
      .limit(1)
      .single();

    if (latestErr || !latest) {
      return NextResponse.json({ error: "Data harga belum tersedia" }, { status: 404 });
    }

    const tanggal = latest.tanggal as string;

    const { data, error } = await supabase
      .from("harga_emas")
      .select("berat, berat_gram, harga_dasar, harga_pajak")
      .eq("tanggal", tanggal)
      .order("berat_gram", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tanggal, data }, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
