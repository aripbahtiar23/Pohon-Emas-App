import { useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, TreeDeciduous, Menu, X, Wand2, ChevronLeft, ChevronRight, User } from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

function LogoIcon() {
  return (
    <div className="size-[72px] flex items-center justify-center overflow-hidden shrink-0">
      <img
        src="/logo.png"
        alt="Pohon Emas"
        className="size-[72px] object-contain"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const fallback = el.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div className="size-10 rounded-lg bg-gradient-gold items-center justify-center shadow-elegant hidden">
        <img src="/logo.png" alt="Pohon Emas" className="size-8 object-contain" />
      </div>
    </div>
  );
}

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/masuk", label: "Barang Masuk", icon: ArrowDownToLine },
  { to: "/keluar", label: "Barang Keluar", icon: ArrowUpFromLine },
  { to: "/story", label: "Generator Story", icon: Wand2 },
];

function UserArea({ collapsed }: { collapsed: boolean }) {
  const { user } = useUser();
  if (!user) return null;
  if (collapsed) {
    return (
      <UserButton
        appearance={{ elements: { avatarBox: "size-8" } }}
        userProfileUrl="/profile"
        userProfileMode="navigation"
      />
    );
  }
  return (
    <div className="flex items-center gap-3 min-w-0">
      <UserButton
        appearance={{ elements: { avatarBox: "size-8" } }}
        userProfileUrl="/profile"
        userProfileMode="navigation"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-sidebar-foreground truncate">{user.fullName || user.username || "Pengguna"}</p>
        <p className="text-[11px] text-sidebar-foreground/50 truncate">{user.primaryEmailAddress?.emailAddress}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand + collapse toggle */}
        <div className={cn("border-b border-sidebar-border flex items-center", sidebarCollapsed ? "px-2 py-4 justify-center" : "px-4 py-4 justify-between gap-2")}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-0 min-w-0">
              <LogoIcon />
              <div className="min-w-0">
                <div className="font-semibold tracking-tight truncate">Pohon Emas</div>
                <div className="text-xs text-sidebar-foreground/60">Reseller Ledger</div>
              </div>
            </div>
          )}
          <button
            aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="size-8 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-sidebar-accent/60 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors min-h-11",
                  sidebarCollapsed && "justify-center px-2",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User area bottom */}
        <div className={cn("border-t border-sidebar-border", sidebarCollapsed ? "px-2 py-3 flex justify-center" : "px-4 py-3")}>
          <UserArea collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar text-sidebar-foreground border-b border-sidebar-border flex items-center justify-between px-4 shadow-soft">
        <div className="flex items-center gap-0">
          <LogoIcon />
          <div>
            <div className="font-semibold tracking-tight">Pohon Emas</div>
            <div className="text-xs text-sidebar-foreground/60">Reseller Ledger</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserButton
            appearance={{ elements: { avatarBox: "size-8" } }}
            userProfileUrl="/profile"
            userProfileMode="navigation"
          />
          <button
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="size-11 inline-flex items-center justify-center rounded-md hover:bg-sidebar-accent/60 active:bg-sidebar-accent transition-colors"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-14" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <nav
            className="relative bg-sidebar text-sidebar-foreground border-b border-sidebar-border px-3 py-3 space-y-1 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            {nav.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 rounded-md text-base min-h-12 transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60"
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              );
            })}
            {/* User di drawer */}
            <div className="pt-2 border-t border-sidebar-border mt-1">
              <UserArea collapsed={false} />
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 overflow-auto pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border flex pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-14 text-[11px] transition-colors",
                active
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/70 active:bg-sidebar-accent/60"
              )}
            >
              <Icon className="size-5" />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
