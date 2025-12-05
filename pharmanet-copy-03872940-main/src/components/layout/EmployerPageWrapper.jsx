import React from "react";

/**
 * Wrapper component for employer pages that provides:
 * - Desktop: Professional layout with max-width, padding, and proper spacing
 * - Mobile: No changes, renders children as-is
 * 
 * Usage:
 * <EmployerPageWrapper
 *   title="My Shifts"
 *   subtitle="Manage your posted shifts"
 *   headerContent={<button>Post Shift</button>}
 * >
 *   {mobileContent}
 * </EmployerPageWrapper>
 */
export default function EmployerPageWrapper({ 
  children, 
  title, 
  subtitle,
  headerContent,
  maxWidth = "7xl", // xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl
  noPadding = false 
}) {
  const maxWidthClasses = {
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header - Hidden on mobile */}
      {(title || headerContent) && (
        <div className="hidden md:block bg-white border-b border-gray-200">
          <div className={`${maxWidthClasses[maxWidth]} mx-auto px-6 py-5`}>
            <div className="flex items-center justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
              {headerContent && (
                <div className="flex items-center gap-3">
                  {headerContent}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Content Wrapper - Hidden on mobile */}
      <div className="hidden md:block">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto ${noPadding ? '' : 'px-6 py-6'}`}>
          {children}
        </div>
      </div>

      {/* Mobile Content - Hidden on desktop */}
      <div className="md:hidden">
        {children}
      </div>
    </div>
  );
}

/**
 * Stats row component for desktop layouts
 */
export function DesktopStatsRow({ stats }) {
  return (
    <div className="hidden md:grid md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">{stat.label}</p>
            </div>
            {stat.icon && (
              <div className={`w-12 h-12 ${stat.bgColor || 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                {stat.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Desktop card grid layout
 */
export function DesktopCardGrid({ children, columns = 3 }) {
  const colClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4"
  };

  return (
    <div className={`hidden md:grid ${colClasses[columns]} gap-4`}>
      {children}
    </div>
  );
}

/**
 * Desktop two-column layout (sidebar + main)
 */
export function DesktopTwoColumn({ sidebar, main, sidebarWidth = "w-80" }) {
  return (
    <div className="hidden md:flex gap-6">
      <div className={`${sidebarWidth} flex-shrink-0 space-y-4`}>
        {sidebar}
      </div>
      <div className="flex-1 min-w-0">
        {main}
      </div>
    </div>
  );
}