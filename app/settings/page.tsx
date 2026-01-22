"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/lib/context/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrintFormatManager } from "@/components/settings/print-format-manager";
import { CommodityPriceManager } from "@/components/settings/commodity-price-manager";
import { UserManagement } from "@/components/settings/user-management";
import {
  Settings,
  Building2,
  Users,
  Sparkles,
  Save,
  RefreshCw,
  Shield,
  Globe,
  Printer,
  FileText,
  TrendingUp,
  Bell,
  Mail,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Floating icons for background
function FloatingIcons() {
  const [icons, setIcons] = useState<Array<{ id: number; x: number; y: number; delay: number; icon: any; size: string }>>([]);

  useEffect(() => {
    const iconList = [Sparkles, Settings, Building2, TrendingUp];
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gstin: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    currency: "INR",
    taxRate: 18,
    invoicePrefix: "INV",
    lowStockThreshold: 5,
    thermalPrinterWidth: 80,
    taxInclusive: false,
    logoUrl: "",
  });

  useEffect(() => {
    setMounted(true);
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Error checking role:", error);
    } finally {
      setCheckingRole(false);
    }
  };

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        gstin: organization.gstin || "",
        address: organization.address || "",
        phone: organization.phone || "",
        email: organization.email || "",
        website: organization.website || "",
        currency: organization.settings?.currency || "INR",
        taxRate: organization.settings?.default_gst_rate || 18,
        invoicePrefix: organization.settings?.invoice_prefix || "INV",
        lowStockThreshold: organization.settings?.low_stock_threshold || 5,
        thermalPrinterWidth: organization.settings?.thermal_printer_width || 80,
        taxInclusive: organization.settings?.tax_inclusive || false,
        logoUrl: organization.logo_url || "",
      });
    }
  }, [organization]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateOrganization({
        name: formData.name,
        gstin: formData.gstin,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logo_url: formData.logoUrl,
        settings: {
          ...organization?.settings,
          currency: formData.currency,
          default_gst_rate: formData.taxRate,
          invoice_prefix: formData.invoicePrefix,
          low_stock_threshold: formData.lowStockThreshold,
          thermal_printer_width: formData.thermalPrinterWidth,
          tax_inclusive: formData.taxInclusive,
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
        email: organization.email || "",
        website: organization.website || "",
        currency: organization.settings?.currency || "INR",
        taxRate: organization.settings?.default_gst_rate || 18,
        invoicePrefix: organization.settings?.invoice_prefix || "INV",
        lowStockThreshold: organization.settings?.low_stock_threshold || 5,
        thermalPrinterWidth: organization.settings?.thermal_printer_width || 80,
        taxInclusive: organization.settings?.tax_inclusive || false,
        logoUrl: organization.logo_url || "",
      });
      toast.info("Settings reset to original values");
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, logoUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
      toast.success("Logo uploaded successfully!");
    }
  };

  const handleFactoryReset = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/reset-data", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("System reset successfully. All transactions cleared.");
        setResetConfirmOpen(false);
      } else {
        toast.error("Failed to reset system: " + data.error);
      }
    } catch (e) {
      toast.error("An error occurred during reset.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f9fa] dark:bg-slate-950">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You need administrator privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Icons */}
      <FloatingIcons />

      {/* Animated Background */}
      {/* Background - Offwhite */}
      <div className="fixed inset-0 bg-background" />

      <div className="relative z-10 w-full p-6 space-y-8">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 glass border-0 shadow-lg h-auto p-1 gap-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-lg flex items-center gap-2 rounded-lg py-2">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-lg flex items-center gap-2 rounded-lg py-2">
              <Users className="h-4 w-4" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="print-formats" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-lg flex items-center gap-2 rounded-lg py-2">
              <Printer className="h-4 w-4" />
              Print Formats
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-lg flex items-center gap-2 rounded-lg py-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="commodities" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-lg flex items-center gap-2 rounded-lg py-2">
              <TrendingUp className="h-4 w-4" />
              Commodities
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/20 data-[state=active]:backdrop-blur-lg flex items-center gap-2 rounded-lg py-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="danger-zone" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500 data-[state=active]:backdrop-blur-lg flex items-center gap-2 rounded-lg py-2 hover:bg-red-500/10">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-8">
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
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        Company Logo
                      </Label>
                      <div className="flex items-center gap-4">
                        {formData.logoUrl && (
                          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            <img
                              src={formData.logoUrl}
                              alt="Company Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="glass border-0 shadow-lg"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload your company logo (PNG, JPG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

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
                          placeholder="Enter your company name"
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
                        placeholder="Enter your business address"
                        className="glass border-0 shadow-lg h-12"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="text-sm font-bold">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Contact number"
                          className="glass border-0 shadow-lg h-12"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-sm font-bold">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="business@company.com"
                          className="glass border-0 shadow-lg h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="website" className="text-sm font-bold">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="www.company.com"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="space-y-3">
                        <Label htmlFor="invoicePrefix" className="text-sm font-bold">Invoice Prefix</Label>
                        <Input
                          id="invoicePrefix"
                          value={formData.invoicePrefix}
                          onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                          placeholder="INV"
                          className="glass border-0 shadow-lg h-12 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="lowStockThreshold" className="text-sm font-bold">Low Stock Threshold</Label>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          value={formData.lowStockThreshold}
                          onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                          placeholder="5"
                          className="glass border-0 shadow-lg h-12"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="thermalPrinterWidth" className="text-sm font-bold">Thermal Printer Width (mm)</Label>
                        <Input
                          id="thermalPrinterWidth"
                          type="number"
                          value={formData.thermalPrinterWidth}
                          onChange={(e) => setFormData({ ...formData, thermalPrinterWidth: Number(e.target.value) })}
                          placeholder="80"
                          className="glass border-0 shadow-lg h-12"
                        />
                      </div>
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
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="print-formats" className="space-y-8">
            <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-emerald-500/5" />
              <CardHeader className="pb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl holographic">
                    <Printer className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl gradient-text">Print Format Management</CardTitle>
                    <CardDescription className="text-base">
                      Design and customize print layouts for invoices, orders, and receipts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <PrintFormatManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-8">
            <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
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
          </TabsContent>

          <TabsContent value="commodities" className="space-y-8">
            <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5" />
              <CardHeader className="pb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl holographic">
                    <TrendingUp className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl gradient-text">Commodity Daily Rates</CardTitle>
                    <CardDescription className="text-base">
                      Set daily rates for commodities like Gold, Silver etc. to be used in calculations.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <CommodityPriceManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-8">
            <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-pink-500/5 to-purple-500/5" />
              <CardHeader className="pb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl holographic">
                    <Bell className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl gradient-text">Email & Notifications</CardTitle>
                    <CardDescription className="text-base">
                      Configure email settings for OTPs, invoices, and alerts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="senderEmail" className="text-sm font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-pink-500" />
                      Sender Email
                    </Label>
                    <Input
                      id="senderEmail"
                      placeholder="noreply@yourdomain.com"
                      className="glass border-0 shadow-lg h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email address to display in sent emails
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="smtpHost" className="text-sm font-bold">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      className="glass border-0 shadow-lg h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="smtpPort" className="text-sm font-bold">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      placeholder="587"
                      className="glass border-0 shadow-lg h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="smtpUser" className="text-sm font-bold">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      placeholder="Enter SMTP username"
                      className="glass border-0 shadow-lg h-12"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold">Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-4 rounded-xl glass">
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Email OTP for Login</p>
                        <p className="text-xs text-muted-foreground">Enable OTP verification for users</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-4 rounded-xl glass">
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Password Reset Emails</p>
                        <p className="text-xs text-muted-foreground">Allow users to reset password via email</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button className="holographic text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="danger-zone" className="space-y-8">
            <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden border-l-4 border-l-red-500">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5" />
              <CardHeader className="pb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 shadow-inner">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription className="text-base">
                      Destructive actions that cannot be undone. Please proceed with caution.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                  <div className="space-y-1">
                    <p className="font-bold text-lg text-red-600 dark:text-red-400">Factory Reset</p>
                    <p className="text-sm text-muted-foreground max-w-xl">
                      This action will permanently delete all transaction data including sales, purchases, inventory movements, vouchers, and logs. Settings, Users, and Master Data (Items, Customers) will be preserved.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="holographic-red shadow-lg"
                    onClick={() => setResetConfirmOpen(true)}
                  >
                    Reset All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
          <DialogContent className="glass border-0 shadow-2xl max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertTriangle className="h-6 w-6" />
                <DialogTitle className="text-xl">Confirm System Reset</DialogTitle>
              </div>
              <DialogDescription className="text-base text-foreground/80">
                Are you absolutely sure you want to proceed? This will wipe all transactional data from the system. This action <span className="font-bold text-red-500">cannot be undone</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={() => setResetConfirmOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleFactoryReset}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes, Wipe Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}