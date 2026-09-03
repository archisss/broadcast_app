import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2, Sparkles, Heart, RefreshCw } from 'lucide-react';
import { TvAnnouncement, ConnectionState } from '../types';
import { HospitalLogo } from './HospitalLogo';

interface TVDisplayProps {
  announcement: TvAnnouncement | null;
  activeList?: TvAnnouncement[];
  spaceName?: string;
  spacePath?: string;
  connectionState: ConnectionState;
}

export const TVDisplay: React.FC<TVDisplayProps> = ({
  announcement,
  activeList = [],
  spaceName,
  spacePath = '/tv',
  connectionState,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsHint, setShowControlsHint] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute the current active items list
  const displayItems = activeList.length > 0 ? activeList : announcement ? [announcement] : [];

  // Reset index if list changes
  useEffect(() => {
    if (currentIndex >= displayItems.length) {
      setCurrentIndex(0);
    }
  }, [displayItems.length]);

  // 30-Second Loop Timer for multiple images
  useEffect(() => {
    if (displayItems.length <= 1) {
      setProgress(0);
      return;
    }

    const duration = 30000; // 30 seconds
    const intervalMs = 100;
    const step = (intervalMs / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((curr) => (curr + 1) % displayItems.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [displayItems.length, currentIndex]);

  const currentItem: TvAnnouncement | null =
    displayItems.length > 0 ? displayItems[currentIndex] || displayItems[0] : null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControlsHint(true);
  };

  useEffect(() => {
    if (!showControlsHint) return;
    const timeout = setTimeout(() => setShowControlsHint(false), 3500);
    return () => clearTimeout(timeout);
  }, [showControlsHint]);

  // Display title for space
  const resolvedSpaceTitle =
    spaceName ||
    (spacePath === '/tv' || spacePath === '/'
      ? 'Sala de Espera General'
      : spacePath.replace(/^\//, '').replace(/_/g, ' ').toUpperCase());

  return (
    <div
      id="tv-display-root"
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between select-none cursor-default font-sans"
    >
      {/* 30-second loop progress bar if multiple images */}
      {displayItems.length > 1 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50 overflow-hidden">
          <div
            className="h-full bg-sky-400 transition-all duration-100 ease-linear shadow-xs shadow-sky-400/50"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Discreet Fullscreen & Connection status in corners */}
      <div
        className={`fixed top-5 right-6 z-50 flex items-center gap-3 transition-opacity duration-500 ${
          showControlsHint ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}
      >
        {displayItems.length > 1 && (
          <span className="text-[11px] font-medium bg-sky-950/80 text-sky-300 border border-sky-600/40 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
            <span>
              Rotación 30s ({currentIndex + 1} de {displayItems.length})
            </span>
          </span>
        )}

        {connectionState !== 'connected' && (
          <span className="text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full backdrop-blur-md">
            Sincronizando señal...
          </span>
        )}

        <button
          id="btn-toggle-tv-fullscreen"
          onClick={toggleFullscreen}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa (F11)'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-slate-300" />
          ) : (
            <Maximize2 className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>

      {/* Top Header Bar: Hospital identity + Clock + Space name */}
      <header className="w-full px-8 md:px-14 pt-8 pb-4 flex items-center justify-between z-20">
        <HospitalLogo size="tv" inverted />

        <div className="flex items-center gap-6 text-slate-400">
          <div className="flex flex-col text-right">
            <span className="font-mono text-2xl md:text-3xl font-light text-white tracking-widest">
              {currentTime}
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs uppercase tracking-widest text-sky-300 font-semibold">
                {resolvedSpaceTitle}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center px-6 md:px-12 py-2 overflow-hidden z-10">
        <AnimatePresence mode="wait">
          {currentItem && currentItem.is_active ? (
            /* ACTIVE BROADCAST IMAGE VIEW */
            <motion.div
              key={currentItem.id || `${currentIndex}-${currentItem.photo_url}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full max-w-7xl max-h-[78vh] flex flex-col items-center justify-center"
            >
              {/* Subtle ambient glow behind the photo */}
              <div className="absolute inset-0 bg-sky-500/10 blur-3xl rounded-full pointer-events-none transform -translate-y-4" />

              {/* Photo Frame */}
              <div className="relative w-full h-full flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-700/50 bg-slate-950/70 backdrop-blur-sm">
                <img
                  src={currentItem.photo_url}
                  alt={currentItem.title || 'Emisión Hospitalaria'}
                  className="w-full h-full object-contain p-2 md:p-4 transition-transform duration-700"
                />

                {/* Corner Soft Watermark */}
                <div className="absolute top-5 left-5 pointer-events-none opacity-90 flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {currentItem.title || (resolvedSpaceTitle ? resolvedSpaceTitle : 'Hospital San Lucas')}
                  </span>
                </div>

                {/* Carousel Indicator pill on bottom-right of photo frame */}
                {displayItems.length > 1 && (
                  <div className="absolute bottom-5 right-5 pointer-events-none opacity-90 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-medium text-slate-300">
                    <span>
                      {currentIndex + 1} / {displayItems.length}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-sky-400">30 seg</span>
                  </div>
                )}
              </div>

              {/* Institutional Caption */}
              <div className="mt-4 flex flex-col items-center text-center space-y-1">
                <div className="flex items-center gap-2 text-sky-300 text-lg md:text-xl font-medium tracking-wide">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400/40" />
                  <span>{currentItem.title || 'Hospital San Lucas • Broadcast Hospitalario'}</span>
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400/40" />
                </div>

                {/* Optional discreet reference */}
                {(currentItem.baby_identifier || currentItem.room || currentItem.published_by_name) && (
                  <p className="text-xs md:text-sm text-slate-400 font-light tracking-wide">
                    {currentItem.baby_identifier && (
                      <span className="font-mono text-slate-300">{currentItem.baby_identifier}</span>
                    )}
                    {currentItem.baby_identifier && currentItem.room && ' • '}
                    {currentItem.room && <span>{currentItem.room}</span>}
                    {currentItem.published_by_name && (
                      <span className="text-slate-500"> • {currentItem.published_by_name}</span>
                    )}
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            /* NEUTRAL STANDBY VIEW */
            <motion.div
              key="neutral-standby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center text-center max-w-2xl px-6 py-12"
            >
              {/* Soft Pulsing Hospital Cross */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-sky-400 shadow-2xl backdrop-blur-xl">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-14 h-14"
                  >
                    <path d="M12 3v18" />
                    <path d="M3 12h18" />
                    <circle cx="12" cy="12" r="7" strokeOpacity="0.4" strokeWidth="1.5" />
                    <path d="M9 13.5c.8 1.2 2 1.5 3 1.5s2.2-.3 3-1.5" strokeWidth="1.8" />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Hospital San Lucas
              </h1>

              <p className="text-base md:text-xl text-slate-300 font-light leading-relaxed max-w-xl">
                En este momento no hay una fotografía o comunicado activo para mostrar.
              </p>

              <div className="mt-8 flex items-center gap-2 text-xs text-sky-400/80 uppercase tracking-widest font-semibold bg-sky-950/50 border border-sky-800/40 px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Espacio: {resolvedSpaceTitle} • Esperando transmisión</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Subdued Institutional Footer */}
      <footer className="w-full px-8 md:px-14 py-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-xs shadow-emerald-500/50 animate-pulse" />
          <span className="tracking-wide">
            Broadcast Hospitalario • {resolvedSpaceTitle}
          </span>
        </div>
        <span className="tracking-wider uppercase text-[11px] text-slate-400">
          Hospital San Lucas
        </span>
      </footer>
    </div>
  );
};
