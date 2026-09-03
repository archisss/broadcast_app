import React, { useState } from 'react';
import { TvAnnouncement } from '../types';
import { formatDateTime } from '../lib/utils';
import { Clock, Eye, CheckCircle2, History, Filter } from 'lucide-react';

interface AnnouncementHistoryProps {
  announcements: TvAnnouncement[];
  onSelectPhotoPreview?: (announcement: TvAnnouncement) => void;
}

export const AnnouncementHistory: React.FC<AnnouncementHistoryProps> = ({
  announcements,
  onSelectPhotoPreview,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  const filteredList = announcements.filter((item) => {
    if (filter === 'active') return item.is_active;
    if (filter === 'archived') return !item.is_active;
    return true;
  });

  return (
    <div id="announcements-history-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Historial de Publicaciones</h3>
            <p className="text-xs text-slate-500">Registro seguro de fotografías emitidas a sala de espera</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
          <Filter className="w-3.5 h-3.5 ml-2 text-slate-400" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Todos ({announcements.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'active' ? 'bg-white text-emerald-800 font-semibold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'archived' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Retirados
          </button>
        </div>
      </div>

      {/* List / Table */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No hay registros en el historial para el filtro seleccionado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Miniatura</th>
                <th className="py-3 px-4">Identificador</th>
                <th className="py-3 px-4">Habitación</th>
                <th className="py-3 px-4">Publicado por</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-14 h-10 bg-slate-950 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                      <img
                        src={item.photo_url}
                        alt="Miniatura"
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {item.baby_identifier || '—'}
                  </td>

                  <td className="py-3 px-4">
                    {item.room || '—'}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{item.published_by_name}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(item.published_at)}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Activo en TV
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                        Retirado
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {onSelectPhotoPreview && (
                      <button
                        onClick={() => onSelectPhotoPreview(item)}
                        className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Ver detalle de fotografía"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
