import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = import.meta.env.VITE_FEEDBACK_WEBHOOK_URL as string | undefined;

export function FeedbackForm() {
  const { user } = useUser();
  const [pesan, setPesan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pesan.trim()) return;

    if (!WEBHOOK_URL) {
      toast.error("Fitur feedback belum dikonfigurasi.");
      return;
    }

    setSubmitting(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          nama: user?.fullName || user?.username || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          pesan: pesan.trim(),
        }),
      });
      toast.success("Terima kasih! Masukan Anda sudah terkirim.");
      setPesan("");
    } catch {
      toast.error("Gagal mengirim masukan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6 w-full max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquarePlus className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Feedback & Masukan</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Ada saran, ide fitur, atau kendala? Tulis di sini.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="feedback-nama">Nama</Label>
          <Input id="feedback-nama" value={user?.fullName || user?.username || ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="feedback-pesan">Pesan</Label>
          <Textarea
            id="feedback-pesan"
            placeholder="Tulis feedback atau masukan Anda..."
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={4}
            required
          />
        </div>
        <Button type="submit" disabled={submitting || !pesan.trim()}>
          {submitting ? "Mengirim..." : "Kirim Masukan"}
        </Button>
      </form>
    </Card>
  );
}
