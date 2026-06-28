import React from 'react';

export type AriaExpression = 'happy' | 'thinking' | 'excited' | 'concerned';

interface AriaFaceProps {
  expression?: AriaExpression;
  size?: 'small' | 'medium' | 'large' | number;
  className?: string;
  isOpen?: boolean;
  isHovered?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
}

export const AriaFace: React.FC<AriaFaceProps> = ({
  expression = 'happy',
  size = 'large',
  className = '',
  isOpen = false,
  isHovered = false,
  isThinking = false,
  isSpeaking = false,
}) => {
  // Map preset sizes to pixel numbers
  const sizeMap = {
    small: 28,
    medium: 48,
    large: 64,
  };
  const finalSize = typeof size === 'number' ? size : sizeMap[size] || 64;

  // Determine active states based on props & expressions
  const activeThinking = isThinking || expression === 'thinking';
  const activeSpeaking = isSpeaking || expression === 'excited';

  // Responsive scale factor (relative to 64px design size)
  const scaleFactor = finalSize / 64;

  // Layer size calculations
  const baseStyle: React.CSSProperties = {
    width: `${finalSize}px`,
    height: `${finalSize}px`,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, #0A0F2E 0%, #050818 100%)',
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
  };

  // Layer 2: Aurora Core Conic Gradient
  // When Chat is open, shift colors to a purple dominant spectrum
  const auroraBg = isOpen
    ? 'conic-gradient(from 0deg, rgba(159,122,234,0.9) 0%, rgba(128,90,213,0.9) 20%, rgba(99,179,237,0.3) 50%, rgba(159,122,234,0.9) 70%, rgba(128,90,213,0.5) 85%, rgba(159,122,234,0.9) 100%)'
    : 'conic-gradient(from 0deg, rgba(99,179,237,0.9), rgba(159,122,234,0.9), rgba(99,179,237,0.4), rgba(56,178,172,0.8), rgba(159,122,234,0.6), rgba(99,179,237,0.9))';

  // Aurora rotation speed: Fast (1s) for thinking, medium (2s) for hover, slow (4s) for idle
  let auroraAnimationClass = 'orb-aurora-spin';
  if (activeThinking) {
    auroraAnimationClass = 'orb-aurora-spin-fast';
  } else if (isHovered) {
    auroraAnimationClass = 'orb-aurora-spin-hover';
  }

  // Layer 6: Dynamic outer ring offset
  const outerRingOffset = -6 * scaleFactor;

  // Layer 7: Outer glow scale and speed
  const glowInset = isHovered ? -30 * scaleFactor : -20 * scaleFactor;
  const glowBlur = 12 * scaleFactor;

  // Center dot scale classes and variables
  let centerDotAnimationClass = 'orb-center-dot-pulse';
  if (activeThinking) {
    centerDotAnimationClass = 'orb-center-dot-flicker';
  } else if (activeSpeaking) {
    // Speaking rapid pulse is configured via rapid keyframes or custom timing
    centerDotAnimationClass = '';
  }

  return (
    <div
      id="aria-premium-core-orb"
      className={`relative select-none ${className}`}
      style={baseStyle}
    >
      {/* LAYER 7 — Ambient glow (behind orb) */}
      <div
        className={`absolute rounded-full pointer-events-none -z-10 ${
          activeThinking ? 'orb-glow-flash' : 'orb-glow-pulse'
        }`}
        style={{
          inset: `${glowInset}px`,
          background: 'radial-gradient(circle, rgba(99,179,237,0.25) 0%, rgba(159,122,234,0.12) 40%, transparent 70%)',
          filter: `blur(${glowBlur}px)`,
        }}
      />

      {/* LAYER 6 — Outer ring */}
      <div
        className="absolute rounded-full orb-ring-rotate orb-outer-ring pointer-events-none"
        style={{
          inset: `${outerRingOffset}px`,
          border: '1px solid transparent',
        }}
      />

      {/* LAYER 2 — Animated aurora core */}
      <div
        className={`absolute rounded-full ${auroraAnimationClass}`}
        style={{
          inset: `${8 * scaleFactor}px`,
          background: auroraBg,
          filter: `blur(${4 * scaleFactor}px)`,
        }}
      />

      {/* LAYER 3 — Dark center overlay */}
      <div
        className="absolute rounded-full"
        style={{
          inset: `${16 * scaleFactor}px`,
          background: 'radial-gradient(circle at 40% 35%, #0D1530, #060A1A)',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
        }}
      />

      {/* LAYER 4 — Center Symbol or Close (X) Icon */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: `${24 * scaleFactor}px`,
          height: `${24 * scaleFactor}px`,
        }}
      >
        {isOpen ? (
          // Simple X close icon for open state (no animations)
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full p-1 opacity-90 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Neural Pulse Abstract AI core
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer rotating arc */}
            <path
              className="orb-outer-arc"
              d="M6 12 Q6 6 12 6 Q18 6 18 12"
              stroke="rgba(99,179,237,0.9)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ transformOrigin: '12px 12px' }}
            />

            {/* Inner counter-rotating arc */}
            <path
              className="orb-inner-arc"
              d="M8.5 12 Q8.5 8.5 12 8.5 Q15.5 8.5 15.5 12"
              stroke="rgba(159,122,234,0.8)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ transformOrigin: '12px 12px' }}
            />

            {/* Center dot */}
            <circle
              cx="12"
              cy="12"
              r={isHovered ? 3.2 : 2}
              fill="white"
              filter="url(#dotGlow)"
              className={centerDotAnimationClass}
              style={{
                transformOrigin: '12px 12px',
                animation: activeSpeaking 
                  ? 'centerDotPulse 0.5s ease-in-out infinite' 
                  : undefined,
              }}
            />
          </svg>
        )}
      </div>

      {/* LAYER 5 — Glass sphere overlay */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)',
        }}
      />
    </div>
  );
};
