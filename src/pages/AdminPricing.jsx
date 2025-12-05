import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Save, 
  RefreshCw,
  BarChart3,
  Settings,
  AlertCircle
} from "lucide-react";
import { AdminOnly } from "../components/auth/RouteProtection";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

function AdminPricingContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedRates, setEditedRates] = useState({});

  // Initialize pricing config if needed
  const initMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('initializePricingConfig');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingConfig'] });
      queryClient.invalidateQueries({ queryKey: ['pricingAnalysis'] });
    }
  });

  // Fetch pricing config
  const { data: pricingConfig = [], isLoading: configLoading } = useQuery({
    queryKey: ['pricingConfig'],
    queryFn: async () => {
      const configs = (await base44.entities.PricingConfig.list()) || [];
      return configs.sort((a, b) => b.base_rate - a.base_rate);
    },
    onSuccess: (data) => {
      // Initialize edited rates
      const rates = {};
      data.forEach(config => {
        rates[config.id] = config.base_rate;
      });
      setEditedRates(rates);
    }
  });

  // Fetch pricing analysis
  const { data: analysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['pricingAnalysis'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzePricingData');
      return response.data;
    },
    enabled: pricingConfig.length > 0
  });

  // Update pricing mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates = pricingConfig.map(config => ({
        id: config.id,
        base_rate: editedRates[config.id] || config.base_rate,
        label: config.label,
        description: config.description,
        is_active: config.is_active
      }));

      const response = await base44.functions.invoke('updatePricingConfig', {
        pricingUpdates: updates
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingConfig'] });
      refetchAnalysis();
      toast({
        title: "✓ Pricing Updated",
        description: "Changes saved successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update pricing",
      });
    }
  });

  const handleRateChange = (configId, newRate) => {
    setEditedRates(prev => ({
      ...prev,
      [configId]: parseFloat(newRate) || 0
    }));
  };

  const hasChanges = () => {
    return pricingConfig.some(config => 
      editedRates[config.id] !== config.base_rate
    );
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // If no pricing configs exist, show initialization prompt
  if (pricingConfig.length === 0 && !initMutation.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Initialize Pricing System</h2>
            <p className="text-sm text-gray-600 mb-6">
              Set up default pricing tiers based on shift urgency levels.
            </p>
            <Button
              onClick={() => initMutation.mutate()}
              disabled={initMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {initMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Initializing...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Initialize Pricing
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Pricing</h1>
            <p className="text-xs text-zinc-500">Shift rate configuration</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="bg-zinc-100 border border-zinc-200 p-1 h-10 mb-6">
            <TabsTrigger value="config" className="flex items-center gap-2 text-xs px-3">
              <Settings className="w-3.5 h-3.5" />
              Config
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs px-3">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            {/* Save Banner */}
            {hasChanges() && (
              <Card className="border-2 border-zinc-900 bg-zinc-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">Unsaved changes</p>
                  <Button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="bg-zinc-900 hover:bg-zinc-800 h-9 text-xs"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pricing Tiers */}
            <div className="grid gap-4">
              {pricingConfig.map(config => (
                <Card key={config.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={config.color}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {config.min_days_ahead}-{config.max_days_ahead === 9999 ? '30+' : config.max_days_ahead} days ahead
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {config.description}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-xs">
                            <Label htmlFor={`rate-${config.id}`} className="text-xs mb-1 block">
                              Hourly Rate (CAD)
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                id={`rate-${config.id}`}
                                type="number"
                                step="0.50"
                                min="50"
                                max="150"
                                value={editedRates[config.id] || config.base_rate}
                                onChange={(e) => handleRateChange(config.id, e.target.value)}
                                className="pl-8 h-10"
                              />
                            </div>
                          </div>

                          {analysis?.tier_usage && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Usage</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900">
                                  {analysis.tier_usage.find(t => t.urgency_level === config.urgency_level)?.usage_percentage || '0'}%
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({analysis.tier_usage.find(t => t.urgency_level === config.urgency_level)?.shift_count || 0} shifts)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {analysisLoading ? (
              <div className="grid gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : analysis ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Shifts</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analysis.summary.total_shifts}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Avg Rate</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${analysis.summary.average_rate}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${parseFloat(analysis.summary.total_revenue).toLocaleString()}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rate Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rate Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analysis.rate_distribution).map(([range, count]) => {
                        const total = analysis.summary.total_shifts;
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        
                        return (
                          <div key={range}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{range}</span>
                              <span className="text-sm text-gray-600">
                                {count} shifts ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Tier Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Urgency Tier Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.tier_usage.map(tier => (
                        <div key={tier.urgency_level}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">{tier.label}</span>
                              <Badge variant="outline" className="text-xs">
                                ${tier.base_rate}/hr
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-600">
                              {tier.shift_count} shifts ({tier.usage_percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all"
                              style={{ width: `${tier.usage_percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => refetchAnalysis()}
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminPricing() {
  return (
    <AdminOnly>
      <AdminPricingContent />
    </AdminOnly>
  );
}