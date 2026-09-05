import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import { HospitalLogo } from '../components/HospitalLogo';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCcw,
  AlertCircle,
  Sparkles,
  Tv,
  Layout,
  Trash2,
} from 'lucide-react';

export const HospitalDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings, uploadLogo, resetToDefaults } = useHospital();

  const isSuperadmin = user?.role === 'superadmin';

  const [name, setName] = useState(settings.hospitalName);
  const [subname, setSubname] = useState(settings.hospitalSubname);
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If not superadmin, block view
  if (!isSuperadmin) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Esta sección está reservada exclusivamente para el Superadministrador del hospital.
        </p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFeedback({ type: 'error', message: 'El archivo excede el tamaño máximo permitido (10MB).' });
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    }
  };

  const handleRemoveLogo = () => {
    setSelectedFile(null);
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      let finalLogoUrl = logoPreview;

      // If a new file was selected, upload it
      if (selectedFile) {
        const uploaded = await uploadLogo(selectedFile);
        if (uploaded) {
          finalLogoUrl = uploaded;
        }
      }

      const success = await updateSettings({
        hospitalName: name.trim() || 'HOSPITAL SAN LUCAS',
        hospitalSubname: subname.trim() || 'Broadcast Hospitalario',
        logoUrl: finalLogoUrl,
      });

      if (success) {
        setFeedback({
          type: 'success',
          message: '¡Identidad del hospital guardada exitosamente! Se ha actualizado en el Panel y en las pantallas de TV.',
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({
          type: 'error',
          message: 'Hubo un inconveniente al sincronizar los cambios en el servidor, pero se han guardado localmente.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al guardar los detalles del hospital.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      '¿Deseas restaurar el nombre y logotipo a los valores predeterminados del sistema?'
    );
    if (!confirmed) return;

    setIsSaving(true);
    await resetToDefaults();
    setName('HOSPITAL SAN LUCAS');
    setSubname('Broadcast Hospitalario');
    setLogoPreview('');
    setSelectedFile(null);
    setIsSaving(false);
    setFeedback({
      type: 'success',
      message: 'Se han restaurado los valores predeterminados.',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div id="hospital-details-page" className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Detalles de Identidad del Hospital
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                Solo Superadmin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personaliza el nombre institucional y logotipo. Los cambios se reflejarán instantáneamente en todas las pantallas de TV, el portal médico y el panel de administración.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          title="Restaurar a valores predeterminados"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Restaurar Valores</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Nombre Institucional del Hospital *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Hospital Ginequito o Hospital Materno Infantil"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Aparecerá en el encabezado principal de todas las televisiones de transmisión y en la pantalla de bienvenida.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Subtítulo o Departamento Hospitalario
              </label>
              <input
                type="text"
                value={subname}
                onChange={(e) => setSubname(e.target.value)}
                placeholder="ej: Obstetricia y Maternidad o Broadcast Hospitalario"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Texto secundario institucional debajo del nombre del hospital.
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Logotipo del Hospital
              </label>
              
              <div className="border-2 border-dashed border-slate-300 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50/30 rounded-3xl p-6 text-center transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                  id="hospital-logo-file-input"
                />

                {logoPreview ? (
                  <div className="space-y-4">
                    <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xs mx-auto">
                      <img
                        src={logoPreview}
                        alt="Logotipo actual"
                        className="h-20 max-w-full object-contain mx-auto"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <label
                        htmlFor="hospital-logo-file-input"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
                      >
                        Cambiar Logotipo
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <label
                        htmlFor="hospital-logo-file-input"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Seleccionar Logotipo (PNG / JPG / SVG)</span>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Recomendado: Imagen con fondo transparente (PNG o SVG), resolución recomendada mínima 400x400 px.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 bg-sky-700 hover:bg-sky-600 active:scale-[0.99] text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-900/15 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar y Aplicar en Todo el Sistema</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Previsualización en Vivo</h3>
            </div>

            {/* Light Mode Preview (Admin Portal) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <Layout className="w-3.5 h-3.5" />
                <span>Vista en Modo Claro (Panel y Portales)</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden">
                      <img src={logoPreview} alt={name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight uppercase">
                      {name || 'HOSPITAL SAN LUCAS'}
                    </p>
                    <p className="text-[11px] text-sky-700 font-semibold tracking-wide uppercase">
                      {subname || 'Broadcast Hospitalario'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode Preview (TV Broadcast Screen) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <Tv className="w-3.5 h-3.5" />
                <span>Vista en Modo Oscuro (Pantalla TV de Transmisión)</span>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <div className="w-12 h-12 rounded-xl bg-white/10 p-1.5 border border-white/20 flex items-center justify-center overflow-hidden">
                        <img src={logoPreview} alt={name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white text-base leading-tight uppercase tracking-tight">
                        {name || 'HOSPITAL SAN LUCAS'}
                      </p>
                      <p className="text-xs text-sky-300/90 font-medium tracking-wide uppercase">
                        {subname || 'Broadcast Hospitalario'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-light text-slate-300">12:30 PM</span>
                    <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">En Vivo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl text-[11px] text-sky-900 leading-relaxed">
              💡 <strong>Nota del sistema:</strong> El logotipo y nombre se guardan de forma permanente tanto en la base de datos como en almacenamiento seguro local para garantizar que la pantalla de TV funcione ininterrumpidamente incluso si la conexión a internet oscila.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
