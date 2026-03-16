
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Briefcase, Cpu, Mail, Globe, Star, Newspaper } from 'lucide-react';
import { IAN_CONFIG } from '../constants';
import AnimatedIcon from './AnimatedIcon';

interface SidebarProps {
  onStartProject: () => void;
  currentPage?: 'home' | 'news';
  onPageChange?: (page: 'home' | 'news') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onStartProject, currentPage = 'home', onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Identity', href: '#about', icon: <Home className="w-5 h-5" />, type: 'scroll' as const },
    { name: 'Portfolio', href: '#projects', icon: <Briefcase className="w-5 h-5" />, type: 'scroll' as const },
    { name: 'The Stack', href: '#stack', icon: <Cpu className="w-5 h-5" />, type: 'scroll' as const },
    { name: 'News & Markets', href: 'news', icon: <Newspaper className="w-5 h-5" />, type: 'page' as const },
    { name: 'Inquiry', href: '#contact', icon: <Mail className="w-5 h-5" />, type: 'scroll' as const },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setIsOpen(false);
    
    if (item.type === 'page') {
      // Handle page navigation
      if (onPageChange) {
        onPageChange(item.href as 'home' | 'news');
      }
    } else {
      // Handle scroll navigation - only works on home page
      if (currentPage !== 'home' && onPageChange) {
        // If we're not on home page, go to home first
        onPageChange('home');
        // Then scroll after a brief delay to allow page to load
        setTimeout(() => {
          const element = document.querySelector(item.href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // We're on home page, scroll directly
        const element = document.querySelector(item.href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <>
      <div className="fixed top-8 right-8 z-[60] md:top-12 md:right-12">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-2xl group"
        >
          <AnimatedIcon isClicked={isOpen}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />}
          </AnimatedIcon>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[58]"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-space-900 border-l border-white/10 z-[59] shadow-2xl p-12 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 text-3xl font-black tracking-tighter text-white mb-20">
                  <AnimatedIcon>
                    <Star className="w-8 h-8 fill-white text-white" />
                  </AnimatedIcon>
                  <span>{IAN_CONFIG.brand}</span>
                </div>

                <nav className="space-y-8">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <button
                        onClick={() => handleNavClick(item)}
                        className={`flex items-center gap-6 text-3xl font-bold transition-all group w-full text-left ${
                          (item.type === 'page' && currentPage === item.href) || 
                          (item.name === 'News & Markets' && currentPage === 'news')
                            ? 'text-accent-primary' 
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <AnimatedIcon className={`group-hover:scale-125 transition-transform ${
                          (item.type === 'page' && currentPage === item.href) || 
                          (item.name === 'News & Markets' && currentPage === 'news')
                            ? 'text-accent-primary' 
                            : 'text-accent-primary'
                        }`}>
                          {item.icon}
                        </AnimatedIcon>
                        <span>{item.name}</span>
                      </button>
                    </motion.div>
                  ))}
                </nav>
              </div>

              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 rounded-3xl bg-accent-primary text-white cursor-pointer hover:shadow-[0_0_40px_rgba(255,77,0,0.4)] transition-all"
                  onClick={() => { setIsOpen(false); onStartProject(); }}
                >
                  <div className="text-sm font-mono uppercase tracking-widest mb-1 opacity-60">Ready to build?</div>
                  <div className="text-2xl font-black">Initialize Project</div>
                </motion.div>

                <div className="flex gap-6 text-white/20">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-mono uppercase tracking-widest">{IAN_CONFIG.location}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
