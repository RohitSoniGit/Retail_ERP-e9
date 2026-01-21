"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/lib/context/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Settings,
  Building2,
  Sparkles,
  Save,
  RefreshCw,
  Shield,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

// Floating icons for background
function FloatingIcons() {
  const [icons, setIcons] = useState<Array<{ id: number; x: number; y: number; delay: number; icon: any; size: string }>>([]);

  useEffect(() => {
    const iconList = [Sparkles, Settings, Building2];
    const newIcons = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 8,
      icon: iconList[Math.floor(Math.random() * iconList.length)],
      size: Math.random() > 0.5 ? 'w-3 h-3' : 'w-4 h-4',
    }));
    setIcons(newIcons);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {icons.map((icon) => {
        const Icon = icon.icon;
        return (
          <Icon
            key={icon.id}
            className={`absolute ${icon.size} text-blue-400/10 dark:text-purple-400/10 float`}
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              animationDelay: `${icon.delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { organization, updateOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gstin: "",
    address: "",
    phone: "",
    currency: "INR",
    taxRate: 18,
  });

  useEffect(() => {
    setMounted(true);
    if (organization) {
      setFormData({
        name: organization.name || "",
        gstin: organization.gstin || "",
        address: organization.address || "",
        phone: organization.phone || "",
        // Handle nested settings safely
        currency: organization.settings?.currency || "INR",
        taxRate: organization.settings?.default_gst_rate || 18,
      });
    }
  }, [organization]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Map back to the structure expected by updateOrganization 
      // Note: This matches the partial structure usually expected.
      // We might need to adjust based on how updateOrganization is implemented in context.
      // Assuming it accepts partial<Organization> which typically includes settings jsonb
      await updateOrganization({
        name: formData.name,
        gstin: formData.gstin,
        address: formData.address,
        phone: formData.phone,
        settings: {
          ...organization?.settings,
          currency: formData.currency,
          default_gst_rate: formData.taxRate,
          tax_inclusive: organization?.settings?.tax_inclusive || false,
          thermal_printer_width: organization?.settings?.thermal_printer_width || 80,
          invoice_prefix: organization?.settings?.invoice_prefix || "INV",
          low_stock_threshold: organization?.settings?.low_stock_threshold || 5
        }
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        gstin: organization.gstin || "",
        address: organization.address || "",
        phone: organization.phone || "",
        currency: organization.settings?.currency || "INR",
        taxRate: organization.settings?.default_gst_rate || 18,
      });
      toast.info("Settings reset to original values");
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Icons */}
      <FloatingIcons />

      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 via-purple-50 to-emerald-50 dark:from-slate-950 dark:via-blue-950 dark:via-purple-950 dark:to-slate-950"
        style={{ backgroundSize: '400% 400%', animation: 'gradient-shift 15s ease infinite' }} />

      <div className="relative z-10 w-full p-6 space-y-8">

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Configuration Panel */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="glass border-0 shadow-2xl hover-lift stagger-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-emerald-500/5" />
              <CardHeader className="pb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl holographic">
                    <Building2 className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl gradient-text">Enterprise Configuration</CardTitle>
                    <CardDescription className="text-base">
                      Configure your business identity and operational parameters
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Company Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your empire name"
                      className="glass border-0 shadow-lg h-12 text-lg font-semibold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="gstin" className="text-sm font-bold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      GSTIN
                    </Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      placeholder="Enter GST identification"
                      className="glass border-0 shadow-lg h-12 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="address" className="text-sm font-bold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-500" />
                    Business Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your business headquarters"
                    className="glass border-0 shadow-lg h-12"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-bold">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Contact number"
                      className="glass border-0 shadow-lg h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="currency" className="text-sm font-bold">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      placeholder="INR"
                      className="glass border-0 shadow-lg h-12 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="taxRate" className="text-sm font-bold">Default Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    placeholder="18"
                    className="glass border-0 shadow-lg h-12 font-bold"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="holographic text-white border-0 shadow-lg px-8 py-3 text-lg font-bold hover-glow"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Save Configuration
                  </Button>
                  <Button variant="outline" onClick={handleReset} className="glass border-0 shadow-lg px-6 py-3">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="glass border-0 shadow-2xl hover-lift stagger-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl holographic">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg gradient-text">System Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="flex items-center justify-between p-4 rounded-2xl glass">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle theme
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}