import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Building2,
  Wallet,
  DollarSign,
  Megaphone,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  Server,
  GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from "@/api/base44Client";

const adminLinks = [
  { label: "Dashboard", path: "AdminDashboard", icon: LayoutDashboard },
  { label: "Users", path: "AdminUsers", icon: Users },
  { label: "Shifts", path: "AdminShifts", icon: Calendar },
  { label: "Applications", path: "AdminApplications", icon: FileText },
  { label: "Pharmacies", path: "AdminPharmacies", icon: Building2 },
  { label: "Financials", path: "AdminWallet", icon: Wallet },
  { label: "Pricing", path: "AdminPricing", icon: DollarSign },
  { label: "Broadcast", path: "AdminEmailBroadcast", icon: Megaphone },
  { label: "Security", path: "AdminSecurity", icon: ShieldAlert },
  { label: "System Tools", path: "AdminSystemTools", icon: Server },
  { label: "Version Control", path: "AdminVersionControl", icon: GitBranch },
  { label: "Settings", path: "AdminSettings", icon: Settings },
];

export default function AdminSidebar({ className }) {
  const location = useLocation();

  const isActive = (pageName) => {
    return location.pathname === createPageUrl(pageName);
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (error) {
      window.location.reload();
    }
  };

  return (
    <div className={cn("flex flex-col h-screen border-r border-gray-200 bg-white w-64 sticky top-0", className)}>
      {/* Header/Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
           <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center p-1 shadow-sm">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png" 
                alt="Logo" 
                className="w-full h-full object-contain brightness-0 invert"
              />
           </div>
           <div>
             <h1 className="font-bold text-gray-900 leading-none text-lg tracking-tight">Pharmanet</h1>
             <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mt-0.5">Admin Portal</p>
           </div>
        </div>
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 py-6 px-4">
        <div className="space-y-1.5">
          {adminLinks.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            
            return (
              <Link key={link.path} to={createPageUrl(link.path)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-11 px-3 font-medium transition-all duration-200",
                    active 
                      ? "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 border border-teal-100 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mr-3 transition-colors", active ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600")} />
                  {link.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto text-teal-400" />}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-10 px-3"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}