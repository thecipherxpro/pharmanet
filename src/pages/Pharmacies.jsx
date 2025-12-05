import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Plus, Building2, MapPin, Search, CheckCircle2, X, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PharmacyCard from "../components/pharmacy/PharmacyCard";
import { EmployerOnly } from "../components/auth/RouteProtection";
import BusinessHoursEditor from "../components/pharmacy/BusinessHoursEditor";

const DEFAULT_BUSINESS_HOURS = [
  { day: "monday", is_open: true, open_time: "09:00", close_time: "18:00" },
  { day: "tuesday", is_open: true, open_time: "09:00", close_time: "18:00" },
  { day: "wednesday", is_open: true, open_time: "09:00", close_time: "18:00" },
  { day: "thursday", is_open: true, open_time: "09:00", close_time: "18:00" },
  { day: "friday", is_open: true, open_time: "09:00", close_time: "18:00" },
  { day: "saturday", is_open: true, open_time: "09:00", close_time: "18:00" },
  { day: "sunday", is_open: false, open_time: "09:00", close_time: "18:00" },
];

const softwareOptions = [
  "Kroll",
  "Paperless Kroll",
  "Fillware",
  "PharmaClik",
  "Nexxsys",
  "Commander",
  "Assyst",
  "PrimeRx",
  "McKesson",
  "Other"
];

