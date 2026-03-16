export interface Testimonial {
  id: string;
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_position?: string;
  client_avatar?: string;
  content: string;
  rating: number;
  project_title?: string;
  project_category?: string;
  is_featured: boolean;
  is_approved: boolean;
  display_order: number;
  source: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTestimonialData {
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_position?: string;
  client_avatar?: string;
  content: string;
  rating: number;
  project_title?: string;
  project_category?: string;
  is_featured?: boolean;
  is_approved?: boolean;
  display_order?: number;
  source?: string;
  project_id?: string;
}

export interface UpdateTestimonialData {
  client_name?: string;
  client_email?: string;
  client_company?: string;
  client_position?: string;
  client_avatar?: string;
  content?: string;
  rating?: number;
  project_title?: string;
  project_category?: string;
  is_featured?: boolean;
  is_approved?: boolean;
  display_order?: number;
  source?: string;
  project_id?: string;
}

export interface TestimonialFilters {
  is_featured?: boolean;
  is_approved?: boolean;
  rating?: number;
  client_company?: string;
  project_category?: string;
  source?: string;
}