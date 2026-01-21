"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/lib/context/organization";
import { FABMenu } from "./fab-menu";
import { DemoBanner } from "./demo-banner";
import { ThemeToggle } from "./theme-toggle";
import { isDemoMode } from "@/lib/demo-data";
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

  const sidebarTop = showDemoBanner ? "top-[104px]" : "top-20";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Particles Background */}
      <FloatingParticles />

      {/* Demo Banner */}
      <div className="relative z-10">
        <DemoBanner />
      </div>

      {/* Clean Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-[88px] px-6 w-full md:pl-[126px]">
          <div className="flex items-center gap-4">
            {/* Logo removed from header as requested */}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
        "hidden md:flex fixed left-0 top-0 h-screen w-[110px] flex-col items-center gap-2 py-4 bg-card border-r border-border z-[60] overflow-y-auto"
      )}>
        {/* Company Logo at Top */}
        <div className="mb-4 p-2 sticky top-0 bg-card z-10 w-full flex justify-center pb-4 border-b border-border/10">
          <Link href="/">
            {organization?.logo_url ? (
              <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg hover:opacity-90 transition-opacity cursor-pointer bg-white flex items-center justify-center">
                <img
                  src={organization.logo_url}
                  alt={organization.name || "Logo"}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity cursor-pointer">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
          </Link>
        </div>

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
