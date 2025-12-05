import React from "react";

export const Skeleton = ({ className = "", variant = "default" }) => {
  const variants = {
    default: "bg-gray-200",
    card: "bg-white border border-gray-200",
    shimmer: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"
  };

  return (
    <div className={`rounded ${variants[variant]} animate-pulse ${className}`} />
  );
};

export const SkeletonCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
    {children}
  </div>
);

export const SkeletonCircle = ({ size = "md", className = "" }) => {
  const sizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-gray-200 animate-pulse ${className}`} />
  );
};

export const SkeletonText = ({ lines = 1, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 rounded animate-pulse ${
          i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const SkeletonButton = ({ className = "" }) => (
  <div className={`h-10 bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

export const SkeletonAvatar = ({ size = "md" }) => {
  const sizes = {
    xs: "w-8 h-8",
    sm: "w-10 h-10", 
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-gray-200 animate-pulse`} />
  );
};

export const SkeletonBadge = ({ className = "" }) => (
  <div className={`h-5 w-16 bg-gray-200 rounded-full animate-pulse ${className}`} />
);

export const SkeletonImageCard = ({ className = "" }) => (
  <div className={`relative h-32 rounded-2xl bg-gray-200 animate-pulse overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
  </div>
);

// Add shimmer animation to global styles
export const shimmerStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;