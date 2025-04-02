import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  // Rotating text animation
  const rotatingWords = ["supercharges", "organizes", "empowers", "visualizes"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [activeSection, setActiveSection] = useState('visual-architect');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length);
        setIsAnimating(true);
      }, 500); // Wait for fade out before changing word
    }, 3000); // Change word every 3 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsMenuOpen(false); // Close menu after selection
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <header className={cn(
      "w-full py-4 px-6 flex items-center justify-between border-b border-border/60",
      "backdrop-blur-sm bg-background/70 supports-[backdrop-filter]:bg-background/60",
      "transition-all duration-200 ease-in-out z-50 sticky top-0",
      className
    )}>
      <div className="flex items-center">
        {/* beaUX Logo - Elegant and Minimalist */}
        <Link to="/" className="flex items-center group">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-purple-500 hover:from-purple-500 hover:via-cyan-400 hover:to-primary transition-all duration-700">
            beaUX
          </h1>
          <div className="absolute -bottom-1 w-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 group-hover:w-full transition-all duration-700"></div>
        </Link>
        
        {/* Rotating text animation - Minimalist */}
        <div className="flex items-center ml-4">
          <div className="relative h-6 overflow-hidden">
            <span 
              className={cn(
                "absolute transition-all duration-500 transform min-w-24 text-center text-sm",
                isAnimating 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 -translate-y-6"
              )}
              style={{ color: '#00E5C7' }}
            >
              {rotatingWords[currentWordIndex]}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium">
            Beta
          </span>
        </div>
        
        {/* Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-background rounded-md shadow-lg border border-border/60 overflow-hidden z-50">
          <div className="py-1">
            <button 
              onClick={() => scrollToSection('visual-architect')}
              className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors",
                activeSection === 'visual-architect' 
                  ? "bg-purple-500/5 text-purple-400 font-medium" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              The Visual Architect
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
