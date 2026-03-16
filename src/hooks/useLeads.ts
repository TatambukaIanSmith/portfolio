/**
 * Lead Management Hook
 * Handles lead creation with backend API and localStorage fallback
 */

import { useState, useCallback } from 'react';
import { apiService, CreateLeadRequest, Lead } from '../services/api';

interface UseLeadsReturn {
  createLead: (leadData: CreateLeadRequest) => Promise<{
    success: boolean;
    lead?: Lead;
    error?: string;
    usedFallback?: boolean;
  }>;
  isLoading: boolean;
}

export const useLeads = (): UseLeadsReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const createLead = useCallback(async (leadData: CreateLeadRequest) => {
    setIsLoading(true);
    
    try {
      // First, try to create lead via backend API
      const response = await apiService.createLead(leadData);
      
      if (response.success && response.data) {
        setIsLoading(false);
        return {
          success: true,
          lead: response.data,
          usedFallback: false,
        };
      }
      
      // If backend fails, fall back to localStorage
      console.warn('Backend API failed, falling back to localStorage:', response.error);
      return await createLeadFallback(leadData);
      
    } catch (error) {
      console.error('Lead creation failed, using fallback:', error);
      return await createLeadFallback(leadData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLeadFallback = async (leadData: CreateLeadRequest) => {
    try {
      // Create lead object for localStorage (matching the old format)
      const leadId = crypto.randomUUID();
      const lead: Lead = {
        id: leadId,
        name: leadData.name,
        email: leadData.email,
        message: leadData.message,
        type: leadData.type,
        projectType: leadData.projectType,
        budget: leadData.budget,
        status: 'new',
        priority: 'medium',
        source: leadData.source || 'website',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Try to get AI analysis (if Google Gemini is available)
      try {
        const { GoogleGenAI, Type } = await import("@google/genai");
        const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
        
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const analysisResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this inquiry for Ian Smith (Elite Engineer). Provide a JSON analysis including priority (High, Medium, Low), a 1-sentence executive summary, and a category. 
            Name: ${leadData.name}
            Message: ${leadData.message}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  priority: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['priority', 'summary', 'category']
              }
            }
          });

          const analysis = JSON.parse(analysisResponse.text || '{}');
          lead.aiAnalysis = analysis;
          
          // Update priority based on AI analysis
          if (analysis.priority) {
            lead.priority = analysis.priority.toLowerCase() as 'low' | 'medium' | 'high';
          }
        }
      } catch (aiError) {
        console.warn('AI analysis failed, continuing without it:', aiError);
        // Provide simple fallback analysis
        lead.aiAnalysis = {
          priority: 'Medium',
          summary: `${leadData.type === 'project' ? 'Project' : 'Contact'} inquiry from ${leadData.name}`,
          category: 'General Inquiry'
        };
      }

      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem('iansmith_leads') || '[]');
      const updatedLeads = [...existing, lead];
      localStorage.setItem('iansmith_leads', JSON.stringify(updatedLeads));

      return {
        success: true,
        lead,
        usedFallback: true,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create lead',
        usedFallback: true,
      };
    }
  };

  return {
    createLead,
    isLoading,
  };
};

export default useLeads;