import React from 'react';

interface GhostLogoProps {
  status?: 'online' | 'offline' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  animated?: boolean;
  className?: string;
}

export const GhostLogo: React.FC<GhostLogoProps> = ({
  status = 'online',
  size = 'md',
  showWordmark = false,
  animated = true,
  className = '',
}) => {
  // Dimensions for width/height of the SIM card
  const sizeMap = {
    sm: { width: 28, height: 38, stroke: 2.2, dot: 3.5, font: 9, tracking: '0.3em' },
    md: { width: 38, height: 50, stroke: 2.5, dot: 4.5, font: 11, tracking: '0.35em' },
    lg: { width: 56, height: 74, stroke: 3, dot: 6, font: 14, tracking: '0.4em' },
    xl: { width: 92, height: 122, stroke: 3.8, dot: 8, font: 20, tracking: '0.45em' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  const isRed = status === 'offline' || status === 'error';
  const strokeColor = isRed ? '#FF3B3B' : '#FFFFFF';
  const dotColor = isRed ? '#FF3B3B' : status === 'neutral' ? '#666666' : '#00FF88';
  const dotGlow = isRed ? 'rgba(255, 59, 59, 0.7)' : 'rgba(0, 255, 136, 0.8)';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${
        animated ? 'animate-float' : ''
      } ${className}`}
      aria-label={`Logo GHOST - Statut ${status}`}
    >
      <svg
        viewBox="0 0 144 192"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: `${dim.width}px`,
          height: `${dim.height}px`,
          filter: isRed ? 'drop-shadow(0 0 10px rgba(255, 59, 59, 0.3))' : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
        }}
        className="transition-colors duration-300"
      >
        {/* SIM Card Outline with Top-Right Cut */}
        <path
          d="M 32 14
             L 94 14
             Q 99 14 103 18
             L 122 37
             Q 126 41 126 46
             L 126 162
             A 14 14 0 0 1 112 176
             L 32 176
             A 14 14 0 0 1 18 162
             L 18 28
             A 14 14 0 0 1 32 14
             Z"
          fill="#121212"
          stroke={strokeColor}
          strokeWidth={dim.stroke * 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ghost Minimalist Silhouette Path */}
        <path
          d="M 48 142
             L 48 94
             C 48 68 58 56 72 56
             C 86 56 96 68 96 94
             C 96 116 99 135 110 144
             C 101 146 90 140 82 133
             C 72 124 61 124 55 131
             C 51 135 48 139 48 142
             Z"
          fill="none"
          stroke={strokeColor}
          strokeWidth={dim.stroke * 1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Indicator Dot (Green / Red) */}
        <circle
          cx="72"
          cy="162"
          r={dim.dot * 0.75}
          fill={dotColor}
          style={{
            filter: `drop-shadow(0 0 4px ${dotGlow})`,
          }}
        />
      </svg>

      {/* Optional Wordmark */}
      {showWordmark && (
        <span
          className="font-display font-light text-white uppercase text-center mt-2"
          style={{
            fontSize: `${dim.font}px`,
            letterSpacing: dim.tracking,
          }}
        >
          GHOST
        </span>
      )}
    </div>
  );
};
