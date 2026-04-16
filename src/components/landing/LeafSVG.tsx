import React from 'react';

interface LeafSVGProps {
  size?: number;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

const LeafSVG: React.FC<LeafSVGProps> = ({ size = 24, id = 'leaf', className, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <path
      d="M16 2C16 2 6 8 6 18C6 24 10 28 16 30C22 28 26 24 26 18C26 8 16 2 16 2Z"
      fill="hsl(125 47% 42%)"
      opacity="0.7"
    />
    <path
      d="M16 2C16 2 6 8 6 18C6 24 10 28 16 30C22 28 26 24 26 18C26 8 16 2 16 2Z"
      fill={`url(#${id}Grad)`}
      opacity="0.5"
    />
    <path d="M16 6V26" stroke="hsl(125 47% 28%)" strokeWidth="0.6" opacity="0.5" />
    <path d="M16 10C13 13 10 16 8 19" stroke="hsl(125 47% 28%)" strokeWidth="0.4" opacity="0.3" />
    <path d="M16 14C19 16 22 18 24 20" stroke="hsl(125 47% 28%)" strokeWidth="0.4" opacity="0.3" />
    <defs>
      <linearGradient id={`${id}Grad`} x1="6" y1="2" x2="26" y2="30">
        <stop offset="0%" stopColor="hsl(100 50% 55%)" />
        <stop offset="100%" stopColor="hsl(130 50% 30%)" />
      </linearGradient>
    </defs>
  </svg>
);

export default LeafSVG;
