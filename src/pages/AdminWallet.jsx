import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Wallet,
  Search,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { AdminOnly } from "../components/auth/RouteProtection";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

function AdminWalletContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch all revenue sources
  const { data: cancellations = [], isLoading: cancellationsLoading } = useQuery({
    queryKey: ['adminCancellations'],
    queryFn: async () => (await base44.entities.ShiftCancellation.list('-cancelled_at')) || [],
  });

  const { data: employerPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['adminEmployerPayments'],
    queryFn: async () => (await base44.entities.EmployerPayment.list('-created_date')) || [],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['adminShifts'],
    queryFn: async () => (await base44.entities.Shift.list()) || [],
  });

  // Combine all transactions
  const allTransactions = [
    ...cancellations.map(c => ({
      id: c.id,
      type: 'cancellation_fee',
      amount: c.penalty_app_share || 0,
      total_amount: c.penalty_total || 0,
      employer_share: c.penalty_employer_share || 0,
      date: c.cancelled_at,
      pharmacist_id: c.pharmacist_id,
      employer_id: c.employer_id,
      shift_id: c.shift_id,
      pharmacy_name: c.pharmacy_name,
      shift_date: c.shift_date,
      hours_before_start: c.hours_before_start,
      status: c.status
    })),
    ...employerPayments.map(p => ({
      id: p.id,
      type: p.type,
      amount: p.amount,
      date: p.created_date,
      employer_id: p.employer_id,
      pharmacist_id: p.pharmacist_id,
      pharmacist_name: p.pharmacist_name,
      shift_id: p.shift_id,
      shift_date: p.shift_date,
      pharmacy_name: p.pharmacy_name,
      description: p.description,
      status: p.status,
      stripe_payment_id: p.stripe_payment_id
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter transactions
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = 
      transaction.pharmacy_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.pharmacist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "cancellations" && transaction.type === "cancellation_fee") ||
      (activeTab === "acceptance" && transaction.type === "acceptance_fee") ||
      (activeTab === "other" && transaction.type !== "cancellation_fee" && transaction.type !== "acceptance_fee");

    return matchesSearch && matchesTab;
  });

  // Calculate stats
  const stats = {
    totalRevenue: allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    cancellationRevenue: cancellations.reduce((sum, c) => sum + (c.penalty_app_share || 0), 0),
    acceptanceRevenue: employerPayments.filter(p => p.type === 'acceptance_fee').reduce((sum, p) => sum + (p.amount || 0), 0),
    totalTransactions: allTransactions.length,
    cancellationCount: cancellations.length,
    acceptanceCount: employerPayments.filter(p => p.type === 'acceptance_fee').length,
    avgTransactionValue: allTransactions.length > 0 ? allTransactions.reduce((sum, t) => sum + t.amount, 0) / allTransactions.length : 0
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'cancellation_fee':
        return AlertTriangle;
      case 'acceptance_fee':
        return CheckCircle;
      default:
        return DollarSign;
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'cancellation_fee':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] h-5">Cancel</Badge>;
      case 'acceptance_fee':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] h-5">Accept</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] h-5">{type}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'charged':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-5">Charged</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] h-5">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 text-[10px] h-5">Refunded</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] h-5">{status}</Badge>;
    }
  };

  const isLoading = cancellationsLoading || paymentsLoading;

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Wallet</h1>
            <p className="text-xs text-zinc-500">Revenue tracking</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-zinc-900">${stats.totalRevenue.toFixed(0)}</p>
            <p className="text-[10px] text-zinc-400">{stats.totalTransactions} transactions</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Avg Transaction</p>
            <p className="text-xl font-bold text-zinc-900">${stats.avgTransactionValue.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Cancellations</p>
            <p className="text-xl font-bold text-zinc-900">${stats.cancellationRevenue.toFixed(0)}</p>
            <p className="text-[10px] text-zinc-400">{stats.cancellationCount} fees</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Acceptance</p>
            <p className="text-xl font-bold text-zinc-900">${stats.acceptanceRevenue.toFixed(0)}</p>
            <p className="text-[10px] text-zinc-400">{stats.acceptanceCount} fees</p>
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
              placeholder="Search transactions..."
              className="pl-9 bg-white border-zinc-200"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-zinc-100 border border-zinc-200 p-1 h-10 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="cancellations" className="text-xs px-3">Cancel</TabsTrigger>
              <TabsTrigger value="acceptance" className="text-xs px-3">Accept</TabsTrigger>
              <TabsTrigger value="other" className="text-xs px-3">Other</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <Wallet className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 font-medium">No transactions</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTransactions.map((transaction, index) => {
              const TypeIcon = getTypeIcon(transaction.type);
              const isIncome = transaction.amount > 0;
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowDetails(true);
                  }}
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-zinc-900 text-sm truncate">{transaction.pharmacy_name || 'Transaction'}</h3>
                          <p className="text-xs text-zinc-500">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-zinc-900">${transaction.amount.toFixed(2)}</p>
                        {getTypeBadge(transaction.type)}
                      </div>
                    </div>
                    {transaction.status && (
                      <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
                        <span className="text-xs text-zinc-500">Status</span>
                        {getStatusBadge(transaction.status)}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        </div>
      </div>

      {/* Transaction Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedTransaction && (
            <>
              <SheetHeader className="mb-6 border-b border-zinc-100 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    {React.createElement(getTypeIcon(selectedTransaction.type), { className: "w-6 h-6 text-zinc-600" })}
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-lg font-bold">{selectedTransaction.pharmacy_name || 'Transaction'}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeBadge(selectedTransaction.type)}
                      {selectedTransaction.status && getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* Amount Card */}
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1">Platform Revenue</p>
                  <p className="text-3xl font-bold text-zinc-900">${selectedTransaction.amount.toFixed(2)}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {format(new Date(selectedTransaction.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Details</h4>
                  <div className="space-y-2">
                    {selectedTransaction.pharmacy_name && (
                      <div className="p-3 bg-white border border-zinc-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-500">Pharmacy</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-900">{selectedTransaction.pharmacy_name}</p>
                      </div>
                    )}
                    {selectedTransaction.pharmacist_name && (
                      <div className="p-3 bg-white border border-zinc-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-500">Pharmacist</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-900">{selectedTransaction.pharmacist_name}</p>
                      </div>
                    )}
                    {selectedTransaction.shift_date && (
                      <div className="p-3 bg-white border border-zinc-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-500">Shift Date</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-900">
                          {format(new Date(selectedTransaction.shift_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Breakdown */}
                {selectedTransaction.type === 'cancellation_fee' && selectedTransaction.hours_before_start && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cancellation</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-white border border-zinc-200 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Total</p>
                        <p className="text-sm font-bold">${selectedTransaction.total_amount?.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-white border border-zinc-200 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Employer</p>
                        <p className="text-sm font-bold">${selectedTransaction.employer_share?.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-900 rounded-lg">
                        <p className="text-xs text-zinc-300 mb-1">Platform</p>
                        <p className="text-sm font-bold text-white">${selectedTransaction.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminWallet() {
  return (
    <AdminOnly>
      <AdminWalletContent />
    </AdminOnly>
  );
}