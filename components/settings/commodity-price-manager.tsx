"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp, Calendar, Coins } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type CommodityPrice = {
    id: string;
    organization_id: string;
    category: string;
    rate_per_unit: number;
    unit: string;
    effective_date: string;
    created_at: string;
};

// Common commodities list - in a real app this might come from a settings table or items list
const COMMON_COMMODITIES = [
    "Gold 24K",
    "Gold 22K",
    "Silver",
    "Platinum",
    "Copper",
];

export function CommodityPriceManager() {
    const { organizationId } = useOrganization();
    const [prices, setPrices] = useState<CommodityPrice[]>([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        category: "",
        rate_per_unit: "",
        unit: "gram",
        effective_date: new Date().toISOString().split('T')[0],
    });

    // Create a fresh Supabase client to avoid caching issues
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (organizationId) {
            fetchPrices();
        }
    }, [organizationId]);

    const fetchPrices = async () => {
        console.log("Fetching prices for organization:", organizationId);
        
        try {
            const { data, error } = await supabase
                .from("daily_rates")
                .select("*")
                .eq("organization_id", organizationId)
                .order("effective_date", { ascending: false })
                .order("created_at", { ascending: false });

            console.log("Fetch result:", { data, error, organizationId });

            if (error) {
                console.error("Error fetching daily rates:", error);
                toast.error(`Failed to load rates: ${error.message}`);
                setPrices([]);
            } else {
                console.log("Setting prices:", data);
                setPrices(data || []);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load commodity rates");
            setPrices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.category || !formData.rate_per_unit || !formData.effective_date) {
            toast.error("Please fill in all fields");
            return;
        }

        const rateValue = parseFloat(formData.rate_per_unit);
        if (isNaN(rateValue) || rateValue <= 0) {
            toast.error("Please enter a valid rate");
            return;
        }

        console.log("Saving with organization ID:", organizationId);
        console.log("Form data:", formData);

        try {
            const insertData = {
                organization_id: organizationId,
                category: formData.category,
                rate_per_unit: rateValue,
                unit: formData.unit,
                effective_date: formData.effective_date,
            };
            
            console.log("Insert data:", insertData);

            const { data, error } = await supabase
                .from("daily_rates")
                .insert(insertData);

            console.log("Insert result:", { data, error });

            if (error) {
                console.error("Database error:", error);
                toast.error(`Failed to save: ${error.message}`);
                return;
            }

            // Success - refresh the data
            await fetchPrices();
            toast.success("Commodity rate updated successfully");
            
            // Reset form but keep date and unit
            setFormData(prev => ({ ...prev, category: "", rate_per_unit: "" }));
            
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save rate - please check console for details");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("daily_rates")
                .delete()
                .eq("id", id);

            if (error) {
                toast.error(`Failed to delete: ${error.message}`);
                return;
            }

            await fetchPrices();
            toast.success("Rate record deleted");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete rate record");
        }
    };

    const getLatestPrices = () => {
        // Group by category and get latest date
        const latestMap = new Map<string, CommodityPrice>();
        prices.forEach(p => {
            if (!latestMap.has(p.category) || new Date(p.effective_date) > new Date(latestMap.get(p.category)!.effective_date)) {
                latestMap.set(p.category, p);
            }
        });
        return Array.from(latestMap.values());
    };

    const latestPrices = getLatestPrices();

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Input Form */}
                <Card className="md:col-span-1 glass border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Coins className="h-5 w-5 text-yellow-500" />
                            Set Daily Price
                        </CardTitle>
                        <CardDescription>
                            Update commodity rates for the day
                        </CardDescription>
                        <div className="text-xs text-muted-foreground mt-2">
                            Org ID: {organizationId} | Records: {prices.length}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={formData.effective_date}
                                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Commodity</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select commodity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMMON_COMMODITIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                    <SelectItem value="custom">+ Custom Commodity</SelectItem>
                                </SelectContent>
                            </Select>
                            {formData.category === 'custom' && (
                                <Input
                                    placeholder="Enter commodity name"
                                    className="mt-2"
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <Select
                                value={formData.unit}
                                onValueChange={(val) => setFormData({ ...formData, unit: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gram">Gram</SelectItem>
                                    <SelectItem value="kg">Kilogram</SelectItem>
                                    <SelectItem value="tola">Tola</SelectItem>
                                    <SelectItem value="ounce">Ounce</SelectItem>
                                    <SelectItem value="piece">Piece</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Rate (per {formData.unit})</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.rate_per_unit}
                                    onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
                                    className="pl-8"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Base rate for calculations
                            </p>
                        </div>

                        <Button onClick={handleSave} className="w-full holographic text-white mt-4">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Update Rate
                        </Button>
                    </CardContent>
                </Card>

                {/* Latest Rates Display */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {latestPrices.map(p => (
                            <Card key={p.id} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-0 shadow-md">
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <p className="text-sm font-medium text-muted-foreground">{p.category}</p>
                                    <p className="text-2xl font-bold text-foreground my-1">₹{p.rate_per_unit.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">
                                        per {p.unit} • {new Date(p.effective_date).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                        {latestPrices.length === 0 && (
                            <div className="col-span-full flex items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                                No rates set yet
                            </div>
                        )}
                    </div>

                    {/* History Table */}
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Rate History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[300px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Commodity</TableHead>
                                            <TableHead>Rate</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {prices.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>{new Date(record.effective_date).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{record.category}</TableCell>
                                                <TableCell>₹{record.rate_per_unit.toLocaleString()}</TableCell>
                                                <TableCell>{record.unit}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(record.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {prices.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                    No history available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
