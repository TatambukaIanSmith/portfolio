
import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const STEPS = [
  {
    id: '01',
    title: 'Discovery',
    desc: 'Deep dive into requirements, architecture mapping, and strategic alignment.',
  },
  {
    id: '02',
    title: 'Design',
    desc: 'Low-fidelity wireframes evolved into Apple-standard interactive UI.',
  },
  {
    id: '03',
    title: 'Development',
    desc: 'Laravel 11 implementation with Alpine.js and Tailwind orchestration.',
  },
  {
    id: '04',
    title: 'Deployment',
    desc: 'CI/CD, server hardening, and global cloud infrastructure launch.',
  },
];

const InteractiveWorkflow: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section ref={containerRef} className="py-24 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-16 md:mb-20">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">The Elite Workflow</h2>
        <p className="text-white/40 text-lg md:text-xl max-w-xl italic">Code is a commodity. Process is the product.</p>
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Desktop Background Line */}
        <div className="hidden md:block absolute top-8 left-6 right-6 h-[2px] bg-white/10" />
        
        {/* Desktop Animated Gradient Line */}
        <motion.div
          className="hidden md:block absolute top-8 left-6 h-[2px] bg-gradient-to-r from-orange-500 to-red-600 z-10 origin-left shadow-[0_0_15px_rgba(255,77,0,0.5)]"
          style={{ scaleX: pathLength, width: 'calc(100% - 48px)' }}
        />

        {/* Mobile Vertical Background Line */}
        <div className="md:hidden absolute top-4 bottom-4 left-6 w-[2px] bg-white/10" />
        
        {/* Mobile Animated Vertical Line */}
        <motion.div
          className="md:hidden absolute top-4 left-6 w-[2px] bg-gradient-to-b from-orange-500 to-red-600 z-10 origin-top shadow-[0_0_15px_rgba(255,77,0,0.5)]"
          style={{ scaleY: pathLength, height: 'calc(100% - 32px)' }}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-12 mt-4 relative z-20">
          {STEPS.map((step, idx) => {
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0.3, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-default flex flex-row md:flex-col items-start gap-8 md:gap-0"
              >
                <div className="shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-space-800 border-2 border-white/10 flex items-center justify-center mb-0 md:mb-8 relative transition-all duration-500 md:group-hover:border-accent-primary md:group-hover:shadow-[0_0_20px_rgba(255,77,0,0.3)] z-30">
                    <span className="text-base md:text-lg font-bold text-white md:group-hover:text-accent-primary transition-colors">{step.id}</span>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-white md:group-hover:translate-x-2 transition-transform">{step.title}</h3>
                  <p className="text-white/50 text-sm md:text-base leading-relaxed md:group-hover:text-white/80 transition-colors">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default InteractiveWorkflow;
