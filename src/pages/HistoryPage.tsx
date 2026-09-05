import React, { useState } from 'react';
import { AnnouncementHistory } from '../components/AnnouncementHistory';
import { useRealtime } from '../context/RealtimeContext';
import { TvAnnouncement } from '../types';
import { X, Tag } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

export const HistoryPage: React.FC = () => {
  const { announcements } = useRealtime();
  const [selectedPhoto, setSelectedPhoto] = useState<TvAnnouncement | null>(null);

  return (
    <div id="history-page-root" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Historial de Emisiones
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico de recién nacidos emitidos en las pantallas del hospital ({announcements.length} publicaciones)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <AnnouncementHistory
        announcements={announcements}
        onSelectPhotoPreview={(item) => setSelectedPhoto(item)}
      />

      {/* Modal to view enlarged photo */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-xs">
                <Tag className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold">{selectedPhoto.baby_identifier || 'Recién Nacido'}</span>
                {selectedPhoto.room && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{selectedPhoto.room}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-16/10 bg-black flex items-center justify-center p-4">
              <img
                src={selectedPhoto.photo_url}
                alt="Detalle de fotografía"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div className="p-4 bg-slate-900/90 text-xs text-slate-400 flex items-center justify-between">
              <span>Publicado por: <strong className="text-slate-200">{selectedPhoto.published_by_name}</strong></span>
              <span>{formatDateTime(selectedPhoto.published_at)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
