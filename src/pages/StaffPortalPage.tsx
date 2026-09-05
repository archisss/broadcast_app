import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { HospitalLogo } from '../components/HospitalLogo';
import { ConnectionStatusBadge } from '../components/ConnectionStatusBadge';
import { PhotoUploader } from '../components/PhotoUploader';
import { CameraCapture } from '../components/CameraCapture';
import { PublishConfirmationModal } from '../components/PublishConfirmationModal';
import { Announcement } from '../types';
import {
  UploadCloud,
  Camera,
  Trash2,
  Tv,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Lock,
  ExternalLink,
  Layers,
  Heart,
  RefreshCw,
  Image as ImageIcon,
  User,
} from 'lucide-react';

interface StaffPortalPageProps {
  onOpenTv: (spacePath?: string) => void;
}

export const StaffPortalPage: React.FC<StaffPortalPageProps> = ({ onOpenTv }) => {
  const { user, logout, refreshUser } = useAuth();
  const {
    spaces,
    announcements,
    publishAnnouncement,
    deleteAnnouncement,
    connectionState,
    setCurrentSpacePath,
  } = useRealtime();

  // Always refresh latest user profile (assigned_space_path) from database on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Determine user's assigned broadcast space
  const assignedSpacePath = user?.assigned_space_path || '';
  const [selectedSpacePath, setSelectedSpacePath] = useState<string>(
    assignedSpacePath || '/tv'
  );

  // Keep space synchronized if assignedSpacePath changes
  useEffect(() => {
    if (assignedSpacePath) {
      setSelectedSpacePath(assignedSpacePath);
      setCurrentSpacePath(assignedSpacePath);
    }
  }, [assignedSpacePath, setCurrentSpacePath]);

  // Upload states - default selected option is camera ('camera')
  const [activeUploadTab, setActiveUploadTab] = useState<'upload' | 'camera'>('camera');
  const [selectedPhoto, setSelectedPhoto] = useState<{
    blob: Blob;
    dataUrl: string;
    size: number;
  } | null>(null);
  const [babyIdentifier, setBabyIdentifier] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  // Requirement: loop default selected (keepExistingActive: true)
  const [keepExistingActive, setKeepExistingActive] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Look up space details
  const currentSpaceObj = useMemo(() => {
    const targetPath = assignedSpacePath || selectedSpacePath;
    return spaces.find((s) => s.direccion_web === targetPath);
  }, [spaces, assignedSpacePath, selectedSpacePath]);

  // Filter photos uploaded by this user or in their assigned space
  const myAnnouncements = useMemo(() => {
    const effectiveSpace = assignedSpacePath || selectedSpacePath;
    return announcements.filter((a) => {
      const isOwner =
        (user?.id && a.published_by_id === user.id) ||
        (user?.name && a.published_by_name === user.name) ||
        (user?.username && a.published_by_name?.toLowerCase().includes(user.username.toLowerCase()));

      const matchesSpace =
        effectiveSpace &&
        (a.space_path === effectiveSpace ||
          a.channel === effectiveSpace ||
          a.channel === effectiveSpace.replace(/^\//, ''));

      return isOwner || matchesSpace;
    });
  }, [announcements, user, assignedSpacePath, selectedSpacePath]);

  // Step 1: Open double-confirmation modal
  const handleOpenConfirm = () => {
    if (!selectedPhoto) {
      setFeedback({ type: 'error', message: 'Por favor selecciona o toma una fotografía primero.' });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Step 2: On accepting confirmation modal, automatically transmit
  const handleConfirmAndTransmit = async () => {
    if (!selectedPhoto) return;

    const effectiveSpace = assignedSpacePath || selectedSpacePath || '/tv';

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await publishAnnouncement(
        selectedPhoto.blob,
        babyIdentifier.trim() || undefined,
        roomNumber.trim() || currentSpaceObj?.nombre_espacio || undefined,
        customMessage.trim() || undefined,
        undefined,
        keepExistingActive,
        effectiveSpace
      );

      setIsConfirmModalOpen(false);

      setFeedback({
        type: 'success',
        message: `¡Fotografía publicada con éxito en ${currentSpaceObj?.nombre_espacio || effectiveSpace}!`,
      });

      // Clear form
      setSelectedPhoto(null);
      setBabyIdentifier('');
      setRoomNumber('');
      setCustomMessage('');
      setKeepExistingActive(true);

      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al publicar la fotografía.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (item: Announcement) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar esta fotografía ${
        item.baby_identifier ? `("${item.baby_identifier}")` : ''
      }? Si la subiste por error, se retirará inmediatamente de la pantalla de transmisión.`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await deleteAnnouncement(item.id);
      setFeedback({
        type: 'success',
        message: 'Fotografía eliminada correctamente.',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al eliminar la fotografía.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const effectiveSpacePath = assignedSpacePath || selectedSpacePath;

  return (
    <div id="staff-portal-page" className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header específico y simplificado para Médicos y Enfermeras */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HospitalLogo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatusBadge status={connectionState} />

            {/* Espacio Asignado Indicator */}
            {assignedSpacePath ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full text-xs font-semibold"
                title={`Espacio exclusivo asignado a tu usuario: ${assignedSpacePath}`}
              >
                <Lock className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden md:inline">Espacio asignado:</span>
                <span className="font-bold">
                  {currentSpaceObj?.nombre_espacio || assignedSpacePath}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Espacio: {effectiveSpacePath}</span>
              </div>
            )}

            {/* Botón Ver Pantalla TV */}
            <button
              id="btn-staff-view-tv"
              type="button"
              onClick={() => onOpenTv(effectiveSpacePath)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Abrir la pantalla de TV de este espacio"
            >
              <Tv className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Ver Pantalla</span>
            </button>

            {/* User Pill */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:flex flex-col text-left text-xs leading-tight">
                  <span className="font-semibold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-sky-700 font-medium">
                    {user.role === 'doctor'
                      ? 'Médico Autorizado'
                      : user.role === 'nurse'
                      ? 'Enfermera Neonatal'
                      : 'Personal Autorizado'}
                  </span>
                </div>
                <button
                  id="btn-staff-logout"
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: 2-Column Responsive Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Alerts / Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium border animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div className="flex-1">{feedback.message}</div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 text-xs underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Space Protection Notice for Doctors/Nurses */}
        {assignedSpacePath ? (
          <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-900">
            <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Transmisión protegida en:{' '}
                <span className="text-sky-950 font-extrabold">
                  {currentSpaceObj?.nombre_espacio || assignedSpacePath}
                </span>{' '}
                ({assignedSpacePath})
              </p>
              <p className="text-sky-700 mt-0.5">
                Tus credenciales están vinculadas a este espacio de broadcast para garantizar que
                las fotografías se muestren exclusivamente en la pantalla correcta sin riesgo de
                error.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Layers className="w-4 h-4 text-sky-700" />
              <span className="font-semibold">Selecciona la pantalla de transmisión:</span>
            </div>
            <select
              value={selectedSpacePath}
              onChange={(e) => setSelectedSpacePath(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="/tv">Sala de Espera General (/tv)</option>
              {spaces
                .filter((s) => s.direccion_web !== '/tv')
                .map((s) => (
                  <option key={s.id} value={s.direccion_web}>
                    {s.nombre_espacio} ({s.direccion_web})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Main Grid: Upload on Left/Top, Photo List on Right/Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Section 1: Subir Fotografía (5 cols on lg) */}
          <section className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-sky-700" />
                  <span>Subir Fotografía</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Transmite una nueva fotografía del recién nacido
                </p>
              </div>

              {/* Toggle upload method */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveUploadTab('upload')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeUploadTab === 'upload'
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Subir archivo desde computadora o celular"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveUploadTab('camera')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeUploadTab === 'camera'
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tomar foto con la cámara"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Selection Area */}
            {!selectedPhoto ? (
              <div>
                {activeUploadTab === 'upload' ? (
                  <PhotoUploader onPhotoSelected={(photo) => setSelectedPhoto(photo)} />
                ) : (
                  <CameraCapture
                    onCapture={(photo) => setSelectedPhoto(photo)}
                    onSelectFileFallback={() => setActiveUploadTab('upload')}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Photo Preview Thumbnail */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-4/3 flex items-center justify-center group">
                  <img
                    src={selectedPhoto.dataUrl}
                    alt="Foto seleccionada"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(null)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Cambiar Foto
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md font-mono">
                    Foto lista para emisión
                  </div>
                </div>

                {/* Optional Metadata Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Identificador / Apellidos del Bebé (Opcional)
                    </label>
                    <input
                      type="text"
                      value={babyIdentifier}
                      onChange={(e) => setBabyIdentifier(e.target.value)}
                      placeholder="Ej. Bebé Hernández Garza"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Habitación (Opcional)
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="Ej. Suite 302"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mensaje de Felicitación (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Ej. ¡Bienvenido al mundo!"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Loop Option: Defaulted to True per user requirement */}
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keepExistingActive}
                        onChange={(e) => setKeepExistingActive(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-sky-700 rounded border-slate-300 focus:ring-sky-500"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-sky-950 block">
                          Transmitir en bucle (Rotación de 30s)
                        </span>
                        <span className="text-sky-700 text-[11px]">
                          Mantiene las fotos anteriores rotando en pantalla cada 30 segundos.
                          Desmarca si deseas que esta foto sea la única visible.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Publish and Cancel Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    disabled={isSubmitting}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenConfirm}
                    disabled={isSubmitting}
                    className="w-2/3 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Publicando...</span>
                      </>
                    ) : (
                      <>
                        <Tv className="w-4 h-4" />
                        <span>Publicar en Pantalla</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Mis Fotografías Subidas (7 cols on lg) */}
          <section className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-700" />
                  <span>Mis Fotografías Subidas</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Lista de imágenes emitidas. Puedes eliminar cualquier foto subida por error.
                </p>
              </div>

              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                {myAnnouncements.length} {myAnnouncements.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            {/* List of uploaded photos */}
            {myAnnouncements.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="max-w-xs mx-auto">
                  <p className="text-sm font-semibold text-slate-700">No hay fotos registradas</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Las fotos que tomes o subas aparecerán aquí con la opción de eliminarlas si te
                    equivocas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {myAnnouncements.map((item) => {
                  const isBeingDeleted = deletingId === item.id;
                  const dateFormatted = new Date(item.created_at).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all flex items-center gap-4"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 relative">
                        <img
                          src={item.photo_url}
                          alt={item.baby_identifier || 'Fotografía'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {item.is_active && (
                          <div
                            className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
                            title="Transmitiendo en pantalla"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.baby_identifier || 'Recién Nacido'}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.is_active ? 'En Pantalla' : 'Inactiva'}
                          </span>
                        </div>

                        {item.room && (
                          <p className="text-[11px] text-slate-600">
                            Habitación: <span className="font-semibold">{item.room}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {dateFormatted}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">
                            {item.space_path || item.channel || '/tv'}
                          </span>
                        </div>
                      </div>

                      {/* Action: Delete Photo Button */}
                      <div className="shrink-0 flex items-center">
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(item)}
                          disabled={isBeingDeleted}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Eliminar esta foto del sistema y de la pantalla de TV"
                        >
                          {isBeingDeleted ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal de Doble Confirmación de Espacio Asignado */}
      {selectedPhoto && (
        <PublishConfirmationModal
          isOpen={isConfirmModalOpen}
          isLoading={isSubmitting}
          photoDataUrl={selectedPhoto.dataUrl}
          babyIdentifier={babyIdentifier}
          room={roomNumber || currentSpaceObj?.nombre_espacio}
          spacePath={effectiveSpacePath}
          keepExistingActive={keepExistingActive}
          title={customMessage || 'Fotografía de Nacimiento'}
          onCancel={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmAndTransmit}
        />
      )}
    </div>
  );
};
