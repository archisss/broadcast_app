import React, { useState, useEffect } from 'react';
import { BroadcastSpace } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import {
  Tv,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Radio,
  X,
  Sliders,
} from 'lucide-react';

interface BroadcastSpacesPageProps {
  onOpenSpaceTv?: (spacePath: string) => void;
}

export const BroadcastSpacesPage: React.FC<BroadcastSpacesPageProps> = ({ onOpenSpaceTv }) => {
  const { isSuperadmin, canManageSpaces, user } = useAuth();
  const { announcements } = useRealtime();

  const [spaces, setSpaces] = useState<BroadcastSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreEspacio, setNombreEspacio] = useState('');
  const [direccionWeb, setDireccionWeb] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSpaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/spaces');
      if (!res.ok) throw new Error('Error al consultar espacios de broadcast');
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los espacios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpaces();
  }, []);

  // Auto-generate web path from name
  const handleNameChange = (val: string) => {
    setNombreEspacio(val);
    if (!direccionWeb || direccionWeb.startsWith('/')) {
      const slug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setDireccionWeb('/' + (slug || ''));
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreEspacio.trim()) {
      setError('El nombre del espacio es obligatorio');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let cleanPath = direccionWeb.trim();
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_espacio: nombreEspacio.trim(),
          direccion_web: cleanPath,
          description: description.trim(),
          user_name: user?.name || 'Administrador',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el espacio');

      setSuccessMsg(`Espacio "${nombreEspacio}" creado con éxito en ${cleanPath}`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
      setNombreEspacio('');
      setDireccionWeb('');
      setDescription('');
      await loadSpaces();
    } catch (err: any) {
      setError(err.message || 'Error al registrar espacio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpace = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el espacio "${name}"?`)) return;

    try {
      const res = await fetch(`/api/spaces/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setSpaces((prev) => prev.filter((s) => s.id !== id));
      setSuccessMsg(`Espacio "${name}" eliminado correctamente`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el espacio');
    }
  };

  const copyUrl = (webPath: string, id: string) => {
    const cleanPath = webPath.startsWith('/') ? webPath : `/${webPath}`;
    const fullUrl = `${window.location.origin}${cleanPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Count active loop items for each space
  const getActiveCountForSpace = (webPath: string) => {
    return announcements.filter(
      (a) => a.is_active && (a.space_path === webPath || a.channel === webPath.replace(/^\//, ''))
    ).length;
  };

  return (
    <div id="broadcast-spaces-management" className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-800 rounded-full text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>Múltiples Pantallas & Suites Hospitalarias</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Espacios de Broadcast
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Gestiona las direcciones web independientes de cada televisión (ej. <span className="font-mono text-slate-800">/master_suite</span>, <span className="font-mono text-slate-800">/cuarto22</span>). Si un cuarto tiene más de una imagen activa, se creará automáticamente un bucle que rotará cada 30 segundos.
          </p>
        </div>

        {canManageSpaces && (
          <button
            id="btn-create-new-space"
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-900/15 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Espacio de Broadcast</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Spaces Table & Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lista de Espacios Registrados ({spaces.length})
            </span>
          </div>

          <button
            onClick={loadSpaces}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Refrescar espacios"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {isLoading && spaces.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Cargando espacios hospitalarios...
          </div>
        ) : spaces.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Tv className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No hay espacios registrados todavía</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Crea espacios como "Master Suite" o "Cuarto 22" para habilitar pantallas independientes en cada habitación.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">UUID / ID</th>
                  <th className="py-3.5 px-6">Nombre del Espacio</th>
                  <th className="py-3.5 px-6">Dirección Web</th>
                  <th className="py-3.5 px-6">Imágenes Activas</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {spaces.map((space) => {
                  const activeCount = getActiveCountForSpace(space.direccion_web);
                  const isMultiLoop = activeCount > 1;

                  return (
                    <tr key={space.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                        {space.id.length > 12 ? `${space.id.slice(0, 10)}...` : space.id}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{space.nombre_espacio}</div>
                        {space.description && (
                          <div className="text-[11px] text-slate-400">{space.description}</div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-sky-800 font-mono text-xs font-semibold rounded-lg border border-slate-200">
                          <span>{space.direccion_web}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {activeCount > 0 ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-semibold text-slate-800">
                              {activeCount} imagen{activeCount > 1 ? 'es' : ''}
                            </span>
                            {isMultiLoop && (
                              <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full font-bold">
                                Bucle 30s
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin imágenes activas</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            space.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {space.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => copyUrl(space.direccion_web, space.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Copiar enlace de transmisión"
                          >
                            {copiedId === space.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const cleanPath = space.direccion_web.startsWith('/') ? space.direccion_web : `/${space.direccion_web}`;
                              if (onOpenSpaceTv) {
                                onOpenSpaceTv(cleanPath);
                              } else {
                                window.open(`${window.location.origin}${cleanPath}`, '_blank');
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-lg transition-colors cursor-pointer"
                            title="Ver transmisión en TV"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Ver TV</span>
                            <ExternalLink className="w-3 h-3 text-sky-500" />
                          </button>

                          {canManageSpaces && space.direccion_web !== '/tv' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSpace(space.id, space.nombre_espacio)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar espacio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear Nuevo Espacio de Broadcast */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Crear Espacio de Broadcast</h3>
                  <p className="text-xs text-slate-400">
                    Solo administradores pueden crear nuevos canales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Espacio *
                </label>
                <input
                  type="text"
                  required
                  value={nombreEspacio}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Master Suite ó Cuarto 22"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Web (Ruta URL) *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={direccionWeb}
                    onChange={(e) => setDireccionWeb(e.target.value)}
                    placeholder="/master_suite ó /cuarto22"
                    className="w-full font-mono px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Esta ruta permitirá abrir la transmisión directamente desde el navegador (ej: <span className="font-mono">{window.location.origin}/cuarto22</span>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción o Ubicación (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Pantalla Samsung 65 pulgadas Habitación 22"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando espacio...' : 'Guardar Espacio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
