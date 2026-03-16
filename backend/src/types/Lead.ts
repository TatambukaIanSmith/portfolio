export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  type: 'contact' | 'project';
  
  // Project-specific fields
  projectType?: string;
  budget?: string;
  
  // Lead management
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  priority: 'low' | 'medium' | 'high';
  source: string;
  
  // AI Analysis
  aiAnalysis?: {
    priority: 'High' | 'Medium' | 'Low';
    summary: string;
    category: string;
  };
  
  // Timestamps
  timestamp: number; // Original timestamp from frontend
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeadDto {
  name: string;
  email: string;
  message: string;
  type: 'contact' | 'project';
  projectType: string | null;
  budget: string | null;
  source: string;
  timestamp: number | null;
}

export interface UpdateLeadDto {
  name: string | null;
  email: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed' | null;
  priority: 'low' | 'medium' | 'high' | null;
  projectType: string | null;
  budget: string | null;
}

export interface LeadFilters {
  type: 'contact' | 'project' | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed' | null;
  priority: 'low' | 'medium' | 'high' | null;
  source: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  search: string | null; // Search in name, email, or message
}

export interface PaginatedLeads {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}