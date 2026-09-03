import React from 'react';
import { CurrentAnnouncementCard } from '../components/CurrentAnnouncementCard';
import { AnnouncementHistory } from '../components/AnnouncementHistory';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import {
  ExternalLink,
  ShieldCheck,
  Radio,
  Tv,
  ImagePlus,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TvAnnouncement } from '../types';

interface AdminDashboardPageProps {
  onNewBirth: () => void;
  onOpenTv: () => void;
  onViewHistory: () => void;
  onNavigateToSpaces?: () => void;
  onNavigateToDoctors?: () => void;
  onSelectPhotoPreview?: (announcement: TvAnnouncement) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNewBirth,
  onOpenTv,
  onViewHistory,
  onNavigateToSpaces,
  onNavigateToDoctors,
  onSelectPhotoPreview,
}) => {
  const { user } = useAuth();
  const {
    activeAnnouncement,
    activeList,
    announcements,
    hideAnnouncement,
    spaces,
    currentSpacePath,
    setCurrentSpacePath,
    refreshData,
  } = useRealtime();

  const isSuperadminOrAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div id="admin-dashboard-page" className="space-y-8 animate-fade-in font-sans">
      {/* Top Welcome Banner & Primary Action */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-800 rounded-full text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>Transmisión en vivo para pantallas hospitalarias</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Broadcast Hospitalario
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Bienvenido, <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.role}). Emite fotografías de recién nacidos, mensajes y avisos médicos a cualquiera de las pantallas del hospital en tiempo real.
          </p>
        </div>

        {/* Big Action Button "Publicar imagen" */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <button
            id="btn-action-new-birth"
            type="button"
            onClick={onNewBirth}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-sky-700 hover:bg-sky-600 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-sky-900/20 transition-all cursor-pointer"
          >
            <ImagePlus className="w-5 h-5 text-sky-200" />
            <span>Publicar imagen</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Action Hub (Only for superadmin and admin) */}
      {isSuperadminOrAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={onNavigateToSpaces}
            className="bg-white hover:bg-sky-50/40 p-5 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  Espacios de Broadcast
                </h3>
                <p className="text-xs text-slate-500">
                  {spaces.length} espacios configurados (ej. Master Suite, Cuarto 22)
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl group-hover:bg-sky-700 group-hover:text-white transition-all">
              Administrar →
            </span>
          </div>

          <div
            onClick={onNavigateToDoctors}
            className="bg-white hover:bg-sky-50/40 p-5 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Médicos y Accesos
                </h3>
                <p className="text-xs text-slate-500">
                  Gestionar doctores autorizados para subir imágenes y superadmins
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl group-hover:bg-indigo-700 group-hover:text-white transition-all">
              Gestionar →
            </span>
          </div>
        </div>
      )}

      {/* Space Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 px-2">
          <Tv className="w-4 h-4 text-sky-700" />
          <span>Filtrar monitor por espacio:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setCurrentSpacePath('/tv');
              refreshData('/tv');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentSpacePath === '/tv'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            Todos / General (/tv)
          </button>
          {spaces
            .filter((s) => s.direccion_web !== '/tv')
            .map((sp) => (
              <button
                key={sp.id}
                onClick={() => {
                  setCurrentSpacePath(sp.direccion_web);
                  refreshData(sp.direccion_web);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentSpacePath === sp.direccion_web
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {sp.nombre_espacio} ({sp.direccion_web})
              </button>
            ))}
        </div>
      </div>

      {/* Primary Section: Fotografía actualmente mostrada en las televisiones */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Transmisión Actual en Pantalla ({currentSpacePath})
            </h2>
            <p className="text-xs text-slate-500">
              {activeList.length > 1
                ? `Rotando en bucle de 30 segundos entre ${activeList.length} imágenes activas`
                : 'Imagen activa mostrada en tiempo real en los receptores'}
            </p>
          </div>

          <button
            onClick={onOpenTv}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
          >
            <span>Abrir pantalla TV</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <CurrentAnnouncementCard
          announcement={activeAnnouncement}
          onHide={hideAnnouncement}
          onNewBirth={onNewBirth}
          onOpenTv={onOpenTv}
        />
      </section>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Canal Sincronizado</span>
            <p className="text-sm font-bold text-slate-900">{currentSpacePath}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Protección de Datos</span>
            <p className="text-sm font-bold text-slate-900">EXIF Depurado • RLS Activo</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Emisiones Registradas</span>
            <p className="text-sm font-bold text-slate-900">{announcements.length} Publicaciones</p>
          </div>
        </div>
      </div>

      {/* Recent History Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Historial Reciente de Emisiones
            </h2>
            <p className="text-xs text-slate-500">
              Últimas imágenes y comunicados procesados y transmitidos
            </p>
          </div>

          <button
            onClick={onViewHistory}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
          >
            Ver historial completo →
          </button>
        </div>

        <AnnouncementHistory
          announcements={announcements.slice(0, 5)}
          onSelectPhotoPreview={onSelectPhotoPreview}
        />
      </section>
    </div>
  );
};
