import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, AlertCircle, UploadCloud, RefreshCw } from 'lucide-react';
import { compressAndOptimizeImage } from '../lib/utils';

interface CameraCaptureProps {
  onCapture: (result: { blob: Blob; dataUrl: string; size: number }) => void;
  onSelectFileFallback: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onSelectFileFallback,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isShutterActive, setIsShutterActive] = useState(false);

  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCurrentStream();
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a la cámara web.');
      }

      // Try environment (rear) camera first on mobile devices, or requested mode
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraPermission('granted');
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraPermission('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Permiso de cámara denegado. Permite el acceso a la cámara en los ajustes del navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No se encontró ninguna cámara conectada en este dispositivo.');
      } else {
        setErrorMessage('No se pudo inicializar la cámara. Puedes subir una fotografía desde tus archivos.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [stopCurrentStream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCurrentStream();
    };
  }, [facingMode, startCamera, stopCurrentStream]);

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return;

    // Trigger visual flash
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, invert horizontally to match mirror preview
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        // Optimize and strip EXIF
        const optimized = await compressAndOptimizeImage(blob, 1920, 0.88);
        onCapture({
          blob: optimized.blob,
          dataUrl: optimized.dataUrl,
          size: optimized.optimizedSize,
        });
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div id="camera-capture-container" className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Video Viewport */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/9 bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
        {/* Shutter flash overlay */}
        {isShutterActive && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-200 opacity-90" />
        )}

        {/* Live video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          } ${cameraPermission !== 'granted' ? 'hidden' : 'block'}`}
        />

        {/* Center Baby Framing Guide */}
        {cameraPermission === 'granted' && (
          <div className="absolute inset-8 pointer-events-none border border-white/25 rounded-2xl flex flex-col justify-between p-4">
            <div className="flex justify-between">
              <span className="w-4 h-4 border-t-2 border-l-2 border-white/60" />
              <span className="w-4 h-4 border-t-2 border-r-2 border-white/60" />
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white/80 text-xs font-medium tracking-wide">
                Encuadre del recién nacido
              </span>
            </div>
            <div className="flex justify-between">
              <span className="w-4 h-4 border-b-2 border-l-2 border-white/60" />
              <span className="w-4 h-4 border-b-2 border-r-2 border-white/60" />
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isInitializing && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white gap-3 z-10">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-sm font-medium">Iniciando cámara clínica...</p>
          </div>
        )}

        {/* Camera Permission Denied or Error Fallback */}
        {cameraPermission === 'denied' && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Cámara no disponible</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
              {errorMessage || 'No se pudo acceder a la cámara en este entorno o navegador.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                id="btn-retry-camera"
                onClick={() => startCamera(facingMode)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <button
                id="btn-upload-file-fallback"
                onClick={onSelectFileFallback}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-colors shadow-md shadow-sky-900/20"
              >
                <UploadCloud className="w-4 h-4" />
                Subir foto
              </button>
            </div>
          </div>
        )}

        {/* Switch camera button floating in corner */}
        {cameraPermission === 'granted' && (
          <button
            id="btn-switch-camera"
            type="button"
            onClick={handleToggleFacingMode}
            className="absolute top-4 right-4 z-20 p-2.5 bg-black/50 hover:bg-black/70 active:scale-95 text-white rounded-full backdrop-blur-md transition-all shadow-md"
            title="Cambiar entre cámara trasera y frontal"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Camera Capture Controls */}
      {cameraPermission === 'granted' && (
        <div className="flex items-center justify-between w-full mt-6 px-4">
          <button
            id="btn-fallback-select-photo"
            type="button"
            onClick={onSelectFileFallback}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Subir archivo</span>
          </button>

          {/* Main Shutter Button */}
          <button
            id="btn-capture-shutter"
            type="button"
            onClick={handleCapturePhoto}
            disabled={isInitializing}
            className="relative group p-1.5 rounded-full border-4 border-sky-600 hover:border-sky-500 active:scale-95 transition-all shadow-lg hover:shadow-sky-500/25"
            title="Capturar fotografía del recién nacido"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-sky-600 group-hover:bg-sky-500 flex items-center justify-center transition-all">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </button>

          <button
            id="btn-switch-facing-mode"
            type="button"
            onClick={handleToggleFacingMode}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <SwitchCamera className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">
              {facingMode === 'environment' ? 'Trasera' : 'Frontal'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
