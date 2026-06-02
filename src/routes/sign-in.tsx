import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-0">
        <img src="/logo.png" alt="Pohon Emas" className="size-60 object-contain -mb-14" />
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Pohon Emas</h1>
        <p className="text-sm text-muted-foreground">Pembukuan Reseller Emas</p>
      </div>
      <SignIn
        routing="hash"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
