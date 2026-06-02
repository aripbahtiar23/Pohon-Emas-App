import { createFileRoute } from "@tanstack/react-router";
import { UserProfile } from "@clerk/clerk-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Profil Saya</h1>
        <p className="text-muted-foreground mt-1">Kelola akun, keamanan, dan preferensi Anda.</p>
      </header>
      <div className="flex justify-center">
        <UserProfile routing="hash" />
      </div>
    </AppShell>
  );
}
