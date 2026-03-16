import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, ZoomIn, ZoomOut, Navigation, MapPin, Info, Volume2, VolumeX } from 'lucide-react';

interface VirtualOfficeTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const VirtualOfficeTour: React.FC<VirtualOfficeTourProps> = ({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const officeViews = [
    {
      id: 1,
      name: "Main Workspace",
      description: "Primary development environment with dual monitor setup",
      image: "/api/placeholder/800/400",
      hotspots: [
        { x: 30, y: 40, title: "Development Setup", info: "MacBook Pro M2 with dual 4K monitors for optimal coding experience" },
        { x: 70, y: 60, title: "Reference Library", info: "Technical books and documentation for quick reference" },
        { x: 50, y: 80, title: "Coffee Station", info: "Essential fuel for late-night coding sessions" }
      ]
    },
    {
      id: 2,
      name: "Meeting Area",
      description: "Client consultation and video conference space",
      image: "/api/placeholder/800/400",
      hotspots: [
        { x: 40, y: 50, title: "Conference Setup", info: "Professional lighting and audio for client meetings" },
        { x: 60, y: 30, title: "Whiteboard", info: "For sketching out project architectures and workflows" },
        { x: 20, y: 70, title: "Presentation Display", info: "Large monitor for project demos and presentations" }
      ]
    },
    {
      id: 3,
      name: "Creative Corner",
      description: "Design and brainstorming space with inspiration wall",
      image: "/api/placeholder/800/400",
      hotspots: [
        { x: 25, y: 35, title: "Design Workstation", info: "Graphics tablet and color-calibrated monitor for UI/UX work" },
        { x: 75, y: 45, title: "Inspiration Wall", info: "Collection of design trends and project inspirations" },
        { x: 50, y: 75, title: "Sketch Area", info: "Traditional pen and paper for initial concept sketches" }
      ]
    },
    {
      id: 4,
      name: "Server Room",
      description: "Local development and testing infrastructure",
      image: "/api/placeholder/800/400",
      hotspots: [
        { x: 40, y: 40, title: "Development Servers", info: "Local testing environment with multiple OS configurations" },
        { x: 60, y: 55, title: "Network Equipment", info: "High-speed networking for seamless development workflow" },
        { x: 30, y: 70, title: "Backup Systems", info: "Redundant storage and backup solutions for data security" }
      ]
    }
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    
    setRotation(x);
  };

  const resetView = () => {
    setRotation(0);
    setZoom(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative w-full max-w-7xl h-[90vh