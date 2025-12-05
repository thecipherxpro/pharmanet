import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { createPageUrl } from "@/utils";
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  DollarSign,
  AlertTriangle,
  Info,
  Receipt,
  TrendingUp,
  Calendar,
  Building2,
  CheckCircle,
  Edit
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import AddCardForm from "../components/wallet/AddCardForm";
import { useToast } from "@/components/ui/use-toast";
import { useWalletBanner } from "../components/wallet/WalletBanner";

function SimpleCard({ card, isDefault, onSetDefault, onDelete }) {
  const brandColor = {
    visa: 'border-blue-300 bg-blue-50',
    mastercard: 'border-orange-300 bg-orange-50',
    amex: 'border-teal-300 bg-teal-50',
  }[card.brand.toLowerCase()] || 'border-gray-300 bg-gray-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`border-2 ${brandColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                <CreditCard className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900 uppercase">{card.brand}</div>
                <div className="text-xs text-gray-600">•••• {card.last4}</div>
              </div>
            </div>
            {isDefault && (
              <Badge className="bg-teal-100 text-teal-700 border-teal-300 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Default
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <span>Expires {String(card.exp_month).padStart(2, '0')}/{card.exp_year}</span>
          </div>

          <div className="flex gap-2">
            {!isDefault && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => onSetDefault(card.id)}
              >
                Set Default
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
              onClick={() => onDelete(card.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PaymentsTab({ onBannerMessage }) {
  const [user, setUser] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      console.log('Pharmacist user loaded:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error loading pharmacist user:', error);
    }
  };

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['pharmacistWalletCards', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.log('No pharmacist email available');
        return [];
      }
      try {
        console.log('Fetching cards for pharmacist email:', user.email);
        const cards = await base44.entities.WalletCard.filter({});
        console.log('Pharmacist cards fetched successfully:', cards);
        return cards || [];
      } catch (error) {
        console.error('Error fetching pharmacist cards:', error);
        throw error;
      }
    },
    enabled: !!user?.email,
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => base44.entities.WalletCard.delete(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacistWalletCards']);
      toast({ title: "✓ Card Removed", description: "Payment card removed successfully" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to Remove Card",
        description: error.message || "Please try again."
      });
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (cardId) => {
      const response = await base44.functions.invoke('walletSetDefaultCard', { cardId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacistWalletCards']);
      toast({ title: "✓ Default Updated", description: "Default payment card updated" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to Update",
        description: error.message || "Please try again."
      });
    }
  });

  const handleCardAdded = () => {
    queryClient.invalidateQueries(['pharmacistWalletCards']);
    setShowAddCard(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(2).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Cancellation Policy</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                Your default card is charged if you cancel a shift with less than 5 days notice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => setShowAddCard(true)}
        variant="outline"
        className="w-full h-11 border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Payment Card
      </Button>

      {cards.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No Payment Cards</h3>
            <p className="text-sm text-gray-600">
              Add a card for cancellation fees
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {cards.map((card) => (
              <SimpleCard
                key={card.id}
                card={card}
                isDefault={card.is_default}
                onSetDefault={setDefaultMutation.mutate}
                onDelete={deleteCardMutation.mutate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Sheet open={showAddCard} onOpenChange={setShowAddCard}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Add Payment Card</SheetTitle>
            <SheetDescription>
              Required for cancellation fees
            </SheetDescription>
          </SheetHeader>
          {showAddCard && (
            <AddCardForm
              onSuccess={handleCardAdded}
              onCancel={() => setShowAddCard(false)}
              onBannerMessage={onBannerMessage}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PenaltiesTab() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: cancellations = [], isLoading } = useQuery({
    queryKey: ['pharmacistCancellations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.ShiftCancellation.filter(
        { pharmacist_id: user.id },
        '-cancelled_at'
      );
    },
    enabled: !!user?.id,
  });

  const totalPenalties = cancellations.reduce((sum, c) => sum + (c.penalty_total || 0), 0);
  const chargedPenalties = cancellations.filter(c => c.status === 'charged');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Penalties</div>
              <div className="text-3xl font-bold text-red-600">${totalPenalties.toFixed(2)}</div>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{cancellations.length} cancellations</span>
            <span className="text-gray-600">{chargedPenalties.length} charged</span>
          </div>
        </CardContent>
      </Card>

      {cancellations.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No Penalties</h3>
            <p className="text-sm text-gray-600">
              Great! You haven't incurred any cancellation fees
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {cancellations.map((cancellation) => (
            <Card key={cancellation.id} className="border-l-4 border-red-500">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900">
                      {cancellation.pharmacy_name || 'Shift Cancellation'}
                    </h3>
                    {cancellation.shift_date && (
                      <p className="text-xs text-gray-600">
                        {format(new Date(cancellation.shift_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      -${cancellation.penalty_total.toFixed(2)}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {cancellation.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Cancelled {cancellation.hours_before_start?.toFixed(1)}h before shift
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PayrollTab() {
  const [user, setUser] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditPreference, setShowEditPreference] = useState(false);
  const [formData, setFormData] = useState({
    method: 'Direct Deposit',
    legal_first_name: '',
    legal_last_name: '',
    bank_name: '',
    institution_number: '',
    transit_number: '',
    account_number: '',
    etransfer_email: '',
    auto_deposit_enabled: false,
    security_question: '',
    security_answer: ''
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
  
  const handleCardAdded = () => {
    setShowAddCard(false);
    toast({ title: "✓ Card Added", description: "Payment card added successfully" });
  };

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['pharmacistInvoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.PayrollInvoice.filter(
        { pharmacist_id: user.id },
        '-created_date'
      );
    },
    enabled: !!user?.id,
  });

  const { data: payrollPreference, isLoading: prefLoading } = useQuery({
    queryKey: ['pharmacistPayrollPref', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Use backend function to get data via service role
      const response = await base44.functions.invoke('getPharmacistOwnProfile', {});
      return response.data?.payroll || null;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (payrollPreference) {
      setFormData({
        method: payrollPreference.method || 'Direct Deposit',
        legal_first_name: payrollPreference.legal_first_name || '',
        legal_last_name: payrollPreference.legal_last_name || '',
        bank_name: payrollPreference.bank_name || '',
        institution_number: payrollPreference.institution_number || '',
        transit_number: payrollPreference.transit_number || '',
        account_number: payrollPreference.account_number || '',
        etransfer_email: payrollPreference.etransfer_email || '',
        auto_deposit_enabled: payrollPreference.auto_deposit_enabled || false,
        security_question: payrollPreference.security_question || '',
        security_answer: payrollPreference.security_answer || ''
      });
    }
  }, [payrollPreference]);

  const savePreferenceMutation = useMutation({
    mutationFn: async (data) => {
      // Use backend function to save via service role
      const response = await base44.functions.invoke('payrollSavePreference', {
        user_id: user.id,
        ...data
      });
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pharmacistPayrollPref']);
      setShowEditPreference(false);
      toast({ title: "✓ Saved", description: "Payroll preference updated successfully" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: error.message || "Please try again."
      });
    }
  });

  const handleSavePreference = () => {
    if (!formData.legal_first_name || !formData.legal_last_name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your legal name"
      });
      return;
    }

    if (formData.method === 'Direct Deposit') {
      if (!formData.bank_name || !formData.institution_number || !formData.transit_number || !formData.account_number) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all bank details"
        });
        return;
      }
    } else if (formData.method === 'Bank E-Transfer') {
      if (!formData.etransfer_email) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter your e-transfer email"
        });
        return;
      }
      if (!formData.auto_deposit_enabled && (!formData.security_question || !formData.security_answer)) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please set security question/answer or enable auto-deposit"
        });
        return;
      }
    }

    savePreferenceMutation.mutate(formData);
  };

  const totalEarnings = invoices.reduce((sum, inv) => sum + (inv.net_amount || 0), 0);

  if (invoicesLoading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Earnings</div>
              <div className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">{invoices.length} invoices</div>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {!payrollPreference && !showEditPreference && (
        <Card className="bg-amber-50 border-2 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">Setup Required</h3>
                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                  Configure your payment method to receive payroll
                </p>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 h-9 text-xs"
                  onClick={() => setShowEditPreference(true)}
                >
                  Setup Payroll
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {payrollPreference && !showEditPreference && (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-900">Payment Method</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowEditPreference(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-900">{payrollPreference.method}</span>
              </div>
              <p className="text-xs text-gray-600">
                {payrollPreference.legal_first_name} {payrollPreference.legal_last_name}
              </p>
              {payrollPreference.method === 'Direct Deposit' && payrollPreference.bank_name && (
                <p className="text-xs text-gray-500 mt-1">{payrollPreference.bank_name}</p>
              )}
              {payrollPreference.method === 'Bank E-Transfer' && payrollPreference.etransfer_email && (
                <p className="text-xs text-gray-500 mt-1">{payrollPreference.etransfer_email}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showEditPreference && (
        <Card className="border-2 border-teal-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-4">
              {payrollPreference ? 'Edit Payment Method' : 'Setup Payment Method'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={formData.method} onValueChange={(val) => setFormData({...formData, method: val})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                    <SelectItem value="Bank E-Transfer">Bank E-Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Legal First Name</Label>
                  <Input
                    value={formData.legal_first_name}
                    onChange={(e) => setFormData({...formData, legal_first_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Legal Last Name</Label>
                  <Input
                    value={formData.legal_last_name}
                    onChange={(e) => setFormData({...formData, legal_last_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              {formData.method === 'Direct Deposit' && (
                <>
                  <div>
                    <Label className="text-xs">Bank Name</Label>
                    <Input
                      value={formData.bank_name}
                      onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Institution #</Label>
                      <Input
                        value={formData.institution_number}
                        onChange={(e) => setFormData({...formData, institution_number: e.target.value})}
                        placeholder="001"
                        maxLength={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Transit #</Label>
                      <Input
                        value={formData.transit_number}
                        onChange={(e) => setFormData({...formData, transit_number: e.target.value})}
                        placeholder="12345"
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Account #</Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.method === 'Bank E-Transfer' && (
                <>
                  <div>
                    <Label className="text-xs">E-Transfer Email</Label>
                    <Input
                      type="email"
                      value={formData.etransfer_email}
                      onChange={(e) => setFormData({...formData, etransfer_email: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="auto_deposit"
                      checked={formData.auto_deposit_enabled}
                      onChange={(e) => setFormData({...formData, auto_deposit_enabled: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="auto_deposit" className="text-xs cursor-pointer">
                      Auto-deposit enabled
                    </Label>
                  </div>
                  {!formData.auto_deposit_enabled && (
                    <>
                      <div>
                        <Label className="text-xs">Security Question</Label>
                        <Input
                          value={formData.security_question}
                          onChange={(e) => setFormData({...formData, security_question: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Security Answer</Label>
                        <Input
                          value={formData.security_answer}
                          onChange={(e) => setFormData({...formData, security_answer: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditPreference(false)}
                  disabled={savePreferenceMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={handleSavePreference}
                  disabled={savePreferenceMutation.isPending}
                >
                  {savePreferenceMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {invoices.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No Invoices Yet</h3>
            <p className="text-sm text-gray-600">
              Complete shifts to receive payment
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <h3 className="font-semibold text-gray-900 text-sm">Recent Invoices</h3>
          <div className="space-y-2">
            {invoices.slice(0, 10).map((invoice) => (
              <Card key={invoice.id} className="border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Receipt className="w-3.5 h-3.5 text-gray-600" />
                        <span className="font-medium text-sm text-gray-900">
                          Invoice #{invoice.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {format(new Date(invoice.created_date), 'MMM d, yyyy')}
                      </p>
                      {invoice.sent_to_pharmacist && (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs mt-1">
                          Sent
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${invoice.net_amount.toFixed(2)}
                      </div>
                      {invoice.include_deductions && (
                        <p className="text-xs text-gray-500">
                          After deductions
                        </p>
                      )}
                    </div>
                  </div>
                  {invoice.pdf_url && (
                    <a
                      href={invoice.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View PDF
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Sheet open={showAddCard} onOpenChange={setShowAddCard}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Add Payment Card</SheetTitle>
            <SheetDescription>
              Required for cancellation fees
            </SheetDescription>
          </SheetHeader>
          {showAddCard && (
            <AddCardForm
              onSuccess={handleCardAdded}
              onCancel={() => setShowAddCard(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PharmacistWalletContent() {
  const { banner, showSuccess, showError, showWarning, showInfo } = useWalletBanner();

  const handleBannerMessage = (message, type) => {
    if (type === 'success') showSuccess(message);
    else if (type === 'error') showError(message);
    else if (type === 'warning') showWarning(message);
    else showInfo(message);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {banner}
      
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500 mt-1">Manage cards, penalties & payroll</p>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="bg-white border border-gray-200 p-1 mb-6 inline-flex rounded-lg">
              <TabsTrigger value="payments" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                Cards
              </TabsTrigger>
              <TabsTrigger value="penalties" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                Penalties
              </TabsTrigger>
              <TabsTrigger value="payroll" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                Payroll
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="mt-0">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <PaymentsTab onBannerMessage={handleBannerMessage} />
                </div>
                <div>
                  <Card className="bg-amber-50 border-amber-200 sticky top-24">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900 mb-2">Cancellation Policy</h3>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            Your card is charged if you cancel a shift with less than 5 days notice. Always give employers adequate notice.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="penalties" className="mt-0">
              <div className="max-w-4xl">
                <PenaltiesTab />
              </div>
            </TabsContent>

            <TabsContent value="payroll" className="mt-0">
              <div className="max-w-4xl">
                <PayrollTab />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Wallet</h1>
        <p className="text-sm text-gray-600">Manage cards, penalties & payroll</p>
      </div>

      <div className="px-4 py-4">
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border border-gray-200">
            <TabsTrigger value="payments" className="text-sm">Cards</TabsTrigger>
            <TabsTrigger value="penalties" className="text-sm">Penalties</TabsTrigger>
            <TabsTrigger value="payroll" className="text-sm">Payroll</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="payments" className="mt-0">
              <PaymentsTab onBannerMessage={handleBannerMessage} />
            </TabsContent>

            <TabsContent value="penalties" className="mt-0">
              <PenaltiesTab />
            </TabsContent>

            <TabsContent value="payroll" className="mt-0">
              <PayrollTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      </div>
    </div>
  );
}

export default function PharmacistWallet() {
  return (
    <PharmacistOnly>
      <PharmacistWalletContent />
    </PharmacistOnly>
  );
}