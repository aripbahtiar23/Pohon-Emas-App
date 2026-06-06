import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatIDR } from "@/lib/goldbook";
import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown, RefreshCw, Database } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/harga")({
  component: HargaEmas,
});

/* ── LocalStorage fallback ─────────────────────────────────────── */
const PRICE_KEY   = "pohon-emas:gold-price-history";
const todayStr    = () => new Date().toISOString().slice(0, 10);

type PriceHistory = { today: { date: string; price: number } | null; yesterday: { date: string; price: number } | null };

function loadHistory(): PriceHistory {
  try { const r = localStorage.getItem(PRICE_KEY); return r ? JSON.parse(r) : { today: null, yesterday: null }; }
  catch { return { today: null, yesterday: null }; }
}

function savePriceToday(price: number) {
  const h = loadHistory();
  const today = todayStr();
  localStorage.setItem(PRICE_KEY, JSON.stringify({
    yesterday: h.today?.date !== today ? h.today : h.yesterday,
    today: { date: today, price },
  }));
}

/* ── Types ─────────────────────────────────────────────────────── */
type HargaRow  = { berat: string; berat_gram: number; harga_dasar: number; harga_pajak: number };
type HargaData = { tanggal: string; rows: HargaRow[] };
type HargaKemarin = Record<string, number>; // berat → harga_dasar kemarin

/* ── Exports untuk dashboard ─────────────────────────────────────── */
export function getPricePerGram(): number {
  const h = loadHistory();
  return h.today?.date === todayStr() ? (h.today.price ?? 0) : 0;
}

function formatDateID(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function HargaEmas() {
  const [supabaseData, setSupabaseData]   = useState<HargaData | null>(null);
  const [hargaKemarin, setHargaKemarin]   = useState<HargaKemarin>({});
  const [history, setHistory]             = useState<PriceHistory>(loadHistory);
  const [loading, setLoading]             = useState(true);

  const fetchFromSupabase = async () => {
    setLoading(true);
    try {
      // Ambil tanggal terbaru
      const { data: latest } = await supabase
        .from("harga_emas")
        .select("tanggal")
        .order("tanggal", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) { setLoading(false); return; }

      const { data: rows } = await supabase
        .from("harga_emas")
        .select("berat, berat_gram, harga_dasar, harga_pajak")
        .eq("tanggal", latest.tanggal)
        .order("berat_gram", { ascending: true });

      if (rows && rows.length > 0) {
        setSupabaseData({ tanggal: latest.tanggal, rows });
        const satu = rows.find((r: HargaRow) => r.berat_gram === 1);
        if (satu) { savePriceToday(satu.harga_dasar); setHistory(loadHistory()); }

        // Fetch data kemarin untuk pergerakan
        const { data: kemarin } = await supabase
          .from("harga_emas").select("berat, harga_dasar")
          .lt("tanggal", latest.tanggal)
          .order("tanggal", { ascending: false })
          .limit(rows.length * 2);
        if (kemarin) {
          const map: HargaKemarin = {};
          kemarin.forEach((r: { berat: string; harga_dasar: number }) => { if (!map[r.berat]) map[r.berat] = r.harga_dasar; });
          setHargaKemarin(map);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFromSupabase();
  }, []);


  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Harga Emas Harian</h1>
        <p className="text-muted-foreground mt-1">
          {supabaseData
            ? `Data dari logammulia.com · ${formatDateID(supabaseData.tanggal)}`
            : "Update otomatis dari scraper harian"}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-6 items-start">

        {/* Tabel harga — mobile: setelah sidebar, lg: kolom kiri */}
        <Card className="p-5 sm:p-7 shadow-card border-border/60 bg-card/80 order-2 lg:order-none">
          <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold">Daftar Harga</h2>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Database className="size-3" />
                {supabaseData ? `Terakhir: ${supabaseData.tanggal}` : loading ? "Memuat..." : "Belum ada data scraper"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchFromSupabase} disabled={loading}>
              <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Header */}
          <div className="grid grid-cols-[68px_1fr_1fr] sm:grid-cols-[90px_1fr_1fr] gap-2 sm:gap-3 pb-2 border-b border-border text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Gramasi</span>
            <span>Harga Dasar</span>
            <span>+ Pajak PPh</span>
          </div>

          {/* Rows dari Supabase */}
          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Memuat data...</div>
          )}

          {!loading && !supabaseData && (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Belum ada data harga.</p>
              <p className="text-xs text-muted-foreground">Jalankan scraper lokal dulu:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block max-w-sm mx-auto">
                node scripts/scrape-harga-emas.js
              </code>
            </div>
          )}

          {supabaseData && (
            <div className="space-y-1">
              {supabaseData.rows.map((row) => (
                <div key={row.berat}
                  className={`grid grid-cols-[68px_1fr_1fr] sm:grid-cols-[90px_1fr_1fr] gap-2 sm:gap-3 py-2 border-b border-border/50 text-[11px] sm:text-sm ${row.berat_gram === 1 ? "bg-primary/5 rounded -mx-1 px-1 font-medium" : ""}`}>
                  <span className={row.berat_gram === 1 ? "font-semibold" : ""}>{row.berat}</span>
                  <span className="tabular-nums">{formatIDR(row.harga_dasar)}</span>
                  <span className="tabular-nums text-muted-foreground">{formatIDR(row.harga_pajak)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info — di dalam card tabel, bagian bawah */}
          <div className="mt-5 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🕙 Harga emas diperbarui otomatis setiap hari pukul <span className="font-medium text-foreground">10:00 WIB</span>.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              📋 Selalu cek harga terkini di{" "}
              <a href="https://www.logammulia.com/id/harga-emas-hari-ini" target="_blank" rel="noopener noreferrer"
                className="text-primary underline decoration-dotted hover:decoration-solid">
                logammulia.com
              </a>{" "}
              untuk memastikan akurasi data.
            </p>
          </div>
        </Card>

        {/* Sidebar: Pergerakan + Info — mobile: order-1 (di atas tabel), lg: kolom kanan */}
        <div className="order-1 lg:order-none space-y-4">
          <Card className="p-5 shadow-card border-border/60 bg-card/80">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pergerakan Harga Hari Ini</p>
            {(() => {
              const hariIni = supabaseData?.rows.find((r) => r.berat_gram === 1)?.harga_dasar;
              const kemarin = hargaKemarin["1 gr"];
              if (!hariIni) return <p className="text-sm text-muted-foreground">{loading ? "Memuat..." : "Data belum tersedia."}</p>;
              if (!kemarin) return (
                <p className="text-sm text-muted-foreground">Data perbandingan belum tersedia. Akan muncul setelah jam 10:00 WIB hari berikutnya.</p>
              );
              const diff = hariIni - kemarin;
              const pct  = (diff / kemarin) * 100;
              if (diff === 0) return (
                <p className="text-sm text-muted-foreground">Belum ada pergerakan harga hari ini.</p>
              );
              return (
                <div className={`flex items-center gap-3 text-2xl font-bold ${diff > 0 ? "text-success" : "text-destructive"}`}>
                  {diff > 0 ? <TrendingUp className="size-7" /> : <TrendingDown className="size-7" />}
                  <div>
                    <div>{diff > 0 ? "Naik" : "Turun"} {formatIDR(Math.abs(diff))}</div>
                    <div className="text-sm font-normal text-muted-foreground mt-0.5">{Math.abs(pct).toFixed(2)}% dibandingkan kemarin</div>
                  </div>
                </div>
              );
            })()}
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
