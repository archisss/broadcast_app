import React, { useEffect, useMemo } from 'react';
import { TVDisplay } from '../components/TVDisplay';
import { useRealtime } from '../context/RealtimeContext';
import { ArrowLeft } from 'lucide-react';

interface TVPageProps {
  onBackToAdmin?: () => void;
  targetSpacePath?: string;
}

export const TVPage: React.FC<TVPageProps> = ({ onBackToAdmin, targetSpacePath }) => {
  const {
    activeAnnouncement,
    activeList,
    announcements,
    connectionState,
    setCurrentSpacePath,
    refreshData,
    spaces,
  } = useRealtime();

  // Resolve space path: prop > URL hash / query > default /tv
  const spacePath = useMemo(() => {
    if (targetSpacePath) return targetSpacePath;

    const hash = window.location.hash;
    const path = window.location.pathname;

    // Check hash: #space=/master_suite
    const hashMatch = hash.match(/#space=([^&]+)/);
    if (hashMatch && hashMatch[1]) {
      return decodeURIComponent(hashMatch[1]);
    }

    // Check if hash is like #master_suite or #cuarto22
    if (hash.startsWith('#') && hash !== '#tv' && !hash.startsWith('#admin')) {
      const sub = hash.slice(1);
      if (sub) return '/' + sub;
    }

    // Check pathname: /master_suite or /cuarto22
    if (path && path !== '/' && path !== '/tv' && !path.startsWith('/admin') && !path.startsWith('/api')) {
      return path;
    }

    return '/tv';
  }, [targetSpacePath]);

  // Find space metadata
  const currentSpace = useMemo(() => {
    return spaces.find((s) => s.direccion_web === spacePath);
  }, [spaces, spacePath]);

  useEffect(() => {
    setCurrentSpacePath(spacePath);
    refreshData(spacePath);
  }, [spacePath, setCurrentSpacePath, refreshData]);

  // Compute active items specifically for this space
  const spaceActiveList = useMemo(() => {
    if (spacePath === '/tv') {
      return activeList.length > 0
        ? activeList
        : announcements.filter((a) => a.is_active && (!a.space_path || a.space_path === '/tv'));
    }
    const filtered = announcements.filter(
      (a) =>
        a.is_active &&
        (a.space_path === spacePath || a.channel === spacePath.replace(/^\//, ''))
    );
    if (filtered.length > 0) return filtered;
    return activeList.length > 0 ? activeList : [];
  }, [announcements, activeList, spacePath]);

  const resolvedActive = spaceActiveList.length > 0 ? spaceActiveList[0] : activeAnnouncement;

  return (
    <div id="tv-page-container" className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Floating return button */}
      {onBackToAdmin && (
        <button
          id="btn-tv-return-admin"
          onClick={onBackToAdmin}
          className="fixed bottom-4 right-4 z-50 opacity-15 hover:opacity-100 focus:opacity-100 transition-opacity duration-300 bg-slate-900/90 text-white text-xs px-3.5 py-1.5 rounded-full border border-slate-700 backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer"
          title="Regresar al panel de médico"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Panel Médico</span>
        </button>
      )}

      {/* Pure TV Display Screen with 30s carousel */}
      <TVDisplay
        announcement={resolvedActive}
        activeList={spaceActiveList}
        spaceName={currentSpace?.nombre_espacio}
        spacePath={spacePath}
        connectionState={connectionState}
      />
    </div>
  );
};
