import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  insertTx,
  fetchAvailableStock,
  formatGr,
  formatIDR,
  PRODUK_LM,
  type Transaction,
  type TxType,
} from "@/lib/goldbook";
import { supabase } from "@/lib/supabase";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

function moneySize(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return "text-xs";
  if (abs >= 100_000_000) return "text-sm";
  return "text-base";
}

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Props {
  type: TxType;
}

const KARAT_OPTIONS = ["24K", "22K", "21K", "18K", "14K", "10K"];

function MasukForm() {
  const { userId } = useAuth();

  const [lmEntryType, setLmEntryType] = useState<"beli" | "stok_awal">("stok_awal");

  const [lm, setLm] = useState({
    namaProduct: PRODUK_LM[0] as string,
    gramasi: "",
    noSeri: "",
    harga: "",
    nomerRef: "",
    asalBarang: "",
    tanggal: todayStr(),
  });

  const [ph, setPh] = useState({
    karat: "24K",
    gramasi: "",
    kode: "",
    harga: "",
    asalBarang: "",
    tanggal: todayStr(),
  });

  const submitLm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const gramasi = parseFloat(lm.gramasi);
    const harga = parseRupiah(lm.harga);
    if (!lm.noSeri.trim()) return toast.error("No Seri wajib diisi");
    if (!gramasi || !harga) return toast.error("Gramasi dan harga wajib diisi");
    try {
      // Cek SN duplikat hanya untuk stok yang belum terjual
      const { data: existingMasuk } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "masuk")
        .eq("category", "logam_mulia")
        .eq("no_seri", lm.noSeri.trim());
      if (existingMasuk && existingMasuk.length > 0) {
        const masukIds = existingMasuk.map((m) => m.id);
        const { data: soldOnes } = await supabase
          .from("transactions")
          .select("source_id")
          .eq("user_id", userId)
          .eq("type", "keluar")
          .in("source_id", masukIds);
        const soldIds = new Set((soldOnes ?? []).map((s) => s.source_id));
        const hasUnsold = masukIds.some((id) => !soldIds.has(id));
        if (hasUnsold) return toast.error(`No Seri "${lm.noSeri.trim()}" masih ada di stok`);
      }
      await insertTx(userId, {
        type: "masuk",
        category: "logam_mulia",
        date: new Date(lm.tanggal + "T00:00:00").toISOString(),
        namaProduct: lm.namaProduct,
        gramasi,
        noSeri: lm.noSeri || undefined,
        harga,
        nomerRef: lm.nomerRef || undefined,
        asalBarang: lm.asalBarang.trim() || undefined,
        notes: lmEntryType === "stok_awal" ? "entry_type:stok_awal" : undefined,
      });
      toast.success("Barang masuk dicatat");
      setLm({ ...lm, gramasi: "", noSeri: "", harga: "", nomerRef: "", asalBarang: "", tanggal: todayStr() });
      setLmEntryType("beli");
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    }
  };

  const submitPh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const gramasi = parseFloat(ph.gramasi);
    const harga = parseRupiah(ph.harga);
    if (!gramasi || !harga) return toast.error("Gramasi dan harga wajib diisi");
    try {
      await insertTx(userId, {
        type: "masuk",
        category: "perhiasan",
        date: new Date(ph.tanggal + "T00:00:00").toISOString(),
        karat: ph.karat,
        gramasi,
        kode: ph.kode || undefined,
        harga,
        asalBarang: ph.asalBarang.trim() || undefined,
      });
      toast.success("Barang masuk dicatat");
      setPh({ ...ph, gramasi: "", kode: "", harga: "", asalBarang: "", tanggal: todayStr() });
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    }
  };

  return (
    <Tabs defaultValue="logam_mulia">
      <TabsList className="mb-6">
        <TabsTrigger value="logam_mulia">Logam Mulia</TabsTrigger>
        <TabsTrigger value="perhiasan">Perhiasan</TabsTrigger>
      </TabsList>

      <TabsContent value="logam_mulia">
        <form onSubmit={submitLm} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Jenis Pencatatan */}
          <div className="md:col-span-2 space-y-2">
            <Label>Jenis Pencatatan <span className="text-muted-foreground text-xs font-normal">(pilih salah satu)</span> <span className="text-destructive">*</span></Label>
            <div className="flex rounded-md border border-input overflow-hidden h-10">
              <button type="button" onClick={() => setLmEntryType("stok_awal")}
                className={`flex-1 text-sm transition-colors ${lmEntryType === "stok_awal" ? "bg-amber-600 text-white" : "bg-background hover:bg-muted"}`}>
                Tambah Stok
              </button>
              <button type="button" onClick={() => setLmEntryType("beli")}
                className={`flex-1 text-sm border-l border-input transition-colors ${lmEntryType === "beli" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                Ganti Stok
              </button>
            </div>
            <div className="rounded-lg border border-border/50 bg-transparent px-4 py-3 flex gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-foreground">Tambah Stok</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Emas yang kamu miliki atau beli untuk menambah stok saat ini</li>
                  <li>Tidak perlu sama gramasinya dengan yang dijual</li>
                  <li>Harga beli masuk perhitungan HPP di dashboard</li>
                  <li>Mempengaruhi Keuntungan HPP di dashboard</li>
                </ul>
              </div>
              <div className="w-px bg-border/40 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-foreground">Ganti Stok</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Emas dibeli setelah melakukan penjualan</li>
                  <li>Gramasi sesuai dengan yang sudah dijual</li>
                  <li>Harga beli masuk Keuntungan Ganti Emas</li>
                  <li>Mempengaruhi Keuntungan Ganti Emas di dashboard</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nama Product <span className="text-destructive">*</span></Label>
            <Select value={lm.namaProduct} onValueChange={(v) => setLm({ ...lm, namaProduct: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUK_LM.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gramasi (gr) <span className="text-destructive">*</span></Label>
            <Input type="number" step="0.001" value={lm.gramasi}
              onChange={(e) => setLm({ ...lm, gramasi: e.target.value })} placeholder="contoh: 5" />
          </div>
          <div className="space-y-2">
            <Label>No Seri <span className="text-destructive">*</span></Label>
            <Input value={lm.noSeri} onChange={(e) => setLm({ ...lm, noSeri: e.target.value })} placeholder="Serial number" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Nomer REF <span className="text-muted-foreground font-normal">(opsional)</span></Label>
            <Input value={lm.nomerRef} onChange={(e) => setLm({ ...lm, nomerRef: e.target.value })} placeholder="Reference number" />
          </div>
          <div className="space-y-2">
            <Label>Asal Barang <span className="text-muted-foreground font-normal">(opsional)</span></Label>
            <Input value={lm.asalBarang} onChange={(e) => setLm({ ...lm, asalBarang: e.target.value })} placeholder="Dibeli dari / sumber barang" />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Pembelian <span className="text-destructive">*</span></Label>
            <DatePicker value={lm.tanggal} onChange={(v) => setLm({ ...lm, tanggal: v })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Harga Beli <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
              <Input type="text" inputMode="numeric" value={lm.harga}
                onChange={(e) => setLm({ ...lm, harga: formatRupiah(e.target.value) })}
                placeholder="0" className="pl-9" />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button type="submit" size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-elegant">
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="perhiasan">
        <form onSubmit={submitPh} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Karat <span className="text-destructive">*</span></Label>
            <Select value={ph.karat} onValueChange={(v) => setPh({ ...ph, karat: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KARAT_OPTIONS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gramasi (gr) <span className="text-destructive">*</span></Label>
            <Input type="number" step="0.001" value={ph.gramasi}
              onChange={(e) => setPh({ ...ph, gramasi: e.target.value })} placeholder="contoh: 3.5" />
          </div>
          <div className="space-y-2">
            <Label>Kode <span className="text-muted-foreground font-normal">(opsional)</span></Label>
            <Input value={ph.kode} onChange={(e) => setPh({ ...ph, kode: e.target.value })} placeholder="Kode perhiasan" />
          </div>
          <div className="space-y-2">
            <Label>Asal Barang <span className="text-muted-foreground font-normal">(opsional)</span></Label>
            <Input value={ph.asalBarang} onChange={(e) => setPh({ ...ph, asalBarang: e.target.value })} placeholder="Dibeli dari / sumber barang" />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Pembelian <span className="text-destructive">*</span></Label>
            <DatePicker value={ph.tanggal} onChange={(v) => setPh({ ...ph, tanggal: v })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Harga Beli <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
              <Input type="text" inputMode="numeric" value={ph.harga}
                onChange={(e) => setPh({ ...ph, harga: formatRupiah(e.target.value) })}
                placeholder="0" className="pl-9" />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button type="submit" size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-elegant">
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function stockLabel(t: Transaction) {
  if (t.category === "logam_mulia") {
    const parts = [t.namaProduct, formatGr(t.gramasi)];
    if (t.noSeri) parts.push(`SN ${t.noSeri}`);
    return parts.join(" · ");
  }
  const parts = [t.kode || "Perhiasan", t.karat, formatGr(t.gramasi)];
  return parts.filter(Boolean).join(" · ");
}

/* ── Searchable stock combobox ─────────────────────────────────────────────── */
function StockCombobox({ value, options, onChange }: {
  value: string;
  options: Transaction[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((t) => t.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full flex items-center justify-between px-3 h-10 rounded-md border border-input bg-background text-sm transition-colors hover:bg-muted/50",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">{selected ? stockLabel(selected) : "— Pilih barang dari stok —"}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder="Cari produk, seri, karat..." />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            {options.map((t) => (
              <CommandItem
                key={t.id}
                value={`${stockLabel(t)} ${t.noSeri ?? ""} ${t.kode ?? ""} ${t.asalBarang ?? ""}`}
                onSelect={() => { onChange(t.id); setOpen(false); }}
                className="cursor-pointer"
              >
                <Check className={cn("size-4 mr-2 shrink-0", value === t.id ? "opacity-100" : "opacity-0")} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{stockLabel(t)}</div>
                  {(t.asalBarang || t.noSeri) && (
                    <div className="text-xs text-muted-foreground truncate">
                      {[t.asalBarang && `Dari: ${t.asalBarang}`, t.noSeri && `SN ${t.noSeri}`].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type SaleItem = { rowId: string; selectedStockId: string; harga: string };
const newRowId = () => Math.random().toString(36).slice(2);
const emptyRow = (): SaleItem => ({ rowId: newRowId(), selectedStockId: "", harga: "" });

function SaleForm() {
  const { userId } = useAuth();
  const [stock, setStock] = useState<Transaction[]>([]);
  const [items, setItems] = useState<SaleItem[]>([emptyRow()]);
  const [pembeli, setPembeli] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [ongkir, setOngkir] = useState("");
  const [opsItems, setOpsItems] = useState<{ id: string; amount: string; label: string }[]>([
    { id: crypto.randomUUID(), amount: "", label: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchAvailableStock(userId).then(setStock);
    const channel = supabase
      .channel(`stock-${userId}-${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => { fetchAvailableStock(userId).then(setStock); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const usedIds = new Set(items.map((i) => i.selectedStockId).filter(Boolean));

  const updateItem = (rowId: string, patch: Partial<SaleItem>) =>
    setItems((prev) => prev.map((i) => i.rowId === rowId ? { ...i, ...patch } : i));

  const removeItem = (rowId: string) =>
    setItems((prev) => prev.filter((i) => i.rowId !== rowId));

  const addItem = () => setItems((prev) => [...prev, emptyRow()]);

  // Summary
  const resolvedItems = items.map((i) => ({ item: i, stock: stock.find((s) => s.id === i.selectedStockId) }));
  const totalGramasi = resolvedItems.reduce((sum, { stock: s }) => sum + (s?.gramasi ?? 0), 0);
  const totalNilai = resolvedItems.reduce((sum, { item }) => sum + (parseRupiah(item.harga) || 0), 0);
  const validCount = resolvedItems.filter(({ item, stock: s }) => s && parseRupiah(item.harga) > 0).length;
  const ongkirNum = parseRupiah(ongkir) || 0;
  const totalOpsNum = opsItems.reduce((s, i) => s + (parseRupiah(i.amount) || 0), 0);
  const totalBiaya = ongkirNum + totalOpsNum;
  const totalHargaJual = totalNilai + ongkirNum;
  const totalHPP = resolvedItems.reduce((sum, { item, stock: s }) =>
    sum + (s && parseRupiah(item.harga) > 0 ? s.harga : 0), 0);
  const keuntunganTx = totalNilai - totalHPP - totalOpsNum;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!pembeli.trim()) return toast.error("Nama pembeli wajib diisi");
    const invalid = resolvedItems.find(({ item, stock: s }) => !s || !parseRupiah(item.harga));
    if (invalid) return toast.error("Semua baris harus diisi barang dan harga jual");
    setSubmitting(true);
    try {
      const date = new Date(tanggal + "T00:00:00").toISOString();
      const batchId = resolvedItems.length > 1 ? crypto.randomUUID() : undefined;
      await Promise.all(resolvedItems.map(({ item, stock: s }, idx) =>
        insertTx(userId, {
          type: "keluar",
          category: s!.category,
          date,
          namaProduct: s!.namaProduct,
          noSeri: s!.noSeri,
          nomerRef: s!.nomerRef,
          karat: s!.karat,
          kode: s!.kode,
          gramasi: s!.gramasi,
          harga: parseRupiah(item.harga),
          sourceId: s!.id,
          pembeli: pembeli.trim() || undefined,
          batchId,
          // biaya jual hanya disimpan di item pertama (per transaksi, bukan per barang)
          notes: idx === 0 ? (() => {
            const parts: string[] = [];
            if (ongkirNum > 0) parts.push(`ongkir:${ongkirNum}`);
            opsItems.forEach((op) => { const a = parseRupiah(op.amount) || 0; if (a > 0) parts.push(`ops:${a}:${op.label.trim()}`); });
            return parts.length ? parts.join("|") : undefined;
          })() : undefined,
        })
      ));
      toast.success(`${resolvedItems.length} barang berhasil dicatat`);
      setItems([emptyRow()]); setPembeli(""); setTanggal(todayStr());
      setOngkir("");
      setOpsItems([{ id: crypto.randomUUID(), amount: "", label: "" }]);
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Daftar item */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Daftar Barang</Label>
          <span className="text-xs text-muted-foreground">{items.length} barang</span>
        </div>

        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Tidak ada stok tersedia.</p>
        ) : (
          items.map((item, idx) => {
            const sel = stock.find((s) => s.id === item.selectedStockId);
            const available = stock.filter((s) => !usedIds.has(s.id) || s.id === item.selectedStockId);
            return (
              <div key={item.rowId} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Barang {idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.rowId)}
                      className="text-xs text-destructive hover:underline">Hapus</button>
                  )}
                </div>

                {/* Stock selector with search */}
                <StockCombobox
                  value={item.selectedStockId}
                  options={available}
                  onChange={(id) => updateItem(item.rowId, { selectedStockId: id })}
                />

                {/* Info barang compact */}
                {sel && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-muted/40 rounded-md px-3 py-2">
                    <div><span className="text-muted-foreground block">Gramasi</span><span className="font-medium">{formatGr(sel.gramasi)}</span></div>
                    <div><span className="text-muted-foreground block">Harga Beli</span><span className="font-medium">{formatIDR(sel.harga)}</span></div>
                    {sel.category === "logam_mulia"
                      ? <div><span className="text-muted-foreground block">Produk</span><span className="font-medium">{sel.namaProduct}</span></div>
                      : <div><span className="text-muted-foreground block">Karat</span><span className="font-medium">{sel.karat}</span></div>}
                    {(sel.noSeri || sel.kode) && (
                      <div><span className="text-muted-foreground block">{sel.noSeri ? "No Seri" : "Kode"}</span><span className="font-medium">{sel.noSeri || sel.kode}</span></div>
                    )}
                  </div>
                )}

                {/* Harga jual */}
                <div className="space-y-1">
                  <Label className="text-xs">Harga Jual</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
                    <Input type="text" inputMode="numeric" placeholder="0" className="pl-9"
                      value={item.harga}
                      onChange={(e) => updateItem(item.rowId, { harga: formatRupiah(e.target.value) })} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {stock.length > 0 && (
          <button type="button" onClick={addItem}
            className="w-full py-2.5 rounded-lg border-2 border-dashed border-primary/30 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
            <span className="text-lg leading-none">+</span> Tambah Barang
          </button>
        )}
      </div>

      {/* Shared fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Nama Pembeli <span className="text-destructive">*</span></Label>
          <Input value={pembeli} onChange={(e) => setPembeli(e.target.value)} placeholder="Nama pembeli" />
        </div>
        <div className="space-y-2">
          <Label>Tanggal Penjualan <span className="text-destructive">*</span></Label>
          <DatePicker value={tanggal} onChange={setTanggal} />
        </div>
      </div>

      {/* Ongkir & Biaya Operasional */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Ongkir <span className="text-muted-foreground font-normal">(opsional)</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
            <Input type="text" inputMode="numeric" placeholder="0" className="pl-9"
              value={ongkir} onChange={(e) => setOngkir(formatRupiah(e.target.value))} />
          </div>
        </div>

        {/* Biaya Operasional dynamic */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Biaya Operasional <span className="text-muted-foreground font-normal">(opsional)</span></Label>
            <button type="button" onClick={() => setOpsItems((p) => [...p, { id: crypto.randomUUID(), amount: "", label: "" }])}
              className="text-xs text-primary hover:underline">+ Tambah</button>
          </div>
          {opsItems.map((op) => (
            <div key={op.id} className="flex gap-2 items-center">
              <div className="relative w-40 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
                <Input type="text" inputMode="numeric" placeholder="0" className="pl-9"
                  value={op.amount}
                  onChange={(e) => setOpsItems((p) => p.map((i) => i.id === op.id ? { ...i, amount: formatRupiah(e.target.value) } : i))} />
              </div>
              <Input placeholder="Keterangan (mis. komisi, packaging)" className="flex-1"
                value={op.label}
                onChange={(e) => setOpsItems((p) => p.map((i) => i.id === op.id ? { ...i, label: e.target.value } : i))} />
              <button type="button" onClick={() => setOpsItems((p) => p.filter((i) => i.id !== op.id))}
                className="text-destructive hover:opacity-80 shrink-0 text-xs">Hapus</button>
            </div>
          ))}
        </div>
      </div>

      {/* Ringkasan penjualan */}
      {validCount > 0 && (
        <div className="rounded-lg border border-border bg-gradient-to-r from-card to-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Ringkasan Penjualan</p>
          <div className="flex flex-col sm:flex-row sm:text-center gap-2 sm:gap-3">
            <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:flex-1 py-1 sm:py-0">
              <p className="text-xs text-muted-foreground sm:mb-1">Jumlah Barang</p>
              <p className="text-xl font-semibold">{validCount}</p>
            </div>
            <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:flex-1 py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-border">
              <p className="text-xs text-muted-foreground sm:mb-1">Total Gramasi</p>
              <p className="text-xl font-semibold">{formatGr(totalGramasi)}</p>
            </div>
            {totalOpsNum > 0 && (
              <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:flex-1 py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-border">
                <p className="text-xs text-muted-foreground sm:mb-1 shrink-0">Biaya Ops</p>
                <p className={`font-semibold break-all leading-tight text-right sm:text-center ${moneySize(totalOpsNum)}`}>{formatIDR(totalOpsNum)}</p>
              </div>
            )}
            {ongkirNum > 0 && (
              <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:flex-1 py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-border">
                <p className="text-xs text-muted-foreground sm:mb-1 shrink-0">Ongkir</p>
                <p className={`font-semibold break-all leading-tight text-right sm:text-center ${moneySize(ongkirNum)}`}>{formatIDR(ongkirNum)}</p>
              </div>
            )}
            <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:flex-1 py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-border">
              <p className="text-xs text-muted-foreground sm:mb-1 shrink-0">Total Harga Jual</p>
              <p className={`font-semibold text-primary break-all leading-tight text-right sm:text-center ${moneySize(totalHargaJual)}`}>{formatIDR(totalHargaJual)}</p>
            </div>
            <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:flex-1 py-1 sm:py-0 border-t sm:border-t-0 sm:border-l border-border">
              <p className="text-xs text-muted-foreground sm:mb-1 shrink-0">Keuntungan</p>
              <p className={`font-semibold break-all leading-tight text-right sm:text-center ${keuntunganTx >= 0 ? "text-success" : "text-destructive"} ${moneySize(keuntunganTx)}`}>{formatIDR(keuntunganTx)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={submitting} className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-elegant">
          {submitting ? "Menyimpan..." : `Catat ${items.length} Barang`}
        </Button>
      </div>
    </form>

  );
}

export function TransactionForm({ type }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft p-6">
      {type === "keluar" ? <SaleForm /> : <MasukForm />}
    </div>
  );
}
