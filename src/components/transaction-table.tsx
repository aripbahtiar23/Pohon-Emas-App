import { useState, useEffect, useMemo } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { removeTx, removeBatch, patchTx, formatGr, formatIDR, type Transaction, type TxType } from "@/lib/goldbook";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowDownToLine, ArrowUpFromLine, Pencil, ChevronLeft, ChevronRight, Search, FileText, X, Eye } from "lucide-react";
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
import { InvoiceGeneratorDialog, type InvoiceGeneratorData } from "@/components/invoice-generator";

const PAGE_SIZE = 3;

type SingleRow  = { kind: "single"; tx: Transaction };
type BatchRow   = { kind: "batch";  batchId: string; txs: Transaction[]; date: string; totalGramasi: number; totalHarga: number; pembeli?: string };
type DisplayRow = SingleRow | BatchRow;

function DesktopBatchRow({ row, onEdit, onDelete, onInvoice, onDetail, isKeluar }: { row: BatchRow; onEdit: (r: BatchRow) => void; onDelete: (t: Transaction) => void; onInvoice: (r: BatchRow) => void; onDetail: (r: BatchRow) => void; isKeluar?: boolean }) {
  const allLM = row.txs.every((t) => t.category === "logam_mulia");
  const allPH = row.txs.every((t) => t.category === "perhiasan");
  const catLabel = allLM ? "Logam Mulia" : allPH ? "Perhiasan" : "Campuran";
  return (
    <tr className="border-t border-border hover:bg-muted/30 bg-primary/[0.02]">
      <td className="px-6 py-2 whitespace-nowrap text-muted-foreground">
        {new Date(row.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
      </td>
      {!isKeluar && <td className="px-4 py-2"><Badge variant="default">Keluar</Badge></td>}
      <td className="px-4 py-2 text-muted-foreground">{catLabel}</td>
      {!isKeluar && (
        <td className="px-4 py-2">
          <div className="space-y-0.5">
            {row.txs.map((t) => (
              <div key={t.id}>
                <div className="font-medium text-sm">{t.category === "logam_mulia" ? t.namaProduct : (t.kode || "Perhiasan")}</div>
                <div className="text-xs text-muted-foreground">{t.category === "logam_mulia" ? formatGr(t.gramasi) : `${t.karat} · ${formatGr(t.gramasi)}`}{t.noSeri ? ` · SN ${t.noSeri}` : ""}</div>
              </div>
            ))}
          </div>
        </td>
      )}
      <td className="px-4 py-2 text-sm text-muted-foreground">{row.pembeli || "—"}</td>
      {isKeluar && <td className="px-4 py-2 tabular-nums">{row.txs.length}</td>}
      <td className="px-4 py-2 tabular-nums">{formatGr(row.totalGramasi)}</td>
      <td className="px-4 py-2 tabular-nums font-medium">{formatIDR(row.totalHarga)}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" title="Detail" onClick={() => onDetail(row)}>
            <Eye className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
            <Pencil className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row.txs[0])}>
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function DesktopSingleRow({ row, onEdit, onDelete, onInvoice, onDetail, isKeluar }: { row: SingleRow; onEdit: (t: Transaction) => void; onDelete: (t: Transaction) => void; onInvoice: (t: Transaction) => void; onDetail: (t: Transaction) => void; isKeluar?: boolean }) {
  const t = row.tx;
  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-6 py-2 whitespace-nowrap text-muted-foreground">
        {new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
      </td>
      {!isKeluar && (
        <td className="px-4 py-2">
          <Badge variant={t.type === "masuk" ? "secondary" : "default"}>
            {t.type === "masuk" ? "Masuk" : "Keluar"}
          </Badge>
        </td>
      )}
      <td className="px-4 py-2 text-muted-foreground">{t.category === "logam_mulia" ? "Logam Mulia" : "Perhiasan"}</td>
      {!isKeluar && (
        <td className="px-4 py-2">
          {t.category === "logam_mulia" ? (
            <div>
              <div className="font-medium">{t.namaProduct}</div>
              <div className="text-xs text-muted-foreground">
                {t.noSeri ? `SN ${t.noSeri}` : ""}{t.nomerRef ? ` · REF ${t.nomerRef}` : ""}
                {t.type === "masuk" && t.asalBarang ? ` · Dari: ${t.asalBarang}` : ""}
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium">{t.kode || "—"}</div>
              <div className="text-xs text-muted-foreground">{t.karat}{t.type === "masuk" && t.asalBarang ? ` · Dari: ${t.asalBarang}` : ""}</div>
            </div>
          )}
        </td>
      )}
      <td className="px-4 py-2 text-sm text-muted-foreground">
        {t.type === "keluar" && t.pembeli && <div className="font-medium text-foreground">{t.pembeli}</div>}
        {t.type === "masuk" && t.asalBarang && <div>{t.asalBarang}</div>}
        {!t.pembeli && !t.asalBarang && <span>—</span>}
      </td>
      {isKeluar && <td className="px-4 py-2 tabular-nums">1</td>}
      <td className="px-4 py-2 tabular-nums">{formatGr(t.gramasi)}</td>
      <td className="px-4 py-2 tabular-nums font-medium">{formatIDR(t.harga)}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {t.type === "keluar" && (
            <Button variant="ghost" size="icon" title="Detail" onClick={() => onDetail(t)}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onEdit(t)}>
            <Pencil className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(t)}>
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function groupTransactions(list: Transaction[]): DisplayRow[] {
  const batchMap = new Map<string, Transaction[]>();
  for (const t of list) {
    if (t.batchId) {
      const arr = batchMap.get(t.batchId) ?? [];
      arr.push(t);
      batchMap.set(t.batchId, arr);
    }
  }
  const rows: DisplayRow[] = [];
  const seen = new Set<string>();
  for (const t of list) {
    if (t.batchId) {
      if (!seen.has(t.batchId)) {
        seen.add(t.batchId);
        const txs = batchMap.get(t.batchId)!;
        rows.push({
          kind: "batch",
          batchId: t.batchId,
          txs,
          date: t.date,
          totalGramasi: txs.reduce((s, x) => s + x.gramasi, 0),
          totalHarga:   txs.reduce((s, x) => s + x.harga, 0),
          pembeli: t.pembeli,
        });
      }
    } else {
      rows.push({ kind: "single", tx: t });
    }
  }
  return rows;
}

interface Props {
  filterType?: TxType;
  title?: string;
  filterYear?: string;
  filterMonth?: string;
  filterCat?: string;
  filterDateFrom?: string;
  filterDateTo?: string;
  showDateFilter?: boolean;
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
    <div className="flex items-center justify-center gap-1 px-4 py-2 border-t border-border">
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

export function TransactionTable({ filterType, title = "Riwayat Transaksi", filterYear, filterMonth, filterCat: extCat, filterDateFrom: extDateFrom, filterDateTo: extDateTo, showDateFilter }: Props) {
  const { tx: all, loading } = useTransactions();
  const [cat, setCat] = useState<"all" | "logam_mulia" | "perhiasan">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null);
  const [batchEditTarget, setBatchEditTarget] = useState<BatchRow | null>(null);
  const [batchDetailTarget, setBatchDetailTarget] = useState<BatchRow | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceGeneratorData | null>(null);
  const [intDateFrom, setIntDateFrom] = useState("");
  const [intDateTo, setIntDateTo]     = useState("");
  const filterDateFrom = extDateFrom ?? (showDateFilter ? intDateFrom : undefined);
  const filterDateTo   = extDateTo   ?? (showDateFilter ? intDateTo   : undefined);

  const parseBiaya = (notes?: string) => parseInt(notes?.match(/biaya_jual:(\d+)/)?.[1] ?? "0") || 0;

  const openInvoiceSingle = (t: Transaction) => setInvoiceData({
    transactionIds: [t.id],
    date: t.date,
    pembeli: t.pembeli,
    biayaLain: parseBiaya(t.notes),
    items: [{ id: t.id, category: t.category, namaProduct: t.namaProduct, kode: t.kode, karat: t.karat, noSeri: t.noSeri, gramasi: t.gramasi, harga: t.harga }],
  });

  const openInvoiceBatch = (row: BatchRow) => {
    const firstWithNotes = row.txs.find(t => t.notes);
    setInvoiceData({
      transactionIds: row.txs.map((t) => t.id),
      date: row.date,
      pembeli: row.pembeli,
      biayaLain: parseBiaya(firstWithNotes?.notes),
      items: row.txs.map((t) => ({ id: t.id, category: t.category, namaProduct: t.namaProduct, kode: t.kode, karat: t.karat, noSeri: t.noSeri, gramasi: t.gramasi, harga: t.harga })),
    });
  };

  let filtered: Transaction[] = all;
  if (filterType) filtered = filtered.filter((t) => t.type === filterType);
  // Filter dari dashboard (tahun/bulan/kategori)
  if (filterYear && filterYear !== "all") filtered = filtered.filter((t) => new Date(t.date).getFullYear() === Number(filterYear));
  if (filterMonth && filterMonth !== "all") filtered = filtered.filter((t) => new Date(t.date).getMonth() + 1 === Number(filterMonth));
  if (extCat && extCat !== "all") filtered = filtered.filter((t) => t.category === extCat);
  // Filter rentang tanggal
  if (filterDateFrom) filtered = filtered.filter((t) => t.date.slice(0,10) >= filterDateFrom);
  if (filterDateTo)   filtered = filtered.filter((t) => t.date.slice(0,10) <= filterDateTo);
  // Filter tabs internal
  if (cat !== "all") filtered = filtered.filter((t) => t.category === cat);
  // Urut berdasarkan waktu dicatat (createdAt) terbaru dulu, fallback ke date
  filtered = [...filtered].sort((a, b) => {
    const ca = a.createdAt ?? a.date;
    const cb = b.createdAt ?? b.date;
    return new Date(cb).getTime() - new Date(ca).getTime();
  });

  const rows = useMemo(() => {
    const grouped = groupTransactions(filtered);
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped.filter((r) => {
      if (r.kind === "batch") {
        return r.pembeli?.toLowerCase().includes(q) ||
               r.txs.some((t) => t.asalBarang?.toLowerCase().includes(q));
      }
      const t = r.tx;
      return t.pembeli?.toLowerCase().includes(q) ||
             t.asalBarang?.toLowerCase().includes(q);
    });
  }, [filtered, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => { setPage(1); }, [cat, filterType, search]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const list = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, rows.length);

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 px-4 sm:px-6 py-3 border-b border-border">
          {/* Row 1: judul */}
          <h3 className="font-semibold tracking-tight">{title}</h3>

          {/* Desktop: [Tabs][Date] kiri — [Search] kanan | Mobile: stacked */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Kiri: Tabs + Date sejajar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Tabs value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none">Semua</TabsTrigger>
                  <TabsTrigger value="logam_mulia" className="flex-1 sm:flex-none">Logam Mulia</TabsTrigger>
                  <TabsTrigger value="perhiasan" className="flex-1 sm:flex-none">Perhiasan</TabsTrigger>
                </TabsList>
              </Tabs>

              {showDateFilter && (
                <div className="flex sm:inline-flex items-center gap-1.5">
                  <DatePicker value={intDateFrom} onChange={setIntDateFrom} className="flex-1 sm:w-[120px] sm:flex-none h-8 text-xs" />
                  <span className="text-muted-foreground shrink-0 text-xs">–</span>
                  <DatePicker value={intDateTo} onChange={setIntDateTo} className="flex-1 sm:w-[120px] sm:flex-none h-8 text-xs" />
                  {(intDateFrom || intDateTo) && (
                    <button type="button" onClick={() => { setIntDateFrom(""); setIntDateTo(""); }}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-input hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Kanan: Search */}
            <div className="relative w-full sm:w-52 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input placeholder="Cari pembeli / asal..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm w-full" />
            </div>
          </div>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden p-3 space-y-2">
          {loading && <div className="text-center py-12 text-muted-foreground">Memuat...</div>}
          {!loading && list.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Belum ada transaksi.</div>
          )}
          {list.map((row) => {
            if (row.kind === "batch") {
              return (
                <div key={row.batchId} className="rounded-xl border border-primary/30 bg-card p-3 space-y-2 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-sm">Barang Keluar</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                        {new Date(row.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setBatchDetailTarget(row)}>
                        <Eye className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setBatchEditTarget(row)}>
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteTarget(row.txs[0])}>
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {row.txs.map((t, i) => (
                    <div key={t.id} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                      {i + 1}. {t.category === "logam_mulia" ? `${t.namaProduct} · ${formatGr(t.gramasi)}` : `${t.kode || "Perhiasan"} · ${t.karat} · ${formatGr(t.gramasi)}`} — {formatIDR(t.harga)}
                    </div>
                  ))}
                  {row.pembeli && <div className="text-xs text-muted-foreground">Pembeli: {row.pembeli}</div>}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-sm text-muted-foreground tabular-nums">{formatGr(row.totalGramasi)}</div>
                    <div className="text-sm font-semibold tabular-nums">{formatIDR(row.totalHarga)}</div>
                  </div>
                </div>
              );
            }
            const t = row.tx;
            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-sm">{t.type === "masuk" ? "Barang Masuk" : "Barang Keluar"}</div>
                      <div className="text-xs text-muted-foreground">{t.category === "logam_mulia" ? "Logam Mulia" : "Perhiasan"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                      {new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </div>
                    {t.type === "keluar" && (
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setDetailTarget(t)}>
                        <Eye className="size-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditTarget(t)}>
                      <Pencil className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                {t.category === "logam_mulia" && t.namaProduct && <div className="text-sm font-medium">{t.namaProduct}</div>}
                {t.category === "perhiasan" && <div className="text-sm font-medium">{t.kode || "Perhiasan"} <span className="text-muted-foreground font-normal">· {t.karat}</span></div>}
                {t.type === "masuk" && t.asalBarang && <div className="text-xs text-muted-foreground">Asal: <span className="font-medium text-foreground">{t.asalBarang}</span></div>}
                {t.type === "keluar" && t.pembeli && <div className="text-xs text-muted-foreground">Pembeli: <span className="font-medium text-foreground">{t.pembeli}</span></div>}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-sm text-muted-foreground tabular-nums">{formatGr(t.gramasi)}</div>
                  <div className="text-sm font-semibold tabular-nums">{formatIDR(t.harga)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto -mx-px">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr className="text-left">
                <th className="px-6 py-2 font-medium">Tanggal</th>
                {filterType !== "keluar" && <th className="px-4 py-2 font-medium">Tipe</th>}
                <th className="px-4 py-2 font-medium">Kategori</th>
                {filterType !== "keluar" && <th className="px-4 py-2 font-medium">Detail</th>}
                <th className="px-4 py-2 font-medium">{filterType === "keluar" ? "Pembeli" : "Pembeli / Asal"}</th>
                {filterType === "keluar" && <th className="px-4 py-2 font-medium">QTY</th>}
                <th className="px-4 py-2 font-medium">Gramasi</th>
                <th className="px-4 py-2 font-medium">Harga</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={filterType === "keluar" ? 7 : 8} className="text-center py-12 text-muted-foreground">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
              {list.map((row) =>
                row.kind === "batch"
                  ? <DesktopBatchRow key={row.batchId} row={row} onEdit={setBatchEditTarget} onDelete={setDeleteTarget} onInvoice={openInvoiceBatch} onDetail={setBatchDetailTarget} isKeluar={filterType === "keluar"} />
                  : <DesktopSingleRow key={row.tx.id} row={row} onEdit={setEditTarget} onDelete={setDeleteTarget} onInvoice={openInvoiceSingle} onDetail={setDetailTarget} isKeluar={filterType === "keluar"} />
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {rows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-2 border-t border-border">
            <p className="text-xs text-muted-foreground order-2 sm:order-1">
              Menampilkan {start}–{end} dari {rows.length} entri
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
                deleteTarget.batchId
                  ? `Menghapus semua barang dalam 1 sesi penjualan ini. Tindakan tidak dapat dibatalkan.`
                  : <>
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
                  try {
                    if (deleteTarget.batchId) await removeBatch(deleteTarget.batchId);
                    else await removeTx(deleteTarget.id);
                  } catch { toast.error("Gagal menghapus."); }
                }
                setDeleteTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice dialog */}
      <InvoiceGeneratorDialog
        data={invoiceData}
        open={!!invoiceData}
        onClose={() => setInvoiceData(null)}
      />

      {/* Detail dialog - masuk & keluar */}
      <Dialog open={!!detailTarget} onOpenChange={(v) => !v && setDetailTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Detail Barang {detailTarget?.type === "masuk" ? "Masuk" : "Keluar"} — {detailTarget?.category === "logam_mulia" ? "Logam Mulia" : "Perhiasan"}
            </DialogTitle>
          </DialogHeader>
          {detailTarget && (() => {
            const t = detailTarget;
            const isMasuk = t.type === "masuk";
            const masukSrc = !isMasuk && t.sourceId ? all.find(m => m.id === t.sourceId) : null;
            const biayaJual = parseInt(t.notes?.match(/biaya_jual:(\d+)/)?.[1] ?? "0") || 0;
            const keterangan = t.notes?.match(/ket:(.+)/)?.[1]?.trim() ?? "";
            const keuntunganItem = isMasuk ? null : t.harga - (masukSrc?.harga ?? 0) - biayaJual;

            const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`text-sm font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</span>
              </div>
            );

            return (
              <div className="space-y-0 pt-1">
                {isMasuk && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Jenis Pencatatan</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.notes?.includes("entry_type:stok_awal") ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
                      {t.notes?.includes("entry_type:stok_awal") ? "Tambah Stok" : "Ganti Stok"}
                    </span>
                  </div>
                )}
                <Row label="Tanggal" value={new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} />
                {!isMasuk && t.pembeli && <Row label="Pembeli" value={t.pembeli} />}
                {t.category === "logam_mulia" && <Row label="Nama Product" value={t.namaProduct || "—"} />}
                {t.category === "logam_mulia" && <Row label="No Seri" value={t.noSeri || "—"} mono />}
                {t.category === "logam_mulia" && t.nomerRef && <Row label="Nomer REF" value={t.nomerRef} />}
                {t.category === "perhiasan" && <Row label="Karat" value={t.karat || "—"} />}
                {t.category === "perhiasan" && t.kode && <Row label="Kode" value={t.kode} />}
                <Row label="Gramasi" value={formatGr(t.gramasi)} />
                {isMasuk && <Row label="Harga Beli" value={formatIDR(t.harga)} />}
                {isMasuk && t.asalBarang && <Row label="Asal Barang" value={t.asalBarang} />}
                {!isMasuk && masukSrc && <Row label="Harga Beli Asal" value={formatIDR(masukSrc.harga)} />}
                {!isMasuk && <Row label="Harga Jual" value={formatIDR(t.harga)} />}
                {!isMasuk && biayaJual > 0 && <Row label="Biaya Jual" value={formatIDR(biayaJual)} />}
                {!isMasuk && keterangan && <Row label="Keterangan" value={keterangan} />}
                {!isMasuk && keuntunganItem !== null && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Keuntungan</span>
                    <span className={`text-sm font-semibold ${keuntunganItem >= 0 ? "text-success" : "text-destructive"}`}>{formatIDR(keuntunganItem)}</span>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            {detailTarget?.type === "keluar" && (
              <Button variant="outline" className="flex items-center gap-2" onClick={() => { openInvoiceSingle(detailTarget); setDetailTarget(null); }}>
                <FileText className="size-4" /> Invoice
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog - batch keluar */}
      <Dialog open={!!batchDetailTarget} onOpenChange={(v) => !v && setBatchDetailTarget(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detail Barang Keluar — {batchDetailTarget?.txs.length} Item</DialogTitle>
          </DialogHeader>
          {batchDetailTarget && (() => {
            const row = batchDetailTarget;
            const masukMap = new Map(all.filter(t => t.type === "masuk").map(t => [t.id, t]));
            const firstWithNotes = row.txs.find(t => t.notes);
            const biayaTrx = parseInt(firstWithNotes?.notes?.match(/biaya_jual:(\d+)/)?.[1] ?? "0") || 0;
            const ketTrx = firstWithNotes?.notes?.match(/ket:(.+)/)?.[1]?.trim() ?? "";
            const totalHargaBeli = row.txs.reduce((sum, t) => sum + (t.sourceId ? (masukMap.get(t.sourceId)?.harga ?? 0) : 0), 0);
            const totalHargaJual = row.totalHarga + biayaTrx;
            const keuntunganBersih = row.totalHarga - totalHargaBeli;
            return (
              <>
                <div className="overflow-y-auto flex-1 pr-1">
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Tanggal</span>
                      <span className="text-sm font-medium">{new Date(row.date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span>
                    </div>
                    {row.pembeli && (
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Pembeli</span>
                        <span className="text-sm font-medium">{row.pembeli}</span>
                      </div>
                    )}
                    {biayaTrx > 0 && (
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Biaya Jual</span>
                        <span className="text-sm font-medium">{formatIDR(biayaTrx)}</span>
                      </div>
                    )}
                    {ketTrx && (
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Keterangan</span>
                        <span className="text-sm font-medium text-right max-w-[60%]">{ketTrx}</span>
                      </div>
                    )}
                    {row.txs.map((t, i) => {
                      const masuk = t.sourceId ? masukMap.get(t.sourceId) : null;
                      const untungKotor = t.harga - (masuk?.harga ?? 0);
                      return (
                        <div key={t.id} className="rounded-lg border border-border p-3 space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Barang {i + 1}</div>
                          {t.category === "logam_mulia" ? (
                            <>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Produk</span><span className="font-medium">{t.namaProduct}</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">No Seri</span><span className="font-medium font-mono">{t.noSeri || "—"}</span></div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Karat</span><span className="font-medium">{t.karat}</span></div>
                              {t.kode && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Kode</span><span className="font-medium">{t.kode}</span></div>}
                            </>
                          )}
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gramasi</span><span className="font-medium">{formatGr(t.gramasi)}</span></div>
                          {masuk && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Harga Beli Asal</span><span className="font-medium">{formatIDR(masuk.harga)}</span></div>}
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Harga Jual</span><span className="font-medium">{formatIDR(t.harga)}</span></div>
                          <div className="flex justify-between text-sm pt-1 border-t border-border">
                            <span className="text-muted-foreground">Selisih Jual-Beli</span>
                            <span className={`font-semibold ${untungKotor >= 0 ? "text-success" : "text-destructive"}`}>{formatIDR(untungKotor)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t-2 border-border">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Total Harga Jual</span>
                    <span className="font-semibold">{formatIDR(totalHargaJual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Keuntungan Bersih</span>
                    <span className={`font-semibold ${keuntunganBersih >= 0 ? "text-success" : "text-destructive"}`}>{formatIDR(keuntunganBersih)}</span>
                  </div>
                </div>
              </>
            );
          })()}
          <DialogFooter className="gap-2 pt-2 border-t border-border">
            <Button variant="outline" className="flex items-center gap-2" onClick={() => { openInvoiceBatch(batchDetailTarget!); setBatchDetailTarget(null); }}>
              <FileText className="size-4" /> Invoice
            </Button>
            <Button variant="outline" onClick={() => setBatchDetailTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog - single */}
      <EditTransactionDialog
        tx={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* Edit dialog - batch */}
      <EditBatchDialog
        batch={batchEditTarget}
        open={!!batchEditTarget}
        onClose={() => setBatchEditTarget(null)}
      />
    </>
  );
}

/* ── Edit Batch Dialog ─────────────────────────────────────────────────────── */

function EditBatchDialog({ batch, open, onClose }: { batch: BatchRow | null; open: boolean; onClose: () => void }) {
  const [hargaMap, setHargaMap] = useState<Record<string, string>>({});
  const [pembeli, setPembeli] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!batch) return;
    const map: Record<string, string> = {};
    batch.txs.forEach((t) => { map[t.id] = formatRupiah(String(t.harga)); });
    setHargaMap(map);
    setPembeli(batch.pembeli ?? "");
    setTanggal(new Date(batch.date).toISOString().slice(0, 10));
  }, [batch]);

  if (!batch) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const date = new Date(tanggal + "T00:00:00").toISOString();
      await Promise.all(batch.txs.map((t) =>
        patchTx(t.id, {
          harga: parseRupiah(hargaMap[t.id] ?? ""),
          pembeli: pembeli.trim() || undefined,
          date,
        })
      ));
      toast.success("Penjualan diperbarui");
      onClose();
    } catch {
      toast.error("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Penjualan — {batch.txs.length} Barang</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5 pt-2">
          {batch.txs.map((t, i) => (
            <div key={t.id} className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Barang {i + 1}</p>
              <div className="text-sm font-medium">
                {t.category === "logam_mulia"
                  ? `${t.namaProduct} · ${formatGr(t.gramasi)}`
                  : `${t.kode || "Perhiasan"} · ${t.karat} · ${formatGr(t.gramasi)}`}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Harga Jual</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="pl-9"
                    value={hargaMap[t.id] ?? ""}
                    onChange={(e) => setHargaMap((prev) => ({ ...prev, [t.id]: formatRupiah(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Pembeli</Label>
              <Input value={pembeli} onChange={(e) => setPembeli(e.target.value)} placeholder="Nama pembeli (opsional)" />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <DatePicker value={tanggal} onChange={setTanggal} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
