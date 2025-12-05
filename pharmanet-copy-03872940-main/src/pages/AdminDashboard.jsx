import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  ChevronRight,
  Bell,
  Mail,
  ArrowRight,
  Megaphone,
  Settings,
  Wrench
} from "lucide-react";
import { AdminOnly } from "../components/auth/RouteProtection";
import { motion } from "framer-motion";

function AdminDashboardContent() {
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await base44.entities.User.list()) || [],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['adminShifts'],
    queryFn: async () => (await base44.entities.Shift.list('-created_date')) || [],
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['adminApplications'],
    queryFn: async () => (await base44.entities.ShiftApplication.list('-applied_date')) || [],
  });

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['adminPharmacies'],
    queryFn: async () => (await base44.entities.Pharmacy.list()) || [],
  });

  const { data: cancellations = [] } = useQuery({
    queryKey: ['adminCancellations'],
    queryFn: async () => (await base44.entities.ShiftCancellation.list('-cancelled_at')) || [],
  });

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    employers: users.filter(u => u.user_type === 'employer').length,
    pharmacists: users.filter(u => u.user_type === 'pharmacist').length,
    
    totalShifts: shifts.length,
    openShifts: shifts.filter(s => s.status === 'open').length,
    filledShifts: shifts.filter(s => s.status === 'filled').length,
    
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
    
    activePharmacies: pharmacies.filter(p => p.is_active !== false).length,
    
    totalRevenue: shifts.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.total_pay || 0), 0),
    totalPenaltyRevenue: cancellations.reduce((sum, c) => sum + (c.penalty_app_share || 0), 0),
  };

  const quickStats = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      link: createPageUrl("AdminUsers")
    },
    {
      label: "Open Shifts",
      value: stats.openShifts,
      icon: Calendar,
      link: createPageUrl("AdminShifts")
    },
    {
      label: "Pending Apps",
      value: stats.pendingApplications,
      icon: FileText,
      link: createPageUrl("AdminApplications")
    },
    {
      label: "Revenue",
      value: `$${(stats.totalRevenue / 1000).toFixed(1)}k`,
      icon: DollarSign,
      link: createPageUrl("AdminWallet")
    }
  ];

  const menuItems = [
    {
      title: "User Management",
      description: "Manage employers and pharmacists",
      icon: Users,
      link: createPageUrl("AdminUsers"),
      stat: `${stats.totalUsers} Users`
    },
    {
      title: "Shift Management",
      description: "Monitor and manage shifts",
      icon: Calendar,
      link: createPageUrl("AdminShifts"),
      stat: `${stats.totalShifts} Shifts`
    },
    {
      title: "Applications",
      description: "Review shift applications",
      icon: FileText,
      link: createPageUrl("AdminApplications"),
      stat: `${stats.pendingApplications} Pending`
    },
    {
      title: "Pharmacies",
      description: "Manage pharmacy locations",
      icon: Building2,
      link: createPageUrl("AdminPharmacies"),
      stat: `${stats.activePharmacies} Active`
    },
    {
      title: "Financials",
      description: "Revenue and transactions",
      icon: DollarSign,
      link: createPageUrl("AdminWallet"),
      stat: `$${stats.totalPenaltyRevenue.toFixed(0)} Fees`
    },
    {
      title: "System Tools",
      description: "Advanced admin utilities",
      icon: Wrench,
      link: createPageUrl("AdminSystemTools"),
      stat: "Utilities"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 md:pb-8">
      {/* ============ MOBILE HEADER ============ */}
      <div className="md:hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Admin Portal</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide">System Overview</p>
          </div>
        </div>

        {/* Mobile Stats Grid - Compact */}
        <div className="grid grid-cols-4 gap-2">
          {quickStats.map((stat, i) => (
            <Link key={i} to={stat.link}>
              <div className={`rounded-xl p-2.5 text-center ${i === 3 ? 'bg-white text-zinc-900' : 'bg-white/10 backdrop-blur-sm'}`}>
                <stat.icon className={`w-4 h-4 mx-auto mb-1 ${i === 3 ? 'text-zinc-700' : 'text-zinc-300'}`} />
                <p className={`text-base font-bold ${i === 3 ? 'text-zinc-900' : 'text-white'}`}>
                  {typeof stat.value === 'number' ? stat.value : stat.value}
                </p>
                <p className={`text-[9px] font-medium truncate ${i === 3 ? 'text-zinc-500' : 'text-zinc-400'}`}>{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ============ DESKTOP HEADER ============ */}
      <div className="hidden md:block bg-white border-b border-zinc-200 px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Admin Portal</h1>
            <p className="text-sm text-zinc-500">System Overview</p>
          </div>
        </div>
      </div>

      {/* ============ MOBILE CONTENT ============ */}
      <div className="md:hidden px-3 py-4">
        {/* Management Section */}
        <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Management</h2>
        <div className="space-y-2.5 mb-5">
          {menuItems.map((item, i) => (
            <Link key={i} to={item.link}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-zinc-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 text-sm">{item.title}</h3>
                  <p className="text-[11px] text-zinc-500 truncate">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 font-normal text-[10px] px-1.5 py-0.5">
                    {item.stat}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-zinc-300" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Quick Actions - Mobile */}
        <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl("StatusNotify")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-zinc-200 rounded-xl p-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center mb-2">
                <Megaphone className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-900">Status Banner</h3>
              <p className="text-[10px] text-zinc-500">Portal updates</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl("AdminNotifications")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-zinc-200 rounded-xl p-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center mb-2">
                <Bell className="w-4 h-4 text-zinc-600" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-900">Notifications</h3>
              <p className="text-[10px] text-zinc-500">Push alerts</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl("AdminEmailBroadcast")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-zinc-200 rounded-xl p-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center mb-2">
                <Mail className="w-4 h-4 text-zinc-600" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-900">Email Broadcast</h3>
              <p className="text-[10px] text-zinc-500">Send to all</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl("AdminOverride")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-semibold text-white">System Override</h3>
              <p className="text-[10px] text-red-100">Maintenance</p>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* ============ DESKTOP CONTENT ============ */}
      <div className="hidden md:block px-6 max-w-[1600px] mx-auto -mt-4 relative z-10">
        {/* Bento Grid Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Large Card - Total Users */}
          <Link to={quickStats[0].link} className="col-span-2 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:border-zinc-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <Users className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </div>
              <p className="text-4xl font-bold text-zinc-900 tracking-tight mb-1">{quickStats[0].value}</p>
              <p className="text-sm font-medium text-zinc-500">{quickStats[0].label}</p>
            </motion.div>
          </Link>

          {/* Two Medium Cards */}
          <Link to={quickStats[1].link}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:border-zinc-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{quickStats[1].value}</p>
              <p className="text-xs font-medium text-zinc-500">{quickStats[1].label}</p>
            </motion.div>
          </Link>

          <Link to={quickStats[2].link}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:border-zinc-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{quickStats[2].value}</p>
              <p className="text-xs font-medium text-zinc-500">{quickStats[2].label}</p>
            </motion.div>
          </Link>

          {/* One Large Revenue Card */}
          <Link to={quickStats[3].link} className="col-span-2 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-900 border border-zinc-900 rounded-xl p-6 shadow-sm hover:bg-zinc-800 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <p className="text-4xl font-bold text-white tracking-tight mb-1">{quickStats[3].value}</p>
              <p className="text-sm font-medium text-zinc-400">{quickStats[3].label}</p>
            </motion.div>
          </Link>
        </div>

        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3 px-1">Management</h2>

        {/* Navigation Menu - 2 Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {menuItems.map((item, i) => (
            <Link key={i} to={item.link}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-300 hover:bg-zinc-50/50 transition-all group h-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                    <item.icon className="w-5 h-5 text-zinc-700" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-zinc-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{item.description}</p>
                <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 font-normal text-xs">
                  {item.stat}
                </Badge>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3 px-1 mt-8">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to={createPageUrl("StatusNotify")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-300 hover:bg-zinc-50/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-zinc-900 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Status Banner</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Portal updates</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl("AdminNotifications")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-300 hover:bg-zinc-50/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-zinc-600" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Notifications</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Push alerts</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl("AdminEmailBroadcast")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-300 hover:bg-zinc-50/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-zinc-600" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Email Broadcast</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Send to all users</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl("AdminOverride")}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-red-500 to-red-600 border border-red-600 rounded-xl p-5 shadow-sm hover:from-red-600 hover:to-red-700 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">System Override</h3>
              <p className="text-xs text-red-100 leading-relaxed">Maintenance mode</p>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminOnly>
      <AdminDashboardContent />
    </AdminOnly>
  );
}