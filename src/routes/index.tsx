import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { TransactionTable } from "@/components/transaction-table";
import { useTransactions } from "@/hooks/use-transactions";
import { formatGr, formatIDR, summarize } from "@/lib/goldbook";
import { ArrowDownToLine, ArrowUpFromLine, Coins, TrendingUp, Scale, Gem, Landmark } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getPricePerGram } from "@/routes/harga";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const PRICE_KEY = "pohon-emas:gold-price-history";
const todayStr = () => new Date().toISOString().slice(0, 10);

type PriceEntry = { date: string; price: number };
type PriceHistory = { today: PriceEntry | null; yesterday: PriceEntry | null };

function loadPriceHistory(): PriceHistory {
  try {
    const raw = localStorage.getItem(PRICE_KEY);
    return raw ? JSON.parse(raw) : { today: null, yesterday: null };
  } catch { return { today: null, yesterday: null }; }
}

function savePriceToday(price: number) {
  const history = loadPriceHistory();
  const today = todayStr();
  const next: PriceHistory = {
    yesterday: history.today?.date !== today ? history.today : history.yesterday,
    today: { date: today, price },
  };
  localStorage.setItem(PRICE_KEY, JSON.stringify(next));
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
  const { tx } = useTransactions();
  const s = summarize(tx);

  const [history] = useState<PriceHistory>(() => loadPriceHistory());

  const pricePerGram = getPricePerGram();
  const hargaHariIni = pricePerGram > 0 ? pricePerGram : (history.today?.date === todayStr() ? history.today.price : null);
  const hargaKemarin = history.yesterday?.price ?? null;
  const totalAset    = hargaHariIni != null && hargaHariIni > 0 ? s.totalStock * hargaHariIni : null;
  const movement     = hargaHariIni != null && hargaKemarin != null ? hargaHariIni - hargaKemarin : null;
  const movementPct  = movement != null && hargaKemarin ? (movement / hargaKemarin) * 100 : null;

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

      {/* Total Aset + Input Harga Emas */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-soft mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Landmark className="size-4 text-gold-deep" /> Total Aset
          </div>
          <Link to="/harga" className="text-xs text-primary hover:underline">
            {hargaHariIni ? "Ubah harga" : "Input harga hari ini →"}
          </Link>
        </div>

        {/* Nilai aset */}
        <div className="mt-3">
          {totalAset != null ? (
            <div className="flex items-end gap-3 flex-wrap">
              <div className="text-2xl md:text-3xl font-semibold tracking-tight tabular-nums text-gold-deep">
                {formatIDR(totalAset)}
              </div>
              {movement != null && (
                <div className={`text-sm font-medium tabular-nums mb-0.5 ${movement >= 0 ? "text-success" : "text-destructive"}`}>
                  {movement >= 0 ? "▲" : "▼"} {formatIDR(Math.abs(movement))}/gr
                  {movementPct != null && (
                    <span className="text-xs ml-1 opacity-70">
                      ({movementPct >= 0 ? "+" : ""}{movementPct.toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Masukkan harga emas hari ini untuk melihat estimasi total aset.</p>
          )}
          {totalAset != null && (
            <div className="text-xs text-muted-foreground mt-1">
              {formatGr(s.totalStock)} × {formatIDR(hargaHariIni!)}/gr
              {hargaKemarin && <span className="ml-2">(kemarin: {formatIDR(hargaKemarin)}/gr)</span>}
            </div>
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
