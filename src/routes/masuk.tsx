import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { ArrowDownToLine } from "lucide-react";

export const Route = createFileRoute("/masuk")({
  head: () => ({
    meta: [
      { title: "Barang Masuk — Pohon Emas" },
      { name: "description", content: "Catat pembelian Logam Mulia dan Perhiasan." },
    ],
  }),
  component: MasukPage,
});

function MasukPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowDownToLine className="size-4 text-success" /> Modul Pembelian
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Barang Masuk</h1>
        <p className="text-muted-foreground mt-1">Catat barang yang masuk ke stok Anda.</p>
      </header>
      <div className="mb-8">
        <TransactionForm type="masuk" />
      </div>
      <TransactionTable filterType="masuk" title="Riwayat Barang Masuk" showDateFilter />
    </AppShell>
  );
}
