import React from 'react';
import { Bot, Wrench, Cpu, Settings } from 'lucide-react';

interface BarryAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animated?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const BarryAvatar: React.FC<BarryAvatarProps> = ({ 
  size = 'md', 
  animated = true,
  showBadge = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    full: 'w-full h-full'
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
    full: 'w-3/4 h-3/4'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Background circle */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-military-green to-military-green/70 shadow-lg" />
      
      {/* Main Barry icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Bot className={`${iconSizeClasses[size]} text-white ${animated ? 'animate-pulse' : ''}`} />
      </div>
      
      {/* Decorative elements for larger sizes */}
      {(size === 'lg' || size === 'xl' || size === 'full') && (
        <>
          <div className="absolute top-2 right-2">
            <Wrench className="w-4 h-4 text-white/60 animate-spin-slow" />
          </div>
          <div className="absolute bottom-2 left-2">
            <Settings className="w-4 h-4 text-white/60 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
          </div>
          <div className="absolute top-2 left-2">
            <Cpu className="w-3 h-3 text-white/50" />
          </div>
        </>
      )}
      
      {/* Online badge */}
      {showBadge && (
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
          <div className="w-full h-full bg-green-400 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

// Large feature card version with full height avatar
export const BarryFeatureAvatar: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-full min-h-[200px] flex items-center justify-center p-6 bg-gradient-to-br from-military-green via-military-green/90 to-military-green/80 ${className}`}>
      {/* Large centered Barry */}
      <div className="relative w-full h-full max-w-[150px] max-h-[150px]">
        <Bot className="w-full h-full text-white/90 drop-shadow-xl" />
        
        {/* Animated decoration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-full border-4 border-white/20 animate-ping" />
        </div>
        
        {/* Corner decorations */}
        <Wrench className="absolute top-0 right-0 w-8 h-8 text-white/70 animate-bounce" />
        <Settings className="absolute bottom-0 left-0 w-8 h-8 text-white/70 animate-spin-slow" />
        <Cpu className="absolute top-0 left-0 w-6 h-6 text-white/60" />
      </div>
      
      {/* Barry label */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="text-white/90 font-bold text-lg tracking-wide">BARRY AI</span>
      </div>
    </div>
  );
};