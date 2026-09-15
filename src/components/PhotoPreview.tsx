import React from 'react';
import { RotateCcw, Tv, ShieldCheck, RefreshCcw, Lock, Baby, Weight, Ruler, Activity, Clock, Footprints } from 'lucide-react';
import { formatFileSize } from '../lib/utils';
import { BroadcastSpace } from '../types';
import { useAuth } from '../context/AuthContext';

interface PhotoPreviewProps {
  dataUrl: string;
  size: number;
  babyName: string;
  setBabyName: (val: string) => void;
  weight: string;
  setWeight: (val: string) => void;
  height: string;
  setHeight: (val: string) => void;
  apgar: string;
  setApgar: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  birthTime: string;
  setBirthTime: (val: string) => void;
  footSize: string;
  setFootSize: (val: string) => void;
  spacePath?: string;
  setSpacePath?: (val: string) => void;
  keepExistingActive?: boolean;
  setKeepExistingActive?: (val: boolean) => void;
  spaces?: BroadcastSpace[];
  onRetake: () => void;
  onProceedToConfirm: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  dataUrl,
  size,
  babyName,
  setBabyName,
  weight,
  setWeight,
  height,
  setHeight,
  apgar,
  setApgar,
  gender,
  setGender,
  birthTime,
  setBirthTime,
  footSize,
  setFootSize,
  spacePath = '/tv',
  setSpacePath,
  keepExistingActive = true,
  setKeepExistingActive,
  spaces = [],
  onRetake,
  onProceedToConfirm,
}) => {
  const { user } = useAuth();
  const hasAssignedSpace = Boolean(user?.assigned_space_path);
  return (
    <div id="photo-preview-step" className="w-full max-w-3xl mx-auto space-y-6 font-sans">
      {/* Photo Frame with TV Ratio */}
      <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 flex items-center justify-center group">
        <img
          src={dataUrl}
          alt="Previsualización de la imagen"
          className="w-full h-full object-contain"
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-medium rounded-full border border-slate-700">
            Listo para emisión • {formatFileSize(size)}
          </span>

          <span className="px-3 py-1 bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-xs font-medium rounded-full border border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Optimizado para TV
          </span>
        </div>
      </div>

      {/* Target Broadcast Space & Loop Options */}
      <div className="bg-sky-50/70 rounded-2xl p-5 border border-sky-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-sky-700" />
            <span className="text-xs font-bold text-sky-950 uppercase tracking-wider">
              Destino de Transmisión (Espacio de Broadcast)
            </span>
          </div>
          <span className="text-[11px] font-mono text-sky-800 font-semibold">
            {spacePath}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {setSpacePath && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pantalla o Habitación Destino
              </label>
              {hasAssignedSpace ? (
                <div className="w-full px-3.5 py-2 bg-white border border-sky-300 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-sky-700 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        {spaces.find((s) => s.direccion_web === user?.assigned_space_path)?.nombre_espacio || user?.assigned_space_path}
                      </span>
                      <span className="text-[10px] text-sky-700 font-mono">
                        {user?.assigned_space_path} (Asignado a tu cuenta)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    Fijo
                  </span>
                </div>
              ) : (
                <select
                  value={spacePath}
                  onChange={(e) => setSpacePath(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-sky-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
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
              )}
            </div>
          )}

          {setKeepExistingActive && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modo de Exhibición
              </label>
              <div className="flex items-center gap-2 pt-1">
                <label className="relative flex items-center gap-2 cursor-pointer select-none text-xs text-slate-800 bg-white px-3 py-2 rounded-xl border border-sky-200 hover:border-sky-400 transition-colors w-full">
                  <input
                    type="checkbox"
                    checked={keepExistingActive}
                    onChange={(e) => setKeepExistingActive(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <div className="leading-tight">
                    <span className="font-bold block">Bucle de 30 segundos</span>
                    <span className="text-[10px] text-slate-500">
                      Rotar con imágenes activas existentes
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Newborn Clinical & Birth Information (All Optional) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Baby className="w-4 h-4 text-sky-700" />
            <span>Datos del Recién Nacido</span>
          </h4>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Todos los campos son opcionales
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Nombre */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Baby className="w-3.5 h-3.5 text-sky-600" />
              <span>Nombre</span>
              <span className="text-[10px] font-normal text-slate-400">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Juan Pedro"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* 2. Peso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-sky-600" />
              <span>Peso</span>
              <span className="text-[10px] font-normal text-slate-400">(kg o gramos)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. 1.3 kg o 3200 g"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* 3. Talla */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-sky-600" />
              <span>Talla</span>
              <span className="text-[10px] font-normal text-slate-400">(en cm)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. 70 cm"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* 4. Apgar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              <span>Apgar</span>
              <span className="text-[10px] font-normal text-slate-400">(0 a 10)</span>
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="1"
              placeholder="Ej. 9"
              value={apgar}
              onChange={(e) => setApgar(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* 5. Sexo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <span>Sexo</span>
              <span className="text-[10px] font-normal text-slate-400">(Opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender(gender === 'Masculino' ? '' : 'Masculino')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  gender === 'Masculino'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Masculino
              </button>
              <button
                type="button"
                onClick={() => setGender(gender === 'Femenino' ? '' : 'Femenino')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  gender === 'Femenino'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Femenino
              </button>
            </div>
          </div>

          {/* 6. Hora de Nacimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Hora de Nacimiento</span>
              <span className="text-[10px] font-normal text-slate-400">(DD/MM/YYYY)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. 15/10/2026"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Formato MX: dia,mes,año DD,MM,YYYY</span>
          </div>

          {/* 7. Pie */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-sky-600" />
              <span>Pie</span>
              <span className="text-[10px] font-normal text-slate-400">(en cm)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. 8 cm"
              value={footSize}
              onChange={(e) => setFootSize(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          id="btn-retake-photo"
          type="button"
          onClick={onRetake}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Cambiar o repetir</span>
        </button>

        <button
          id="btn-show-in-tv"
          type="button"
          onClick={onProceedToConfirm}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-sky-700 hover:bg-sky-600 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-sky-900/20 transition-all cursor-pointer"
        >
          <Tv className="w-4 h-4" />
          <span>Publicar imagen</span>
        </button>
      </div>
    </div>
  );
};
