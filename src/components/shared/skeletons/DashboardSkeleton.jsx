import React from "react";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText, SkeletonImageCard, SkeletonAvatar } from "../Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className="px-3 pt-4 pb-3">
        {/* Welcome Card Skeleton */}
        <SkeletonCard className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <SkeletonAvatar size="xl" />
            <div className="flex-1">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-10 w-10 rounded-xl mx-auto mb-2" />
                <Skeleton className="h-5 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Search Bar Skeleton */}
      <div className="px-3 mb-3">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-11 rounded-xl" />
          <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="px-3 mb-4">
        <Skeleton className="h-5 w-24 mb-2.5" />
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonImageCard key={i} />
          ))}
        </div>
      </div>

      {/* Recent Items Skeleton */}
      <div className="px-3">
        <div className="flex items-center justify-between mb-2.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}