"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/lib/context/organization";
import { FABMenu } from "./fab-menu";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Receipt,
  Store,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/billing", label: "Bill", icon: ShoppingCart },
  { href: "/customers", label: "Parties", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const sideNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/billing", label: "Billing", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/vouchers", label: "Vouchers", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { organization, loading } = useOrganization();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm">
                {loading ? "Loading..." : organization?.name || "My Shop"}
              </span>
              {organization?.gstin && (
                <p className="text-[10px] text-muted-foreground">
                  GST: {organization.gstin}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full sm:pl-20">
        {children}
      </main>

      {/* Floating Action Button */}
      <FABMenu />

      {/* Bottom Navigation - Mobile */}
      <nav className="sticky bottom-0 bg-background border-t sm:hidden z-40">
        <div className="flex justify-around py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  active
                    ? "text-emerald-600"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-emerald-600/20")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden sm:flex fixed left-0 top-14 bottom-0 w-20 flex-col items-center gap-1 py-4 border-r bg-muted/30">
        {sideNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-16",
                active
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
