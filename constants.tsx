
import React from 'react';
import { Github, Cpu, Layout, Server, Database, Layers, Cloud, GraduationCap, Heart, Phone, Instagram, Twitter, Youtube, MessageCircle } from 'lucide-react';
import { Project, Metric, Testimonial } from './types';

export const IAN_CONFIG = {
  name: "Ian Smith",
  shortName: "Ian",
  brand: "IANSMITH.DEV",
  email: "leemeeya851@gmail.com",
  phone: "+256748550372",
  location: "Entebbe, Wakiso district, Uganda",
  role: "Elite Full-Stack Engineer",
  education: "Bachelor of Business Computing (First Class), Makerere University Business School",
  philosophy: "I am a flexible programmer who balances high-level architecture with life's leisure, including football, lacrosse, and basketball. Intelligent, God-fearing, and family-oriented.",
  slogan: "Tell us, let's get it to you.",
  profileImage: "/images/me.jpeg",
  socials: {
    whatsapp: "+256748550372", 
    x: "the_forex_chip",
    instagram: "mr.lee851",
    github: "Tatambuka88",
    youtube: "leeEnterprises2233"
  },
  talents: ["God-fearing", "Family First", "Adaptable", "Football", "Lacrosse", "Basketball"]
};

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'DOCBOOKS PWA',
    description: 'An offline-first medical documentation and digital library system built as a Progressive Web App. Optimized for sub-second synchronization and seamless local-first user experience.',
    tech: ['Laravel 11', 'Livewire 3', 'PWA / Service Workers'],
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'SwiftPay Engine',
    description: 'A robust fintech gateway designed for sub-50ms transaction latency, handling over 1M requests daily with Redis-backed state management and secure encrypted vaults.',
    tech: ['PHP 8.3', 'Redis', 'AWS Cloud Infrastructure'],
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'LogiTrack Global',
    description: 'Real-time logistics and fleet tracking system with interactive geospatial mapping and automated route optimization.',
    tech: ['Livewire 3', 'Google Maps API', 'PostgreSQL'],
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '4',
    title: 'EduSync Platform',
    description: 'A scalable Learning Management System serving 50k+ students, featuring real-time collaborative whiteboards and automated grading.',
    tech: ['Inertia.js', 'Vue 3', 'S3 Storage'],
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1200&auto=format&fit=crop',
  },
];

export const METRICS: Metric[] = [
  { label: 'Uptime Architecture', value: '99.99%' },
  { label: 'Clean Code Commits/Wk', value: '150+' },
  { label: 'Avg System Latency', value: '<50ms' },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    author: 'Sarah Jenkins',
    role: 'CTO @ Veloce',
    content: "Ian's level of polish in the backend logic matches the visual perfection of the frontend. A rare specialist in the TALL stack.",
    avatar: 'https://picsum.photos/seed/sarah/100/100',
  },
  {
    author: 'Mark Thompson',
    role: 'Founder @ ScaleSync',
    content: "Ian transformed our legacy stack into a high-performance asset. Revenue grew 40% post-launch thanks to his architecture.",
    avatar: 'https://picsum.photos/seed/mark/100/100',
  },
];

export const TECH_CATEGORIES = [
  {
    title: 'Backend',
    items: [
      { name: 'Laravel 11', icon: <Server className="w-6 h-6" />, color: '#FF2D20' },
      { name: 'PHP 8.3', icon: <Cpu className="w-6 h-6" />, color: '#777BB4' },
    ]
  },
  {
    title: 'Frontend',
    items: [
      { name: 'Tailwind CSS', icon: <Layout className="w-6 h-6" />, color: '#06B6D4' },
      { name: 'Alpine.js', icon: <Layers className="w-6 h-6" />, color: '#8BC0D0' },
    ]
  },
  {
    title: 'Infrastructure',
    items: [
      { name: 'Forge / Vapor', icon: <Cloud className="w-6 h-6" />, color: '#18B69B' },
      { name: 'AWS Ecosystem', icon: <Database className="w-6 h-6" />, color: '#FF9900' },
    ]
  }
];
