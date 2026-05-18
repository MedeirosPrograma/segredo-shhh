import { Link, useLocation } from "@tanstack/react-router";
import { Home, History, Settings } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Hoje", icon: Home },
  { to: "/history", label: "Histórico", icon: History },
  { to: "/edit", label: "Editar", icon: Settings },
] as const;

export function MobileLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-md px-4 pt-6">{children}</div>;
}
