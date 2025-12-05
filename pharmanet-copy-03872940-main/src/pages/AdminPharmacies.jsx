import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Building2,
  Search,
  MapPin,
  Phone,
  Mail,
  Trash2,
  CheckCircle,
  XCircle,
  Monitor
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminOnly } from "../components/auth/RouteProtection";
import { motion, AnimatePresence } from "framer-motion";

function AdminPharmaciesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ['adminPharmacies'],
    queryFn: () => base44.entities.Pharmacy.list('-created_date'),
  });

  const deletePharmacyMutation = useMutation({
    mutationFn: (pharmacyId) => base44.entities.Pharmacy.delete(pharmacyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPharmacies']);
      toast({
        title: "Pharmacy Deleted",
        description: "Pharmacy removed successfully",
      });
      setShowDetails(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete pharmacy",
      });
    }
  });

  const toggleActiveStatus = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.Pharmacy.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPharmacies']);
      toast({
        title: "Status Updated",
        description: "Pharmacy status updated successfully",
      });
      setShowDetails(false);
    }
  });

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesSearch = 
      pharmacy.pharmacy_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pharmacy.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pharmacy.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "active" && pharmacy.is_active !== false) ||
      (activeTab === "inactive" && pharmacy.is_active === false);

    return matchesSearch && matchesTab;
  });

  const stats = {
    all: pharmacies.length,
    active: pharmacies.filter(p => p.is_active !== false).length,
    inactive: pharmacies.filter(p => p.is_active === false).length
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Pharmacies</h1>
            <p className="text-xs text-zinc-500">
              {stats.all} total • {stats.active} active • {stats.inactive} inactive
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-[1600px] mx-auto mt-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pharmacies..."
              className="pl-9 bg-white border-zinc-200"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-zinc-100 border border-zinc-200 p-1 h-10 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="active" className="text-xs px-3">Active</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs px-3">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pharmacies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 font-medium">No pharmacies found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredPharmacies.map((pharmacy, i) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    setSelectedPharmacy(pharmacy);
                    setShowDetails(true);
                  }}
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-zinc-900 text-sm line-clamp-1">{pharmacy.pharmacy_name}</h3>
                      <Badge variant="outline" className={pharmacy.is_active !== false 
                        ? "bg-green-50 text-green-700 border-green-200 text-[10px] h-5" 
                        : "bg-zinc-100 text-zinc-600 border-zinc-200 text-[10px] h-5"}>
                        {pharmacy.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="mt-auto space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-zinc-600">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span className="truncate">{pharmacy.city}, {pharmacy.province || 'ON'}</span>
                      </div>
                      {pharmacy.phone && (
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <span>{pharmacy.phone}</span>
                        </div>
                      )}
                      {pharmacy.software && (
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <Monitor className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <span>{pharmacy.software}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedPharmacy && (
            <>
              <SheetHeader className="mb-6 border-b border-zinc-100 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-zinc-600" />
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-lg font-bold text-zinc-900 leading-tight mb-1">
                      {selectedPharmacy.pharmacy_name}
                    </SheetTitle>
                    <Badge variant="outline" className={selectedPharmacy.is_active !== false 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-zinc-100 text-zinc-600 border-zinc-200"}>
                      {selectedPharmacy.is_active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* Location */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Location</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Address</p>
                      <p className="text-sm font-medium">{selectedPharmacy.address}</p>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">City & Province</p>
                      <p className="text-sm font-medium">
                        {selectedPharmacy.city}, {selectedPharmacy.province || 'ON'} {selectedPharmacy.postal_code}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact</h4>
                  <div className="space-y-2">
                    {selectedPharmacy.phone && (
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                        <Phone className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-900">{selectedPharmacy.phone}</span>
                      </div>
                    )}
                    {selectedPharmacy.email && (
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                        <Mail className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-900">{selectedPharmacy.email}</span>
                      </div>
                    )}
                    {selectedPharmacy.manager_name && (
                      <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                        <p className="text-xs text-zinc-500 mb-1">Manager</p>
                        <p className="text-sm font-medium">{selectedPharmacy.manager_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Software */}
                {selectedPharmacy.software && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Software</h4>
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <Badge variant="outline" className="bg-white">{selectedPharmacy.software}</Badge>
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin Actions</h4>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => toggleActiveStatus.mutate({ 
                      id: selectedPharmacy.id, 
                      is_active: selectedPharmacy.is_active === false 
                    })}
                    disabled={toggleActiveStatus.isPending}
                  >
                    {selectedPharmacy.is_active !== false ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Deactivate Pharmacy
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activate Pharmacy
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    className="w-full justify-start bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                    onClick={() => {
                      if (confirm(`Delete ${selectedPharmacy.pharmacy_name}?`)) {
                        deletePharmacyMutation.mutate(selectedPharmacy.id);
                      }
                    }}
                    disabled={deletePharmacyMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Pharmacy
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminPharmacies() {
  return (
    <AdminOnly>
      <AdminPharmaciesContent />
    </AdminOnly>
  );
}