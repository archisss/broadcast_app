import React, { useState } from 'react';
import { Tv, EyeOff, CheckCircle2, Clock, MapPin, Tag, ExternalLink, ImagePlus } from 'lucide-react';
import { TvAnnouncement } from '../types';
import { formatDateTime } from '../lib/utils';

interface CurrentAnnouncementCardProps {
  announcement: TvAnnouncement | null;
  onHide: () => Promise<boolean>;
  onNewBirth: () => void;
  onOpenTv: () => void;
}

export const CurrentAnnouncementCard: React.FC<CurrentAnnouncementCardProps> = ({
  announcement,
  onHide,
  onNewBirth,
  onOpenTv,
}) => {
  const [isHiding, setIsHiding] = useState(false);

  const handleHideClick = async () => {
    if (!window.confirm('¿Deseas retirar esta imagen de las televisiones? La pantalla pasará al modo neutro o a la siguiente imagen en el bucle.')) {
      return;
    }
    setIsHiding(true);
    await onHide();
    setIsHiding(false);
  };

  if (!announcement || !announcement.is_active) {
    return (
      <div
        id="current-announcement-empty"
        className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm flex flex-col items-center justify-center gap-4 font-sans"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Tv className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-base font-bold text-slate-800">
            Sin imagen o comunicado activo en este espacio
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Las pantallas están mostrando actualmente el protector institucional de bienvenida.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <button
            id="btn-empty-new-birth"
            onClick={onNewBirth}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Publicar imagen</span>
          </button>
          <button
            id="btn-empty-view-tv"
            onClick={onOpenTv}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver pantalla TV</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="current-announcement-card"
      className="bg-white rounded-3xl border border-sky-100 shadow-md shadow-sky-950/5 overflow-hidden transition-all font-sans"
    >
      {/* Header bar */}
      <div className="px-6 py-4 bg-sky-50/70 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
            Visible en pantalla
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-600 font-medium font-mono bg-white px-2 py-0.5 rounded border border-sky-200">
            {announcement.space_path || '/tv'}
          </span>
        </div>

        <button
          id="btn-quick-preview-tv"
          onClick={onOpenTv}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Ver en modo TV</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Photo Container */}
        <div className="md:col-span-5 relative aspect-16/10 bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
          <img
            src={announcement.photo_url}
            alt="Imagen transmitida en TV"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-white/90 font-medium">
            1080p Transmitiendo
          </div>
        </div>

        {/* Metadata Details */}
        <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {announcement.title || announcement.baby_identifier || 'Emisión Activa'}
                </h4>
                <p className="text-xs text-slate-500">
                  Publicado por: {announcement.published_by_name}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                Sincronizado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Hora publicación</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(announcement.published_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Ubicación / Espacio</span>
                  <span className="font-semibold text-slate-800">
                    {announcement.room || announcement.space_path || 'General'}
                  </span>
                </div>
              </div>
            </div>

            {announcement.baby_identifier && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Referencia clínica / Cuna: </span>
                <span className="font-mono font-medium text-slate-900">{announcement.baby_identifier}</span>
              </div>
            )}
          </div>

          {/* Action to Hide */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Retira la foto para avanzar el bucle o volver al protector de pantalla.
            </span>

            <button
              id="btn-hide-photo"
              type="button"
              disabled={isHiding}
              onClick={handleHideClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4 text-rose-600" />
              <span>{isHiding ? 'Ocultando...' : 'Ocultar imagen'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
