import React from 'react';

interface CountryFlagProps {
  iso: string;
  className?: string;
  size?: number;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  iso,
  className = '',
  size = 18,
}) => {
  const width = size;
  const height = Math.round(size * 0.72);

  switch (iso.toUpperCase()) {
    case 'CM': // Cameroun (Green, Red with yellow star, Yellow)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="300" height="600" fill="#007A5E" />
          <rect x="300" width="300" height="600" fill="#CE1126" />
          <rect x="600" width="300" height="600" fill="#FCD116" />
          <polygon points="450,230 468,285 526,285 479,320 497,375 450,340 403,375 421,320 374,285 432,285" fill="#FCD116" />
        </svg>
      );

    case 'CI': // Côte d'Ivoire (Orange, White, Green)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="300" height="600" fill="#F77F00" />
          <rect x="300" width="300" height="600" fill="#FFFFFF" />
          <rect x="600" width="300" height="600" fill="#009E60" />
        </svg>
      );

    case 'SN': // Sénégal (Green, Yellow with green star, Red)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="300" height="600" fill="#00853F" />
          <rect x="300" width="300" height="600" fill="#FDEF42" />
          <rect x="600" width="300" height="600" fill="#E31B23" />
          <polygon points="450,230 468,285 526,285 479,320 497,375 450,340 403,375 421,320 374,285 432,285" fill="#00853F" />
        </svg>
      );

    case 'FR': // France (Blue, White, Red)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="300" height="600" fill="#002654" />
          <rect x="300" width="300" height="600" fill="#FFFFFF" />
          <rect x="600" width="300" height="600" fill="#CE1126" />
        </svg>
      );

    case 'BE': // Belgique (Black, Yellow, Red)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="300" height="600" fill="#000000" />
          <rect x="300" width="300" height="600" fill="#FDDA24" />
          <rect x="600" width="300" height="600" fill="#EF3340" />
        </svg>
      );

    case 'US': // USA
      return (
        <svg viewBox="0 0 741 390" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="741" height="390" fill="#B22234" />
          <rect y="30" width="741" height="30" fill="#FFFFFF" />
          <rect y="90" width="741" height="30" fill="#FFFFFF" />
          <rect y="150" width="741" height="30" fill="#FFFFFF" />
          <rect y="210" width="741" height="30" fill="#FFFFFF" />
          <rect y="270" width="741" height="30" fill="#FFFFFF" />
          <rect y="330" width="741" height="30" fill="#FFFFFF" />
          <rect width="296.4" height="210" fill="#3C3B6E" />
          <circle cx="60" cy="50" r="10" fill="#FFFFFF" />
          <circle cx="120" cy="50" r="10" fill="#FFFFFF" />
          <circle cx="180" cy="50" r="10" fill="#FFFFFF" />
          <circle cx="240" cy="50" r="10" fill="#FFFFFF" />
          <circle cx="90" cy="105" r="10" fill="#FFFFFF" />
          <circle cx="150" cy="105" r="10" fill="#FFFFFF" />
          <circle cx="210" cy="105" r="10" fill="#FFFFFF" />
          <circle cx="60" cy="160" r="10" fill="#FFFFFF" />
          <circle cx="120" cy="160" r="10" fill="#FFFFFF" />
          <circle cx="180" cy="160" r="10" fill="#FFFFFF" />
          <circle cx="240" cy="160" r="10" fill="#FFFFFF" />
        </svg>
      );

    case 'CG': // Congo (Green, Yellow, Red diagonal)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <polygon points="0,0 600,0 0,600" fill="#009543" />
          <polygon points="0,600 600,0 900,0 300,600" fill="#FBDE4A" />
          <polygon points="300,600 900,0 900,600" fill="#DC241F" />
        </svg>
      );

    case 'CD': // RDC (Sky blue, Red diagonal with yellow borders, Yellow star)
      return (
        <svg viewBox="0 0 800 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="800" height="600" fill="#007FFF" />
          <polygon points="0,480 0,600 800,120 800,0" fill="#F7D618" />
          <polygon points="0,520 0,600 800,80 800,0" fill="#CE1021" />
          <polygon points="120,60 135,100 178,100 143,125 156,165 120,140 84,165 97,125 62,100 105,100" fill="#F7D618" />
        </svg>
      );

    case 'GA': // Gabon (Green, Yellow, Blue)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="900" height="200" fill="#009E60" />
          <rect y="200" width="900" height="200" fill="#FCD116" />
          <rect y="400" width="900" height="200" fill="#3A75C4" />
        </svg>
      );

    case 'BJ': // Bénin (Green vertical, Yellow and Red horizontal)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="360" height="600" fill="#008751" />
          <rect x="360" width="540" height="300" fill="#FCD116" />
          <rect x="360" y="300" width="540" height="300" fill="#E8112D" />
        </svg>
      );

    case 'TG': // Togo (Green and yellow stripes, red canton with white star)
      return (
        <svg viewBox="0 0 809 500" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="809" height="100" fill="#006A4E" />
          <rect y="100" width="809" height="100" fill="#FFCE00" />
          <rect y="200" width="809" height="100" fill="#006A4E" />
          <rect y="300" width="809" height="100" fill="#FFCE00" />
          <rect y="400" width="809" height="100" fill="#006A4E" />
          <rect width="300" height="300" fill="#D21034" />
          <polygon points="150,75 168,130 226,130 179,165 197,220 150,185 103,220 121,165 74,130 132,130" fill="#FFFFFF" />
        </svg>
      );

    case 'GB': // Royaume-Uni (Union Jack)
      return (
        <svg viewBox="0 0 60 30" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <clipPath id="s">
            <path d="M0,0 v30 h60 v-30 z"/>
          </clipPath>
          <clipPath id="t">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
          </clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
          </g>
        </svg>
      );

    case 'DE': // Allemagne (Black, Red, Gold)
      return (
        <svg viewBox="0 0 900 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="900" height="200" fill="#000000" />
          <rect y="200" width="900" height="200" fill="#DD0000" />
          <rect y="400" width="900" height="200" fill="#FFCE00" />
        </svg>
      );

    case 'CH': // Suisse (Red with white cross)
      return (
        <svg viewBox="0 0 600 600" width={width} height={height} className={`inline-block rounded-xs overflow-hidden shrink-0 ${className}`}>
          <rect width="600" height="600" fill="#D52B1E" />
          <rect x="250" y="120" width="100" height="360" fill="#FFFFFF" />
          <rect x="120" y="250" width="360" height="100" fill="#FFFFFF" />
        </svg>
      );

    default: // Globe icon fallback
      return (
        <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`inline-block text-[#888888] ${className}`}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
};
