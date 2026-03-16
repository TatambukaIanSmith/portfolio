import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

interface ThreeJSPortfolioProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThreeJSPortfolio: React.FC<ThreeJSPortfolioProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // Three.js implementation would go here
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Placeholder 3D-like animation
      let frame = 0;
      const animate = () => {
        if (!isRotating) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw rotating cube placeholder
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = 100 * zoom;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(frame * 0.02);
        
        // Draw cube faces
        ctx.fillStyle = '#ff4d00';
        ctx.fillRect(-size/2, -size/2, size, size);
        
        ctx.fillStyle = '#ff6d20';
        ctx.fillRect(-size/2 + 20, -size/2 + 20, size, size);
        
        ctx.restore();
        
        frame++;
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  }, [isOpen, isRotating, zoom]);

  const projects3D = [
    {
      id: 1,
      title: "E-Commerce Platform",
      description: "Full-stack Laravel application with 3D product visualization",
      tech: ["Laravel", "Three.js", "MySQL", "Vue.js"],
      model: "ecommerce-model"
    },
    {
      id: 2,
      title: "Real Estate Portal",
      description: "Interactive property tours with 3D floor plans",
      tech: ["React", "Three.js", "Node.js", "MongoDB"],
      model: "realestate-model"
    },
    {
      id: 3,
      title: "Portfolio Dashboard",
      description: "3D data visualization and analytics platform",
      tech: ["TypeScript", "Three.js", "D3.js", "PostgreSQL"],
      model: "dashboard-model"
    }
  ];

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
            className="relative w-full max-w-7xl h-[90vh] bg-space-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex overflow-hidden"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 bg-white/[0.01] border-b border-white/5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-black tracking-tight">3D Portfolio Showcase</h2>
                <p className="text-white/40 text-sm">Interactive Three.js Project Presentations</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {isRotating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setZoom(1); setIsRotating(true); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>
            </div>

            <div className="flex w-full pt-20">
              {/* Project List */}
              <div className="w-80 border-r border-white/5 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold mb-6">3D Projects</h3>
                <div className="space-y-4">
                  {projects3D.map((project) => (
                    <div key={project.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-primary/20 transition-all cursor-pointer group">
                      <h4 className="font-bold mb-2 group-hover:text-accent-primary transition-colors">{project.title}</h4>
                      <p className="text-white/60 text-sm mb-3 leading-relaxed">{project.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {project.tech.map((tech) => (
                          <span key={tech} className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold text-white/40">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3D Viewer */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full"
                  />
                  
                  {/* 3D Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10">
                      <span className="text-white/60 text-sm">Click and drag to rotate • Scroll to zoom</span>
                    </div>
                    <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10">
                      <span className="text-white/60 text-sm">Zoom: {(zoom * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="mt-6 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                  <h4 className="text-xl font-bold mb-2">E-Commerce Platform</h4>
                  <p className="text-white/60 mb-4">Interactive 3D product visualization with real-time rendering and physics simulation. Built with Three.js and integrated with Laravel backend for seamless product management.</p>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 bg-accent-primary text-white font-bold rounded-xl hover:bg-accent-primary/80 transition-colors">
                      View Live Demo
                    </button>
                    <button className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                      View Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ThreeJSPortfolio;