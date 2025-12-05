import React from 'react';
import { Button } from "@/components/ui/button";
import ProfileAvatar from "./ProfileAvatar";

export default function WelcomeProfileCard({ 
  user, 
  greeting = "Welcome back",
  actions = [],
  stats = [],
  onAvatarUpload
}) {
  const getUserTypeColor = () => {
    // Professional medical colors - subtle and clean
    return 'from-slate-500 via-slate-600 to-gray-700';
  };

  const getUserTypeLabel = () => {
    if (!user?.user_type) return '';
    return user.user_type === 'employer' ? 'Pharmacy Employer' : 'Licensed Pharmacist';
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-white border border-gray-200">
      {/* Professional Medical Header - Less Colorful */}
      <div className={`relative h-20 bg-gradient-to-br ${getUserTypeColor()} overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-4 w-16 h-16 bg-white rounded-full blur-2xl" />
          <div className="absolute bottom-2 left-4 w-12 h-12 bg-white rounded-full blur-xl" />
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMiAyLTQgNC00czQgMiA0IDQtMiA0LTQgNCAyLTQtNC00LTQtNCAyLTQgNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      </div>

      {/* Professional Avatar - Overlapping Header */}
      <div className="absolute left-1/2 -translate-x-1/2 top-10">
        <div className="relative">
          <ProfileAvatar 
            user={user} 
            size="lg" 
            editable={true}
            onUploadSuccess={onAvatarUpload}
          />
          {/* Subtle shadow instead of colorful glow */}
          <div className="absolute inset-0 -z-10 blur-xl bg-gray-300 rounded-full scale-110 opacity-50" />
        </div>
      </div>

      {/* Professional Content */}
      <div className="pt-14 px-3 pb-4">
        {/* User Info - Centered & Professional */}
        <div className="mb-3 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">
            {user?.full_name || 'User'}
          </h2>
          <p className="text-xs text-gray-600 font-semibold">
            {getUserTypeLabel()}
          </p>
        </div>

        {/* Stats - Professional Medical Theme */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-xl py-2 px-1.5">
                <div className="flex justify-center mb-1">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-600 shadow-sm border border-gray-200">
                    <div className="scale-75">
                      {stat.icon}
                    </div>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-0.5 leading-none">{stat.value}</p>
                <p className="text-[10px] text-gray-600 leading-tight font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons - Professional Medical Style */}
        {actions.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || "default"}
                className={`h-10 font-semibold shadow-sm text-xs ${
                  action.variant === "default" 
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-0" 
                    : "border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {action.icon && <span className="mr-1.5 scale-90">{action.icon}</span>}
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}