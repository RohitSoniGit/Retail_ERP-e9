"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/lib/context/organization";
import { CommodityPriceManager } from "@/components/settings/commodity-price-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CommoditiesPage() {
  const { organization, loading } = useOrganization();
  const router = useRouter();

  useEffect(() => {
    // Redirect if commodity features are not enabled
    if (!loading && organization && !organization.settings?.enable_commodity_features) {
      router.push("/settings");
    }
  }, [organization, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization?.settings?.enable_commodity_features) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Commodity Features Disabled</h2>
          <p className="text-muted-foreground mb-6">
            Enable commodity features in settings to access this page.
          </p>
          <Link href="/settings">
            <Button>Go to Settings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Commodity Management</h1>
          <p className="text-muted-foreground">
            Manage daily commodity rates for gold, silver, and other precious metals
          </p>
        </div>
      </div>

      {/* Commodity Price Manager */}
      <Card className="glass border-0 shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl holographic">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl gradient-text">Daily Commodity Rates</CardTitle>
              <CardDescription className="text-base">
                Set and manage daily rates for commodities used in your business
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CommodityPriceManager />
        </CardContent>
      </Card>
    </div>
  );
}