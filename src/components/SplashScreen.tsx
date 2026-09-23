import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDisplayTimeMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDisplayTimeMs = 1800,
}) => {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Start fade out after minDisplayTimeMs
    const timer = setTimeout(() => {
      setFading(true);
      // Wait for CSS fade transition to finish
      const removeTimer = setTimeout(() => {
        setRemoved(true);
        if (onFinish) onFinish();
      }, 500);
      return () => clearTimeout(removeTimer);
    }, minDisplayTimeMs);

    return () => clearTimeout(timer);
  }, [minDisplayTimeMs, onFinish]);

  if (removed) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0B0B] transition-opacity duration-500 ease-out select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow ambient background aura */}
        <div className="absolute -inset-10 bg-radial from-[#00FF88]/15 via-transparent to-transparent blur-2xl rounded-full pointer-events-none" />

        {/* Animated SIM Card Logo */}
        <div className="relative animate-pulse">
          <svg
            viewBox="0 0 144 192"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-28 h-36 sm:w-36 sm:h-48 drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
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
              fill="#0F0F0F"
              stroke="#FFFFFF"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-in fade-in duration-700"
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
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-in fade-in duration-1000"
            />

            {/* Glowing Indicator Dot */}
            <circle
              cx="72"
              cy="162"
              r="4.5"
              fill="#00FF88"
              className="animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 8px #00FF88)',
              }}
            />
          </svg>
        </div>

        {/* Brand Name Typography */}
        <h1
          className="mt-6 font-display font-light text-xl sm:text-2xl text-white tracking-[0.45em] pl-[0.45em] animate-in fade-in duration-1000"
        >
          GHOST
        </h1>

        {/* Small subtitle mantra */}
        <p className="mt-3 text-[11px] font-mono text-[#777777] uppercase tracking-wider animate-in fade-in duration-1000 delay-300">
          Change ton numéro. Pas ton lien.
        </p>
      </div>
    </div>
  );
};
