import React from 'react';

export const ViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse pb-12" aria-busy="true" aria-label="Loading view content">
      {/* Top Banner Skeleton */}
      <div className="h-28 rounded-2xl bg-slate-800/40 border border-slate-800/60" />

      {/* Grid of Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-800/40 border border-slate-800/60 p-4 space-y-2">
            <div className="w-16 h-3 bg-slate-700/50 rounded" />
            <div className="w-24 h-6 bg-slate-700/70 rounded" />
            <div className="w-20 h-2.5 bg-slate-700/40 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 h-72 rounded-2xl bg-slate-800/40 border border-slate-800/60" />
        <div className="lg:col-span-7 h-72 rounded-2xl bg-slate-800/40 border border-slate-800/60" />
      </div>

      {/* Bottom Ledger Skeleton */}
      <div className="h-64 rounded-2xl bg-slate-800/40 border border-slate-800/60" />
    </div>
  );
};
