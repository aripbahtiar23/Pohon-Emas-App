import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AppShell } from "@/components/app-shell";
import { TransactionTable } from "@/components/transaction-table";
import { useTransactions } from "@/hooks/use-transactions";
import { formatGr, formatIDR, summarize } from "@/lib/goldbook";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownToLine, ArrowUpFromLine, Coins, TrendingUp, TrendingDown, Scale, Gem, Landmark, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type HargaRow = { berat: string; berat_gram: number; harga_dasar: number };

// Cari harga untuk gramasi tertentu dari list
function getHargaForItem(gramasi: number, list: HargaRow[]): number {
  if (!list.length) return 0;
  // Supabase NUMERIC bisa return string — cast ke number
  const exact = list.find((h) => Number(h.berat_gram) === gramasi);
  if (exact) return Number(exact.harga_dasar);
  const satu = list.find((h) => Number(h.berat_gram) === 1);
  if (satu) return Math.round((Number(satu.harga_dasar) * gramasi) / 1000) * 1000;
  return 0;
}

function Stat({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border p-3 md:p-5 shadow-soft ${accent ? "bg-gradient-gold text-gold-foreground border-transparent" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${accent ? "text-gold-foreground/80" : "text-muted-foreground"}`}>{label}</span>
        <div className={`size-9 rounded-lg flex items-center justify-center ${accent ? "bg-black/10" : "bg-accent"}`}>
          <Icon className={`size-4 ${accent ? "text-gold-foreground" : "text-gold-deep"}`} />
        </div>
      </div>
      <div className="mt-2 md:mt-3 text-xl md:text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className={`mt-1 text-xs ${accent ? "text-gold-foreground/70" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function Dashboard() {
  const { userId } = useAuth();
  const { tx } = useTransactions();

  const [filterYear, setFilterYear]   = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterCat, setFilterCat]     = useState<"all"|"logam_mulia"|"perhiasan">("all");

  const availableYears = useMemo(() =>
    Array.from(new Set(tx.map((t) => new Date(t.date).getFullYear()))).sort((a, b) => b - a),
  [tx]);

  const filteredTx = useMemo(() => {
    return tx.filter((t) => {
      const d = new Date(t.date);
      if (filterYear !== "all" && d.getFullYear() !== Number(filterYear)) return false;
      if (filterMonth !== "all" && d.getMonth() + 1 !== Number(filterMonth)) return false;
      if (filterCat !== "all" && t.category !== filterCat) return false;
      return true;
    });
  }, [tx, filterYear, filterMonth, filterCat]);

  const s = summarize(filteredTx, tx);

  const [hargaList, setHargaList]       = useState<HargaRow[]>([]);
  const [hargaTanggal, setHargaTanggal] = useState("");

  // Derived dari tx realtime — update otomatis saat ada transaksi baru
  const availableStock = useMemo(() => {
    const soldIds = new Set(
      tx.filter(t => t.type === "keluar" && t.sourceId).map(t => t.sourceId!)
    );
    return tx.filter(t => t.type === "masuk" && !soldIds.has(t.id));
  }, [tx]);
  const [harga1grHariIni, setHarga1grHariIni] = useState<number | null>(null);
  const [harga1grKemarin, setHarga1grKemarin] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: latest, error } = await supabase.from("harga_emas")
          .select("tanggal").order("tanggal", { ascending: false }).limit(1).maybeSingle();
        if (error || !latest || cancelled) return;
        if (!cancelled) setHargaTanggal(latest.tanggal);

        const { data: todayRows } = await supabase.from("harga_emas")
          .select("berat, berat_gram, harga_dasar")
          .eq("tanggal", latest.tanggal).order("berat_gram", { ascending: true });
        if (todayRows && !cancelled) {
          setHargaList(todayRows as HargaRow[]);
          const satu = todayRows.find((r: HargaRow) => Number(r.berat_gram) === 1);
          if (satu) setHarga1grHariIni(Number(satu.harga_dasar));
        }

        const { data: kemarin } = await supabase.from("harga_emas")
          .select("harga_dasar").eq("berat_gram", 1)
          .lt("tanggal", latest.tanggal)
          .order("tanggal", { ascending: false }).limit(1).maybeSingle();
        if (kemarin && !cancelled) setHarga1grKemarin(kemarin.harga_dasar);
      } catch { /* silent — UI stays in default state */ }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Total aset = setiap item stok × harga bracket-nya
  const totalAset = hargaList.length > 0
    ? availableStock.reduce((sum, item) => sum + getHargaForItem(item.gramasi, hargaList), 0)
    : null;

  return (
    <AppShell>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <img src="/logo.png" alt="Pohon Emas" className="size-8 object-contain" /> Pohon Emas Dashboard
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ringkasan Stok & Keuangan</h1>

          {/* Filter kanan */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterCat} onValueChange={(v) => setFilterCat(v as typeof filterCat)}>
              <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="logam_mulia">Logam Mulia</SelectItem>
                <SelectItem value="perhiasan">Perhiasan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setFilterMonth("all"); }}>
              <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth} disabled={filterYear === "all"}>
              <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterCat !== "all" || filterYear !== "all") && (
              <button type="button" onClick={() => { setFilterCat("all"); setFilterYear("all"); setFilterMonth("all"); }}
                className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted">
                Reset filter
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Stat label="Total Stok" value={formatGr(s.totalStock)} sub={`${s.count} transaksi`} icon={Scale} accent />
        <Stat label="Stok Logam Mulia" value={formatGr(s.lmStock)} icon={Coins} />
        <Stat label="Stok Perhiasan" value={formatGr(s.phStock)} icon={Gem} />
        <Stat label="Estimasi Margin" value={formatIDR(s.profit)} sub={`dari ${formatIDR(s.totalJual)} penjualan`} icon={TrendingUp} />
      </div>

      {/* Total Pembelian + Penjualan */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="rounded-xl border border-border bg-card p-3 md:p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <ArrowDownToLine className="size-4 text-success" /> Total Harga Pembelian
          </div>
          <div className="text-lg md:text-2xl font-semibold tracking-tight mt-1 md:mt-2 tabular-nums">{formatIDR(s.totalBeliTerjual)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total modal: {formatIDR(s.totalBeli)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 md:p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <ArrowUpFromLine className="size-4 text-gold-deep" /> Total Penjualan
          </div>
          <div className="text-lg md:text-2xl font-semibold tracking-tight mt-1 md:mt-2 tabular-nums">{formatIDR(s.totalJual)}</div>
        </div>
      </div>

      {/* Total Aset + Pergerakan Harga — 2 kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Landmark className="size-4 text-gold-deep" /> Total Aset
            </div>
            <Link to="/harga" className="text-xs text-primary hover:underline">Lihat harga →</Link>
          </div>
          {totalAset != null ? (
            <>
              <div className="text-2xl md:text-3xl font-semibold tracking-tight tabular-nums text-gold-deep">
                {formatIDR(totalAset)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {availableStock.length} item ·{" "}
                {formatGr(availableStock.reduce((s, i) => s + i.gramasi, 0))} ·{" "}
                {hargaTanggal || "—"}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Menunggu data harga...</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="size-4 text-gold-deep" /> Pergerakan Harga Emas Hari Ini
            </div>
            <Link to="/harga" className="text-xs text-primary hover:underline">Detail →</Link>
          </div>
          {!harga1grHariIni ? (
            <p className="text-sm text-muted-foreground">Data belum tersedia.</p>
          ) : !harga1grKemarin ? (
            <p className="text-sm text-muted-foreground">Data kemarin belum ada.</p>
          ) : (() => {
            const diff = harga1grHariIni - harga1grKemarin;
            const pct  = (diff / harga1grKemarin) * 100;
            if (diff === 0) return <p className="text-sm text-muted-foreground">Belum ada pergerakan.</p>;
            return (
              <div className={`flex items-center gap-2 font-bold ${diff > 0 ? "text-success" : "text-destructive"}`}>
                {diff > 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                <div>
                  <div className="text-lg md:text-xl">{diff > 0 ? "Naik" : "Turun"} {formatIDR(Math.abs(diff))}</div>
                  <div className="text-xs font-normal text-muted-foreground">{Math.abs(pct).toFixed(2)}% dibandingkan kemarin</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <TransactionTable title="Riwayat Transaksi Terbaru" />
    </AppShell>
  );
}
