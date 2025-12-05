import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Info,
  Shield,
  Building2,
  Receipt,
  Clock,
  Star,
  AlertTriangle,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { EmployerOnly } from "../components/auth/RouteProtection";
import AddCardForm from "../components/wallet/AddCardForm";
import { useToast } from "@/components/ui/use-toast";
import LoadingScreen from "../components/shared/LoadingScreen";
import ErrorMessage from "../components/shared/ErrorMessage";
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

function PaymentCardsTab({ onBannerMessage }) {
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
      console.log('Employer user loaded for cards:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error loading employer user:', error);
    }
  };

  const { data: cards = [], isLoading, error: cardsError, refetch: refetchCards } = useQuery({
    queryKey: ['employerWalletCards', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.log('No email available');
        return [];
      }
      try {
        console.log('Fetching cards for email:', user.email);
        const cards = await base44.entities.WalletCard.filter({});
        console.log('Cards fetched successfully:', cards);
        return cards || [];
      } catch (error) {
        console.error('Error fetching cards:', error);
        throw error;
      }
    },
    enabled: !!user?.email,
    retry: 2
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => base44.entities.WalletCard.delete(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries(['employerWalletCards']);
      toast({
        title: "✓ Card Removed",
        description: "Payment card removed successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to Remove Card",
        description: error.message || "Please try again or contact support.",
      });
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (cardId) => {
      const response = await base44.functions.invoke('walletSetDefaultCard', { cardId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employerWalletCards']);
      toast({
        title: "✓ Default Updated",
        description: "Default payment card updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to Update Default",
        description: error.message || "Please try again.",
      });
    }
  });

  const handleCardAdded = () => {
    queryClient.invalidateQueries(['employerWalletCards']);
    setShowAddCard(false);
  };

  if (cardsError) {
    console.error('Cards error state:', cardsError);
    return (
      <ErrorMessage
        title="Failed to Load Cards"
        message={cardsError?.message || "We couldn't load your payment cards. Please try again."}
        onRetry={refetchCards}
        showRetry={true}
      />
    );
  }

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
      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Payment Cards</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                Your default card is charged $50 when you accept a pharmacist.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Card Button */}
      <Button
        onClick={() => setShowAddCard(true)}
        variant="outline"
        className="w-full h-11 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Payment Card
      </Button>

      {/* Cards List */}
      {cards.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No Payment Cards</h3>
            <p className="text-sm text-gray-600">
              Add a card to accept pharmacists
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

      {/* Add Card Sheet */}
      <Sheet open={showAddCard} onOpenChange={setShowAddCard}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Add Payment Card</SheetTitle>
            <SheetDescription>
              Securely add a card for platform fees
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

function PaymentsHistoryTab() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ['employerPayments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.EmployerPayment.filter(
        { employer_id: user.id },
        '-created_date'
      );
    },
    enabled: !!user?.id,
    retry: 2
  });

  const { data: earnings = [], isLoading: earningsLoading } = useQuery({
    queryKey: ['employerEarnings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const cancellations = await base44.entities.ShiftCancellation.filter(
        { employer_id: user.email },
        '-cancelled_at'
      );
      return cancellations.filter(c => c.penalty_employer_share > 0);
    },
    enabled: !!user?.email,
    retry: 2
  });

  const isLoading = paymentsLoading || earningsLoading;

  if (paymentsError) {
    return (
      <ErrorMessage
        title="Failed to Load Payment History"
        message="We couldn't load your payment history. Please try again."
        onRetry={refetchPayments}
        showRetry={true}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalEarned = earnings.reduce((sum, e) => sum + (e.penalty_employer_share || 0), 0);
  const netSpending = totalSpent - totalEarned;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-gray-700">Total Spent</span>
            </div>
            <div className="text-2xl font-bold text-red-600">${totalSpent.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">{payments.length} payments</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-700">Earned Back</span>
            </div>
            <div className="text-2xl font-bold text-green-600">${totalEarned.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">{earnings.length} penalties</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Net Spending</div>
              <div className="text-3xl font-bold text-gray-900">${netSpending.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">After penalty earnings</div>
            </div>
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings from Penalties */}
      {earnings.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Earnings from Penalties
          </h3>
          <div className="space-y-2">
            {earnings.map((earning) => (
              <Card key={earning.id} className="border-l-4 border-green-500">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900">
                          {earning.pharmacy_name || 'Cancellation Earnings'}
                        </h3>
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          Earned
                        </Badge>
                      </div>
                      {earning.shift_date && (
                        <p className="text-xs text-gray-600">
                          {format(new Date(earning.shift_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      +${earning.penalty_employer_share.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Payment History */}
      {payments.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">No Payments Yet</h3>
            <p className="text-xs text-gray-600">
              Your payment history will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-4 text-sm">
            <Receipt className="w-4 h-4 text-gray-600" />
            Payment History
          </h3>
          <div className="space-y-2">
            {payments.map((payment) => (
              <Card key={payment.id} className="border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900">
                          {payment.type === 'acceptance_fee' ? 'Acceptance Fee' : payment.type}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                      {payment.pharmacist_name && (
                        <p className="text-xs text-gray-600">{payment.pharmacist_name}</p>
                      )}
                      {payment.shift_date && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(payment.shift_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        -${payment.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(payment.created_date), 'MMM d')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: payments = [] } = useQuery({
    queryKey: ['employerPaymentsAnalytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.EmployerPayment.filter(
        { employer_id: user.id },
        '-created_date'
      );
    },
    enabled: !!user?.id,
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ['employerEarningsAnalytics', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const cancellations = await base44.entities.ShiftCancellation.filter(
        { employer_id: user.email },
        '-cancelled_at'
      );
      return cancellations.filter(c => c.penalty_employer_share > 0);
    },
    enabled: !!user?.email,
  });

  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalEarned = earnings.reduce((sum, e) => sum + (e.penalty_employer_share || 0), 0);
  const avgPayment = payments.length > 0 ? totalSpent / payments.length : 0;
  const acceptanceFees = payments.filter(p => p.type === 'acceptance_fee');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Total Spent</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              ${totalSpent.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Total Earned</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${totalEarned.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <Receipt className="w-3.5 h-3.5" />
              <span>Avg Payment</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${avgPayment.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Acceptances</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {acceptanceFees.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-gray-200">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Payment Breakdown</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Acceptance Fees</span>
              <div className="text-right">
                <div className="font-bold text-red-600">
                  -${acceptanceFees.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">{acceptanceFees.length} payments</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Penalty Earnings</span>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  +${totalEarned.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">{earnings.length} earnings</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
              <span className="text-sm font-bold text-gray-900">Net Spending</span>
              <div className="font-bold text-xl text-gray-900">
                ${(totalSpent - totalEarned).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployerWalletContent() {
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
            <p className="text-sm text-gray-500 mt-1">Manage payments and cards</p>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs defaultValue="cards" className="w-full">
            <TabsList className="bg-white border border-gray-200 p-1 mb-6 inline-flex rounded-lg">
              <TabsTrigger value="cards" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                Cards
              </TabsTrigger>
              <TabsTrigger value="history" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                History
              </TabsTrigger>
              <TabsTrigger value="analytics" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="mt-0">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <PaymentCardsTab onBannerMessage={handleBannerMessage} />
                </div>
                <div>
                  <Card className="bg-blue-50 border-blue-200 sticky top-24">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900 mb-2">Secure Payments</h3>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            Your payment information is encrypted and secure. We use Stripe for processing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="max-w-4xl">
                <PaymentsHistoryTab />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="grid grid-cols-2 gap-6">
                <AnalyticsTab />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Wallet</h1>
        <p className="text-sm text-gray-600">Manage payments and cards</p>
      </div>

      <div className="px-4 py-4">
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border border-gray-200">
            <TabsTrigger value="cards" className="text-sm">Cards</TabsTrigger>
            <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="cards" className="mt-0">
              <PaymentCardsTab onBannerMessage={handleBannerMessage} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <PaymentsHistoryTab />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      </div>
    </div>
  );
}

export default function EmployerWallet() {
  return (
    <EmployerOnly>
      <EmployerWalletContent />
    </EmployerOnly>
  );
}