
import React from 'react';
import { METRICS } from '../constants';

const Metrics: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 md:-mt-12 relative z-30">
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl py-8 md:py-12 px-6 md:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-0 shadow-2xl relative overflow-hidden">
        {METRICS.map((metric, i) => (
          <div key={metric.label} className="text-center group relative">
            <div className="text-3xl md:text-5xl font-black text-white mb-2 md:group-hover:text-accent-primary transition-colors tracking-tighter">
              {metric.value}
            </div>
            <div className="text-[10px] md:text-sm font-mono text-white/40 uppercase tracking-widest px-2">
              {metric.label}
            </div>
            {i < METRICS.length - 1 && (
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 md:h-12 bg-white/10" />
            )}
            {i < METRICS.length - 1 && (
                <div className="sm:hidden absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-12 h-px bg-white/10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Metrics;
