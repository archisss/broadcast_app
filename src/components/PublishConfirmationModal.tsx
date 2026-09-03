import React from 'react';
import { Tv, AlertTriangle, Check, X, RefreshCw, Layers, RefreshCcw } from 'lucide-react';

interface PublishConfirmationModalProps {
  isOpen: boolean;
  isLoading: boolean;
  photoDataUrl: string;
  babyIdentifier?: string;
  room?: string;
  channel?: string;
  spacePath?: string;
  keepExistingActive?: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PublishConfirmationModal: React.FC<PublishConfirmationModalProps> = ({
  isOpen,
  isLoading,
  photoDataUrl,
  babyIdentifier,
  room,
  channel = 'waiting-room',
  spacePath = '/tv',
  keepExistingActive = false,
  title,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="publish-confirmation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              ¿Confirmar publicación en pantalla?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Destino:{' '}
              <span className="font-mono font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                {spacePath}
              </span>
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="w-24 h-16 bg-slate-900 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={photoDataUrl}
                alt="Miniatura imagen a publicar"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs space-y-1">
              {title && (
                <p className="font-bold text-slate-900 text-sm line-clamp-1">{title}</p>
              )}
              <p className="text-slate-600">
                Espacio: <span className="font-mono font-bold text-sky-700">{spacePath}</span>
              </p>
              {babyIdentifier && (
                <p className="text-slate-600">
                  Referencia: <span className="font-medium text-slate-900">{babyIdentifier}</span>
                </p>
              )}
              {room && (
                <p className="text-slate-600">
                  Habitación: <span className="font-medium text-slate-900">{room}</span>
                </p>
              )}
            </div>
          </div>

          {keepExistingActive ? (
            <div className="flex items-start gap-2.5 p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-sky-900 text-xs leading-relaxed">
              <RefreshCcw className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bucle de 30 segundos activado</p>
                <p className="text-sky-800 mt-0.5">
                  Esta imagen se sumará a las ya activas en <span className="font-mono">{spacePath}</span> y la televisión rotará automáticamente entre todas cada 30 segundos.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Esta imagen pasará a ser la única visible en <span className="font-mono">{spacePath}</span>, reemplazando las anteriores de esta pantalla.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            id="btn-cancel-publish"
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            Cancelar
          </button>

          <button
            id="btn-confirm-publish"
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-sky-900/15 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Emitiendo imagen...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Publicar imagen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
