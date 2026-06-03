import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatIDR } from "@/lib/goldbook";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown, Save, RefreshCw, Database, Pencil } from "lucide-react";
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
type HargaRow = { berat: string; berat_gram: number; harga_dasar: number; harga_pajak: number };
type HargaData = { tanggal: string; rows: HargaRow[] };

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
  const [supabaseData, setSupabaseData] = useState<HargaData | null>(null);
  const [history, setHistory]           = useState<PriceHistory>(loadHistory);
  const [loading, setLoading]           = useState(true);
  const [manualInput, setManualInput]   = useState("");
  const [showManual, setShowManual]     = useState(false);

  const fetchFromSupabase = async () => {
    setLoading(true);
    try {
      // Ambil tanggal terbaru
      const { data: latest } = await supabase
        .from("harga_emas")
        .select("tanggal")
        .order("tanggal", { ascending: false })
        .limit(1)
        .single();

      if (!latest) { setLoading(false); return; }

      const { data: rows } = await supabase
        .from("harga_emas")
        .select("berat, berat_gram, harga_dasar, harga_pajak")
        .eq("tanggal", latest.tanggal)
        .order("berat_gram", { ascending: true });

      if (rows && rows.length > 0) {
        setSupabaseData({ tanggal: latest.tanggal, rows });
        // Simpan harga 1gr ke localStorage untuk offline + dashboard
        const satu = rows.find((r: HargaRow) => r.berat_gram === 1);
        if (satu) {
          savePriceToday(satu.harga_dasar);
          setHistory(loadHistory());
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

  const handleSaveManual = () => {
    const price = parseRupiah(manualInput);
    if (!price) return toast.error("Masukkan harga yang valid");
    savePriceToday(price);
    setHistory(loadHistory());
    setShowManual(false);
    setManualInput("");
    toast.success("Harga manual tersimpan");
  };

  const hargaKemarin  = history.yesterday?.price ?? null;
  const harga1gr      = supabaseData?.rows.find((r) => r.berat_gram === 1)?.harga_dasar
                     ?? (history.today?.date === todayStr() ? history.today.price : null);
  const movement      = harga1gr != null && hargaKemarin ? harga1gr - hargaKemarin : null;
  const movementPct   = movement != null && hargaKemarin ? (movement / hargaKemarin) * 100 : null;

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

        {/* Tabel harga dari Supabase */}
        <Card className="p-5 sm:p-7 shadow-card border-border/60 bg-card/80">
          <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
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
          <div className="grid grid-cols-[90px_1fr_1fr] gap-3 pb-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                  className={`grid grid-cols-[90px_1fr_1fr] gap-3 py-2 border-b border-border/50 text-sm ${row.berat_gram === 1 ? "bg-primary/5 rounded -mx-1 px-1 font-medium" : ""}`}>
                  <span className={row.berat_gram === 1 ? "font-semibold" : ""}>{row.berat}</span>
                  <span className="tabular-nums">{formatIDR(row.harga_dasar)}</span>
                  <span className="tabular-nums text-muted-foreground">{formatIDR(row.harga_pajak)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sidebar ringkasan */}
        <div className="space-y-4">
          {/* Harga 1gr */}
          <Card className="p-5 shadow-card border-border/60 bg-card/80">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Harga per Gram (1gr)</p>
            {harga1gr ? (
              <>
                <div className="text-2xl font-bold tabular-nums text-gold-deep">{formatIDR(harga1gr)}</div>
                {movement != null && (
                  <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${movement > 0 ? "text-success" : "text-destructive"}`}>
                    {movement > 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                    {movement > 0 ? "+" : ""}{formatIDR(movement)}
                    {movementPct != null && <span className="text-xs opacity-70">({movementPct.toFixed(2)}%)</span>}
                    <span className="text-xs text-muted-foreground font-normal">vs kemarin</span>
                  </div>
                )}
                {hargaKemarin && (
                  <p className="text-xs text-muted-foreground mt-2">Kemarin: {formatIDR(hargaKemarin)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Dipakai untuk kalkulasi Total Aset di dashboard.</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            )}
          </Card>

          {/* Manual override */}
          <Card className="p-5 shadow-card border-border/60 bg-card/80">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Override Manual</p>
              <button onClick={() => setShowManual((v) => !v)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="size-3.5" />
              </button>
            </div>
            {showManual ? (
              <div className="space-y-2">
                <Label className="text-xs">Harga per gram</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                  <Input inputMode="numeric" placeholder="2.774.000" className="pl-9 text-sm"
                    value={manualInput} onChange={(e) => setManualInput(formatRupiah(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveManual()} />
                </div>
                <Button size="sm" onClick={handleSaveManual} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                  <Save className="size-4 mr-2" /> Simpan Manual
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Klik ikon pensil untuk input harga manual (override data scraper).</p>
            )}
          </Card>

          {/* Cara jalankan scraper */}
          <Card className="p-5 shadow-card border-border/60 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Jalankan Scraper</p>
            <p className="text-xs text-muted-foreground mb-2">Dari folder project, jalankan:</p>
            <code className="text-xs bg-background px-2 py-1.5 rounded block border border-border">
              node scripts/scrape-harga-emas.js
            </code>
            <p className="text-xs text-muted-foreground mt-2">Data otomatis masuk ke tabel ini.</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
