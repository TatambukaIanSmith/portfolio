import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, MessageSquare, Trash2, CheckCircle, X, Shield, BarChart3, Clock, Database, MessageCircle } from 'lucide-react';
import { Lead } from '../types';
import AnimatedIcon from './AnimatedIcon';
import SystemMetrics from './SystemMetrics';
import AdminChat from './AdminChat';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'leads' | 'analytics' | 'chat'>('leads');

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('iansmith_leads');
      if (stored) {
        setLeads(JSON.parse(stored).sort((a: Lead, b: Lead) => b.timestamp - a.timestamp));
      }
    }
  }, [isOpen]);

  const deleteLead = (id: string) => {
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated);
    localStorage.setItem('iansmith_leads', JSON.stringify(updated));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative w-full max-w-6xl h-[85vh] bg-space-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Sidebar / Header */}
            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Management Terminal</h2>
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Authorized Access Only • v11.0.4</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-white/40" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Navigation */}
              <div className="w-20 md:w-64 border-r border-white/5 p-4 hidden md:flex flex-col gap-2">
                <button 
                  onClick={() => setActiveTab('leads')}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'leads' ? 'bg-accent-primary text-white' : 'text-white/40 hover:bg-white/5'}`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-bold">Lead Pipeline</span>
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'analytics' ? 'bg-accent-primary text-white' : 'text-white/40 hover:bg-white/5'}`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-bold">System Metrics</span>
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'chat' ? 'bg-accent-primary text-white' : 'text-white/40 hover:bg-white/5'}`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">Live Chat</span>
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                {activeTab === 'leads' ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black">Lead Registry <span className="text-white/20 ml-2">{leads.length}</span></h3>
                      <div className="flex gap-2">
                         <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-accent-primary border border-accent-primary/20">LIVE DB: LOCALSTORAGE</span>
                      </div>
                    </div>

                    {leads.length === 0 ? (
                      <div className="py-20 text-center">
                        <Database className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/20 font-mono uppercase tracking-widest">Terminal Empty • Awaiting Inbound Signal</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leads.map((lead) => (
                          <motion.div 
                            layout
                            key={lead.id} 
                            className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${lead.type === 'project' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {lead.type === 'project' ? 'Build Request' : 'Inquiry'}
                                  </span>
                                  {lead.aiAnalysis?.priority === 'High' && (
                                    <span className="animate-pulse px-2 py-0.5 bg-red-500/20 text-red-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-red-500/30">Priority High</span>
                                  )}
                                  <span className="text-white/20 font-mono text-[10px]">{new Date(lead.timestamp).toLocaleString()}</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">{lead.name}</h4>
                                <p className="text-accent-primary text-sm mb-4 font-mono">{lead.email}</p>
                                
                                {lead.aiAnalysis && (
                                  <div className="mb-4 p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/10">
                                    <div className="flex items-center gap-2 mb-2">
                                      <BarChart3 className="w-3 h-3 text-accent-primary" />
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-accent-primary">AI Insight</span>
                                    </div>
                                    <p className="text-sm text-white/70 italic leading-relaxed">"{lead.aiAnalysis.summary}"</p>
                                  </div>
                                )}

                                <p className="text-white/40 text-sm leading-relaxed mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                  {lead.message}
                                </p>

                                {lead.projectType && (
                                  <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest text-white/30">
                                    <span>Scope: <span className="text-white/60">{lead.projectType}</span></span>
                                    <span>Budget: <span className="text-white/60">{lead.budget}</span></span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => deleteLead(lead.id)}
                                  className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button className="p-3 rounded-xl bg-white/5 hover:bg-green-500/20 hover:text-green-400 transition-all">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : activeTab === 'analytics' ? (
                  <div className="space-y-6">
                    <SystemMetrics apiUrl="/api/v1" leadsData={leads} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <AdminChat apiUrl="http://localhost:3000" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdminPanel;