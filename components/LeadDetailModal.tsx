import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Calendar, Mail, Phone, MessageSquare, User, Briefcase, DollarSign, Clock, Star, AlertTriangle } from 'lucide-react';
import { Lead } from '../types';
import AnimatedIcon from './AnimatedIcon';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: string) => void;
  onUpdatePriority: (leadId: string, priority: string) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ 
  lead, 
  isOpen, 
  onClose, 
  onUpdateStatus, 
  onUpdatePriority 
}) => {
  if (!lead) return null;

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'qualified': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'converted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const dateTime = formatDate(lead.createdAt || lead.timestamp);

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
            className="bg-space-900/90 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-primary/20 rounded-2xl flex items-center justify-center">
                  <AnimatedIcon>
                    <User className="w-6 h-6 text-accent-primary" />
                  </AnimatedIcon>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">{lead.name}</h2>
                  <p className="text-white/40 text-sm font-mono">{lead.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-120px)] space-y-8">
              {/* Status and Priority Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Status</label>
                  <select
                    value={lead.status || 'new'}
                    onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-primary/50 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Priority</label>
                  <select
                    value={lead.priority || 'medium'}
                    onChange={(e) => onUpdatePriority(lead.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent-primary/50 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Lead Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <User className="w-5 h-5 text-accent-primary" />
                    Contact Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                      <Mail className="w-5 h-5 text-accent-primary shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Email</p>
                        <p className="text-white font-mono">{lead.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                      <Calendar className="w-5 h-5 text-accent-primary shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Received</p>
                        <p className="text-white">{dateTime.date}</p>
                        <p className="text-white/60 text-sm">{dateTime.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                      <Briefcase className="w-5 h-5 text-accent-primary shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Type</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                          lead.type === 'project' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {lead.type === 'project' ? 'Project Request' : 'General Inquiry'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-accent-primary" />
                    Project Details
                  </h3>

                  <div className="space-y-4">
                    {lead.projectType && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Project Type</p>
                        <p className="text-white">{lead.projectType}</p>
                      </div>
                    )}

                    {lead.budget && (
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                        <DollarSign className="w-5 h-5 text-green-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Budget</p>
                          <p className="text-white font-bold">{lead.budget}</p>
                        </div>
                      </div>
                    )}

                    {lead.timeline && (
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                        <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Timeline</p>
                          <p className="text-white">{lead.timeline}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getStatusColor(lead.status || 'new')}`}>
                        {lead.status || 'new'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getPriorityColor(lead.priority || 'medium')}`}>
                        {lead.priority || 'medium'} Priority
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {lead.aiAnalysis && (
                <div className="p-6 bg-accent-primary/5 rounded-2xl border border-accent-primary/10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <Star className="w-5 h-5 text-accent-primary" />
                    AI Analysis
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-accent-primary mb-2">Summary</p>
                      <p className="text-white/80 italic leading-relaxed">"{lead.aiAnalysis.summary}"</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">
                        {lead.aiAnalysis.category}
                      </span>
                      {lead.aiAnalysis.priority && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          lead.aiAnalysis.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          lead.aiAnalysis.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          AI Priority: {lead.aiAnalysis.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-accent-primary" />
                  Message Content
                </h3>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{lead.message}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="text-white/40 text-sm">
                Lead ID: <span className="font-mono text-white/60">{lead.id}</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-accent-primary text-white font-bold rounded-xl hover:bg-accent-primary/80 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Leads
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadDetailModal;