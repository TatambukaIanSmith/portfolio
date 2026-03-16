import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, Building2, User } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';

interface Testimonial {
  id: string;
  client_name: string;
  client_company?: string;
  client_position?: string;
  client_avatar?: string;
  content: string;
  rating: number;
  project_title?: string;
  project_category?: string;
}

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/v1/testimonials/featured');
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.data || []);
      } else {
        // Fallback to sample data if API fails
        setTestimonials(sampleTestimonials);
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      setTestimonials(sampleTestimonials);
    } finally {
      setLoading(false);
    }
  };

  const sampleTestimonials: Testimonial[] = [
    {
      id: '1',
      client_name: 'Sarah Johnson',
      client_company: 'TechStart Inc.',
      client_position: 'CEO',
      content: 'Ian delivered an exceptional e-commerce platform that exceeded our expectations. His attention to detail and technical expertise transformed our business operations completely.',
      rating: 5,
      project_title: 'E-commerce Platform',
      project_category: 'Web Development'
    },
    {
      id: '2',
      client_name: 'Michael Chen',
      client_company: 'Digital Solutions Ltd.',
      client_position: 'CTO',
      content: 'Working with Ian was a game-changer. He built a robust SaaS application with Laravel that handles thousands of users seamlessly. Highly recommended!',
      rating: 5,
      project_title: 'SaaS Application',
      project_category: 'Full-Stack Development'
    },
    {
      id: '3',
      client_name: 'Emily Rodriguez',
      client_company: 'Creative Agency',
      client_position: 'Project Manager',
      content: 'Ian\'s expertise in React and modern web technologies helped us create an award-winning portfolio website. The performance and user experience are outstanding.',
      rating: 5,
      project_title: 'Portfolio Website',
      project_category: 'Frontend Development'
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
      />
    ));
  };

  if (loading) {
    return (
      <section className="py-20 md:py-32 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-white/40">Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 md:py-32 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.03),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="text-accent-primary font-mono tracking-[0.3em] uppercase text-[10px] md:text-xs mb-3 md:mb-5 block">
            Client Testimonials
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            What Clients Say.
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-base md:text-lg font-light italic leading-relaxed">
            Real feedback from clients who've experienced the difference of working with a dedicated engineer.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-space-900/40 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-3xl"
            >
              {/* Quote Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center border border-accent-primary/20">
                  <Quote className="w-8 h-8 text-accent-primary" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex justify-center gap-1 mb-8">
                {renderStars(currentTestimonial.rating)}
              </div>

              {/* Content */}
              <blockquote className="text-xl md:text-2xl font-light leading-relaxed text-center mb-8 text-white/90 italic">
                "{currentTestimonial.content}"
              </blockquote>

              {/* Client Info */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {currentTestimonial.client_avatar ? (
                    <img
                      src={currentTestimonial.client_avatar}
                      alt={currentTestimonial.client_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-white/40" />
                    </div>
                  )}
                  <div className="text-left">
                    <h4 className="font-bold text-white text-lg">{currentTestimonial.client_name}</h4>
                    {currentTestimonial.client_position && (
                      <p className="text-white/60 text-sm">{currentTestimonial.client_position}</p>
                    )}
                  </div>
                </div>

                {currentTestimonial.client_company && (
                  <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                    <Building2 className="w-4 h-4" />
                    <span>{currentTestimonial.client_company}</span>
                  </div>
                )}

                {currentTestimonial.project_title && (
                  <div className="mt-4 inline-block px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-accent-primary border border-accent-primary/20">
                    {currentTestimonial.project_title}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {testimonials.length > 1 && (
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent-primary hover:border-accent-primary transition-all duration-300 group"
              >
                <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-white" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-accent-primary w-8'
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent-primary hover:border-accent-primary transition-all duration-300 group"
              >
                <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Auto-advance */}
        {testimonials.length > 1 && (
          <div className="text-center mt-8">
            <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
              Auto-advancing every 8 seconds
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

// Auto-advance testimonials
const TestimonialsWithAutoAdvance: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  return <Testimonials />;
};

export default TestimonialsWithAutoAdvance;