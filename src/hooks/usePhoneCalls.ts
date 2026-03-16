/**
 * Phone Call Management Hook
 * Handles phone call requests with backend API and localStorage fallback
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export interface CreatePhoneCallRequest {
  caller_name?: string;
  caller_email?: string;
  caller_phone?: string;
  call_type: 'direct' | 'callback_request' | 'instagram';
  message?: string;
  preferred_time?: string;
  source?: string;
}

export interface PhoneCall {
  id: string;
  caller_name?: string;
  caller_email?: string;
  caller_phone?: string;
  call_type: 'direct' | 'callback_request' | 'instagram';
  message?: string;
  status: 'requested' | 'scheduled' | 'completed' | 'missed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  source: string;
  preferred_time?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  timestamp: number;
  created_at: string;
  updated_at: string;
}

interface UsePhoneCallsReturn {
  createPhoneCall: (phoneCallData: CreatePhoneCallRequest) => Promise<{
    success: boolean;
    phoneCall?: PhoneCall;
    error?: string;
    usedFallback?: boolean;
  }>;
  isLoading: boolean;
}

export const usePhoneCalls = (): UsePhoneCallsReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const createPhoneCall = useCallback(async (phoneCallData: CreatePhoneCallRequest) => {
    setIsLoading(true);
    
    try {
      // First, try to create phone call via backend API
      const response = await fetch(`${API_BASE_URL}/phone-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...phoneCallData,
          source: phoneCallData.source || 'website',
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsLoading(false);
        return {
          success: true,
          phoneCall: data.data,
          usedFallback: false,
        };
      }
      
      // If backend fails, fall back to localStorage
      console.warn('Backend API failed, falling back to localStorage:', data.error);
      return await createPhoneCallFallback(phoneCallData);
      
    } catch (error) {
      console.error('Phone call creation failed, using fallback:', error);
      return await createPhoneCallFallback(phoneCallData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPhoneCallFallback = async (phoneCallData: CreatePhoneCallRequest) => {
    try {
      // Create phone call object for localStorage
      const phoneCallId = crypto.randomUUID();
      const phoneCall: PhoneCall = {
        id: phoneCallId,
        caller_name: phoneCallData.caller_name,
        caller_email: phoneCallData.caller_email,
        caller_phone: phoneCallData.caller_phone,
        call_type: phoneCallData.call_type,
        message: phoneCallData.message,
        status: 'requested',
        priority: phoneCallData.call_type === 'callback_request' ? 'high' : 'medium',
        source: phoneCallData.source || 'website',
        preferred_time: phoneCallData.preferred_time,
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem('iansmith_phone_calls') || '[]');
      const updatedPhoneCalls = [...existing, phoneCall];
      localStorage.setItem('iansmith_phone_calls', JSON.stringify(updatedPhoneCalls));

      return {
        success: true,
        phoneCall,
        usedFallback: true,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create phone call request',
        usedFallback: true,
      };
    }
  };

  return {
    createPhoneCall,
    isLoading,
  };
};

export default usePhoneCalls;