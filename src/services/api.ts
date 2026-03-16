/**
 * API Service for Ian Smith Portfolio
 * Handles all backend API communications
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  message: string;
  type: 'contact' | 'project';
  projectType?: string;
  budget?: string;
  source?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  type: 'contact' | 'project';
  projectType?: string;
  budget?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  priority: 'low' | 'medium' | 'high';
  source: string;
  aiAnalysis?: {
    priority: 'High' | 'Medium' | 'Low';
    summary: string;
    category: string;
  };
  timestamp: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  recentCount: number;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Lead Management
  async createLead(leadData: CreateLeadRequest): Promise<ApiResponse<Lead>> {
    return this.request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify({
        ...leadData,
        source: leadData.source || 'website',
        timestamp: Date.now(),
      }),
    });
  }

  async getLeads(filters?: {
    type?: 'contact' | 'project';
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/leads?${queryString}` : '/leads';
    
    return this.request(endpoint);
  }

  async getLeadById(id: string): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`);
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async getLeadStats(): Promise<ApiResponse<LeadStats>> {
    return this.request<LeadStats>('/leads/stats');
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }

  // Utility method to check if backend is available
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await this.healthCheck();
      return response.success;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;