import React from 'react';

interface DecisionIconProps {
  className?: string;
  size?: number | string;
}

export const DecisionIcon: React.FC<DecisionIconProps> = ({ size = 64, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
        {/* Layered Outer Frame - Cyberpunk Shield Geometry */}
        <path d="M50 5 L90 25 V75 L50 95 L10 75 V25 L50 5 Z" stroke="#22D3EE" strokeWidth="1" opacity="0.3" />
        <rect x="10" y="10" width="80" height="80" rx="24" stroke="#22D3EE" strokeWidth="4" fill="#050505" />
        
        {/* The Core Synthesis (The Triple Fork) */}
        <g transform="translate(50, 50)">
          {/* Path A: Purple - Digital Logic */}
          <path d="M0 0 L-22 -22" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="-22" cy="-22" r="3" fill="#A855F7" />
          
          {/* Path B: Amber - Human Ambition */}
          <path d="M0 0 L22 -22" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="22" cy="-22" r="3" fill="#F59E0B" />
          
          {/* Path C: Cyan - The Synthesis (Infinite Vertical) */}
          <path d="M0 0 V-30" stroke="#22D3EE" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M-6 -30 H6 L0 -38 Z" fill="#22D3EE" /> {/* Arrowhead for the optimized future */}
          
          {/* Central Nexus (The User) */}
          <circle r="8" fill="#050505" stroke="#22D3EE" strokeWidth="2" />
          <circle r="3" fill="#22D3EE">
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
          </circle>
          
          {/* Peripheral Data Nodes */}
          <g opacity="0.4">
            <circle cx="-15" cy="15" r="1.5" fill="#22D3EE" />
            <circle cx="15" cy="15" r="1.5" fill="#22D3EE" />
            <circle cx="0" cy="22" r="1.5" fill="#22D3EE" />
            <path d="M-15 15 L0 22 L15 15" stroke="#22D3EE" strokeWidth="0.5" fill="none" />
          </g>
        </g>

        {/* HUD Navigation Accents */}
        <line x1="20" y1="20" x2="30" y2="20" stroke="#22D3EE" strokeWidth="1" opacity="0.5" />
        <line x1="20" y1="20" x2="20" y2="30" stroke="#22D3EE" strokeWidth="1" opacity="0.5" />
        
        <line x1="80" y1="80" x2="70" y2="80" stroke="#22D3EE" strokeWidth="1" opacity="0.5" />
        <line x1="80" y1="80" x2="80" y2="70" stroke="#22D3EE" strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
  );
};
