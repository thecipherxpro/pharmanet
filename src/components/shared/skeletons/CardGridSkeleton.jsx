import React from "react";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonBadge } from "../Skeleton";

export default function CardGridSkeleton({ itemCount = 6 }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white z-40 shadow-sm px-3 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Card Grid */}
      <div className="px-3 pt-3">
        <div className="grid gap-3">
          {Array.from({ length: itemCount }).map((_, i) => (
            <SkeletonCard key={i} className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <SkeletonCircle size="lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="flex gap-2">
                    <SkeletonBadge />
                    <SkeletonBadge />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}