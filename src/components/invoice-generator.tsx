import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Share2, Loader2 } from "lucide-react";
import { sharePNG, downloadPNG, canShareFiles } from "@/lib/share";
import { toast } from "sonner";
import { formatIDR, formatGr } from "@/lib/goldbook";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import { createInvoiceNumber, formatDateID, type InvoiceItemData } from "@/lib/invoice-utils";

const BANK_KEY  = "pohon-emas:invoice-bank";
const BRAND_KEY = "pohon-emas:invoice-brand";

type BankSettings  = { bankName: string; accountNumber: string; accountHolder: string };
type BrandSettings = { brandName: string; logo: string };

const defaultBank:  BankSettings  = { bankName: "", accountNumber: "", accountHolder: "" };
const defaultBrand: BrandSettings = { brandName: "Pohon Emas", logo: "/logo.png" };

function loadJSON<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? { ...fallback, ...JSON.parse(r) } : fallback; }
  catch { return fallback; }
}

export type InvoiceGeneratorData = {
  transactionIds: string[];
  items: InvoiceItemData[];
  date: string;
  pembeli?: string;
};

/* ── Canvas 1122 × 793 landscape ─────────────────────────────────────────── */

interface CanvasProps {
  invoiceNumber: string;
  date: string;
  issuedDate?: string;
  pembeli: string;
  customerAddress: string;
  customerPhone: string;
  downPayment: number;
  bank: BankSettings;
  brand: BrandSettings;
  items: InvoiceItemData[];
}

/* ── Tree of Life SVG watermark ─────────────────────────────────────────── */
function TreeOfLife() {
  const c = "#8B5E3C";
  return (
    <svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle */}
      <circle cx="240" cy="240" r="220" stroke={c} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.4"/>
      <circle cx="240" cy="240" r="206" stroke={c} strokeWidth="0.5" opacity="0.25"/>

      {/* Trunk */}
      <path d="M240 340 C240 310 238 285 240 260" stroke={c} strokeWidth="5" strokeLinecap="round"/>
      <path d="M240 260 C240 230 240 210 240 190" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M240 190 C240 170 240 155 240 140" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>

      {/* Roots */}
      <path d="M240 340 C230 355 210 365 190 370" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      <path d="M240 340 C250 355 270 365 290 370" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      <path d="M240 345 C235 362 228 375 220 385" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M240 345 C245 362 252 375 260 385" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M238 348 C225 358 205 358 188 355" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M242 348 C255 358 275 358 292 355" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>

      {/* Main branches L1 */}
      <path d="M240 260 C220 248 195 242 170 245" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M240 260 C260 248 285 242 310 245" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>

      {/* Main branches L2 */}
      <path d="M240 220 C215 205 185 200 158 205" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M240 220 C265 205 295 200 322 205" stroke={c} strokeWidth="2" strokeLinecap="round"/>

      {/* Upper branches */}
      <path d="M240 190 C222 178 200 172 178 175" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M240 190 C258 178 280 172 302 175" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M240 165 C228 152 212 148 196 152" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M240 165 C252 152 268 148 284 152" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M240 148 C233 136 225 130 216 132" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M240 148 C247 136 255 130 264 132" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>

      {/* Secondary branches from L1 */}
      <path d="M195 242 C182 228 175 215 176 200" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M170 245 C158 235 150 222 152 208" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M285 242 C298 228 305 215 304 200" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M310 245 C322 235 330 222 328 208" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>

      {/* Leaf clusters — circles */}
      {[
        [170,245],[155,208],[176,200],[158,205],[140,212],
        [310,245],[325,208],[304,200],[322,205],[340,212],
        [178,175],[196,152],[216,132],[264,132],[284,152],[302,175],
        [240,130],[230,118],[250,118],[240,108],
        [195,192],[215,180],[265,180],[285,192],
        [160,230],[148,222],[328,230],[332,222],
      ].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r={i < 10 ? 6 : i < 18 ? 5 : 4} fill={c} opacity={i < 4 ? 0.5 : 0.35}/>
      ))}

      {/* Small decorative leaves */}
      {[
        [168,238],[162,250],[312,238],[318,250],
        [174,202],[182,194],[306,202],[298,194],
        [186,170],[200,162],[280,162],[294,170],
        [208,144],[220,136],[260,136],[272,144],
        [236,124],[244,124],
      ].map(([x,y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="3.5" ry="5" fill={c} opacity="0.25"
          transform={`rotate(${(x - 240) * 0.4} ${x} ${y})`} />
      ))}
    </svg>
  );
}

