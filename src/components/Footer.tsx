import React from 'react';
import { cn } from '@/lib/utils';
import { Github, Twitter, Heart, Code } from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn(
      "w-full py-10 px-6 border-t border-border/60",
      "bg-gradient-to-b from-background/80 to-background",
      "backdrop-blur-sm supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-primary/10 mr-2">
              <span className="text-xl font-bold text-primary">b</span>
            </div>
            <h3 className="text-lg font-semibold">beaUX</h3>
          </div>
          <p className="mt-3 text-muted-foreground text-sm text-center md:text-left">
            The beautiful developer experience for React and React Native
          </p>
          <div className="mt-5 flex space-x-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github size={20} />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter size={20} />
            </a>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-base font-semibold mb-4">Navigation</h3>
          <ul className="space-y-2">
            <li>
              <a 
                href="#react-native" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                React Native Playground
              </a>
            </li>
            <li>
              <a 
                href="#diagram" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Visual Architecture Designer
              </a>
            </li>
            <li>
              <a 
                href="#react-web" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                React Web Studio
              </a>
            </li>
          </ul>
        </div>
        
        {/* Canvas-inspired Element */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-base font-semibold mb-4">Canvas</h3>
          <div className="w-full max-w-xs h-32 rounded-md bg-muted p-4 relative overflow-hidden grid place-items-center">
            {/* Canvas dots pattern */}
            <div className="absolute inset-0 opacity-10 grid-pattern"></div>
            
            {/* Sample nodes inspired by DiagramEditor */}
            <div className="absolute left-[20%] top-[30%] w-16 h-10 rounded-md bg-primary/80 shadow-md flex items-center justify-center text-white text-xs font-medium">
              Component
            </div>
            <div className="absolute right-[20%] top-[50%] w-16 h-10 rounded-md bg-purple-500/80 shadow-md flex items-center justify-center text-white text-xs font-medium">
              Hook
            </div>
            
            {/* Connection line */}
            <div className="absolute left-[36%] top-[35%] w-[30%] h-0.5 bg-slate-400 rotate-12"></div>
          </div>
        </div>
      </div>
      
      <div className="mt-10 pt-6 border-t border-border/30 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} beaUX. All rights reserved.</p>
        <div className="flex items-center mt-4 md:mt-0">
          <span className="flex items-center">
            Made with <Heart size={14} className="mx-1 text-red-500" /> using React
          </span>
          <span className="mx-2">•</span>
          <a 
            href="#" 
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Code size={14} className="mr-1" /> Open Source
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
