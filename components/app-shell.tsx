"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/lib/context/organization";
import { FABMenu } from "./fab-menu";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard,
  LayoutList,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
  { href: "/categories", label: "Categories", icon: LayoutList },
  { href: "/billing", label: "Billing", icon: ShoppingCart },
  { href: "/purchase", label: "Purchase", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/ledger", label: "Ledger", icon: BarChart3 },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/jobs", label: "Job Work", icon: Zap },
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
  const { organization, loading, error } = useOrganization();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const router = useRouter();
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    const publicRoutes = ["/login", "/signup", "/forgot-password"];
    const isPublic = publicRoutes.includes(pathname);
    setIsPublicRoute(isPublic);

    const checkAuth = async () => {
      if (!isPublic) {
        const supabase = (await import("@/lib/supabase/client")).getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
        }
      }
    };
    checkAuth();
  }, [pathname, router]);

  if (!mounted) return null;

  // On public routes (like login), only render the content without the app shell
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main className="w-full h-full">
          {children}
        </main>
      </div>
    );
  }

  // Show error state if organization loading failed
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Setup Required</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-4">
            <p className="text-sm">Please follow these steps:</p>
            <ol className="text-sm text-left space-y-2">
              <li>1. Run the database schema in Supabase SQL Editor: <code>master_setup.sql</code></li>
              <li>2. Run the setup script: <code>scripts/setup-ronak-jewellers.sql</code></li>
              <li>3. Refresh this page</li>
            </ol>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Floating Particles Background */}
      <FloatingParticles />

      {/* Clean Header - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between h-[88px] px-6 w-full md:pl-[126px]">
          <div className="flex items-center gap-4">
            {/* Logo removed from header as requested */}
            <div>
              <span className="font-bold text-xl gradient-text">
                {loading ? "Loading..." : organization?.name || "Business Hub"}
              </span>
              {organization?.gstin && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  GST: {organization.gstin}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-200/20 shadow-sm">
                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-border/50">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                  <span onClick={async () => {
                    const supabase = (await import("@/lib/supabase/client")).getSupabaseBrowserClient();
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                  }}>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full md:pl-[126px]">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* FAB Menu */}
      <FABMenu />

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/40 pb-safe">
        <div className="flex justify-around py-3 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px]",
                  active
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 scale-105"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", active && "-translate-y-0.5")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar - Premium Glass */}
      <nav className={cn(
        "hidden md:flex fixed left-0 top-0 h-screen w-[110px] flex-col items-center gap-2 py-4 bg-background/60 backdrop-blur-2xl border-r border-border/40 z-[60] overflow-y-auto scrollbar-none"
      )}>
        {/* Company Logo at Top */}
        <div className="mb-2 p-4 sticky top-0 z-20 w-full flex justify-center bg-background/80 backdrop-blur-xl border-b border-border/40">
          <Link href="/">
            {organization?.logo_url ? (
              <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform cursor-pointer bg-white flex items-center justify-center border border-white/20">
                <img
                  src={organization.logo_url}
                  alt={organization.name || "Logo"}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <Store className="h-5 w-5 text-white" />
              </div>
            )}
          </Link>
        </div>

        <div className="flex flex-col gap-3 w-full px-3">
          {sideNavItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 relative overflow-hidden",
                  active
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-105"
                    : "text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                )}
                title={item.label}
              >
                <Icon className={cn("h-5 w-5 transition-transform duration-300", !active && "group-hover:scale-110")} />
                <span className={cn("text-[10px] font-semibold text-center transition-colors", active ? "text-white/90" : "")}>{item.label}</span>

                {active && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl pointer-events-none" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