function PharmaciesContent() {
  const [user, setUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState({});
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [formData, setFormData] = useState({
    pharmacy_name: "",
    address: "",
    city: "",
    province: "ON",
    postal_code: "",
    phone: "",
    email: "",
    manager_name: "",
    software: "",
    is_active: true,
    business_hours: DEFAULT_BUSINESS_HOURS,
    default_shift_duration: 8
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ['myPharmacies', user?.email],
    queryFn: () => base44.entities.Pharmacy.filter({ created_by: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Pharmacy.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['myPharmacies'] });
      
      // Sync public profile after pharmacy added
      try {
        await base44.functions.invoke('syncPublicEmployerProfile');
      } catch (syncError) {
        console.error("Profile sync warning:", syncError);
      }

      setShowDialog(false);
      resetForm();
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
      toast({
        title: "Success",
        description: "Pharmacy added successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add pharmacy",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pharmacy.update(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['myPharmacies'] });
      
      // Sync public profile after pharmacy updated
      try {
        await base44.functions.invoke('syncPublicEmployerProfile');
      } catch (syncError) {
        console.error("Profile sync warning:", syncError);
      }

      setShowDialog(false);
      setEditingPharmacy(null);
      resetForm();
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
      toast({
        title: "Success",
        description: "Pharmacy updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Pharmacy.delete(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['myPharmacies'] });
      
      // Sync public profile after pharmacy deleted
      try {
        await base44.functions.invoke('syncPublicEmployerProfile');
      } catch (syncError) {
        console.error("Profile sync warning:", syncError);
      }

      toast({
        title: "Success",
        description: "Pharmacy deleted",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      pharmacy_name: "",
      address: "",
      city: "",
      province: "ON",
      postal_code: "",
      phone: "",
      email: "",
      manager_name: "",
      software: "",
      is_active: true,
      business_hours: DEFAULT_BUSINESS_HOURS,
      default_shift_duration: 8
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pharmacy_name || formData.pharmacy_name.trim().length < 2) {
      newErrors.pharmacy_name = "Pharmacy name is required (minimum 2 characters)";
    }

    if (!formData.address || formData.address.trim().length < 5) {
      newErrors.address = "Street address is required (minimum 5 characters)";
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = "City is required";
    }

    if (!formData.postal_code || !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(formData.postal_code)) {
      newErrors.postal_code = "Valid postal code required (e.g., M5V 3A8)";
    }

    if (!formData.phone || !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Valid 10-digit phone number required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email address required";
    }

    if (!formData.manager_name || formData.manager_name.trim().length < 2) {
      newErrors.manager_name = "Manager name is required (minimum 2 characters)";
    }

    if (!formData.software) {
      newErrors.software = "Pharmacy software selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (pharmacy) => {
    setEditingPharmacy(pharmacy);
    setFormData({
      ...pharmacy,
      business_hours: pharmacy.business_hours || DEFAULT_BUSINESS_HOURS,
      default_shift_duration: pharmacy.default_shift_duration || 8
    });
    setShowDialog(true);
  };

  const handleDelete = (pharmacy) => {
    if (window.confirm(`Delete ${pharmacy.pharmacy_name}?`)) {
      deleteMutation.mutate(pharmacy.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (editingPharmacy) {
      updateMutation.mutate({ id: editingPharmacy.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPharmacies = pharmacies.filter(p =>
    p.pharmacy_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="sticky top-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold text-sm">
                Pharmacy {editingPharmacy ? 'updated' : 'added'} successfully!
              </p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="text-white hover:text-green-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Pharmacies</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your pharmacy locations</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search pharmacies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 border-gray-200"
                  />
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setEditingPharmacy(null);
                    setShowDialog(true);
                  }}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  Add Pharmacy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-3xl font-bold text-gray-900">{pharmacies.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Total Locations</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-3xl font-bold text-green-600">{pharmacies.filter(p => p.is_active !== false).length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Active</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-3xl font-bold text-gray-900">{pharmacies.filter(p => p.is_active === false).length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Inactive</p>
            </div>
          </div>

          {/* Desktop Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredPharmacies.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-semibold mb-1">No pharmacies yet</p>
              <p className="text-gray-500 text-sm mb-4">Add your first pharmacy location</p>
              <button
                onClick={() => {
                  resetForm();
                  setEditingPharmacy(null);
                  setShowDialog(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Add Pharmacy
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPharmacies.map((pharmacy) => (
                <PharmacyCard
                  key={pharmacy.id}
                  pharmacy={pharmacy}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Professional Medical Header */}
      <div className="bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 text-white p-4 pb-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Pharmacies</h1>
            <p className="text-gray-200 text-sm">Manage your pharmacy locations</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingPharmacy(null);
              setShowDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{pharmacies.length}</p>
            <p className="text-xs text-gray-200">Total Locations</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold">{pharmacies.filter(p => p.is_active !== false).length}</p>
            <p className="text-xs text-gray-200">Active</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 -mt-4 mb-4">
        <div className="bg-white rounded-xl shadow-md p-3 border border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search pharmacies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Pharmacies Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">No pharmacies yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add your first pharmacy location
            </p>
            <button
              onClick={() => {
                resetForm();
                setEditingPharmacy(null);
                setShowDialog(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Pharmacy
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.id}
                pharmacy={pharmacy}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Sheet Drawer */}
      <Sheet open={showDialog} onOpenChange={setShowDialog}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <SheetTitle className="text-lg font-bold text-gray-900">
                {editingPharmacy ? "Edit Pharmacy" : "Add New Pharmacy"}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <form id="pharmacy-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pharmacy_name" className="text-sm font-medium text-gray-700">Pharmacy Name *</Label>
                  <Input
                    id="pharmacy_name"
                    value={formData.pharmacy_name}
                    onChange={(e) => {
                      setFormData({ ...formData, pharmacy_name: e.target.value });
                      if (errors.pharmacy_name) setErrors({ ...errors, pharmacy_name: null });
                    }}
                    placeholder="Shoppers Drug Mart"
                    className={`h-12 mt-1.5 ${errors.pharmacy_name ? 'border-red-500' : ''}`}
                  />
                  {errors.pharmacy_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.pharmacy_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: null });
                    }}
                    placeholder="123 Main St"
                    className={`h-12 mt-1.5 ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ ...formData, city: e.target.value });
                        if (errors.city) setErrors({ ...errors, city: null });
                      }}
                      placeholder="Toronto"
                      className={`h-12 mt-1.5 ${errors.city ? 'border-red-500' : ''}`}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className="text-sm font-medium text-gray-700">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => {
                        setFormData({ ...formData, postal_code: e.target.value.toUpperCase() });
                        if (errors.postal_code) setErrors({ ...errors, postal_code: null });
                      }}
                      placeholder="M5V 3A8"
                      maxLength={7}
                      className={`h-12 mt-1.5 ${errors.postal_code ? 'border-red-500' : ''}`}
                    />
                    {errors.postal_code && (
                      <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[0-9\s\-()]*$/.test(value)) {
                        setFormData({ ...formData, phone: value });
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }
                    }}
                    placeholder="(416) 555-0123"
                    maxLength={14}
                    className={`h-12 mt-1.5 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    placeholder="pharmacy@example.com"
                    className={`h-12 mt-1.5 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="manager_name" className="text-sm font-medium text-gray-700">Manager Name *</Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => {
                      setFormData({ ...formData, manager_name: e.target.value });
                      if (errors.manager_name) setErrors({ ...errors, manager_name: null });
                    }}
                    placeholder="John Smith"
                    className={`h-12 mt-1.5 ${errors.manager_name ? 'border-red-500' : ''}`}
                  />
                  {errors.manager_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.manager_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="software" className="text-sm font-medium text-gray-700">Pharmacy Software *</Label>
                  <Select
                    value={formData.software}
                    onValueChange={(value) => {
                      setFormData({ ...formData, software: value });
                      if (errors.software) setErrors({ ...errors, software: null });
                    }}
                  >
                    <SelectTrigger className={`h-12 mt-1.5 ${errors.software ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select software" />
                    </SelectTrigger>
                    <SelectContent className="z-[99999]">
                      {softwareOptions.map((software) => (
                        <SelectItem key={software} value={software}>
                          {software}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.software && (
                    <p className="text-xs text-red-600 mt-1">{errors.software}</p>
                  )}
                </div>

                {/* Business Hours Section */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <Label className="text-sm font-semibold text-gray-700">Business Hours</Label>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Set your pharmacy's operating hours. These will be used as defaults when creating shifts.
                  </p>
                  <BusinessHoursEditor
                    value={formData.business_hours}
                    onChange={(hours) => setFormData({ ...formData, business_hours: hours })}
                  />
                </div>

                {/* Default Shift Duration */}
                <div className="pt-4 border-t border-gray-200">
                  <Label htmlFor="default_shift_duration" className="text-sm font-medium text-gray-700">
                    Default Shift Duration (hours)
                  </Label>
                  <Select
                    value={String(formData.default_shift_duration || 8)}
                    onValueChange={(value) => setFormData({ ...formData, default_shift_duration: Number(value) })}
                  >
                    <SelectTrigger className="h-12 mt-1.5">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="z-[99999]">
                      {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((hrs) => (
                        <SelectItem key={hrs} value={String(hrs)}>
                          {hrs} hours
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </div>

            <SheetFooter className="px-4 py-4 border-t border-gray-100 bg-white sticky bottom-0">
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingPharmacy(null);
                    resetForm();
                  }}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="pharmacy-form"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    editingPharmacy ? "Update Pharmacy" : "Add Pharmacy"
                  )}
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}

export default function Pharmacies() {
  return (
    <EmployerOnly>
      <PharmaciesContent />
    </EmployerOnly>
  );
}