function InvoiceCanvas({ invoiceNumber, date, issuedDate, pembeli, customerAddress, customerPhone, downPayment, bank, brand, items }: CanvasProps) {
  const subtotal  = items.reduce((s, i) => s + i.harga, 0);
  const repayment = subtotal - downPayment;

  const BG    = "#fcf0e7";
  const BROWN = "#5C3D1E";
  const MUTED = "#8C6B4A";
  const GOLD  = "#B8894A";
  const LINE  = "#D9C8AE";
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS  = "'Inter', system-ui, sans-serif";

  // Dynamic scale: sedikit produk = font besar
  const n = items.length;
  const s = n <= 1 ? 1.35 : n <= 2 ? 1.2 : n <= 3 ? 1.1 : n <= 4 ? 1.0 : n <= 6 ? 0.9 : 0.8;
  const f = (base: number) => Math.round(base * s);

  return (
    <div style={{ width: 1122, height: 793, background: BG, fontFamily: SANS, color: BROWN, position: "relative", padding: "28px 56px 32px", boxSizing: "border-box", overflow: "hidden" }}>

      {/* Logo watermark */}
      {brand.logo && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 120, opacity: 0.08, pointerEvents: "none", zIndex: 0 }}>
          <img src={brand.logo} alt="" aria-hidden style={{ width: "240%", height: "240%", objectFit: "contain" }} />
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* ── Row 1: INVOICE + brand | invoice number ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: f(44), fontWeight: 700, lineHeight: 1, color: BROWN, letterSpacing: "-0.03em" }}>INVOICE</div>
            <div style={{ fontFamily: SERIF, fontSize: f(13), color: GOLD, marginTop: 4, letterSpacing: "0.04em" }}>
              {brand.brandName || "Pohon Emas"}
            </div>
          </div>
          <div style={{ textAlign: "right", paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ fontFamily: SANS, fontSize: f(18), fontWeight: 700, color: BROWN }}>{invoiceNumber}</span>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: LINE, marginBottom: 8 }} />

        {/* ── Row 2: Billed to | Dates ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: f(9), fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 5 }}>Billed To</div>
            <div style={{ fontFamily: SERIF, fontSize: f(15), fontWeight: 700, marginBottom: 2 }}>{pembeli || "Umum"}</div>
            <div style={{ fontSize: f(11), color: MUTED, lineHeight: 1.5 }}>{customerAddress || "—"}</div>
            <div style={{ fontSize: f(11), color: MUTED, marginTop: 1, marginBottom: 18 }}>{customerPhone || "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: f(9), fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 5 }}>Date</div>
            <div style={{ fontSize: f(11), color: MUTED, marginBottom: 2 }}>
              Issued: <span style={{ fontWeight: 600, color: BROWN }}>{formatDateID(issuedDate || date)}</span>
            </div>
            <div style={{ fontSize: f(11), color: MUTED }}>
              Due: <span style={{ fontWeight: 600, color: BROWN }}>{formatDateID(date)}</span>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: LINE, marginBottom: 6 }} />

        {/* ── Table ── */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${BROWN}` }}>
              {[
                { l: "Product Name", a: "left",  w: "auto" },
                { l: "Gramasi",      a: "center", w: 90 },
                { l: "Unit Price",   a: "right", w: 130 },
                { l: "Total",        a: "right", w: 130 },
              ].map(({ l, a, w }) => (
                <th key={l} style={{
                  padding: "6px 8px", textAlign: a as "left"|"right",
                  fontSize: f(10), fontWeight: 700, color: BROWN,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  width: typeof w === "number" ? w : undefined,
                }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const name = item.category === "logam_mulia"
                ? item.namaProduct || "Logam Mulia"
                : `${item.kode || "Perhiasan"}${item.karat ? ` ${item.karat}` : ""}`;
              return (
                <tr key={item.id}>
                  <td style={{ padding: "1px 8px", fontSize: f(13), fontWeight: 500, textAlign: "left", verticalAlign: "top" }}>
                    <div style={{ textAlign: "left" }}>
                      {name}
                      {item.noSeri && <span style={{ fontSize: f(11), color: MUTED, marginLeft: 8 }}>SN {item.noSeri}</span>}
                    </div>
                  </td>
                  <td style={{ padding: "1px 8px", textAlign: "center", fontSize: f(12), color: MUTED, verticalAlign: "top" }}>{formatGr(item.gramasi)}</td>
                  <td style={{ padding: "1px 8px", textAlign: "right", fontSize: f(12), fontVariantNumeric: "tabular-nums", verticalAlign: "top" }}>{formatIDR(item.harga)}</td>
                  <td style={{ padding: "1px 8px", textAlign: "right", fontSize: f(13), fontWeight: 600, fontVariantNumeric: "tabular-nums", verticalAlign: "top" }}>{formatIDR(item.harga)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Divider ── */}
        {/* Spacer fleksibel — makin banyak produk makin kecil */}
        <div style={{ flex: 1, minHeight: 20 }} />

        <div style={{ height: 1.5, background: BROWN, marginBottom: 14 }} />

        {/* ── Row Bottom: Payment | Thank you | Summary ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

          {/* Payment method */}
          <div>
            <div style={{ fontSize: f(9), fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 7 }}>Payment Method</div>
            <div style={{ fontSize: f(11), color: MUTED, marginBottom: 4 }}>Bank Transfer</div>
            <div style={{ fontFamily: SERIF, fontSize: f(16), fontWeight: 700, color: BROWN, letterSpacing: "0.04em" }}>{bank.accountNumber || "—"}</div>
            <div style={{ fontSize: f(11), color: MUTED, marginTop: 2 }}>{bank.bankName || "—"}</div>
            <div style={{ fontSize: f(11), color: MUTED }}>a.n. {bank.accountHolder || "—"}</div>
          </div>

          {/* Summary + Thank you */}
          <div style={{ minWidth: 230 }}>
            {[
              { label: "Subtotal",     value: subtotal },
              { label: "Down Payment", value: downPayment },
              { label: "Repayment",    value: repayment },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: f(12), color: MUTED, marginBottom: 3, paddingBottom: 3, borderBottom: `1px solid ${LINE}` }}>
                <span style={{ marginRight: 40 }}>{label}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatIDR(value)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 48 }}>
              <span style={{ fontFamily: SERIF, fontSize: f(18), fontWeight: 700, color: BROWN, marginRight: 40 }}>Total Price</span>
              <span style={{ fontFamily: SERIF, fontSize: f(18), fontWeight: 900, color: BROWN, fontVariantNumeric: "tabular-nums" }}>{formatIDR(subtotal)}</span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: f(13), fontStyle: "italic", fontWeight: 700, color: GOLD, textAlign: "right" }}>
              Thank you for shopping with us!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Responsive Preview ──────────────────────────────────────────────────── */
function PreviewScaled({ canvasRef, children }: { canvasRef: React.RefObject<HTMLDivElement>; children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.52);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth - 24;
      setScale(Math.min(0.52, w / 1122));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <div style={{ width: 1122 * scale, height: 793 * scale, position: "relative", margin: "0 auto" }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
          <div ref={canvasRef} style={{ width: 1122 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Dialog ───────────────────────────────────────────────────────────────── */

interface Props {
  data: InvoiceGeneratorData | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceGeneratorDialog({ data, open, onClose }: Props) {
  const { userId } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone]     = useState("");
  const [issuedDate, setIssuedDate]           = useState("");
  const [downPayment, setDownPayment]         = useState("");
  const [bank, setBank]   = useState<BankSettings>(defaultBank);
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [generating, setGenerating]       = useState(false);
  const [saved, setSaved]                 = useState(false);

  useEffect(() => {
    if (!data) return;
    setDownPayment(""); setSaved(false); setInvoiceNumber("");
    setCustomerAddress(""); setCustomerPhone(""); setIssuedDate("");
    setBank(loadJSON(BANK_KEY, defaultBank));
    setBrand(loadJSON(BRAND_KEY, defaultBrand));
  }, [data]);

  const saveBank  = (next: BankSettings)  => { setBank(next);  localStorage.setItem(BANK_KEY,  JSON.stringify(next)); };
  const saveBrand = (next: BrandSettings) => { setBrand(next); localStorage.setItem(BRAND_KEY, JSON.stringify(next)); };

  const getOrCreateNumber = useCallback(async () => {
    if (invoiceNumber) return invoiceNumber;
    if (!userId || !data) return "";
    const { invoiceNumber: num } = await createInvoiceNumber(userId, data.date, data.transactionIds);
    setInvoiceNumber(num); setSaved(true);
    return num;
  }, [invoiceNumber, userId, data]);

  const handleShare = async () => {
    if (!canvasRef.current || !data) return;
    setGenerating(true);
    try {
      const num      = await getOrCreateNumber();
      const filename = `${num.replace(/\//g, "-")}.png`;
      const dataUrl  = await toPng(canvasRef.current, {
        width: 1122, height: 793, canvasWidth: 1122, canvasHeight: 793,
        pixelRatio: 2, cacheBust: true, backgroundColor: "#fcf0e7",
      });
      if (canShareFiles()) {
        const shared = await sharePNG({ dataUrl, filename, title: `Invoice ${num}`, text: `Invoice ${data.pembeli || "pelanggan"} — ${num}` });
        if (shared) toast.success("Invoice berhasil dibagikan!");
        else { downloadPNG(dataUrl, filename); toast("Invoice diunduh — attach manual ke WhatsApp."); }
      } else {
        downloadPNG(dataUrl, filename);
        toast.success("Invoice diunduh sebagai gambar.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal generate invoice. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  if (!data) return null;

  const subtotal = data.items.reduce((s, i) => s + i.harga, 0);
  const dp = parseRupiah(downPayment) || 0;

  const canvasProps: CanvasProps = {
    invoiceNumber: invoiceNumber || "INV/No.—",
    date: data.date,
    issuedDate: issuedDate || undefined,
    pembeli: data.pembeli || "",
    customerAddress, customerPhone,
    downPayment: dp, bank, brand, items: data.items,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-0 overscroll-contain">
        <DialogHeader className="px-6 pt-5 pb-4 pr-12 border-b border-border">
          <DialogTitle>Generate Invoice</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-0">

          {/* ── Form — grid 5 kolom ── */}
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

              {/* 1 · No Invoice + Brand */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice & Brand</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">No. Invoice</Label>
                  <Input placeholder="Auto / isi manual" value={invoiceNumber}
                    onChange={(e) => { setInvoiceNumber(e.target.value); setSaved(!!e.target.value); }}
                    className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Brand</Label>
                  <Input placeholder="Pohon Emas" value={brand.brandName}
                    onChange={(e) => saveBrand({ ...brand, brandName: e.target.value })} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Logo</Label>
                  <div className="flex items-center gap-2">
                    {brand.logo && <img src={brand.logo} alt="" className="w-10 h-10 rounded border object-contain" />}
                    <label htmlFor="inv-logo" className="flex-1 cursor-pointer">
                      <div className="px-2 h-8 rounded-md border border-input bg-background text-xs text-muted-foreground hover:bg-muted flex items-center transition-colors">
                        {brand.logo && brand.logo !== "/logo.png" ? "Ganti logo..." : "Upload logo lain..."}
                      </div>
                      <input id="inv-logo" type="file" accept="image/*" className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => saveBrand({ ...brand, logo: String(reader.result || "") });
                          reader.readAsDataURL(file); e.target.value = "";
                        }} />
                    </label>
                    {brand.logo && brand.logo !== "/logo.png" && (
                      <button type="button" className="text-xs text-destructive" onClick={() => saveBrand({ ...brand, logo: "/logo.png" })}>✕</button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2 · Pelanggan */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pelanggan</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama</Label>
                  <Input value={data.pembeli || ""} disabled className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alamat</Label>
                  <Input placeholder="Jl. Contoh No. 1" value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">No. HP</Label>
                  <Input placeholder="+62 812 ..." value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)} className="text-xs" />
                </div>
              </div>

              {/* 3 · Rekening */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rekening</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Bank</Label>
                  <Input placeholder="BCA / BRI ..." value={bank.bankName}
                    onChange={(e) => saveBank({ ...bank, bankName: e.target.value })} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nomor Rekening</Label>
                  <Input placeholder="1234567890" value={bank.accountNumber}
                    onChange={(e) => saveBank({ ...bank, accountNumber: e.target.value })} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Pemilik</Label>
                  <Input placeholder="Nama lengkap" value={bank.accountHolder}
                    onChange={(e) => saveBank({ ...bank, accountHolder: e.target.value })} className="text-xs" />
                </div>
              </div>

              {/* 4 · Pembayaran + tombol */}
              <div className="space-y-3 sm:col-span-2 lg:col-span-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pembayaran</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Issued Date <span className="text-muted-foreground">(opsional)</span></Label>
                    <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Down Payment</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                      <Input inputMode="numeric" placeholder="0" className="pl-8 text-xs"
                        value={downPayment} onChange={(e) => setDownPayment(formatRupiah(e.target.value))} />
                    </div>
                  </div>
                </div>
                <div className="rounded border border-border bg-muted/40 p-2 text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>DP</span><span>-{formatIDR(dp)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Repayment</span><span>{formatIDR(subtotal - dp)}</span></div>
                </div>
                <Button onClick={handleShare} disabled={generating}
                  className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold">
                  {generating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Share2 className="size-4 mr-2" />}
                  {generating ? "Generating..." : "Bagikan Invoice"}
                </Button>
              </div>

            </div>
          </div>

          {/* Preview — scale responsif */}
          <div className="bg-muted/30 flex items-center justify-center p-3 overflow-x-auto">
            <PreviewScaled canvasRef={canvasRef}>
              <InvoiceCanvas {...canvasProps} />
            </PreviewScaled>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
