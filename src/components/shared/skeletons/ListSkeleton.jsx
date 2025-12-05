import React from "react";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText, SkeletonBadge } from "../Skeleton";

export default function ListSkeleton({ itemCount = 6 }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white z-40 shadow-sm">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2 mb-3">
            <Skeleton className="flex-1 h-10 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-3 py-2">
        <Skeleton className="h-3 w-24" />
      </div>

      {/* List Items */}
      <div className="px-3 space-y-2.5">
        {Array.from({ length: itemCount }).map((_, i) => (
          <SkeletonCard key={i} className="p-3">
            <div className="flex gap-3">
              <SkeletonCircle size="md" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-2" />
                <div className="flex items-center gap-2 mb-2">
                  <SkeletonBadge className="w-16" />
                  <SkeletonBadge className="w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}