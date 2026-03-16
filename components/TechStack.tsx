
import React from 'react';
import { motion } from 'framer-motion';
import { TECH_CATEGORIES } from '../constants';
import AnimatedIcon from './AnimatedIcon';

const TechStack: React.FC = () => {
  return (
    <section className="py-24 bg-space-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-accent-primary font-mono tracking-widest uppercase text-sm mb-4 block">The Powerhouse Stack</span>
          <h2 className="text-5xl font-extrabold mb-6">Built for Authority.</h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg">
            We don't just use tools; we orchestrate systems. Only the fastest, most reliable frameworks make the cut.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {TECH_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
            >
              <h3 className="text-white/40 font-mono uppercase tracking-[0.3em] text-xs mb-8">{cat.title}</h3>
              <div className="space-y-6">
                {cat.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-4 group">
                    <div
                      className="w-12 h-12 rounded-xl bg-space-700 flex items-center justify-center text-white/20 group-hover:text-white transition-all duration-500"
                      style={{ '--hover-color': item.color } as any}
                    >
                      <div className="transition-colors duration-500 group-hover:text-[var(--hover-color)]">
                        <AnimatedIcon>
                          {item.icon}
                        </AnimatedIcon>
                      </div>
                    </div>
                    <div>
                      <span className="text-xl font-medium text-white/80 group-hover:text-white transition-colors">
                        {item.name}
                      </span>
                      {item.name === 'Laravel 11' && (
                        <span className="ml-2 text-[10px] bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full">LATEST</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStack;
