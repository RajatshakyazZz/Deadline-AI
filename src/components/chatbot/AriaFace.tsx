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

  // Resolve expressions SVG parameters
  let mouthPath = "M17 30 Q24 36 31 30"; // Happy curve
  let leftEyeR = 4;
  let rightEyeR = 4;
  let eyebrowLeftPath = "";
  let eyebrowRightPath = "";

  if (expression === 'thinking') {
    mouthPath = "M18 31 L30 31"; // Flat straight line
    leftEyeR = 3.5; // squint left eye
    rightEyeR = 4;
    eyebrowLeftPath = "M14 16 L20 18"; // tilted
    eyebrowRightPath = "M28 18 L34 16"; // tilted up
  } else if (expression === 'excited') {
    mouthPath = "M15 28 Q24 40 33 28"; // Wide open smile
    leftEyeR = 5; // Wider eyes
    rightEyeR = 5;
    eyebrowLeftPath = "M14 15 Q18 13 21 16"; // Arched up
    eyebrowRightPath = "M27 16 Q30 13 34 15"; // Arched up
  } else if (expression === 'concerned') {
    mouthPath = "M17 33 Q24 27 31 33"; // Soft sad curve
    leftEyeR = 4;
    rightEyeR = 4;
    eyebrowLeftPath = "M15 18 L21 15"; // Inner eyebrow ends up (worried)
    eyebrowRightPath = "M27 15 L33 18"; // Worried slant
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
      rotate: [-5, 5, -5],
      y: [0, -1, 0],
      transition: {
        rotate: {
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        y: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
    excited: {
      y: [0, -8, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
    concerned: {
      y: [0, -1, 0],
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
          <linearGradient id="faceGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#63B3ED" />
            <stop offset="100%" stopColor="#9F7AEA" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Glow in Excited Mode */}
        {expression === 'excited' && (
          <circle
            cx="24"
            cy="24"
            r="24"
            fill="#9F7AEA"
            opacity="0.35"
            filter="url(#softGlow)"
          />
        )}

        {/* Base Face Circle */}
        <circle cx="24" cy="24" r="24" fill="url(#faceGrad)" />

        {/* Eyebrows if present */}
        {eyebrowLeftPath && (
          <path
            d={eyebrowLeftPath}
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.9"
          />
        )}
        {eyebrowRightPath && (
          <path
            d={eyebrowRightPath}
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.9"
          />
        )}

        {/* Left Eye Group */}
        <g id="left-eye-group">
          <motion.ellipse
            cx="17"
            cy="21"
            rx={leftEyeR}
            ry={blink ? 0.4 : leftEyeR}
            fill="white"
            animate={{ scaleY: blink ? 0.1 : 1 }}
            transition={{ duration: 0.12 }}
          />
          {!blink && (
            <>
              {/* Pupil */}
              <circle cx="18" cy="22" r="2" fill="#1A1A2E" />
              {/* Eye Shine */}
              <circle cx="19" cy="21" r="0.8" fill="white" />
            </>
          )}
        </g>

        {/* Right Eye Group */}
        <g id="right-eye-group">
          <motion.ellipse
            cx="31"
            cy="21"
            rx={rightEyeR}
            ry={blink ? 0.4 : rightEyeR}
            fill="white"
            animate={{ scaleY: blink ? 0.1 : 1 }}
            transition={{ duration: 0.12 }}
          />
          {!blink && (
            <>
              {/* Pupil */}
              <circle cx="32" cy="22" r="2" fill="#1A1A2E" />
              {/* Eye Shine */}
              <circle cx="33" cy="21" r="0.8" fill="white" />
            </>
          )}
        </g>

        {/* Smile Path */}
        <motion.path
          d={mouthPath}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          animate={{ d: mouthPath }}
          transition={{ duration: 0.2 }}
        />

        {/* Star Sparkles around face for Excited Mode */}
        {expression === 'excited' && (
          <g opacity="0.9">
            {/* Top Left Sparkle */}
            <path d="M-2 -2 L-1 -5 L0 -2 L3 -1 L0 0 L-1 3 L-2 0 L-5 -1 Z" fill="#FEE08B" />
            {/* Top Right Sparkle */}
            <path d="M46 -4 L47 -7 L48 -4 L51 -3 L48 -2 L47 1 L46 -2 L43 -3 Z" fill="#63B3ED" />
            {/* Bottom Left Sparkle */}
            <path d="M-4 44 L-3 41 L-2 44 L1 45 L-2 46 L-3 49 L-4 46 L-7 45 Z" fill="#EBF8FF" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};
