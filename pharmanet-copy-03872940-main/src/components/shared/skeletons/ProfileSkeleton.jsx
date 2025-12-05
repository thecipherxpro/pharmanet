import React from "react";
import { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonText, SkeletonBadge } from "../Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-3 py-3 flex items-center gap-2 border-b border-gray-100 sticky top-0 z-40">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="max-w-3xl mx-auto px-3 py-4">
        {/* Profile Header Card */}
        <SkeletonCard className="p-4 mb-3">
          <div className="flex items-start gap-3 mb-4">
            <SkeletonAvatar size="xl" />
            <div className="flex-1">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56 mb-3" />
              <div className="flex gap-2">
                <SkeletonBadge />
                <SkeletonBadge />
                <SkeletonBadge />
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-5 w-24 mb-2" />
                <SkeletonBadge className="w-20" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        {/* Location Card */}
        <SkeletonCard className="p-0 mb-3 overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </SkeletonCard>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-3">
          <div className="flex border-b border-gray-200">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-1 h-10 m-2 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="p-4">
              <Skeleton className="h-5 w-32 mb-3" />
              <SkeletonText lines={3} />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}