import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network, 
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Palette,
  Layout,
  Clock,
  Bell,
  BellOff,
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  Target,
  MessageSquare,
  BarChart3,
  PieChart,
  Calendar,
  Zap
} from 'lucide-react';

interface SystemMetrics {
  cpu: {
    usage_percent: number;
    load_average: number[];
  };
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    usage_percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
  };
  network: {
    connections_active: number;
    requests_per_minute: number;
  };
  application: {
    uptime_seconds: number;
    response_time_avg_ms: number;
    error_rate_percent: number;
  };
  database: {
    connections_active: number;
    connections_max: number;
    query_time_avg_ms: number;
    queries_per_minute: number;
  };
}

interface SystemMetricsProps {
  apiUrl?: string;
  leadsData?: any[];
}

export default function SystemMetrics({ 
  apiUrl = '/api/v1',
  leadsData = []
}: SystemMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leadAnalytics, setLeadAnalytics] = useState<any>(null);

  const calculateLeadAnalytics = () => {
    // Get leads from localStorage if no leadsData provided
    const leads = leadsData.length > 0 ? leadsData : (() => {
      const stored = localStorage.getItem('iansmith_leads');
      return stored ? JSON.parse(stored) : [];
    })();

    if (leads.length === 0) {
      return {
        totalLeads: 0,
        recentLeads: 0,
        conversionRate: 0,
        highPriorityLeads: 0,
        byStatus: {},
        byType: {},
        byPriority: {},
        recentActivity: []
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentLeads = leads.filter((lead: any) => 
      new Date(lead.timestamp || lead.created_at) > weekAgo
    );
    
    const byStatus = leads.reduce((acc: Record<string, number>, lead: any) => {
      const status = lead.status || 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const byType = leads.reduce((acc: Record<string, number>, lead: any) => {
      const type = lead.type || 'contact';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const byPriority = leads.reduce((acc: Record<string, number>, lead: any) => {
      const priority = lead.priority || lead.aiAnalysis?.priority?.toLowerCase() || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    const convertedLeads = byStatus.converted || byStatus.closed || 0;
    const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;
    const highPriorityLeads = byPriority.high || 0;
    
    return {
      totalLeads: leads.length,
      recentLeads: recentLeads.length,
      conversionRate,
      highPriorityLeads,
      byStatus,
      byType,
      byPriority,
      recentActivity: leads.slice(0, 5)
    };
  };

  const fetchMetrics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      setError(null);
      
      // Calculate analytics from lead data
      const analytics = calculateLeadAnalytics();
      setLeadAnalytics(analytics);
      setLastUpdated(new Date());
      
    } catch (err) {
      setError(null); // Hide errors as requested
    } finally {
      setLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Remove auto-refresh since we're not fetching real data
    // const interval = setInterval(() => fetchMetrics(), 30000);
    // return () => clearInterval(interval);
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-white/60">Loading system metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // Skip error display, just show loading instead
    return (
      <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-white/60">Loading system metrics...</span>
        </div>
      </div>
    );
  }

  if (!leadAnalytics) {
    return null;
  }

  return (
    <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold text-white">Lead Pipeline Analytics</h2>
            {lastUpdated && (
              <p className="text-sm text-white/40">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchMetrics(true)}
          disabled={isRefreshing}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Leads */}
        <div className="p-4 rounded-lg border bg-white/[0.02] border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="font-medium text-sm text-white">Total Leads</h3>
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-white">
            {leadAnalytics.totalLeads}
          </div>
          <div className="text-xs text-white/60">
            All time leads
          </div>
        </div>

        {/* Recent Leads */}
        <div className="p-4 rounded-lg border bg-white/[0.02] border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h3 className="font-medium text-sm text-white">Recent Leads</h3>
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-white">
            {leadAnalytics.recentLeads}
          </div>
          <div className="text-xs text-white/60">
            Last 7 days
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 rounded-lg border bg-white/[0.02] border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-400" />
              <h3 className="font-medium text-sm text-white">Conversion Rate</h3>
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-white">
            {leadAnalytics.conversionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-white/60">
            Success rate
          </div>
        </div>

        {/* High Priority */}
        <div className="p-4 rounded-lg border bg-white/[0.02] border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="font-medium text-sm text-white">High Priority</h3>
            </div>
          </div>
          <div className="text-2xl font-bold mb-1 text-white">
            {leadAnalytics.highPriorityLeads}
          </div>
          <div className="text-xs text-white/60">
            Urgent leads
          </div>
        </div>
      </div>

      {/* Status and Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Status */}
        <div className="p-4 rounded-lg border bg-white/[0.02] border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">Lead Status</h3>
          <div className="space-y-3">
            {Object.entries(leadAnalytics.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm capitalize text-white/70">{status}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${leadAnalytics.totalLeads > 0 ? ((count as number) / leadAnalytics.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Types */}
        <div className="p-4 rounded-lg border bg-white/[0.02] border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">Lead Types</h3>
          <div className="space-y-3">
            {Object.entries(leadAnalytics.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm capitalize text-white/70">{type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${leadAnalytics.totalLeads > 0 ? ((count as number) / leadAnalytics.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right">{count as number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}