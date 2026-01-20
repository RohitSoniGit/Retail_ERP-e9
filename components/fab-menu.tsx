"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, ShoppingCart, Package, Users, Receipt } from "lucide-react";
import Link from "next/link";

export function FABMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: ShoppingCart, label: "New Bill", href: "/billing", color: "bg-emerald-500 hover:bg-emerald-600" },
    { icon: Package, label: "Add Stock", href: "/items?action=add-stock", color: "bg-blue-500 hover:bg-blue-600" },
    { icon: Users, label: "New Customer", href: "/customers?action=add", color: "bg-purple-500 hover:bg-purple-600" },
    { icon: Receipt, label: "New Voucher", href: "/vouchers?action=add", color: "bg-amber-500 hover:bg-amber-600" },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {/* Menu Items */}
      <div className={`flex flex-col-reverse gap-2 mb-2 transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)}>
            <div className="flex items-center gap-2 justify-end">
              <span className="bg-background border shadow-sm text-xs px-2 py-1 rounded whitespace-nowrap">
                {item.label}
              </span>
              <div className={`${item.color} text-white p-3 rounded-full shadow-lg`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="lg"
        className={`rounded-full h-14 w-14 shadow-lg transition-transform ${isOpen ? 'rotate-45 bg-muted-foreground' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
