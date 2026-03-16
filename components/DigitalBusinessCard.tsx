
import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { QrCode, UserPlus, Share2, Copy, Check, Smartphone, Mail, Phone, MapPin, PhoneCall, Loader2, Instagram } from 'lucide-react';
import { IAN_CONFIG } from '../constants';
import AnimatedIcon from './AnimatedIcon';
import { usePhoneCalls } from '../src/hooks/usePhoneCalls';

const DigitalBusinessCard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting'>('idle');
  
  // Use phone calls hook for backend integration
  const { createPhoneCall, isLoading } = usePhoneCalls();

  // Holographic tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const downloadVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${IAN_CONFIG.name}
ORG:${IAN_CONFIG.brand}
TITLE:${IAN_CONFIG.role}
TEL;TYPE=CELL:${IAN_CONFIG.phone}
EMAIL:${IAN_CONFIG.email}
ADR;TYPE=WORK:;;Entebbe, Wakiso District;Uganda;;;
URL:https://iansmith.dev
END:VCARD`;
    
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Ian_Smith.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePhoneCall = async () => {
    setCallStatus('connecting');
    
    try {
      // Create phone call request in backend
      const result = await createPhoneCall({
        call_type: 'direct',
        source: 'business_card',
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
    setTimeout(() => {
      window.location.href = `tel:${IAN_CONFIG.phone}`;
      setTimeout(() => setCallStatus('idle'), 2000);
    }, 400);
  };

  const handleInstagramCall = async () => {
    setCallStatus('connecting');
    
    try {
      // Create Instagram call request in backend
      const result = await createPhoneCall({
        call_type: 'instagram',
        source: 'business_card',
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
    setTimeout(() => setCallStatus('idle'), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-20 px-4">
      <div className="text-center">
        <span className="text-accent-primary font-mono tracking-[0.3em] uppercase text-xs mb-4 block">Networking Terminal</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">The Digital <span className="text-accent-primary italic">Pass.</span></h2>
        <p className="text-white/40 max-w-sm mx-auto italic">Hover to explore the holographic finish.</p>
      </div>

      <div 
        className="perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          className="relative w-full max-w-[400px] aspect-[1.6/1] rounded-[2rem] bg-space-900 border border-white/10 shadow-2xl overflow-hidden group cursor-pointer"
        >
          {/* Holographic Overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 via-transparent to-accent-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.1),transparent)]" />
          
          <div className="relative h-full p-8 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-2xl font-black tracking-tighter text-white">
                  IAN<span className="text-accent-primary">SMITH</span>
                </div>
                <div className="text-[10px] font-mono text-accent-primary uppercase tracking-widest">{IAN_CONFIG.role}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                <AnimatedIcon>
                  <QrCode className="w-6 h-6" />
                </AnimatedIcon>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <AnimatedIcon>
                  <Mail className="w-4 h-4 text-accent-primary" />
                </AnimatedIcon>
                <span className="font-light">{IAN_CONFIG.email}</span>
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <AnimatedIcon>
                  <Phone className="w-4 h-4 text-accent-primary" />
                </AnimatedIcon>
                <span className="font-light">{IAN_CONFIG.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <AnimatedIcon>
                  <MapPin className="w-4 h-4 text-accent-primary" />
                </AnimatedIcon>
                <span className="font-light">Entebbe, Uganda</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">Auth ID: IS-851-TERMINAL</div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
              </div>
            </div>
          </div>

          {/* Magnetic Stripe on back (Simulated) */}
          <div className="absolute top-0 right-0 w-32 h-full bg-white/[0.01] skew-x-12 translate-x-16 pointer-events-none" />
        </motion.div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePhoneCall}
            disabled={callStatus === 'connecting' || isLoading}
            className="flex items-center gap-3 px-8 py-4 bg-accent-primary text-white font-bold rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.4)] transition-all duration-500 disabled:opacity-80"
          >
            <AnimatedIcon isClicked={callStatus === 'connecting' || isLoading}>
              {callStatus === 'connecting' || isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneCall className="w-5 h-5" />}
            </AnimatedIcon>
            Phone Call
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstagramCall}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(219,39,119,0.4)] transition-all duration-500"
          >
            <AnimatedIcon>
              <Instagram className="w-5 h-5" />
            </AnimatedIcon>
            IG Direct Call
          </motion.button>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadVCard}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl shadow-xl hover:bg-white/90 transition-all duration-500"
          >
            <AnimatedIcon isClicked={isSaved}>
              {isSaved ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </AnimatedIcon>
            {isSaved ? "Saved" : "Save Contact"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              navigator.clipboard.writeText('https://iansmith.dev');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-500"
          >
            <AnimatedIcon isClicked={copied}>
              {copied ? <Check className="w-5 h-5 text-accent-primary" /> : <Share2 className="w-5 h-5" />}
            </AnimatedIcon>
            {copied ? "Copied" : "Share"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default DigitalBusinessCard;
