import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Clock, BrainCircuit, Code2, GraduationCap, Heart, Star, User, Trophy } from 'lucide-react';
import { IAN_CONFIG } from '../constants';
const profileImage = '/images/me.jpeg';
import AnimatedIcon from './AnimatedIcon';

const BentoGrid: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const GithubMock = () => (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 49 }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm transition-all duration-700 ${
            Math.random() > 0.7 ? 'bg-accent-primary opacity-50 shadow-[0_0_8px_rgba(255,77,0,0.3)]' : 'bg-white/5'
          }`}
        />
      ))}
    </div>
  );

  const SpotlightCard = ({ children, className, noPadding = false }: { children?: React.ReactNode; className?: string; noPadding?: boolean }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl group transition-all duration-700 hover:border-accent-primary/30 ${noPadding ? '' : 'p-6 md:p-10'} ${className}`}
      >
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-700 z-10 hidden md:block"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 77, 0, 0.1), transparent 40%)`,
          }}
        />
        {children}
      </div>
    );
  };

  return (
    <section id="about" className="py-20 md:py-32 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 md:auto-rows-[240px]">
        {/* Main Philosophy */}
        <SpotlightCard className="md:col-span-2 md:row-span-2 flex flex-col justify-center min-h-[350px] md:min-h-0">
          <AnimatedIcon>
            <BrainCircuit className="w-10 h-10 md:w-14 md:h-14 text-accent-primary mb-6 md:mb-10 group-hover:scale-110 transition-transform duration-700" />
          </AnimatedIcon>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 md:mb-6 text-white tracking-tighter">
            Intelligence meets <br />
            <span className="text-accent-primary italic">Balance.</span>
          </h2>
          <p className="text-white/40 text-lg md:text-xl max-w-lg leading-relaxed font-light">
            I balance technical precision with the joy of family and life's leisure. Intelligent architecture driven by God-fearing principles.
          </p>
        </SpotlightCard>

        {/* Identity Photo Tile */}
        <SpotlightCard noPadding className="md:row-span-2 bg-space-900 group shadow-2xl min-h-[400px] md:min-h-0">
          <div className="absolute inset-0 grayscale contrast-125 md:group-hover:grayscale-0 md:group-hover:contrast-100 transition-all duration-1000 ease-[0.16, 1, 0.3, 1]">
             <img
                src={IAN_CONFIG.profileImage}
                loading="lazy"
                decoding="async"
               alt="Ian Smith"
               className="w-full h-full object-cover scale-110 md:group-hover:scale-100 transition-transform duration-1000"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-80" />
          </div>
          <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 z-20">
             <span className="px-3 md:px-4 py-1 md:py-1.5 bg-accent-primary rounded-full text-[8px] md:text-[9px] font-bold tracking-[0.3em] text-white uppercase mb-3 md:mb-4 inline-block shadow-lg">The Architect</span>
             <p className="text-white font-black text-2xl md:text-3xl tracking-tighter uppercase leading-none">{IAN_CONFIG.name}</p>
          </div>
        </SpotlightCard>

        {/* Education Tile */}
        <SpotlightCard className="min-h-[200px] md:min-h-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <span className="text-[9px] md:text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Academic</span>
            <AnimatedIcon>
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-accent-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </AnimatedIcon>
          </div>
          <p className="text-lg md:text-xl font-bold text-white mb-2 tracking-tight leading-snug">Bachelor of Business Computing</p>
          <p className="text-accent-primary font-mono text-xs md:text-sm font-bold tracking-tight">First Class Honors</p>
          <p className="mt-4 text-[9px] md:text-[10px] text-white/20 uppercase tracking-[0.2em]">MUBS, Makerere University</p>
        </SpotlightCard>

        {/* Personality/Values Tile */}
        <SpotlightCard className="min-h-[240px] md:min-h-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <span className="text-[9px] md:text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Talents & Values</span>
            <AnimatedIcon>
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-accent-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
            </AnimatedIcon>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-2.5">
            {(IAN_CONFIG.talents || ["God-fearing", "Family First", "Adaptable", "Football", "Lacrosse", "Basketball"]).map(talent => (
              <span key={talent} className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-widest hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-all cursor-default">
                {talent}
              </span>
            ))}
          </div>
        </SpotlightCard>

        {/* Git Activity Tile */}
        <SpotlightCard className="min-h-[200px] md:min-h-0">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <span className="text-[9px] md:text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Git Throughput</span>
            <AnimatedIcon>
              <Github className="w-5 h-5 md:w-6 md:h-6 text-white/20 group-hover:text-accent-primary transition-colors" />
            </AnimatedIcon>
          </div>
          <GithubMock />
          <p className="mt-6 text-[9px] md:text-[10px] text-white/20 uppercase tracking-widest font-bold">150+ Optimized Commits / Week</p>
        </SpotlightCard>

        {/* Slogan Quote Tile */}
        <SpotlightCard className="md:col-span-2 flex items-center justify-center bg-gradient-to-br from-accent-primary/[0.03] to-transparent min-h-[240px] md:min-h-0">
            <div className="text-center p-2 md:p-6">
                <p className="text-xl md:text-3xl font-light text-white/80 leading-relaxed tracking-tight">"Bridging Intelligence with <br/> <span className="text-accent-primary font-black uppercase italic tracking-tighter">Elite Technical Execution</span>"</p>
                <div className="mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-4">
                  <div className="w-8 md:w-12 h-px bg-white/10" />
                  <p className="text-[8px] md:text-[9px] text-white/20 uppercase tracking-[0.5em] md:tracking-[0.8em] font-black">{IAN_CONFIG.slogan}</p>
                  <div className="w-8 md:w-12 h-px bg-white/10" />
                </div>
            </div>
        </SpotlightCard>
      </div>
    </section>
  );
};

export default BentoGrid;
