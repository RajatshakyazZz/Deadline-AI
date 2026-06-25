import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export type AriaExpression = 'happy' | 'thinking' | 'excited' | 'concerned';

interface AriaFaceProps {
  expression?: AriaExpression;
  size?: 'small' | 'medium' | 'large' | number;
  className?: string;
}

export const AriaFace: React.FC<AriaFaceProps> = ({
  expression = 'happy',
  size = 'medium',
  className = '',
}) => {
  const [blink, setBlink] = useState(false);

  // Trigger eye blink every 4 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Map size keys to px
  const sizeMap = {
    small: 36,
    medium: 48,
    large: 64,
  };
  const finalSize = typeof size === 'number' ? size : sizeMap[size] || 48;

  // Resolve expressions SVG parameters for robotic '<' and '>' eyes
  let leftEyePath = "M 18 19 L 14 22 L 18 25"; // default '<'
  let rightEyePath = "M 30 19 L 34 22 L 30 25"; // default '>'
  let mouthPath = "M 20 31 Q 24 35 28 31"; // happy curve '-'

  if (expression === 'thinking') {
    leftEyePath = "M 18 21 L 14 22 L 18 23"; // narrow squint
    rightEyePath = "M 30 21 L 34 22 L 30 23"; // narrow squint
    mouthPath = "M 21 31 L 27 31"; // straight dash '-'
  } else if (expression === 'excited') {
    leftEyePath = "M 17 17 L 13 22 L 17 27"; // larger '<'
    rightEyePath = "M 31 17 L 35 22 L 31 27"; // larger '>'
    mouthPath = "M 19 29 Q 24 38 29 29"; // wide open cyber smile
  } else if (expression === 'concerned') {
    leftEyePath = "M 18 20 L 14 22 L 18 24";
    rightEyePath = "M 30 20 L 34 22 L 30 24";
    mouthPath = "M 20 33 Q 24 29 28 33"; // soft inverse curve
  }

  // Define variants for idle bobbing, thinking tilting, and excited jumps
  const faceContainerVariants = {
    happy: {
      y: [0, -2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    thinking: {
      rotate: [-4, 4, -4],
      y: [0, -1, 0],
      transition: {
        rotate: {
          duration: 1.0,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        y: {
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
    excited: {
      y: [0, -7, 0],
      scale: [1, 1.08, 1],
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    concerned: {
      y: [0, -1.5, 0],
      transition: {
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      id="aria-face-container"
      className={`relative inline-block ${className}`}
      style={{ width: finalSize, height: finalSize }}
      animate={expression}
      variants={faceContainerVariants}
    >
      <svg
        viewBox="0 0 48 48"
        width="100%"
        height="100%"
        className="overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#63B3ED" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Antenna Base Joint */}
        <ellipse cx="24" cy="8" rx="3.5" ry="1.5" fill="#4A5568" stroke="#cbd5e0" strokeWidth="0.5" />

        {/* Antenna Stem */}
        <line x1="24" y1="8" x2="24" y2="2" stroke="#cbd5e0" strokeWidth="1.5" strokeLinecap="round" />

        {/* Glowing Antenna Node (Pulse effect) */}
        <motion.circle
          cx="24"
          cy="2"
          r="2.5"
          fill="#63B3ED"
          filter="url(#cyberGlow)"
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Base Robotic Face Circle - Dark/Black inner cavity, glowing border */}
        <circle 
          cx="24" 
          cy="26" 
          r="17" 
          fill="#080D1A" 
          stroke="#63B3ED" 
          strokeWidth="2.2" 
          filter="url(#cyberGlow)" 
          className="shadow-inner"
        />

        {/* Left Eye Group (Articulated '<') */}
        <g id="left-eye-group">
          <motion.path
            d={leftEyePath}
            stroke="#63B3ED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={blink ? { scaleY: 0.1, y: 1 } : { scaleY: 1, y: 0 }}
            style={{ transformOrigin: '16px 22px' }}
            transition={{ duration: 0.12 }}
          />
        </g>

        {/* Right Eye Group (Articulated '>') */}
        <g id="right-eye-group">
          <motion.path
            d={rightEyePath}
            stroke="#63B3ED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={blink ? { scaleY: 0.1, y: 1 } : { scaleY: 1, y: 0 }}
            style={{ transformOrigin: '32px 22px' }}
            transition={{ duration: 0.12 }}
          />
        </g>

        {/* Robotic Mouth Path (dash) */}
        <motion.path
          d={mouthPath}
          stroke="#63B3ED"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          animate={{ d: mouthPath }}
          transition={{ duration: 0.2 }}
        />

        {/* Cyber sparks around head in Excited Mode */}
        {expression === 'excited' && (
          <g opacity="0.95">
            <line x1="4" y1="12" x2="1" y2="9" stroke="#9F7AEA" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="44" y1="12" x2="47" y2="9" stroke="#9F7AEA" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="2" y1="38" x2="-1" y2="41" stroke="#63B3ED" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="46" y1="38" x2="49" y2="41" stroke="#63B3ED" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};
