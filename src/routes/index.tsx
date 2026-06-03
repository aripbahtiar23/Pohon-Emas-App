import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AppShell } from "@/components/app-shell";
import { TransactionTable } from "@/components/transaction-table";
import { useTransactions } from "@/hooks/use-transactions";
import { formatGr, formatIDR, summarize, fetchAvailableStock, type Transaction } from "@/lib/goldbook";
import { supabase } from "@/lib/supabase";
import { ArrowDownToLine, ArrowUpFromLine, Coins, TrendingUp, Scale, Gem, Landmark } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type HargaRow = { berat: string; berat_gram: number; harga_dasar: number };

// Cari harga untuk gramasi tertentu dari list
function getHargaForItem(gramasi: number, list: HargaRow[]): number {
  if (!list.length) return 0;
  // Exact match
  const exact = list.find((h) => h.berat_gram === gramasi);
  if (exact) return exact.harga_dasar;
  // Tidak ada exact → pakai harga 1gr × gramasi
  const satu = list.find((h) => h.berat_gram === 1);
  if (satu) return Math.round((satu.harga_dasar * gramasi) / 1000) * 1000;
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
  const s = summarize(tx);

  const [hargaList, setHargaList]       = useState<HargaRow[]>([]);
  const [availableStock, setAvailable]  = useState<Transaction[]>([]);
  const [hargaTanggal, setHargaTanggal] = useState("");

  useEffect(() => {
    if (!userId) return;
    // Fetch stok tersedia
    fetchAvailableStock(userId).then(setAvailable);
    // Fetch harga emas terbaru dari Supabase
    supabase.from("harga_emas")
      .select("tanggal").order("tanggal", { ascending: false }).limit(1).single()
      .then(({ data: latest }) => {
        if (!latest) return;
        setHargaTanggal(latest.tanggal);
        supabase.from("harga_emas")
          .select("berat, berat_gram, harga_dasar")
          .eq("tanggal", latest.tanggal)
          .order("berat_gram", { ascending: true })
          .then(({ data }) => { if (data) setHargaList(data as HargaRow[]); });
      });
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
      <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-soft mb-6 md:mb-8">
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
              {availableStock.length} item stok · harga per gramasi dari logammulia.com
              {hargaTanggal && <span className="ml-1">({hargaTanggal})</span>}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {hargaList.length === 0 ? "Menunggu data harga..." : "Tidak ada stok tersedia."}
          </p>
        )}
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
