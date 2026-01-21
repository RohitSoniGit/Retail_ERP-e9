"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/lib/context/organization";
import { FABMenu } from "./fab-menu";
import { DemoBanner } from "./demo-banner";
import { ThemeToggle } from "./theme-toggle";
import { isDemoMode } from "@/lib/demo-data";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Receipt,
  Store,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/billing", label: "Bill", icon: ShoppingCart },
  { href: "/purchase", label: "Purchase", icon: Receipt },
  { href: "/customers", label: "Parties", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const sideNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/billing", label: "Billing", icon: ShoppingCart },
  { href: "/purchase", label: "Purchase", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/ledger", label: "Ledger", icon: BarChart3 },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/categories", label: "Categories", icon: Store }, // Using Store icon as placeholder
  { href: "/jobs", label: "Job Work", icon: Zap }, // Using Zap icon
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Floating particles component
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 8,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { organization, loading } = useOrganization();
  const showDemoBanner = isDemoMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarTop = showDemoBanner ? "top-[88px]" : "top-14";

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Particles Background */}
      <FloatingParticles />

      {/* Demo Banner */}
      <div className="relative z-10">
        <DemoBanner />
      </div>

      {/* Clean Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-6 w-full md:pl-20">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold text-lg text-foreground">
                {loading ? "Loading..." : organization?.name || "Business Hub"}
              </span>
              {organization?.gstin && (
                <p className="text-xs text-muted-foreground">
                  GST: {organization.gstin}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full md:pl-20">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* FAB Menu */}
      <FABMenu />

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex justify-around py-3 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className={cn(
        "hidden md:flex fixed left-0 bottom-0 w-20 flex-col items-center gap-2 py-4 bg-card border-r border-border z-40",
        sidebarTop
      )}>
        <div className="flex flex-col gap-2 w-full px-2">
          {sideNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors hover-lift",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
