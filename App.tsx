
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Send, CheckCircle2, Phone, Instagram, Twitter, Youtube, Github, MessageCircle, Play, Loader2, PhoneCall, Star, ShieldCheck, Globe, Newspaper, Menu, X } from 'lucide-react';

import CustomCursor from './components/CustomCursor';
import MagneticButton from './components/MagneticButton';
import BentoGrid from './components/BentoGrid';
import InteractiveWorkflow from './components/InteractiveWorkflow';
import TechStack from './components/TechStack';
import Metrics from './components/Metrics';
import ProjectModal from './components/ProjectModal';
import Sidebar from './components/Sidebar';
import DigitalBusinessCard from './components/DigitalBusinessCard';
import AdminPanel from './components/AdminPanel';
import AnimatedIcon from './components/AnimatedIcon';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AdminAuth from './components/AdminAuth';
import ChatWidget from './components/ChatWidget';
import NewsAndMarkets from './components/NewsAndMarkets';
import { IAN_CONFIG, PROJECTS } from './constants';
import { useLeads } from './src/hooks/useLeads';
import { usePhoneCalls } from './src/hooks/usePhoneCalls';

// Audio decoding utilities as per guidelines
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isInitializingAudio, setIsInitializingAudio] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting'>('idle');
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsOfServiceOpen, setIsTermsOfServiceOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'news'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Lead management hook
  const { createLead, isLoading } = useLeads();
  
  // Phone call management hook
  const { createPhoneCall, isLoading: isPhoneCallLoading } = usePhoneCalls();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const playAcousticChime = (ctx: AudioContext) => {
    const now = ctx.currentTime;
    const frequencies = [440, 554.37, 659.25, 880];
    
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (index * 0.05));
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 1.5);
      gain.gain.setValueAtTime(0, now + (index * 0.05));
      gain.gain.linearRampToValueAtTime(0.15, now + (index * 0.05) + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + (index * 0.05));
      osc.stop(now + 2);
    });
  };

  const playWelcomeAudio = useCallback(async () => {
    if (isInitializingAudio) return;
    setIsInitializingAudio(true);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    playAcousticChime(audioCtx);

    try {
      const { GoogleGenAI, Modality } = await import("@google/genai");
      const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
      
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: 'Terminal Synchronized. Welcome to the digital identity of Ian Smith. Engineering Excellence initiated.' }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioBuffer = await decodeAudioData(
            decodeBase64(base64Audio),
            audioCtx,
            24000,
            1
          );
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          source.start(audioCtx.currentTime + 1.2);
        }
      }
    } catch (err) {
      console.error("Audio initialization failed:", err);
    } finally {
      setIsInitializingAudio(false);
    }
  }, [isInitializingAudio]);

  const startExperience = () => {
    setHasStarted(true);
    playWelcomeAudio();
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    
    try {
      const result = await createLead({
        name: contactName,
        email: contactEmail,
        message: contactMessage,
        type: 'contact',
        source: 'website'
      });

      if (result.success) {
        setFormState('success');
        console.log('Lead created successfully:', result.lead);
        if (result.usedFallback) {
          console.warn('Used localStorage fallback - backend may be unavailable');
        }
      } else {
        console.error('Failed to create lead:', result.error);
        setFormState('idle');
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Unexpected error during lead creation:', error);
      setFormState('idle');
    }
  };

  const openModal = () => setIsModalOpen(true);

  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handlePhoneCall = async () => {
    setCallStatus('connecting');
    
    try {
      // Create phone call request in backend
      const result = await createPhoneCall({
        call_type: 'direct',
        source: 'floating_menu',
      });

      if (result.success) {
        console.log('Phone call request created:', result.phoneCall);
        if (result.usedFallback) {
          console.warn('Used localStorage fallback - backend may be unavailable');
        }
      } else {
        console.error('Failed to create phone call request:', result.error);
      }
    } catch (error) {
      console.error('Unexpected error during phone call request:', error);
    }

    // Initiate the actual phone call
    window.location.href = `tel:${IAN_CONFIG.phone}`;
    setTimeout(() => {
      setCallStatus('idle');
      setIsFloatingMenuOpen(false);
    }, 3000);
  };

  const handleInstagramCall = async () => {
    setCallStatus('connecting');
    
    try {
      // Create Instagram call request in backend
      const result = await createPhoneCall({
        call_type: 'instagram',
        source: 'floating_menu',
      });

      if (result.success) {
        console.log('Instagram call request created:', result.phoneCall);
        if (result.usedFallback) {
          console.warn('Used localStorage fallback - backend may be unavailable');
        }
      } else {
        console.error('Failed to create Instagram call request:', result.error);
      }
    } catch (error) {
      console.error('Unexpected error during Instagram call request:', error);
    }

    // Open Instagram
    window.open(`https://ig.me/m/${IAN_CONFIG.socials.instagram}`, '_blank');
    setTimeout(() => {
      setCallStatus('idle');
      setIsFloatingMenuOpen(false);
    }, 1000);
  };

  // Check if user is authenticated for admin access
  const isAdminAuthenticated = () => {
    const authStatus = sessionStorage.getItem('admin_authenticated');
    const authTime = sessionStorage.getItem('admin_auth_time');
    
    if (!authStatus || !authTime) return false;
    
    // Session expires after 4 hours
    const fourHours = 4 * 60 * 60 * 1000;
    const isExpired = Date.now() - parseInt(authTime) > fourHours;
    
    if (isExpired) {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_auth_time');
      return false;
    }
    
    return authStatus === 'true';
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated()) {
      setIsAdminOpen(true);
    } else {
      setIsAdminAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-accent-primary selection:text-white bg-space-950 text-white overflow-x-hidden">
      <CustomCursor />
      
      <AnimatePresence>
        {!hasStarted && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
            className="fixed inset-0 z-[200] bg-space-950 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="max-w-md"
            >
              <div className="flex items-center justify-center gap-3 text-3xl font-black tracking-tighter mb-4">
                <AnimatedIcon>
                  <Star className="w-8 h-8 fill-white text-white" />
                </AnimatedIcon>
                <span>IAN<span className="text-accent-primary">SMITH</span></span>
              </div>
              <div className="w-12 h-px bg-white/10 mx-auto mb-8" />
              <button 
                onClick={startExperience}
                className="group relative px-10 py-5 bg-white text-black font-bold rounded-full overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-3 text-sm tracking-widest uppercase">
                  Initialize Terminal 
                  <AnimatedIcon isClicked={hasStarted}>
                    <Play className="w-4 h-4 fill-black" />
                  </AnimatedIcon>
                </span>
                <div className="absolute inset-0 bg-accent-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
              <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Encrypted Identity Access</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <AdminAuth 
        isOpen={isAdminAuthOpen} 
        onClose={() => setIsAdminAuthOpen(false)}
        onAuthenticated={() => setIsAdminOpen(true)}
      />
      <PrivacyPolicy isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <TermsOfService isOpen={isTermsOfServiceOpen} onClose={() => setIsTermsOfServiceOpen(false)} />

      {/* Floating Hub Action */}
      <AnimatePresence>
        {isScrolled && hasStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="fixed bottom-8 left-8 z-[60] flex flex-col-reverse items-center gap-4"
          >
            <button
              onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
              className="w-16 h-16 bg-accent-primary backdrop-blur-2xl border border-white/20 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all shadow-[0_20px_50px_rgba(255,77,0,0.3)] group relative"
            >
              <AnimatedIcon isClicked={isFloatingMenuOpen}>
                <PhoneCall className={`w-7 h-7 transition-transform duration-500 ${isFloatingMenuOpen ? 'rotate-45' : ''}`} />
              </AnimatedIcon>
              <div className="absolute inset-0 rounded-full bg-accent-primary animate-ping opacity-20 pointer-events-none" />
            </button>

            <AnimatePresence>
              {isFloatingMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  className="flex flex-col gap-3"
                >
                  <button
                    onClick={handlePhoneCall}
                    className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all group relative"
                  >
                    <Phone className="w-6 h-6" />
                    <span className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Direct Phone</span>
                  </button>
                  <button
                    onClick={handleInstagramCall}
                    className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all group relative"
                  >
                    <Instagram className="w-6 h-6" />
                    <span className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Instagram Call</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <Sidebar 
        onStartProject={openModal} 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${isScrolled ? 'bg-space-900/60 backdrop-blur-2xl py-3 md:py-4 border-b border-white/5' : 'bg-transparent py-6 md:py-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 text-xl md:text-2xl font-black tracking-tighter text-white cursor-pointer group" onClick={() => setCurrentPage('home')}>
            <AnimatedIcon>
              <Star className="w-5 h-5 md:w-6 md:h-6 fill-white text-white" />
            </AnimatedIcon>
            <span>IAN<span className="text-accent-primary group-hover:pl-1 transition-all">SMITH</span></span>
          </div>
          <div className="hidden lg:flex gap-10 text-[13px] font-semibold text-white/40 items-center uppercase tracking-widest">
            {currentPage === 'home' ? (
              <>
                <button onClick={() => scrollToSection('#about')} className="hover:text-white transition-colors duration-300">Identity</button>
                <button onClick={() => scrollToSection('#projects')} className="hover:text-white transition-colors duration-300">Portfolio</button>
                <button onClick={() => scrollToSection('#stack')} className="hover:text-white transition-colors duration-300">The Stack</button>
                <button onClick={() => setCurrentPage('news')} className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  News & Markets
                </button>
                <button onClick={() => scrollToSection('#contact')} className="hover:text-white transition-colors duration-300">Inquiry</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentPage('home')} className="hover:text-white transition-colors duration-300">← Back to Portfolio</button>
                <div className="w-px h-4 bg-white/20"></div>
                <span className="text-white flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  News & Markets Intelligence
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <MagneticButton onClick={currentPage === 'home' ? openModal : () => setCurrentPage('home')}>
              <div className="px-5 md:px-7 py-2 md:py-2.5 bg-white text-black font-bold rounded-full text-[12px] md:text-sm hover:bg-accent-primary hover:text-white transition-all duration-500 shadow-xl">
                {currentPage === 'home' ? 'Start Project' : 'Portfolio'}
              </div>
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* Main Content - Conditional Rendering */}
      {currentPage === 'home' ? (
        <>
          {/* Hero Section */}
          <header className="relative pt-28 md:pt-44 pb-20 md:pb-32 px-4 md:px-6 max-w-7xl mx-auto text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] md:h-[600px] bg-accent-primary/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10" />

            <motion.div
              initial="hidden"
              animate={hasStarted ? "visible" : "hidden"}
              variants={containerVariants}
            >
              <motion.span variants={itemVariants} className="inline-block px-4 md:px-5 py-1.5 md:py-2 mb-6 md:mb-8 text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-accent-primary bg-accent-primary/10 rounded-full uppercase border border-accent-primary/20">
                {IAN_CONFIG.role} • Specialist
              </motion.span>
              
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1] md:leading-[0.9] mb-8 md:mb-10 text-gradient">
                {"Engineering".split("").map((char, i) => (
                  <motion.span key={i} variants={wordVariants} className="inline-block">{char}</motion.span>
                ))} 
                <br />
                <span className="text-accent-primary italic">
                  {"Digital Excellence.".split(" ").map((word, i) => (
                    <motion.span key={i} variants={wordVariants} className="inline-block mr-4">{word}</motion.span>
                  ))}
                </span>
              </h1>

              <motion.div variants={itemVariants}>
                <p className="text-white/50 text-base md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed mb-6 font-light px-4">
                  Architecting robust full-stack solutions with Laravel 11 and the TALL stack.
                </p>
                <p className="text-white/30 text-sm md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-12 md:mb-16 font-light px-4 italic">
                  Balancing high-level business intelligence with meticulous execution.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center items-center">
                <MagneticButton onClick={() => scrollToSection('#projects')}>
                  <div className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-6 bg-accent-primary text-white font-black rounded-2xl text-lg md:text-xl flex items-center justify-center gap-4 hover:shadow-[0_20px_40px_rgba(255,77,0,0.3)] transition-all duration-500">
                    Explore Portfolio 
                    <AnimatedIcon>
                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                    </AnimatedIcon>
                  </div>
                </MagneticButton>
                <button 
                  onClick={() => scrollToSection('#contact')} 
                  className="text-white/60 font-bold hover:text-white transition-all duration-300 py-4 px-6 relative md:after:absolute md:after:bottom-3 md:after:left-6 md:after:right-6 md:after:h-px md:after:bg-white/20 hover:md:after:bg-accent-primary hover:md:after:scale-x-110"
                >
                  Get in Touch
                </button>
              </motion.div>
            </motion.div>
          </header>

          <Metrics />

          <motion.section 
            id="about"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
            }}
            className="w-full"
          >
            <BentoGrid />
          </motion.section>

          <motion.section 
            id="projects" 
            className="py-20 md:py-32 px-4 md:px-6 max-w-7xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
            }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6 md:gap-8">
              <div>
                <span className="text-accent-primary font-mono tracking-[0.3em] uppercase text-[10px] md:text-xs mb-3 md:mb-5 block">Selected Artifacts</span>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight">Elite Productions.</h2>
              </div>
              <p className="text-white/40 max-w-md text-base md:text-lg font-light italic leading-relaxed">
                Each project is a testament to high-performance architecture and meticulous design standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {PROJECTS.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15, duration: 0.8 }}
                  viewport={{ once: true }}
                  className="group relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white/[0.02] border border-white/5 hover:border-accent-primary/20 transition-all duration-700"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-60" />
                  </div>
                  <div className="p-6 md:p-10">
                    <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                      {project.tech.map(t => (
                        <span key={t} className="px-3 py-1 bg-white/5 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white/40 border border-white/5">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl md:text-4xl font-bold mb-3 md:mb-5 group-hover:text-accent-primary transition-colors duration-500">{project.title}</h3>
                    <p className="text-white/40 leading-relaxed font-light text-sm md:text-lg">
                      {project.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <section id="stack" className="w-full">
            <TechStack />
          </section>

          <InteractiveWorkflow />

          {/* Business Card Section */}
          <section className="bg-space-900/50">
            <DigitalBusinessCard />
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-24 md:py-40 bg-white/[0.01] border-y border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(255,77,0,0.05),transparent_40%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
            }}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8 md:mb-10 tracking-tighter leading-[1] md:leading-[0.9]">Ready for <br/><span className="text-accent-primary italic">Initialization?</span></h2>
            <p className="text-white/40 text-lg md:text-xl mb-12 md:mb-16 max-w-md font-light leading-relaxed">
              Whether it's a legacy migration or a greenfield SaaS architecture, I'm ready to bring intelligence and balance to your vision.
            </p>
            
            <div className="space-y-6 md:space-y-8">
              <a href={`tel:${IAN_CONFIG.phone}`} className="flex items-center gap-4 md:gap-6 text-white/50 hover:text-white transition-all duration-300 group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent-primary group-hover:text-white group-hover:border-accent-primary transition-all duration-500 shadow-lg shrink-0">
                  <AnimatedIcon>
                    <Phone className="w-5 h-5 md:w-6 md:h-6" />
                  </AnimatedIcon>
                </div>
                <span className="text-xl md:text-2xl font-light tracking-tight truncate">{IAN_CONFIG.phone}</span>
              </a>
              <a href={`mailto:${IAN_CONFIG.email}`} className="flex items-center gap-4 md:gap-6 text-white/50 hover:text-white transition-all duration-300 group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent-primary group-hover:text-white group-hover:border-accent-primary transition-all duration-500 shadow-lg shrink-0">
                  <AnimatedIcon>
                    <Send className="w-5 h-5 md:w-6 md:h-6" />
                  </AnimatedIcon>
                </div>
                <span className="text-xl md:text-2xl font-light tracking-tight truncate">{IAN_CONFIG.email}</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-3 md:gap-4 mt-12 md:mt-20">
              {[
                { icon: <Twitter />, href: `https://x.com/${IAN_CONFIG.socials.x}` },
                { icon: <Instagram />, href: `https://instagram.com/${IAN_CONFIG.socials.instagram}` },
                { icon: <Youtube />, href: `https://youtube.com/@${IAN_CONFIG.socials.youtube}` },
                { icon: <Github />, href: `https://github.com/${IAN_CONFIG.socials.github}` },
                { icon: <MessageCircle />, href: `https://wa.me/${IAN_CONFIG.socials.whatsapp}` },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-accent-primary hover:text-white hover:border-accent-primary transition-all duration-500 hover:-translate-y-1"
                >
                  <AnimatedIcon>
                    {React.cloneElement(social.icon as React.ReactElement, { className: 'w-5 h-5 md:w-6 md:h-6' })}
                  </AnimatedIcon>
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-space-900/40 p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] border border-white/5 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
          >
            {formState === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-10 md:py-12"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 bg-accent-primary/20 rounded-full flex items-center justify-center text-accent-primary mb-8 md:mb-10 shadow-[0_0_50px_rgba(255,77,0,0.3)]">
                  <AnimatedIcon isClicked={true}>
                    <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12" />
                  </AnimatedIcon>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">Transmission Received</h3>
                <p className="text-white/40 text-base md:text-lg font-light leading-relaxed px-4">Ian's AI Assistant is analyzing your message. Transmission verified.</p>
                <button 
                  onClick={() => {
                    setFormState('idle');
                    setContactName('');
                    setContactEmail('');
                    setContactMessage('');
                  }}
                  className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all"
                >
                  Send Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">Your Identity</label>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      required 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:outline-none focus:border-accent-primary/50 focus:bg-white/10 transition-all duration-300 placeholder:text-white/10 text-sm" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">Digital Mail</label>
                    <input 
                      type="email" 
                      placeholder="email@company.com" 
                      required 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:outline-none focus:border-accent-primary/50 focus:bg-white/10 transition-all duration-300 placeholder:text-white/10 text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">Project Brief</label>
                  <textarea 
                    rows={4} 
                    placeholder="Describe the mission and scope..." 
                    required 
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 md:px-6 py-4 md:py-5 focus:outline-none focus:border-accent-primary/50 focus:bg-white/10 transition-all duration-300 placeholder:text-white/10 resize-none text-sm" 
                  />
                </div>
                <button 
                  disabled={isLoading}
                  className="w-full py-5 md:py-6 bg-white text-black font-black rounded-2xl hover:bg-accent-primary hover:text-white transition-all duration-500 flex items-center justify-center gap-4 group shadow-xl active:scale-95 text-base md:text-lg relative overflow-hidden"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full"
                      />
                      <span className="animate-pulse tracking-widest font-mono text-xs uppercase">Processing Lead...</span>
                    </div>
                  ) : (
                    <>
                      Send Transmission 
                      <AnimatedIcon>
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </AnimatedIcon>
                    </>
                  )}
                  {isLoading && (
                    <motion.div 
                      className="absolute bottom-0 left-0 h-1 bg-accent-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                    />
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
        </>
      ) : (
        /* News & Markets Page */
        <NewsAndMarkets />
      )}

      <footer className="py-16 md:py-24 border-t border-white/5 px-4 md:px-6 bg-space-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-20 mb-16 md:mb-20">
            <div className="max-w-md w-full">
              <div className="flex items-center gap-3 text-3xl md:text-4xl font-black tracking-tighter text-white mb-6">
                <AnimatedIcon>
                  <Star className="w-8 h-8 md:w-10 md:h-10 fill-white text-white" />
                </AnimatedIcon>
                <span>IAN<span className="text-accent-primary">SMITH</span>.DEV</span>
              </div>
              <p className="text-accent-primary font-mono text-[9px] md:text-[10px] uppercase tracking-[0.5em] mb-6">"{IAN_CONFIG.slogan}"</p>
              <p className="text-white/30 leading-relaxed mb-8 md:mb-10 italic font-light text-base md:text-lg">
                {IAN_CONFIG.philosophy}
              </p>
              
              {/* Management Terminal Login - Hidden but functional */}
              <button 
                onClick={handleAdminAccess}
                className="group flex items-center gap-2 text-[8px] font-mono text-white/5 uppercase tracking-[0.5em] hover:text-accent-primary transition-all mb-8"
              >
                <ShieldCheck className="w-3 h-3" />
                Management Authorization Required
              </button>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: <Instagram />, href: `https://instagram.com/${IAN_CONFIG.socials.instagram}` },
                  { icon: <Youtube />, href: `https://youtube.com/@${IAN_CONFIG.socials.youtube}` },
                  { icon: <Github />, href: `https://github.com/${IAN_CONFIG.socials.github}` },
                  { icon: <MessageCircle />, href: `https://wa.me/${IAN_CONFIG.socials.whatsapp}` },
                ].map((social, i) => (
                  <a key={i} href={social.href} target="_blank" className="p-3.5 md:p-4 bg-white/5 rounded-2xl text-white/20 hover:text-accent-primary hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 border border-white/5">
                    <AnimatedIcon>
                      {React.cloneElement(social.icon as React.ReactElement, { className: 'w-5 h-5' })}
                    </AnimatedIcon>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 lg:gap-20 w-full lg:w-auto">
              <div>
                <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-6 md:mb-8">Contact Terminal</h4>
                <ul className="space-y-4 md:space-y-5">
                  <li><a href={`mailto:${IAN_CONFIG.email}`} className="text-white/50 hover:text-white transition-colors duration-300 font-light text-sm md:text-base truncate block">{IAN_CONFIG.email}</a></li>
                  <li><a href={`tel:${IAN_CONFIG.phone}`} className="text-white/50 hover:text-white transition-colors duration-300 font-light text-sm md:text-base">Call: {IAN_CONFIG.phone}</a></li>
                  <li><a href={`https://wa.me/${IAN_CONFIG.socials.whatsapp}`} className="text-accent-primary font-bold hover:underline transition-all underline-offset-8 text-sm md:text-base">WhatsApp Direct</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-6 md:mb-8">Digital Identity</h4>
                <ul className="space-y-4 md:space-y-5">
                  <li><a href={`https://x.com/${IAN_CONFIG.socials.x}`} className="text-white/50 hover:text-white transition-colors duration-300 font-light text-sm md:text-base">X: @{IAN_CONFIG.socials.x}</a></li>
                  <li><a href={`https://instagram.com/${IAN_CONFIG.socials.instagram}`} className="text-white/50 hover:text-white transition-colors duration-300 font-light text-sm md:text-base">Instagram: @{IAN_CONFIG.socials.instagram}</a></li>
                  <li><a href={`https://youtube.com/@${IAN_CONFIG.socials.youtube}`} className="text-white/50 hover:text-white transition-colors duration-300 font-light text-sm md:text-base">YouTube Channel</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 md:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 text-white/10 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-center md:text-left">
            <div>© {new Date().getFullYear()} IAN SMITH • crafting the future.</div>
            <div className="flex gap-8 md:gap-12">
              <button 
                onClick={() => setIsPrivacyPolicyOpen(true)}
                className="hover:text-accent-primary transition-colors duration-300"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setIsTermsOfServiceOpen(true)}
                className="hover:text-accent-primary transition-colors duration-300"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      {hasStarted && <ChatWidget />}
    </div>
  );
};

export default App;
