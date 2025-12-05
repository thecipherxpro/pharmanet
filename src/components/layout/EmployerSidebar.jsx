import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  UserSearch,
  Calendar,
  PlusCircle,
  Building2,
  FileText,
  Mail,
  Wallet,
  User,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { base44 } from "@/api/base44Client";

const employerLinks = [
  { label: "Dashboard", path: "EmployerDashboard", icon: LayoutDashboard },
  { label: "Find Pharmacists", path: "FindPharmacists", icon: UserSearch },
  { label: "My Shifts", path: "MyShifts", icon: Calendar },
  { label: "Post Shift", path: "PostShift", icon: PlusCircle },
  { label: "Pharmacies", path: "Pharmacies", icon: Building2 },
  { label: "Applications", path: "ManageApplications", icon: FileText },
  { label: "Invitations", path: "EmployerInvitations", icon: Mail },
  { label: "Wallet", path: "EmployerWallet", icon: Wallet },
];

const bottomLinks = [
  { label: "Profile", path: "EmployerProfile", icon: User },
  { label: "Settings", path: "EmployerSettings", icon: Settings },
];

export default function EmployerSidebar({ className }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('employerSidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('employerSidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

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

  const NavLink = ({ link, showLabel = true }) => {
    const active = isActive(link.path);
    const Icon = link.icon;
    
    const buttonContent = (
      <Button
        variant="ghost"
        className={cn(
          "w-full h-11 px-3 font-medium transition-all duration-200",
          showLabel ? "justify-start" : "justify-center",
          active 
            ? "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 border border-teal-100 shadow-sm" 
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <Icon className={cn(
          "w-5 h-5 transition-colors flex-shrink-0",
          showLabel && "mr-3",
          active ? "text-teal-600" : "text-gray-400"
        )} />
        {showLabel && (
          <>
            <span className="truncate">{link.label}</span>
            {active && <ChevronRight className="w-4 h-4 ml-auto text-teal-400 flex-shrink-0" />}
          </>
        )}
      </Button>
    );

    if (!showLabel) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to={createPageUrl(link.path)}>
              {buttonContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {link.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link to={createPageUrl(link.path)}>
        {buttonContent}
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-col h-screen border-r border-gray-200 bg-white sticky top-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-64",
        className
      )}>
        {/* Header/Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!isCollapsed && (
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
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mt-0.5">Employer</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Main Navigation Links */}
        <ScrollArea className="flex-1 py-4 px-3">
          <div className="space-y-1">
            {employerLinks.map((link) => (
              <NavLink key={link.path} link={link} showLabel={!isCollapsed} />
            ))}
          </div>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-100 py-3 px-3 space-y-1">
          {bottomLinks.map((link) => (
            <NavLink key={link.path} link={link} showLabel={!isCollapsed} />
          ))}
          
          {/* Logout Button */}
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 h-11"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-11 px-3"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}