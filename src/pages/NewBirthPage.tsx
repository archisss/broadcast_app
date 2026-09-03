import React, { useState } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { PhotoUploader } from '../components/PhotoUploader';
import { PhotoPreview } from '../components/PhotoPreview';
import { MessageToImageGenerator } from '../components/MessageToImageGenerator';
import { PublishConfirmationModal } from '../components/PublishConfirmationModal';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Tv,
  FileText,
  Sparkles,
  Layers,
  RefreshCcw,
} from 'lucide-react';

interface NewBirthPageProps {
  onBack: () => void;
  onViewTv: () => void;
}

type PublishInputMode = 'camera' | 'upload' | 'message' | 'preview' | 'success';

export const NewBirthPage: React.FC<NewBirthPageProps> = ({ onBack, onViewTv }) => {
  const { user } = useAuth();
  const { publishAnnouncement, isPublishing, publishError, spaces, currentSpacePath } = useRealtime();

  // Mode: 'camera' | 'upload' | 'message' | 'preview' | 'success'
  const [mode, setMode] = useState<PublishInputMode>('camera');
  const [photoData, setPhotoData] = useState<{ blob?: Blob; dataUrl: string; size: number } | null>(null);

  // Metadata & Options
  const [selectedSpacePath, setSelectedSpacePath] = useState<string>(
    () => user?.assigned_space_path || currentSpacePath || '/tv'
  );

  React.useEffect(() => {
    if (user?.assigned_space_path) {
      setSelectedSpacePath(user.assigned_space_path);
    }
  }, [user?.assigned_space_path]);

  const [keepExistingActive, setKeepExistingActive] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [babyIdentifier, setBabyIdentifier] = useState('');
  const [room, setRoom] = useState('');
  const [birthDatetime, setBirthDatetime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Called when camera captures or file is uploaded
  const handlePhotoReady = (result: { blob: Blob; dataUrl: string; size: number }) => {
    setPhotoData(result);
    setMode('preview');
  };

  // Called when message card is generated into JPG
  const handleMessageImageReady = (dataUrl: string, generatedTitle?: string, generatedMsg?: string) => {
    // Approximate size in bytes for base64 dataUrl
    const approxSize = Math.round((dataUrl.length * 3) / 4);
    setPhotoData({ dataUrl, size: approxSize });
    if (generatedTitle) setTitle(generatedTitle);
    if (generatedMsg) setMessage(generatedMsg);
    setMode('preview');
  };

  const handleRetake = () => {
    setPhotoData(null);
    setMode('camera');
  };

  const handleOpenConfirm = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!photoData) return;

    const ok = await publishAnnouncement({
      photoBase64: photoData.dataUrl,
      babyIdentifier: babyIdentifier.trim() || undefined,
      room: room.trim() || undefined,
      birthDatetime: birthDatetime || new Date().toISOString(),
      channel: selectedSpacePath.replace(/^\//, '') || 'waiting-room',
      space_path: selectedSpacePath,
      keepExistingActive,
      title: title.trim() || undefined,
      message: message.trim() || undefined,
    });

    if (ok) {
      setIsConfirmModalOpen(false);
      setMode('success');
    }
  };

  return (
    <div id="publish-image-flow" className="max-w-4xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-dashboard"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al panel</span>
        </button>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Espacio seleccionado:</span>
          <span className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            {selectedSpacePath}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* Step Header */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-800 rounded-full text-xs font-semibold mb-2">
            <Tv className="w-3.5 h-3.5 text-sky-600" />
            <span>Broadcast Hospitalario</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Publicar Imagen o Comunicado
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Elige si deseas tomar una foto, subir un archivo existente o diseñar un mensaje que se convertirá automáticamente a JPG.
          </p>
        </div>

        {/* Global Error Banner */}
        {publishError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-semibold">{publishError}</p>
              <p className="text-rose-600/80 mt-0.5">
                La imagen se ha conservado para que puedas reintentar sin perder tu trabajo.
              </p>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs (Visible during input stages) */}
        {mode !== 'preview' && mode !== 'success' && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-slate-100 pb-4">
            <button
              id="tab-select-camera"
              type="button"
              onClick={() => setMode('camera')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'camera'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>1. Tomar con cámara</span>
            </button>

            <button
              id="tab-select-upload"
              type="button"
              onClick={() => setMode('upload')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'upload'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>2. Subir archivo</span>
            </button>

            <button
              id="tab-select-message"
              type="button"
              onClick={() => setMode('message')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'message'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>3. Mensaje a JPG (Diseñador)</span>
            </button>
          </div>
        )}

        {/* 1. CAMERA CAPTURE */}
        {mode === 'camera' && (
          <div className="space-y-6">
            <CameraCapture
              onCapture={handlePhotoReady}
              onSelectFileFallback={() => setMode('upload')}
            />
          </div>
        )}

        {/* 2. FILE UPLOAD */}
        {mode === 'upload' && (
          <div className="space-y-6">
            <PhotoUploader onPhotoSelected={handlePhotoReady} />
          </div>
        )}

        {/* 3. MESSAGE TO JPG GENERATOR */}
        {mode === 'message' && (
          <div className="space-y-6">
            <MessageToImageGenerator
              onImageGenerated={handleMessageImageReady}
              defaultDoctor={user?.name}
              defaultRoom={room}
            />
          </div>
        )}

        {/* PREVIEW STAGE */}
        {mode === 'preview' && photoData && (
          <PhotoPreview
            dataUrl={photoData.dataUrl}
            size={photoData.size}
            babyIdentifier={babyIdentifier}
            setBabyIdentifier={setBabyIdentifier}
            room={room}
            setRoom={setRoom}
            birthDatetime={birthDatetime}
            setBirthDatetime={setBirthDatetime}
            spacePath={selectedSpacePath}
            setSpacePath={setSelectedSpacePath}
            keepExistingActive={keepExistingActive}
            setKeepExistingActive={setKeepExistingActive}
            spaces={spaces}
            onRetake={handleRetake}
            onProceedToConfirm={handleOpenConfirm}
          />
        )}

        {/* SUCCESS STAGE */}
        {mode === 'success' && (
          <div className="py-12 text-center max-w-md mx-auto space-y-5 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Imagen emitida exitosamente
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                La publicación está activa en el espacio <span className="font-mono font-bold text-slate-800">{selectedSpacePath}</span>.
                {keepExistingActive && ' Al estar activado el bucle de 30s, la pantalla rotará entre todas las imágenes activas.'}
              </p>
              <div className="inline-block mt-2 px-4 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
                Sincronizado en tiempo real
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-success-view-tv"
                onClick={onViewTv}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Tv className="w-4 h-4" />
                <span>Ver en la pantalla TV</span>
              </button>

              <button
                id="btn-success-new-another"
                onClick={() => {
                  setPhotoData(null);
                  setBabyIdentifier('');
                  setRoom('');
                  setTitle('');
                  setMessage('');
                  setMode('camera');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Publicar otra imagen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {photoData && (
        <PublishConfirmationModal
          isOpen={isConfirmModalOpen}
          isLoading={isPublishing}
          photoDataUrl={photoData.dataUrl}
          babyIdentifier={babyIdentifier}
          room={room}
          spacePath={selectedSpacePath}
          keepExistingActive={keepExistingActive}
          title={title}
          onCancel={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmPublish}
        />
      )}
    </div>
  );
};
