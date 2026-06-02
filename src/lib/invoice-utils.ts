import { supabase } from "./supabase";

export type InvoiceItemData = {
  id: string;
  category: "logam_mulia" | "perhiasan";
  namaProduct?: string;
  kode?: string;
  karat?: string;
  noSeri?: string;
  gramasi: number;
  harga: number;
};

export type InvoicePayload = {
  items: InvoiceItemData[];
  date: string;
  pembeli?: string;
  invoiceNumber?: string;
  sequence?: number;
};

/** Format: INV/No.{seq}{DDMMYY} */
function formatInvoiceNumber(seq: number, date: string): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `INV/No.${seq}${dd}${mm}${yy}`;
}

/** Get next invoice number for user and save to DB */
export async function createInvoiceNumber(
  userId: string,
  date: string,
  transactionIds: string[],
): Promise<{ invoiceNumber: string; sequence: number }> {
  // Count existing invoices for this user
  const { count, error: countErr } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countErr) throw countErr;

  const sequence = (count ?? 0) + 1;
  const invoiceNumber = formatInvoiceNumber(sequence, date);

  const { error } = await supabase.from("invoices").insert({
    user_id: userId,
    invoice_number: invoiceNumber,
    sequence_number: sequence,
    transaction_ids: transactionIds,
  });

  if (error) throw error;

  return { invoiceNumber, sequence };
}

/** Format date to Indonesian long format */
export function formatDateID(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
