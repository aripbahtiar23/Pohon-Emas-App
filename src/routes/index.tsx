import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TransactionTable } from "@/components/transaction-table";
import { useTransactions } from "@/hooks/use-transactions";
import { formatGr, formatIDR, summarize } from "@/lib/goldbook";
import { fetchGoldPriceData, type GoldPriceData } from "@/hooks/use-gold-price";
import { ArrowDownToLine, ArrowUpFromLine, Coins, TrendingUp, Scale, Gem, Landmark } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
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
  const { tx } = useTransactions();
  const s = summarize(tx);
  const [goldData, setGoldData] = useState<GoldPriceData | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    fetchGoldPriceData().then(setGoldData).finally(() => setLoadingPrice(false));
  }, []);

  const totalAset = goldData ? s.totalStock * goldData.pricePerGram : null;

  return (
    <AppShell>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <img src="/logo.png" alt="Pohon Emas" className="size-8 object-contain" /> Pohon Emas Dashboard
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Ringkasan Stok & Keuangan</h1>
        <p className="text-muted-foreground mt-1">Pantau stok logam mulia, perhiasan, dan margin Anda.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Stat label="Total Stok" value={formatGr(s.totalStock)} sub={`${s.count} transaksi`} icon={Scale} accent />
        <Stat label="Stok Logam Mulia" value={formatGr(s.lmStock)} icon={Coins} />
        <Stat label="Stok Perhiasan" value={formatGr(s.phStock)} icon={Gem} />
        <Stat label="Estimasi Margin" value={formatIDR(s.profit)} sub={`Jual ${formatIDR(s.totalJual)}`} icon={TrendingUp} />
      </div>

      {/* Total Aset */}
      <div className="rounded-xl border border-border bg-card p-3 md:p-5 shadow-soft mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Landmark className="size-4 text-gold-deep" /> Total Aset (estimasi harga emas harian)
          </div>
          {goldData && (
            <span className="text-xs text-muted-foreground">
              {goldData.source}
            </span>
          )}
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="text-2xl md:text-3xl font-semibold tracking-tight tabular-nums text-gold-deep">
            {loadingPrice && !totalAset ? "Memuat harga..." : totalAset != null ? formatIDR(totalAset) : "—"}
          </div>
          {goldData?.movement != null && (
            <div className={`text-sm font-medium tabular-nums mb-0.5 ${goldData.movement >= 0 ? "text-success" : "text-destructive"}`}>
              {goldData.movement >= 0 ? "▲" : "▼"} {formatIDR(Math.abs(goldData.movement))}/gr
              <span className="text-xs ml-1 opacity-70">({goldData.movementPct != null ? (goldData.movementPct >= 0 ? "+" : "") + goldData.movementPct.toFixed(2) + "%" : ""})</span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {formatGr(s.totalStock)} × {goldData ? formatIDR(goldData.pricePerGram) + "/gr" : "memuat harga..."}
          {goldData && goldData.source !== "Estimasi (offline)" && (
            <span className="ml-2 text-success">(real-time)</span>
          )}
          {goldData?.source === "Estimasi (offline)" && (
            <span className="ml-2 text-warning">(estimasi offline)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="rounded-xl border border-border bg-card p-3 md:p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <ArrowDownToLine className="size-4 text-success" /> Total Pembelian
          </div>
          <div className="text-lg md:text-2xl font-semibold tracking-tight mt-1 md:mt-2 tabular-nums">{formatIDR(s.totalBeli)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 md:p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <ArrowUpFromLine className="size-4 text-gold-deep" /> Total Penjualan
          </div>
          <div className="text-lg md:text-2xl font-semibold tracking-tight mt-1 md:mt-2 tabular-nums">{formatIDR(s.totalJual)}</div>
        </div>
      </div>

      <TransactionTable title="Riwayat Transaksi Terbaru" />
    </AppShell>
  );
}
