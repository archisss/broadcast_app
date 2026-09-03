import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { compressAndOptimizeImage, formatFileSize } from '../lib/utils';

interface PhotoUploaderProps {
  onPhotoSelected: (result: { blob: Blob; dataUrl: string; size: number }) => void;
  onCancel?: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotoSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Strict validation
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setErrorMessage('Formato no permitido. Solo se admiten imágenes JPG, PNG o WEBP.');
      return;
    }

    // Max 15MB original
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(`El archivo es demasiado grande (${formatFileSize(file.size)}). Máximo 15MB.`);
      return;
    }

    try {
      setIsProcessing(true);
      const optimized = await compressAndOptimizeImage(file, 1920, 0.88);
      onPhotoSelected({
        blob: optimized.blob,
        dataUrl: optimized.dataUrl,
        size: optimized.optimizedSize,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div id="photo-uploader-component" className="w-full max-w-xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
        id="file-input-baby-photo"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-sky-400 bg-white hover:bg-slate-50/50'
        } shadow-sm`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <RefreshCw className="w-10 h-10 animate-spin text-sky-600" />
            <p className="text-sm font-semibold text-slate-800">
              Optimizando y sanitizando imagen...
            </p>
            <p className="text-xs text-slate-500">
              Eliminando metadatos EXIF y ajustando resolución a pantalla TV
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-sky-100/80 text-sky-700 flex items-center justify-center mb-1">
              {isDragging ? (
                <UploadCloud className="w-8 h-8 animate-bounce" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">
                Arrastra la fotografía aquí o haz clic para seleccionarla
              </p>
              <p className="text-xs text-slate-500">
                Formatos permitidos: JPG, PNG, WEBP (hasta 15MB)
              </p>
            </div>

            <span className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">
              <UploadCloud className="w-4 h-4 text-slate-500" />
              Examinar en el dispositivo
            </span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs leading-relaxed animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
