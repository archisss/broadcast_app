import React, { useState } from 'react';
import { AnnouncementHistory } from '../components/AnnouncementHistory';
import { useRealtime } from '../context/RealtimeContext';
import { TvAnnouncement } from '../types';
import { ShieldCheck, History, X, Clock, MapPin, Tag } from 'lucide-react';
import { formatDateTime } from '../lib/utils';

export const HistoryPage: React.FC = () => {
  const { announcements, auditLogs } = useRealtime();
  const [selectedPhoto, setSelectedPhoto] = useState<TvAnnouncement | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'audit'>('history');

  return (
    <div id="history-page-root" className="space-y-6 animate-fade-in">
      {/* Header and Sub-tabs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Registro Clínico de Emisiones
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historial de recién nacidos presentados y trazabilidad de auditoría de seguridad
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-sky-700" />
            <span>Publicaciones ({announcements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Auditoría ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'history' ? (
        <AnnouncementHistory
          announcements={announcements}
          onSelectPhotoPreview={(item) => setSelectedPhoto(item)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Bitácora de Eventos de Seguridad</h3>
            <p className="text-xs text-slate-500">Registro inmutable de acciones realizadas por el personal hospitalario</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Detalle del Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      {log.action === 'photo_published' ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                          PUBLICACIÓN_TV
                        </span>
                      ) : log.action === 'photo_hidden' ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                          RETIRO_TV
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.action.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] text-slate-500">
                      {log.user_role}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
