import React from 'react';
import { cn } from '@/lib/utils';
import { Github, Linkedin, Heart, Star } from 'lucide-react';

interface FooterProps {
  className?: string;
}

// Generate random stars for galaxy background
const generateStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 2 + 1; // 1-3px
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const opacity = Math.random() * 0.7 + 0.3; // 0.3-1.0
    const animationDelay = Math.random() * 5;
    stars.push(
      <div 
        key={i}
        className="absolute rounded-full bg-white animate-pulse"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${x}%`,
          top: `${y}%`,
          opacity: opacity,
          animationDelay: `${animationDelay}s`,
        }}
      />
    );
  }
  return stars;
};

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn(
      "w-full py-10 px-6 border-t border-white/10 relative overflow-hidden",
      "bg-black text-white/80",
      className
    )}>
      {/* Galaxy background with stars */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0c0c1d] to-[#0f0923] opacity-90">
        {generateStars(100)}
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center">
            <h3 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-purple-500">beaUX</h3>
          </div>
          <p className="mt-3 text-white/70 text-sm text-center md:text-left">
            The beautiful visual architecture design tool for React developers
          </p>
          <div className="mt-5 flex space-x-4">
            <a 
              href="https://github.com/a-bonus" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-primary transition-colors"
            >
              <Github size={20} />
            </a>
            <a 
              href="https://linkedin.com/in/alainbonus" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white/70 hover:text-primary transition-colors"
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-base font-semibold mb-4 text-white">Navigation</h3>
          <ul className="space-y-2">
            <li>
              <a 
                href="#visual-architect" 
                className="text-white/70 hover:text-primary transition-colors text-sm"
              >
                The Visual Architect
              </a>
            </li>
            <li>
              <a 
                href="https://github.com/a-bonus" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-primary transition-colors text-sm"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
        
        {/* Canvas-inspired Element */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-base font-semibold mb-4 text-white">Canvas</h3>
          <div className="w-full max-w-xs h-32 rounded-md bg-[#121225] p-4 relative overflow-hidden grid place-items-center border border-white/10">
            {/* Canvas dots pattern */}
            <div className="absolute inset-0 opacity-20 grid-pattern"></div>
            
            {/* Sample nodes inspired by DiagramEditor */}
            <div className="absolute left-[20%] top-[30%] w-16 h-10 rounded-md bg-primary/80 shadow-md flex items-center justify-center text-white text-xs font-medium">
              Component
            </div>
            <div className="absolute right-[20%] top-[50%] w-16 h-10 rounded-md bg-purple-500/80 shadow-md flex items-center justify-center text-white text-xs font-medium">
              Hook
            </div>
            
            {/* Connection line */}
            <div className="absolute left-[36%] top-[35%] w-[30%] h-0.5 bg-white/40 rotate-12"></div>
            
            {/* Decorative star */}
            <Star size={16} className="absolute right-3 top-3 text-primary/60" />
          </div>
        </div>
      </div>
      
      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-sm text-white/60 relative z-10">
        <p> {new Date().getFullYear()} beaUX. All rights reserved.</p>
        <div className="flex items-center mt-4 md:mt-0">
          <span className="flex items-center">
            Made with <Heart size={14} className="mx-1 text-red-500" /> for the vibe coders
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
