import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';

interface AdminAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ isOpen, onClose, onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const ADMIN_EMAIL = 'leemeeya851@gmail.com';
  const MAX_ATTEMPTS = 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate authentication delay for security
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
      // Store authentication in sessionStorage (expires when browser closes)
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_auth_time', Date.now().toString());
      
      setIsLoading(false);
      onAuthenticated();
      onClose();
      setEmail('');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`Access denied. Maximum attempts exceeded. Contact system administrator.`);
        // Lock out for 5 minutes
        setTimeout(() => {
          setAttempts(0);
          setError('');
        }, 5 * 60 * 1000);
      } else {
        setError(`Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  // Check if user is already authenticated (session-based)
  const isAuthenticated = () => {
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

  // If already authenticated, directly open admin panel
  React.useEffect(() => {
    if (isOpen && isAuthenticated()) {
      onAuthenticated();
      onClose();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-space-950/95 backdrop-blur-2xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-space-900/90 border border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-primary/20 rounded-2xl flex items-center justify-center">
                  <AnimatedIcon>
                    <Shield className="w-6 h-6 text-accent-primary" />
                  </AnimatedIcon>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">Admin Access</h2>
                  <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Authorization Required</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-primary/20">
                  <Lock className="w-8 h-8 text-accent-primary" />
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Enter authorized email address to access the management terminal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input
                      type="email"
                      placeholder="admin@domain.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading || attempts >= MAX_ATTEMPTS}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-accent-primary/50 focus:bg-white/10 transition-all duration-300 placeholder:text-white/20 text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || attempts >= MAX_ATTEMPTS || !email.trim()}
                  className="w-full py-4 bg-accent-primary text-white font-bold rounded-2xl hover:bg-accent-primary/80 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                      />
                      <span className="font-mono text-sm uppercase tracking-widest">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span className="font-mono text-sm uppercase tracking-widest">
                        {attempts >= MAX_ATTEMPTS ? 'Access Locked' : 'Authenticate'}
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">
                    Security Level: Maximum
                  </p>
                  <p className="text-[9px] text-white/10">
                    Session expires after 4 hours of inactivity
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminAuth;