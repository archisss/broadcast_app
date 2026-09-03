import React from 'react';

interface HospitalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'tv';
  inverted?: boolean;
  minimal?: boolean;
  className?: string;
}

export const HospitalLogo: React.FC<HospitalLogoProps> = ({
  size = 'md',
  inverted = false,
  minimal = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    tv: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
    tv: 'text-2xl font-bold tracking-tight',
  };

  const subTextSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-xs tracking-wider',
    tv: 'text-sm tracking-wider',
  };

  return (
    <div id="hospital-brand-logo" className={`flex items-center gap-3 select-none ${className}`}>
      {/* Hospital Cross & Cradle Heart Emblem */}
      <div
        className={`flex items-center justify-center rounded-xl transition-transform ${
          iconSizes[size]
        } ${
          inverted
            ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-inner'
            : 'bg-sky-700 text-white shadow-md shadow-sky-900/15'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5"
        >
          {/* Medical cross with soft heart cradle */}
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <circle cx="12" cy="12" r="7" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M9 13.5c.8 1.2 2 1.5 3 1.5s2.2-.3 3-1.5" strokeWidth="1.8" />
        </svg>
      </div>

      {!minimal && (
        <div className="flex flex-col leading-tight">
          <span
            className={`${textSizes[size]} ${
              inverted ? 'text-white' : 'text-slate-900'
            }`}
          >
            HOSPITAL SAN LUCAS
          </span>
          <span
            className={`uppercase font-medium tracking-wide ${subTextSizes[size]} ${
              inverted ? 'text-sky-300/90' : 'text-sky-700 font-semibold'
            }`}
          >
            Broadcast Hospitalario
          </span>
        </div>
      )}
    </div>
  );
};
