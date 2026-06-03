import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 py-8" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
      <div className="mb-4 flex flex-col items-center gap-0">
        <img
          src="/logo.png"
          alt="Pohon Emas"
          className="size-28 sm:size-40 object-contain -mb-4 sm:-mb-8"
        />
        <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight">Pohon Emas</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Pembukuan Reseller Emas</p>
      </div>
      <SignIn
        routing="hash"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
