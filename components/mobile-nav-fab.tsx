"use client";

import { useState, useRef, useEffect } from "react";
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
    const [position, setPosition] = useState({ x: 32, y: 32 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    const [hasMoved, setHasMoved] = useState(false);
    const pathname = usePathname();
    const fabRef = useRef<HTMLDivElement>(null);
    const dragThreshold = 5; // Minimum pixels to move before considering it a drag

    // Load saved position on mount
    useEffect(() => {
        const savedPosition = localStorage.getItem('mobile-nav-fab-position');
        if (savedPosition) {
            try {
                const parsed = JSON.parse(savedPosition);
                setPosition(parsed);
            } catch (e) {
                // Use default position if parsing fails
            }
        }
    }, []);

    // Save position to localStorage
    const savePosition = (newPosition: { x: number; y: number }) => {
        localStorage.setItem('mobile-nav-fab-position', JSON.stringify(newPosition));
    };

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    // Handle drag move
    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;

        const newX = clientX - dragStart.x;
        const newY = clientY - dragStart.y;

        // Check if we've moved enough to consider this a drag
        const deltaX = Math.abs(clientX - startPosition.x);
        const deltaY = Math.abs(clientY - startPosition.y);
        
        if (!hasMoved && (deltaX > dragThreshold || deltaY > dragThreshold)) {
            setHasMoved(true);
        }

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const fabSize = 56;

        // Constrain to viewport bounds
        const constrainedX = Math.max(16, Math.min(viewportWidth - fabSize - 16, newX));
        const constrainedY = Math.max(16, Math.min(viewportHeight - fabSize - 16, newY));

        setPosition({ x: constrainedX, y: constrainedY });
    };

    // Handle drag end
    const handleDragEnd = () => {
        if (isDragging) {
            setIsDragging(false);
            
            // Only snap to edges if we actually dragged
            if (hasMoved) {
                const viewportWidth = window.innerWidth;
                const fabSize = 56;
                const threshold = viewportWidth / 3;

                let finalPosition = { ...position };

                if (position.x < threshold) {
                    finalPosition.x = 16;
                } else if (position.x > viewportWidth - threshold) {
                    finalPosition.x = viewportWidth - fabSize - 16;
                }

                setPosition(finalPosition);
                savePosition(finalPosition);
            }
            
            setHasMoved(false);
        }
    };

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setHasMoved(false);
        setStartPosition({ x: e.clientX, y: e.clientY });
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // Touch events - using a different approach
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setHasMoved(false);
        setStartPosition({ x: touch.clientX, y: touch.clientY });
        setDragStart({
            x: touch.clientX - position.x,
            y: touch.clientY - position.y
        });
    };

    // Global event handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            handleDragMove(e.clientX, e.clientY);
        };

        const handleMouseUp = () => {
            handleDragEnd();
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                e.preventDefault();
                const touch = e.touches[0];
                handleDragMove(touch.clientX, touch.clientY);
            }
        };

        const handleTouchEnd = () => {
            handleDragEnd();
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isDragging, dragStart, position, startPosition, hasMoved]);

    // Handle button click (only if not dragging)
    const handleButtonClick = (e: React.MouseEvent) => {
        // Only toggle menu if we didn't drag
        if (!hasMoved) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <>
            <div 
                ref={fabRef}
                className="md:hidden fixed z-50 flex flex-col items-center gap-4"
                style={{
                    left: `${position.x}px`,
                    bottom: `${position.y}px`,
                    transition: isDragging ? 'none' : 'left 0.3s ease, bottom 0.3s ease',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
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

                {/* Toggle Button - Draggable */}
                <div
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-all duration-300 relative overflow-hidden holographic text-white border-0 select-none drag-hint flex items-center justify-center cursor-pointer",
                        isOpen ? "rotate-90 scale-110" : "hover:scale-105",
                        isDragging ? "scale-110 shadow-2xl" : ""
                    )}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onClick={handleButtonClick}
                    style={{
                        touchAction: 'none',
                        userSelect: 'none'
                    }}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    
                    {/* Drag indicator dots - only show when not open */}
                    {!isOpen && (
                        <div className="absolute bottom-1 right-1 opacity-30">
                            <div className="grid grid-cols-2 gap-0.5">
                                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                                <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                            </div>
                        </div>
                    )}
                </div>
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
