
export interface Project {
  id: string;
  title: string;
  description: string;
  tech: string[];
  image: string;
}

export interface Metric {
  label: string;
  value: string;
}

export interface Testimonial {
  author: string;
  role: string;
  content: string;
  avatar: string;
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
