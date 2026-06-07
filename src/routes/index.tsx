import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AppShell } from "@/components/app-shell";
import { TransactionTable } from "@/components/transaction-table";
import { useTransactions } from "@/hooks/use-transactions";
import { formatGr, formatIDR, summarize } from "@/lib/goldbook";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownToLine, ArrowUpFromLine, Coins, TrendingUp, TrendingDown, Scale, Gem, Landmark, Activity, RotateCcw, Info, ShoppingCart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

function InfoTip({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="shrink-0 focus:outline-none">
          <Info className={`size-3.5 ${accent ? "text-gold-foreground/60" : "text-muted-foreground/60"}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-[230px] text-xs leading-relaxed p-3 w-auto">
        {text}
      </PopoverContent>
    </Popover>
  );
}

function Stat({ label, value, sub, icon: Icon, accent, tooltip }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: boolean;
  tooltip?: string;
}) {
  return (
    <div className={`rounded-xl border border-border p-2 md:p-3 shadow-soft ${accent ? "bg-gradient-gold text-gold-foreground border-transparent" : "bg-card"}`}>
      <div className="flex items-center gap-2 min-w-0">
        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-black/10" : "bg-accent"}`}>
          <Icon className={`size-4 ${accent ? "text-gold-foreground" : "text-gold-deep"}`} />
        </div>
        <span className={`text-[11px] sm:text-sm leading-tight ${accent ? "text-gold-foreground/80" : "text-muted-foreground"}`}>{label}</span>
        {tooltip && <InfoTip text={tooltip} accent={accent} />}
      </div>
      <div className={`mt-1 font-semibold tracking-tight tabular-nums ${
        value.length > 18 ? "text-xs md:text-sm" :
        value.length > 14 ? "text-sm md:text-lg" :
        "text-base md:text-xl"
      }`}>{value}</div>
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

  const s = summarize(filteredTx);

  // Stok: semua transaksi s/d AKHIR periode filter (akumulasi historis)
  // Bukan hanya transaksi dalam periode — ini mencegah stok minus cross-period
  const stockTx = useMemo(() => {
    let base = tx;
    if (filterYear !== "all") {
      const month = filterMonth !== "all" ? Number(filterMonth) : 12;
      const year  = Number(filterYear);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      base = base.filter(t => new Date(t.date) <= endDate);
    }
    if (filterCat !== "all") {
      base = base.filter(t => t.category === filterCat);
    }
    return base;
  }, [tx, filterYear, filterMonth, filterCat]);

  const sStock = summarize(stockTx);

  const { hpp, totalBeliEmasTerjual, jualGantiStok, totalBiayaJualKeluar, countGantiKeluar, countGantiMasuk, totalGramasiTerjual, countTotalKeluar, countTotalMasuk } = useMemo(() => {
    const masukMap = new Map(tx.filter(t => t.type === "masuk").map(t => [t.id, t]));
    let hppTotal = 0, beliEmas = 0, jualGS = 0, biayaJual = 0, gantiKeluar = 0, gramasiKeluar = 0;
    for (const t of filteredTx) {
      if (t.type !== "keluar") continue;
      gramasiKeluar += t.gramasi;
      if (t.notes) {
        const opsTotal = [...t.notes.matchAll(/ops:(\d+):[^|]*/g)].reduce((s, m) => s + parseInt(m[1]), 0)
          || parseInt(t.notes.match(/biaya_ops:(\d+)/)?.[1] ?? t.notes.match(/biaya_jual:(\d+)/)?.[1] ?? "0") || 0;
        const ongkirTotal = parseInt(t.notes.match(/ongkir:(\d+)/)?.[1] ?? "0") || 0;
        if (opsTotal > 0) hppTotal += opsTotal;
        const b = opsTotal + ongkirTotal;
        if (b > 0) biayaJual += b;
      }
      if (t.sourceId) {
        const masuk = masukMap.get(t.sourceId);
        if (masuk) {
          const isTambahStok = masuk.notes?.includes("entry_type:stok_awal");
          hppTotal += masuk.harga;
          if (!isTambahStok) {
            beliEmas += masuk.harga;
            jualGS += t.harga;
            gantiKeluar++;
          }
        }
      }
    }
    // Ganti Stok masuk dalam periode filter
    const gantiMasuk = filteredTx.filter(t => t.type === "masuk" && !t.notes?.includes("entry_type:stok_awal")).length;
    const totalKeluar = filteredTx.filter(t => t.type === "keluar").length;
    const totalMasuk  = filteredTx.filter(t => t.type === "masuk").length;
    return { hpp: hppTotal, totalBeliEmasTerjual: beliEmas, jualGantiStok: jualGS, totalBiayaJualKeluar: biayaJual, countGantiKeluar: gantiKeluar, countGantiMasuk: gantiMasuk, totalGramasiTerjual: gramasiKeluar, countTotalKeluar: totalKeluar, countTotalMasuk: totalMasuk };
  }, [tx, filteredTx]);

  // Total Omzet = sum harga jual produk saja, tanpa ongkir dan biaya operasional
  const totalPenjualan = s.totalJual;
  // Keuntungan Ganti Emas = harga jual Ganti Stok - harga beli Ganti Stok
  const keuntunganBeliEmas = jualGantiStok - totalBeliEmasTerjual;
  // Keuntungan Total Penjualan = Total Omzet - Total Modal Barang Terjual
  const keuntunganHPP = totalPenjualan - hpp;

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
      <header className="mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <img src="/logo.png" alt="Pohon Emas" className="size-8 object-contain" /> Pohon Emas Dashboard
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ringkasan Stok & Keuangan</h1>

          {/* Filter kanan — 1 baris fleksibel */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <Select value={filterCat} onValueChange={(v) => setFilterCat(v as typeof filterCat)}>
              <SelectTrigger className="flex-1 min-w-0 sm:w-[130px] sm:flex-none h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kategori</SelectItem>
                <SelectItem value="logam_mulia">Logam Mulia</SelectItem>
                <SelectItem value="perhiasan">Perhiasan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setFilterMonth("all"); }}>
              <SelectTrigger className="flex-1 min-w-0 sm:w-[130px] sm:flex-none h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tahun</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth} disabled={filterYear === "all"}>
              <SelectTrigger className="flex-1 min-w-0 sm:w-[130px] sm:flex-none h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bulan</SelectItem>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterCat !== "all" || filterYear !== "all") && (
              <button type="button" onClick={() => { setFilterCat("all"); setFilterYear("all"); setFilterMonth("all"); }}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
                <RotateCcw className="size-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Row 1 — Total Aset + Pergerakan Harga */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <div className="rounded-xl bg-gradient-gold text-gold-foreground border-transparent p-3 shadow-elegant">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gold-foreground/80">
              <Landmark className="size-4 shrink-0" />
              <span>Total Aset</span>
              <InfoTip text="Perkiraan nilai semua emas yang kamu miliki sekarang, berdasarkan harga pasar hari ini." accent />
            </div>
            <Link to="/harga" className="text-xs text-gold-foreground/70 hover:text-gold-foreground">Lihat harga →</Link>
          </div>
          {totalAset != null ? (
            <>
              <div className="text-lg md:text-2xl font-semibold tracking-tight tabular-nums">
                {formatIDR(totalAset)}
              </div>
              <div className="text-xs text-gold-foreground/70 mt-1">
                {availableStock.length} item ·{" "}
                {formatGr(availableStock.reduce((s, i) => s + i.gramasi, 0))} ·{" "}
                {hargaTanggal || "—"}
              </div>
            </>
          ) : (
            <p className="text-sm text-gold-foreground/70">Menunggu data harga...</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Activity className="size-4 text-gold-deep shrink-0" /> Pergerakan Harga Emas Hari Ini
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

      {/* Row 2 — Keuntungan (accent) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <Stat label="Keuntungan Ganti Stok" value={formatIDR(keuntunganBeliEmas)} icon={TrendingUp}
          sub={`${countTotalKeluar} terjual · ${countGantiMasuk} masuk ganti stok`}
          tooltip="Keuntungan dari transaksi Ganti Stok — total penjualan dikurangi harga beli emas yang diganti dan biaya jual." />
        <Stat label="Keuntungan Total Penjualan" value={formatIDR(keuntunganHPP)} icon={TrendingUp}
          sub={`${countTotalKeluar} terjual · ${countTotalMasuk} barang masuk`}
          tooltip="Keuntungan dari transaksi Tambah Stok — total penjualan dikurangi Harga Pokok Penjualan (HPP) dan biaya jual." />
      </div>

      {/* Row 3 — Total Modal + HPP + Total Omzet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        <div className="rounded-xl border border-border bg-card p-2 md:p-3 shadow-soft flex flex-col">
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
            <ArrowDownToLine className="size-4 text-success shrink-0" />
            <span>Total Modal</span>
            <InfoTip text="Total uang yang kamu keluarkan untuk membeli barang, termasuk stok yang belum terjual." />
          </div>
          <div className={`font-semibold tracking-tight mt-auto pt-2 tabular-nums ${formatIDR(s.totalBeli).length > 18 ? "text-sm md:text-base" : formatIDR(s.totalBeli).length > 14 ? "text-base md:text-xl" : "text-lg md:text-2xl"}`}>{formatIDR(s.totalBeli)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-2 md:p-3 shadow-soft flex flex-col">
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
            <ShoppingCart className="size-4 text-gold-deep shrink-0" />
            <span>Total Modal Barang Terjual</span>
            <InfoTip text="Total harga beli barang yang sudah terjual ditambah biaya operasional." />
          </div>
          <div className={`font-semibold tracking-tight mt-auto pt-2 tabular-nums ${formatIDR(hpp).length > 18 ? "text-sm md:text-base" : formatIDR(hpp).length > 14 ? "text-base md:text-xl" : "text-lg md:text-2xl"}`}>{formatIDR(hpp)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-2 md:p-3 shadow-soft flex flex-col">
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
            <ArrowUpFromLine className="size-4 text-gold-deep shrink-0" />
            <span>Total Omzet</span>
            <InfoTip text="Total uang yang masuk dari semua penjualan emas." />
          </div>
          <div className={`font-semibold tracking-tight mt-auto pt-2 tabular-nums ${formatIDR(totalPenjualan).length > 18 ? "text-sm md:text-base" : formatIDR(totalPenjualan).length > 14 ? "text-base md:text-xl" : "text-lg md:text-2xl"}`}>{formatIDR(totalPenjualan)}</div>
        </div>
      </div>

      {/* Row 4 — Stok */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
        <Stat label="Total Stok" value={formatGr(Math.max(0, sStock.totalStock))} icon={Scale}
          tooltip="Total gramasi emas yang kamu miliki. Dihitung dari semua barang masuk dikurangi yang sudah terjual." />
        <Stat label="Stok Logam Mulia" value={formatGr(Math.max(0, sStock.lmStock))} icon={Coins}
          tooltip="Gramasi logam mulia yang masih kamu pegang dan belum terjual." />
        <Stat label="Stok Perhiasan" value={formatGr(Math.max(0, sStock.phStock))} icon={Gem}
          tooltip="Gramasi perhiasan yang masih kamu pegang dan belum terjual." />
      </div>

      <TransactionTable
        title="Riwayat Transaksi Terbaru"
        filterYear={filterYear}
        filterMonth={filterMonth}
        filterCat={filterCat}
        hideCategoryFilter
      />
    </AppShell>
  );
}
