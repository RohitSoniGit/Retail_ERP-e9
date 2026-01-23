"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Receipt,
    Users,
    BarChart3,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/items", label: "Items", icon: Package },
    { href: "/billing", label: "Bill", icon: ShoppingCart },
    { href: "/purchase", label: "Purchase", icon: Receipt },
    { href: "/customers", label: "Parties", icon: Users },
    { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function MobileNavFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            <div className="md:hidden fixed bottom-8 left-8 z-50 flex flex-col items-center gap-4">
                {/* Navigation Menu (Expands Upwards) */}
                <div
                    className={cn(
                        "flex flex-col gap-2 transition-all duration-300 origin-bottom",
                        isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-90 pointer-events-none"
                    )}
                >
                    <div className="bg-background/80 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-xl flex flex-col gap-1 w-40">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                                        active ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Toggle Button */}
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-all duration-300 relative overflow-hidden holographic text-white border-0",
                        isOpen ? "rotate-90 scale-110" : "hover:scale-105"
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
