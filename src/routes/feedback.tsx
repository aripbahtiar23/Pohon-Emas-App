import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FeedbackForm } from "@/components/feedback-form";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Feedback & Masukan</h1>
        <p className="text-muted-foreground mt-1">Ada saran, ide fitur, atau kendala? Sampaikan di sini.</p>
      </header>
      <div className="flex justify-center">
        <FeedbackForm />
      </div>
    </AppShell>
  );
}
