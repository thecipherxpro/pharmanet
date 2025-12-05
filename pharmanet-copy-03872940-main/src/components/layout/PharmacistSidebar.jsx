import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Search,
  Calendar,
  FileText,
  Mail,
  Wallet,
  Star,
  Building2,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "PharmacistDashboard" },
  { label: "Browse Shifts", icon: Search, path: "BrowseShifts" },
  { label: "My Schedule", icon: Calendar, path: "MySchedule" },
  { label: "Applications", icon: FileText, path: "MyApplications" },
  { label: "Invitations", icon: Mail, path: "PharmacistInvitations" },
  { label: "Wallet", icon: Wallet, path: "PharmacistWallet" },
  { label: "Reviews", icon: Star, path: "PharmacistReviews" },
  { label: "Employers", icon: Building2, path: "BrowseEmployers" },
];

const bottomNavItems = [
  { label: "Profile", icon: User, path: "PharmacistProfile" },
  { label: "Settings", icon: Settings, path: "PharmacistSettings" },
];

export default function PharmacistSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    const url = createPageUrl(path);
    return location.pathname === url || location.pathname === url + '/';
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  return (
    <div
      className={cn(
        "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png"
              alt="Pharmanet"
              className="w-7 h-7 object-contain"
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-gray-900 leading-none">Pharmanet</h1>
              <p className="text-[10px] text-teal-600 font-semibold uppercase tracking-wide mt-0.5">
                Pharmacist
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
        )}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  active ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {!collapsed && (
                <span className={cn("text-sm font-medium", active && "font-semibold")}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  active ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {!collapsed && (
                <span className={cn("text-sm font-medium", active && "font-semibold")}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-colors" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}