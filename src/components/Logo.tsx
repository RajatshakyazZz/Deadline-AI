import React from 'react';
import { motion } from 'motion/react';

/* 
  DeadlineAI Logo Guidelines:
  ✅ Use on dark backgrounds (#080B14 and similar)
  ✅ Minimum size: 24px for icon, 80px for full logo
  ✅ Always maintain aspect ratio
  ✅ Keep clear space = 1x icon size around logo
  ❌ Don't rotate (except 404 page easter egg)
  ❌ Don't change gradient colors
  ❌ Don't use on light backgrounds without adaptation
  ❌ Don't add drop shadows externally (built-in only)
*/

interface LogoProps {
  size?: number | 'small' | 'medium' | 'large';
  className?: string;
}

interface LogoIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

// 1. LogoIcon Component — Square icon mark only
export const LogoIcon: React.FC<LogoIconProps> = ({ size = 48, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      id="deadlineai-logo-icon"
    >
      <defs>
        {/* Main gradient */}
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#63B3ED" />
          <stop offset="100%" stopColor="#9F7AEA" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Inner shadow filter */}
        <filter id="innerShadow">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Layer 1: Squircle background */}
      <path
        d="M24 2 C10 2 2 10 2 24 C2 38 10 46 24 46 C38 46 46 38 46 24 C46 10 38 2 24 2Z"
        fill="url(#logoGrad)"
      />
      
      {/* Glass sheen on squircle */}
      <path
        d="M24 3 C11 3 3 11 3 24 C3 15 11 5 24 5 C37 5 45 13 45 24 C45 11 37 3 24 3Z"
        fill="rgba(255,255,255,0.15)"
      />
      
      {/* Layer 2: Clock ring */}
      <circle
        cx="24" cy="24" r="14"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Clock tick marks (12, 3, 6, 9 positions) */}
      <line x1="24" y1="11" x2="24" y2="13.5" 
            stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="37" y1="24" x2="34.5" y2="24" 
            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="37" x2="24" y2="34.5" 
            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="11" y1="24" x2="13.5" y2="24" 
            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Layer 3: Lightning bolt — main icon */}
      <path
        d="M27 10 L18 25 L23 25 L21 38 L30 23 L25 23 Z"
        fill="white"
        filter="url(#glow)"
      />
      
      {/* Layer 4: Alert dot (bottom right) */}
      <circle
        cx="34" cy="34" r="5"
        fill="#FC8181"
      />
      {/* White inner dot for depth */}
      <circle
        cx="34" cy="34" r="2.5"
        fill="rgba(255,255,255,0.9)"
      />
    </svg>
  );
};

// Helpers for size resolution
const resolveSizes = (size: LogoProps['size']) => {
  if (typeof size === 'number') {
    return {
      iconSize: size,
      textSizeClass: size >= 64 ? 'text-3xl' : size >= 40 ? 'text-xl' : 'text-base',
      customTextStyle: { fontSize: `${size * 0.5}px` }
    };
  }

  switch (size) {
    case 'small':
      return { iconSize: 28, textSizeClass: 'text-base', customTextStyle: {} };
    case 'large':
      return { iconSize: 64, textSizeClass: 'text-3xl', customTextStyle: {} };
    case 'medium':
    default:
      return { iconSize: 40, textSizeClass: 'text-xl', customTextStyle: {} };
  }
};

// 2. LogoFull — Icon + "DeadlineAI" wordmark horizontal
export const LogoFull: React.FC<LogoProps> = ({ size = 'medium', className = '' }: LogoProps) => {
  const { iconSize, textSizeClass, customTextStyle } = resolveSizes(size);
  
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="deadlineai-logo-full">
      <LogoIcon size={iconSize} />
      <span 
        className={`${textSizeClass} font-bold tracking-tight text-[#F7FAFC] font-sans flex items-center`}
        style={{ letterSpacing: '-0.03em', ...customTextStyle }}
      >
        Deadline
        <span className="bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent font-extrabold ml-px">
          AI
        </span>
      </span>
    </div>
  );
};

// 3. LogoStacked — Icon above wordmark (vertical)
export const LogoStacked: React.FC<LogoProps> = ({ size = 'medium', className = '' }: LogoProps) => {
  const { iconSize, textSizeClass, customTextStyle } = resolveSizes(size);
  
  return (
    <div className={`flex flex-col items-center gap-3 select-none text-center ${className}`} id="deadlineai-logo-stacked">
      <LogoIcon size={iconSize} />
      <span 
        className={`${textSizeClass} font-bold tracking-tight text-[#F7FAFC] font-sans`}
        style={{ letterSpacing: '-0.03em', ...customTextStyle }}
      >
        Deadline
        <span className="bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent font-extrabold ml-px">
          AI
        </span>
      </span>
    </div>
  );
};

