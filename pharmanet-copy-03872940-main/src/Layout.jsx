import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Search,
  Calendar,
  User,
  LogOut,
  Building2,
  Clock,
  Users,
  Bell,
  Settings,
  ChevronRight,
  X,
  ChevronDown,
  DollarSign,
  Shield,
  MessageSquare,
  Wallet,
  UserSearch,
  Star,
  Mail,
  AlertTriangle,
  Wrench,
  Lock,
  AlertCircle,
  Server,
  CloudOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import ProfileAvatar from "./components/shared/ProfileAvatar";
import InstallPrompt from "./components/pwa/InstallPrompt";
import PWAManager from "./components/pwa/PWAManager";
import ManifestLink from "./components/pwa/ManifestLink";
import NotificationDropdown from "./components/notifications/NotificationDropdown";
import StatusBanner from "./components/shared/StatusBanner";
import CountdownTimer from "./components/shared/CountdownTimer";
import { NotificationProvider } from "./components/notifications/NotificationProvider";
import AdminSidebar from "./components/layout/AdminSidebar";
import EmployerSidebar from "./components/layout/EmployerSidebar";
import PharmacistSidebar from "./components/layout/PharmacistSidebar";
import MobileBottomNav from "./components/navigation/MobileBottomNav";
import BrowserNotificationPrompt from "./components/notifications/BrowserNotificationPrompt";
import NotificationTrigger from "./components/notifications/NotificationTrigger";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(null);

  useEffect(() => {
    checkMaintenanceMode();
    loadUser();
    
    const handleAvatarUpdate = (event) => {
      if (event.detail?.avatar_url) {
        setUser(prevUser => ({
          ...prevUser,
          avatar_url: event.detail.avatar_url
        }));
      }
    };
    
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const overrides = await base44.entities.SystemOverride.list();
      const activeOverride = overrides.find(o => o.is_enabled);
      
      if (activeOverride && currentPageName !== "AdminOverride") {
        const userData = await base44.auth.me().catch(() => null);
        const isAdmin = userData?.role === 'admin' || userData?.user_type === 'admin';
        
        if (!isAdmin) {
          setMaintenanceMode(activeOverride);
        }
      }
    } catch (error) {
      console.error("Error checking maintenance mode:", error);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const isAdmin = userData.role === 'admin' || userData.user_type === 'admin';
      
      if (!isAdmin && !userData.user_type && currentPageName !== "RoleSelection") {
        navigate(createPageUrl("RoleSelection"));
      }
    } catch (error) {
      console.error("Error loading user:", error);
      if (currentPageName !== "RoleSelection") {
        const isLoggedOut = error?.message?.includes('logged out') || error?.message?.includes('401') || error?.response?.status === 401;
        if (!isLoggedOut) {
          console.log("User not authenticated");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (newAvatarUrl) => {
    setUser(prevUser => ({ ...prevUser, avatar_url: newAvatarUrl }));
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await base44.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  if (currentPageName === "RoleSelection") {
    return children;
  }

  // Show maintenance mode WITHOUT layout chrome for non-admin users
  if (maintenanceMode && currentPageName !== "AdminOverride") {
    const iconMap = {
      Settings,
      AlertTriangle,
      Wrench,
      Shield,
      Lock,
      AlertCircle,
      Server,
      CloudOff,
    };
    const Icon = iconMap[maintenanceMode.icon_name] || Settings;
    const titleSize = maintenanceMode.title_size || "3xl";

    return (
      <div 
        className="min-h-screen flex items-start p-8 md:p-12"
        style={{ backgroundColor: maintenanceMode.background_color, color: maintenanceMode.primary_color }}
      >
        <div className="max-w-3xl w-full">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${maintenanceMode.primary_color}15` }}
            >
              <Icon className="w-8 h-8" style={{ color: maintenanceMode.primary_color }} />
            </div>
            <h1 className={`text-${titleSize} md:text-${titleSize} font-bold`}>
              {maintenanceMode.title}
            </h1>
          </div>
          <div 
            className="text-lg md:text-xl opacity-80 mb-8 leading-relaxed prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: maintenanceMode.message }}
            style={{ color: maintenanceMode.primary_color }}
          />

          {/* Countdown Timer */}
          {maintenanceMode.countdown_enabled && maintenanceMode.countdown_target && (
            <div className="my-8">
              <CountdownTimer
                targetDate={maintenanceMode.countdown_target}
                label={maintenanceMode.countdown_label}
                primaryColor={maintenanceMode.primary_color}
              />
            </div>
          )}

          <p className="text-sm opacity-60">
            {maintenanceMode.footer_text}
          </p>
        </div>
      </div>
    );
  }

  const getUserTypeColor = () => {
    return 'from-teal-500 via-cyan-600 to-teal-600';
  };

  const employerNav = [
    { 
      label: "Home", 
      path: createPageUrl("EmployerDashboard"), 
      icon: LayoutDashboard
    },
    { 
      label: "Find", 
      path: createPageUrl("FindPharmacists"), 
      icon: UserSearch
    },
    { 
      label: "Shifts", 
      path: createPageUrl("MyShifts"), 
      icon: Calendar
    },
    { 
      label: "Profile", 
      path: createPageUrl("EmployerProfile"), 
      icon: User
    },
  ];

  const pharmacistNav = [
    { 
      label: "Home", 
      path: createPageUrl("PharmacistDashboard"), 
      icon: LayoutDashboard
    },
    { 
      label: "Browse", 
      path: createPageUrl("BrowseShifts"), 
      icon: Search
    },
    { 
      label: "Schedule", 
      path: createPageUrl("MySchedule"), 
      icon: Calendar
    },
    { 
      label: "Profile", 
      path: createPageUrl("PharmacistProfile"), 
      icon: User
    },
  ];

  const adminNav = [
    { 
      label: "Dashboard", 
      path: createPageUrl("AdminDashboard"), 
      icon: Shield
    },
    { 
      label: "Users", 
      path: createPageUrl("AdminUsers"), 
      icon: Users
    },
    { 
      label: "Shifts", 
      path: createPageUrl("AdminShifts"), 
      icon: Calendar
    },
    { 
      label: "Settings", 
      path: createPageUrl("AdminSettings"), 
      icon: Settings
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.user_type === 'admin';
  const navigationItems = isAdmin ? adminNav : 
                         user?.user_type === "employer" ? employerNav : 
                         pharmacistNav;

  return (
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50 flex flex-row">
            {/* PWA Manifest Link - Ensures app is installable */}
            <ManifestLink />

            {/* PWA Manager - handles online/offline status */}
            <PWAManager />

            {/* Install Prompt - shows install banner */}
            <InstallPrompt />

            {/* Status Banner - shows admin notifications */}
            <StatusBanner />

            {/* Browser Notification Prompt */}
            {user && <BrowserNotificationPrompt variant="banner" showAfterDelay={5000} />}

            {/* Notification Trigger - polls and shows browser notifications */}
            {user && <NotificationTrigger user={user} />}

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -20px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(-20px, -20px) scale(1.05); }
          }
          
          .animate-blob {
            animation: blob 7s infinite;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .leaflet-container {
            z-index: 1 !important;
          }
          
          .leaflet-pane {
            z-index: 1 !important;
          }
          
          .leaflet-top,
          .leaflet-bottom {
            z-index: 2 !important;
          }
          
          .leaflet-control {
            z-index: 2 !important;
          }
          
          .leaflet-popup {
            z-index: 3 !important;
          }

          [role="dialog"],
          [role="alertdialog"] {
            z-index: 9999 !important;
          }

          [data-radix-portal] {
            z-index: 10000 !important;
          }

          /* Offline indicator */
          body.offline::before {
            content: 'Offline Mode';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f59e0b;
            color: white;
            text-align: center;
            padding: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 99999;
          }
          
          body.offline {
            padding-top: 40px;
          }
        `}</style>

        {/* Desktop Sidebars */}
        {isAdmin && (
          <div className="hidden md:block flex-shrink-0 z-50 h-screen sticky top-0">
            <AdminSidebar />
          </div>
        )}
        {!isAdmin && user?.user_type === "employer" && (
          <div className="hidden md:block flex-shrink-0 z-50 h-screen sticky top-0">
            <EmployerSidebar />
          </div>
        )}
        {!isAdmin && user?.user_type === "pharmacist" && (
          <div className="hidden md:block flex-shrink-0 z-50 h-screen sticky top-0">
            <PharmacistSidebar />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
          {/* Mobile Header - Only show on mobile for employer/pharmacist */}
          {(user?.user_type === 'employer' || user?.user_type === 'pharmacist') && (
            <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm px-2.5 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center p-0.5">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png" 
                      alt="Pharmanet Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-gray-900 leading-none">Pharmanet</h1>
                    <p className="text-[8px] leading-none text-teal-600 font-semibold uppercase tracking-wide mt-0.5">
                      {user?.user_type === "employer" ? "Employer" : "Pharmacist"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <NotificationDropdown />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 p-0.5 pr-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                        <ProfileAvatar user={user} size="xs" editable={false} onUploadSuccess={handleAvatarUpload} />
                        <ChevronDown size={12} className="text-gray-700" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mr-2 border-gray-200">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-xs font-semibold leading-none truncate">{user?.full_name || 'User'}</p>
                          <p className="text-[10px] leading-none text-teal-600 truncate font-medium">{user?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(user?.user_type === 'employer' ? createPageUrl("EmployerProfile") : createPageUrl("PharmacistProfile"))} className="cursor-pointer py-2.5">
                        <User className="mr-2 h-3.5 w-3.5 text-teal-600" />
                        <span className="text-xs font-medium">Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(createPageUrl("Notifications"))} className="cursor-pointer py-2.5">
                        <Bell className="mr-2 h-3.5 w-3.5 text-teal-600" />
                        <span className="text-xs font-medium">Notifications</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(user?.user_type === 'employer' ? createPageUrl("EmployerSettings") : createPageUrl("PharmacistSettings"))} className="cursor-pointer py-2.5">
                        <Settings className="mr-2 h-3.5 w-3.5 text-teal-600" />
                        <span className="text-xs font-medium">Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5">
                        <LogOut className="mr-2 h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
          )}

          {/* Admin Header - Shows on all screen sizes */}
          {isAdmin && (
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm md:px-6 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:hidden">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center p-0.5">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png" alt="Pharmanet Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-gray-900 leading-none">Pharmanet</h1>
                    <p className="text-[8px] leading-none text-teal-600 font-semibold uppercase tracking-wide mt-0.5">Admin</p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <h2 className="text-lg font-semibold text-gray-800">Admin Portal</h2>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <NotificationDropdown />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 p-0.5 pr-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
                        <ProfileAvatar user={user} size="xs" editable={false} onUploadSuccess={handleAvatarUpload} />
                        <ChevronDown size={12} className="text-gray-700" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mr-2 border-gray-200">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-xs font-semibold leading-none truncate">{user?.full_name || 'User'}</p>
                          <p className="text-[10px] leading-none text-teal-600 truncate font-medium">{user?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(createPageUrl("AdminProfile"))} className="cursor-pointer py-2.5">
                        <User className="mr-2 h-3.5 w-3.5 text-teal-600" />
                        <span className="text-xs font-medium">Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(createPageUrl("Notifications"))} className="cursor-pointer py-2.5">
                        <Bell className="mr-2 h-3.5 w-3.5 text-teal-600" />
                        <span className="text-xs font-medium">Notifications</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(createPageUrl("AdminSettings"))} className="cursor-pointer py-2.5">
                        <Settings className="mr-2 h-3.5 w-3.5 text-teal-600" />
                        <span className="text-xs font-medium">Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5">
                        <LogOut className="mr-2 h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
          )}

          {/* Desktop Floating Pill - For Employer/Pharmacist only */}
          {!isAdmin && (user?.user_type === 'employer' || user?.user_type === 'pharmacist') && (
            <div className="hidden md:flex fixed top-4 right-6 z-50 items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-1.5 py-1">
              <NotificationDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors">
                    <ProfileAvatar user={user} size="xs" editable={false} onUploadSuccess={handleAvatarUpload} />
                    <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">{user?.full_name?.split(' ')[0] || 'User'}</span>
                    <ChevronDown size={12} className="text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mr-2 border-gray-200">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-xs font-semibold leading-none truncate">{user?.full_name || 'User'}</p>
                      <p className="text-[10px] leading-none text-teal-600 truncate font-medium">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(user?.user_type === 'employer' ? createPageUrl("EmployerProfile") : createPageUrl("PharmacistProfile"))} className="cursor-pointer py-2.5">
                    <User className="mr-2 h-3.5 w-3.5 text-teal-600" />
                    <span className="text-xs font-medium">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(createPageUrl("Notifications"))} className="cursor-pointer py-2.5">
                    <Bell className="mr-2 h-3.5 w-3.5 text-teal-600" />
                    <span className="text-xs font-medium">Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(user?.user_type === 'employer' ? createPageUrl("EmployerSettings") : createPageUrl("PharmacistSettings"))} className="cursor-pointer py-2.5">
                    <Settings className="mr-2 h-3.5 w-3.5 text-teal-600" />
                    <span className="text-xs font-medium">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5">
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Main Content - Flex grow to push nav to bottom */}
          <main className="flex-1 relative z-0 w-full">
            {children}
          </main>
        </div>

        {/* Bottom Navigation - Hide on Desktop for Admin/Employer/Pharmacist (they have sidebar), show on mobile */}
        <div className="md:hidden">
          <MobileBottomNav user={user} />
        </div>
      </div>
    </NotificationProvider>
    );
    }