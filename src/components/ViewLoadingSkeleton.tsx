import React from 'react';

export const ViewLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-pulse py-6 select-none">
      {/* Top Header Bar Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-zinc-200/70 rounded-md"></div>
          <div className="h-3 w-72 bg-zinc-100 rounded-md"></div>
        </div>
        <div className="h-8 w-28 bg-zinc-200/70 rounded-md"></div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-4">
          <div className="h-44 bg-zinc-100/80 rounded-xl border border-zinc-200/60 p-5 space-y-3">
            <div className="h-4 w-3/4 bg-zinc-200/80 rounded"></div>
            <div className="h-3 w-full bg-zinc-100 rounded"></div>
            <div className="h-3 w-5/6 bg-zinc-100 rounded"></div>
          </div>
          <div className="h-64 bg-zinc-100/60 rounded-xl border border-zinc-200/60 p-5 space-y-3">
            <div className="h-4 w-1/2 bg-zinc-200/80 rounded"></div>
            <div className="h-24 bg-zinc-100 rounded-lg"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-44 bg-zinc-100/80 rounded-xl border border-zinc-200/60"></div>
          <div className="h-64 bg-zinc-100/60 rounded-xl border border-zinc-200/60"></div>
        </div>
      </div>
    </div>
  );
};