// 4. LogoFavicon — Simplified 16x16 favicon version (or scaled version)
export const LogoFavicon: React.FC<LogoIconProps> = ({ size = 16, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      id="deadlineai-logo-favicon"
    >
      <defs>
        <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#63B3ED" />
          <stop offset="100%" stopColor="#9F7AEA" />
        </linearGradient>
      </defs>
      
      {/* Background squircle */}
      <path
        d="M24 2 C10 2 2 10 2 24 C2 38 10 46 24 46 C38 46 46 38 46 24 C46 10 38 2 24 2Z"
        fill="url(#favGrad)"
      />
      
      {/* Simplified Lightning Bolt */}
      <path
        d="M27 10 L18 25 L23 25 L21 38 L30 23 L25 23 Z"
        fill="white"
      />
      
      {/* Small Alert Dot */}
      <circle cx="34" cy="34" r="5" fill="#FC8181" />
      <circle cx="34" cy="34" r="2.5" fill="white" />
    </svg>
  );
};

interface LogoAnimatedProps extends LogoProps {
  layout?: 'icon-only' | 'horizontal' | 'stacked';
  hoverScale?: boolean;
}

// 5. LogoAnimated — Icon (and wordmark) with sophisticated Framer Motion entrance & loop animations
export const LogoAnimated: React.FC<LogoAnimatedProps> = ({ 
  size = 'medium', 
  layout = 'horizontal', 
  hoverScale = true,
  className = '' 
}: LogoAnimatedProps) => {
  const { iconSize, textSizeClass, customTextStyle } = resolveSizes(size);
  
  const iconMarkup = (
    <motion.svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      whileHover={hoverScale ? { 
        scale: 1.05,
        transition: { type: 'spring', stiffness: 400, damping: 15 }
      } : undefined}
      id="deadlineai-logo-animated-svg"
    >
      <defs>
        {/* Main gradient with slight motion */}
        <linearGradient id="logoAnimatedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#63B3ED" />
          <stop offset="100%" stopColor="#9F7AEA" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="glowAnimated" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Layer 1: Squircle background scales in */}
      <motion.path
        d="M24 2 C10 2 2 10 2 24 C2 38 10 46 24 46 C38 46 46 38 46 24 C46 10 38 2 24 2Z"
        fill="url(#logoAnimatedGrad)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 180, delay: 0.1 }}
        style={{ originX: '24px', originY: '24px' }}
      />
      
      {/* Glass sheen */}
      <path
        d="M24 3 C11 3 3 11 3 24 C3 15 11 5 24 5 C37 5 45 13 45 24 C45 11 37 3 24 3Z"
        fill="rgba(255,255,255,0.15)"
      />
      
      {/* Layer 2: Clock ring draws itself */}
      <motion.circle
        cx="24"
        cy="24"
        r="14"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="88"
        initial={{ strokeDashoffset: 88 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
      />
      
      {/* Clock tick marks fade in */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <line x1="24" y1="11" x2="24" y2="13.5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="37" y1="24" x2="34.5" y2="24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="37" x2="24" y2="34.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="11" y1="24" x2="13.5" y2="24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      </motion.g>
      
      {/* Layer 3: Lightning bolt scales & fades in */}
      <motion.path
        d="M27 10 L18 25 L23 25 L21 38 L30 23 L25 23 Z"
        fill="white"
        filter="url(#glowAnimated)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 11, stiffness: 140, delay: 0.4 }}
        style={{ originX: '24px', originY: '24px' }}
        whileHover={{
          filter: 'brightness(1.2) drop-shadow(0px 0px 4px rgba(255,255,255,0.8))'
        }}
      />
      
      {/* Layer 4: Alert dot with overshoot, and slow pulsing loop */}
      <motion.circle
        cx="34"
        cy="34"
        r="5"
        fill="#FC8181"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [0, 1.3, 1],
        }}
        transition={{ 
          scale: { duration: 0.4, delay: 0.6, ease: 'easeOut' },
        }}
        style={{ originX: '34px', originY: '34px' }}
      />
      <motion.circle
        cx="34"
        cy="34"
        r="2.5"
        fill="rgba(255,255,255,0.9)"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [0, 1.3, 1],
        }}
        transition={{ 
          scale: { duration: 0.4, delay: 0.6, ease: 'easeOut' },
        }}
        style={{ originX: '34px', originY: '34px' }}
      />

      {/* Pulse effect overlay on dot */}
      <motion.circle
        cx="34"
        cy="34"
        r="5"
        stroke="#FC8181"
        strokeWidth="1"
        fill="none"
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.6, 0, 0.6]
        }}
        transition={{
          repeat: Infinity,
          duration: 2.2,
          ease: 'easeInOut'
        }}
        style={{ originX: '34px', originY: '34px' }}
      />
    </motion.svg>
  );

  const textMarkup = (
    <motion.span 
      className={`${textSizeClass} font-bold tracking-tight text-[#F7FAFC] font-sans`}
      style={{ letterSpacing: '-0.03em', ...customTextStyle }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
    >
      Deadline
      <span className="bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent font-extrabold ml-px">
        AI
      </span>
    </motion.span>
  );

  if (layout === 'icon-only') {
    return (
      <div className={`inline-block select-none ${className}`} id="deadlineai-logo-anim-icon">
        {iconMarkup}
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-3 select-none text-center ${className}`} id="deadlineai-logo-anim-stacked">
        {iconMarkup}
        {textMarkup}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="deadlineai-logo-anim-full">
      {iconMarkup}
      {textMarkup}
    </div>
  );
};
