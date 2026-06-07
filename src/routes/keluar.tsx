import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { ArrowUpFromLine } from "lucide-react";

export const Route = createFileRoute("/keluar")({
  head: () => ({
    meta: [
      { title: "Barang Keluar — Pohon Emas" },
      { name: "description", content: "Catat penjualan Logam Mulia dan Perhiasan." },
    ],
  }),
  component: KeluarPage,
});

function KeluarPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowUpFromLine className="size-4 text-gold-deep" /> Modul Penjualan
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Barang Keluar</h1>
        <p className="text-muted-foreground mt-1">Catat barang yang keluar dari stok Anda.</p>
      </header>
      <div className="mb-8">
        <TransactionForm type="keluar" />
      </div>
      <TransactionTable filterType="keluar" title="Riwayat Barang Keluar" showDateFilter defaultSearchField="pembeli" />
    </AppShell>
  );
}
