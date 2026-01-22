"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, ShoppingCart, Package, Users, Receipt } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FABMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const menuItems = [
    {
      icon: ShoppingCart,
      label: "New Bill",
      href: "/billing",
      gradient: "from-emerald-400 to-emerald-600",
      shadow: "shadow-emerald-500/30",
      border: "border-emerald-200 dark:border-emerald-800"
    },
    {
      icon: Package,
      label: "Purchase Order",
      href: "/purchase?tab=orders&action=create",
      gradient: "from-blue-400 to-blue-600",
      shadow: "shadow-blue-500/30",
      border: "border-blue-200 dark:border-blue-800"
    },
    {
      icon: Users,
      label: "Add Supplier",
      href: "/purchase?tab=suppliers&action=add",
      gradient: "from-purple-400 to-purple-600",
      shadow: "shadow-purple-500/30",
      border: "border-purple-200 dark:border-purple-800"
    },
    {
      icon: Receipt,
      label: "Stock Adjustment",
      href: "/inventory?tab=adjustment",
      gradient: "from-amber-400 to-amber-600",
      shadow: "shadow-amber-500/30",
      border: "border-amber-200 dark:border-amber-800"
    },
  ];

  return (
    <>
      {/* Backdrop Blur */}
      <div
        className={cn(
          "fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-all duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-5">
        {/* Menu Items */}
        <div className={cn(
          "flex flex-col items-end gap-4 transition-all duration-300",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}>
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex items-center gap-4 transition-all duration-300 transform",
                isOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <span className="px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur text-sm font-semibold shadow-xl border border-border/50 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200">
                {item.label}
              </span>
              <div className={cn(
                "p-3.5 rounded-2xl text-white shadow-xl bg-gradient-to-br transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 border-2",
                item.gradient,
                item.shadow,
                item.border
              )}>
                <item.icon className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Main Toggle Button */}
        <Button
          size="icon"
          className={cn(
            "h-16 w-16 rounded-2xl shadow-2xl transition-all duration-300 relative overflow-hidden group hover:scale-105 active:scale-95",
            isOpen ? "rotate-90 bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Animated Glow */}
          {!isOpen && (
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl" />
          )}

          {isOpen ? (
            <X className="h-7 w-7 transition-transform duration-300" />
          ) : (
            <Plus className="h-8 w-8 transition-transform duration-300 group-hover:rotate-90" />
          )}
        </Button>
      </div>
    </>
  );
}
