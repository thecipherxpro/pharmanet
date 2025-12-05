import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Search,
  Calendar,
  User,
  Shield,
  Users,
  Settings,
  UserSearch,
  Building2,
  Plus,
  GitBranch,
  FileText,
  Mail
} from "lucide-react";

export default function MobileBottomNav({ user }) {
  const location = useLocation();
  
  const isAdmin = user?.role === 'admin' || user?.user_type === 'admin';

  // Employer Navigation - matches EmployerSidebar main items
  const employerNav = [
    { label: "Home", path: createPageUrl("EmployerDashboard"), icon: LayoutDashboard },
    { label: "Find", path: createPageUrl("FindPharmacists"), icon: UserSearch },
    { label: "Post", path: createPageUrl("PostShift"), icon: Plus, isAction: true },
    { label: "Shifts", path: createPageUrl("MyShifts"), icon: Calendar },
    { label: "Profile", path: createPageUrl("EmployerProfile"), icon: User },
  ];

  // Pharmacist Navigation - matches PharmacistSidebar main items
  const pharmacistNav = [
    { label: "Home", path: createPageUrl("PharmacistDashboard"), icon: LayoutDashboard },
    { label: "Browse", path: createPageUrl("BrowseShifts"), icon: Search },
    { label: "Schedule", path: createPageUrl("MySchedule"), icon: Calendar },
    { label: "Apps", path: createPageUrl("MyApplications"), icon: FileText },
    { label: "Invites", path: createPageUrl("PharmacistInvitations"), icon: Mail },
  ];

  // Admin Navigation - matches AdminSidebar main items
  const adminNav = [
    { label: "Home", path: createPageUrl("AdminDashboard"), icon: Shield },
    { label: "Users", path: createPageUrl("AdminUsers"), icon: Users },
    { label: "Versions", path: createPageUrl("AdminVersionControl"), icon: GitBranch },
    { label: "Settings", path: createPageUrl("AdminSettings"), icon: Settings },
  ];

  const navigationItems = isAdmin ? adminNav : 
                         user?.user_type === "employer" ? employerNav : 
                         pharmacistNav;

  const getAccentColor = () => {
    if (isAdmin) return { bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50" };
    if (user?.user_type === "employer") return { bg: "bg-teal-600", text: "text-teal-600", light: "bg-teal-50" };
    return { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50" };
  };

  const colors = getAccentColor();

  return (
    <>
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80" />
        
        {/* Navigation Content */}
        <div className="relative flex items-stretch justify-around px-1 max-w-md mx-auto" style={{ height: '64px' }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            // Special "Action" button (like Post Shift for employers)
            if (item.isAction) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center px-3 -mt-4"
                >
                  <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 active:scale-95 transition-transform`}>
                    <Icon className="w-7 h-7 text-white stroke-[2.5px]" />
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 ${colors.text}`}>
                    {item.label}
                  </span>
                </Link>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center py-2 active:bg-gray-50/80 transition-colors rounded-xl mx-0.5"
              >
                {/* Icon with Active State */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive ? colors.light : ''
                }`}>
                  <Icon
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive 
                        ? `${colors.text} stroke-[2.2px]` 
                        : 'text-gray-400 stroke-[1.8px]'
                    }`}
                  />
                </div>

                {/* Label */}
                <span className={`text-[10px] mt-0.5 transition-all duration-200 ${
                  isActive 
                    ? `${colors.text} font-semibold` 
                    : 'text-gray-400 font-medium'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Safe Area for iOS */}
        <div className="h-safe bg-white/90" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
      
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </>
  );
}