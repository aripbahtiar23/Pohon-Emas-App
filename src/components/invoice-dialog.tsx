import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { formatGr, formatIDR } from "@/lib/goldbook";

export type InvoiceItem = {
  id: string;
  category: "logam_mulia" | "perhiasan";
  namaProduct?: string;
  kode?: string;
  karat?: string;
  noSeri?: string;
  gramasi: number;
  hargaBeli?: number;
  harga: number;
};

export type InvoiceData = {
  invoiceId: string;
  date: string;
  pembeli?: string;
  items: InvoiceItem[];
};

function invoiceNo(id: string, date: string) {
  const d = new Date(date);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-${ymd}-${id.slice(0, 6).toUpperCase()}`;
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function itemLabel(item: InvoiceItem) {
  if (item.category === "logam_mulia") {
    const parts = [item.namaProduct || "Logam Mulia"];
    if (item.noSeri) parts.push(`SN ${item.noSeri}`);
    return parts.join(" · ");
  }
  const parts = [item.kode || "Perhiasan"];
  if (item.karat) parts.push(item.karat);
  return parts.join(" · ");
}

function InvoiceView({ data }: { data: InvoiceData }) {
  const total = data.items.reduce((s, i) => s + i.harga, 0);
  const totalGr = data.items.reduce((s, i) => s + i.gramasi, 0);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#1a1a1a", background: "#fff", width: "100%", maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 20, borderBottom: "2px solid #c9a76a", marginBottom: 24 }}>
        <img src="/logo.png" alt="Logo" style={{ width: 64, height: 64, objectFit: "contain" }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>Pohon Emas</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Jual Beli Logam Mulia & Perhiasan</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#c9a76a", letterSpacing: "0.05em" }}>INVOICE</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{invoiceNo(data.invoiceId, data.date)}</div>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Kepada</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{data.pembeli || "Umum"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Tanggal</div>
          <div style={{ fontSize: 13 }}>{formatDateLong(data.date)}</div>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f5f0e8", borderBottom: "1px solid #e8dfc8" }}>
            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em" }}>No</th>
            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em" }}>Produk</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em" }}>Gramasi</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em" }}>Harga Jual</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #f0ebe0" }}>
              <td style={{ padding: "10px 12px", color: "#888" }}>{i + 1}</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 500 }}>{itemLabel(item)}</div>
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatGr(item.gramasi)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatIDR(item.harga)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#555" }}>
            <span>Total Gramasi</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatGr(totalGr)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "#f5f0e8", borderRadius: 8, fontSize: 15, fontWeight: 700, borderLeft: "3px solid #c9a76a" }}>
            <span>Total</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: "#a6824a" }}>{formatIDR(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e8dfc8", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>
          <div>Terima kasih atas kepercayaan Anda.</div>
          <div>* Harga sewaktu-waktu bisa berubah</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#888" }}>
          <div style={{ marginBottom: 40 }}>Hormat kami,</div>
          <div style={{ borderTop: "1px solid #aaa", paddingTop: 4, minWidth: 120 }}>Pohon Emas</div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  data: InvoiceData | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceDialog({ data, open, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice - Pohon Emas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #fff; padding: 40px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body onload="window.print()">
  ${content}
</body>
</html>`);
    win.document.close();
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice — {data.pembeli || "Umum"}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="border border-border rounded-lg p-6 bg-white" ref={printRef}>
          <InvoiceView data={data} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button onClick={handlePrint} className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold">
            <Printer className="size-4 mr-2" />
            Print / Simpan PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
