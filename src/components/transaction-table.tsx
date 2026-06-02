import { useState, useEffect } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { removeTx, formatGr, formatIDR, type Transaction, type TxType } from "@/lib/goldbook";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowDownToLine, ArrowUpFromLine, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";

const PAGE_SIZE = 3;

interface Props {
  filterType?: TxType;
  title?: string;
}

function PageControls({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-border">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="size-8 flex items-center justify-center text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="icon"
            className="size-8 text-sm"
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={page === total}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

export function TransactionTable({ filterType, title = "Riwayat Transaksi" }: Props) {
  const { tx: all, loading } = useTransactions();
  const [cat, setCat] = useState<"all" | "logam_mulia" | "perhiasan">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  let filtered: Transaction[] = all;
  if (filterType) filtered = filtered.filter((t) => t.type === filterType);
  if (cat !== "all") filtered = filtered.filter((t) => t.category === cat);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to page 1 when filter changes or data changes
  useEffect(() => { setPage(1); }, [cat, filterType]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          <Tabs value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">Semua</TabsTrigger>
              <TabsTrigger value="logam_mulia" className="flex-1 sm:flex-none">Logam Mulia</TabsTrigger>
              <TabsTrigger value="perhiasan" className="flex-1 sm:flex-none">Perhiasan</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden p-3 space-y-3">
          {loading && <div className="text-center py-12 text-muted-foreground">Memuat...</div>}
          {!loading && list.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Belum ada transaksi.</div>
          )}
          {list.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center ${t.type === "masuk" ? "bg-success/10" : "bg-gold-deep/10"}`}>
                    {t.type === "masuk" ? (
                      <ArrowDownToLine className="size-5 text-success" />
                    ) : (
                      <ArrowUpFromLine className="size-5 text-gold-deep" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t.type === "masuk" ? "Barang Masuk" : "Barang Keluar"}</div>
                    <div className="text-xs text-muted-foreground">{t.category === "logam_mulia" ? "Logam Mulia" : "Perhiasan"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                    {new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </div>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditTarget(t)}>
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteTarget(t)}>
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              {t.category === "logam_mulia" && t.namaProduct && (
                <div className="text-sm font-medium">{t.namaProduct}</div>
              )}
              {t.category === "perhiasan" && (
                <div className="text-sm font-medium">{t.kode || "Perhiasan"} <span className="text-muted-foreground font-normal">· {t.karat}</span></div>
              )}
              {t.type === "masuk" && t.asalBarang && (
                <div className="text-xs text-muted-foreground">Dari: {t.asalBarang}</div>
              )}
              {t.type === "keluar" && t.pembeli && (
                <div className="text-xs text-muted-foreground">Pembeli: {t.pembeli}</div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-sm text-muted-foreground tabular-nums">{formatGr(t.gramasi)}</div>
                <div className="text-sm font-semibold tabular-nums">{formatIDR(t.harga)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto -mx-px">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr className="text-left">
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 font-medium text-right">Gramasi</th>
                <th className="px-4 py-3 font-medium text-right">Harga</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
              {list.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.type === "masuk" ? "secondary" : "default"}>
                      {t.type === "masuk" ? "Masuk" : "Keluar"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.category === "logam_mulia" ? "Logam Mulia" : "Perhiasan"}
                  </td>
                  <td className="px-4 py-3">
                    {t.category === "logam_mulia" ? (
                      <div>
                        <div className="font-medium">{t.namaProduct}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.noSeri ? `SN ${t.noSeri}` : ""}{t.nomerRef ? ` · REF ${t.nomerRef}` : ""}
                          {t.type === "masuk" && t.asalBarang ? ` · Dari: ${t.asalBarang}` : ""}
                          {t.type === "keluar" && t.pembeli ? ` · Pembeli: ${t.pembeli}` : ""}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{t.kode || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.karat}
                          {t.type === "masuk" && t.asalBarang ? ` · Dari: ${t.asalBarang}` : ""}
                          {t.type === "keluar" && t.pembeli ? ` · Pembeli: ${t.pembeli}` : ""}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatGr(t.gramasi)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatIDR(t.harga)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditTarget(t)}>
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground order-2 sm:order-1">
              Menampilkan {start}–{end} dari {filtered.length} transaksi
            </p>
            <div className="order-1 sm:order-2">
              <PageControls page={page} total={totalPages} onChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  {deleteTarget.category === "logam_mulia"
                    ? `${deleteTarget.namaProduct} · ${formatGr(deleteTarget.gramasi)}`
                    : `${deleteTarget.kode || "Perhiasan"} · ${deleteTarget.karat} · ${formatGr(deleteTarget.gramasi)}`}
                  <br />
                  {formatIDR(deleteTarget.harga)} — {new Date(deleteTarget.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  <br /><br />
                  Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  try { await removeTx(deleteTarget.id); }
                  catch { toast.error("Gagal menghapus."); }
                }
                setDeleteTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <EditTransactionDialog
        tx={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </>
  );
}
