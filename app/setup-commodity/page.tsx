"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SetupCommodityPage() {
  const [commodities, setCommodities] = useState([
    { id: 1, name: "Gold", unit: "grams", currentRate: 0 },
    { id: 2, name: "Silver", unit: "grams", currentRate: 0 },
  ]);

  const [newCommodity, setNewCommodity] = useState({
    name: "",
    unit: "",
    currentRate: 0,
  });

  const handleAddCommodity = () => {
    if (newCommodity.name && newCommodity.unit) {
      setCommodities([
        ...commodities,
        {
          id: Date.now(),
          ...newCommodity,
        },
      ]);
      setNewCommodity({ name: "", unit: "", currentRate: 0 });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Commodity Setup</h1>
          <p className="text-muted-foreground">
            Configure commodity types and their current market rates
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add New Commodity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Add New Commodity
            </CardTitle>
            <CardDescription>
              Set up a new commodity type for tracking rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commodity-name">Commodity Name</Label>
              <Input
                id="commodity-name"
                placeholder="e.g., Gold, Silver, Platinum"
                value={newCommodity.name}
                onChange={(e) =>
                  setNewCommodity({ ...newCommodity, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commodity-unit">Unit</Label>
              <Input
                id="commodity-unit"
                placeholder="e.g., grams, ounces, kg"
                value={newCommodity.unit}
                onChange={(e) =>
                  setNewCommodity({ ...newCommodity, unit: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commodity-rate">Current Rate</Label>
              <Input
                id="commodity-rate"
                type="number"
                placeholder="0.00"
                value={newCommodity.currentRate}
                onChange={(e) =>
                  setNewCommodity({
                    ...newCommodity,
                    currentRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <Button onClick={handleAddCommodity} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Add Commodity
            </Button>
          </CardContent>
        </Card>

        {/* Existing Commodities */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Commodities</CardTitle>
            <CardDescription>
              Currently tracked commodity types and rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commodities.map((commodity) => (
                <div
                  key={commodity.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{commodity.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Unit: {commodity.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      ₹{commodity.currentRate.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
              {commodities.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No commodities configured yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}