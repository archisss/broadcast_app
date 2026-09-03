import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, X, Copy, Check, RefreshCw, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey, testSupabaseConnection, SupabaseDiagnostics } from '../lib/supabase';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<SupabaseDiagnostics | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFixSql, setCopiedFixSql] = useState(false);

  const runTest = async () => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setDiagnostics(res);
    } catch (err: any) {
      setDiagnostics({
        configured: isSupabaseConfigured,
        url: supabaseUrl || 'No configurada',
        maskedKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 8)}...` : 'No configurada',
        error: err.message || 'Error al verificar conexión',
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runTest();
    }
  }, [isOpen]);

  const handleCopySql = async () => {
    try {
      const response = await fetch('/api/supabase/migration-sql');
      const sqlText = response.ok ? await response.text() : `-- Error cargando SQL.`;
      await navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      setCopiedSql(false);
    }
  };

  const handleCopyFixSql = async () => {
    try {
      const response = await fetch('/api/supabase/fix-permissions-sql');
      const sqlText = response.ok
        ? await response.text()
        : `-- Permisos universales para Supabase
ALTER TABLE public.tv_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for tv_announcements" ON public.tv_announcements;
CREATE POLICY "Allow all for tv_announcements" ON public.tv_announcements FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all for audit_logs" ON public.audit_logs FOR ALL TO public USING (true) WITH CHECK (true);`;
      await navigator.clipboard.writeText(sqlText);
      setCopiedFixSql(true);
      setTimeout(() => setCopiedFixSql(false), 3000);
    } catch {
      setCopiedFixSql(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Diagnóstico de Conexión con Supabase
              </h3>
              <p className="text-xs text-slate-500">
                Verificación de lectura, escritura y políticas de seguridad RLS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status summary banner */}
          {diagnostics ? (
            diagnostics.canWrite ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950">¡Conexión y Escritura en Supabase Verificadas al 100%!</p>
                  <p className="text-emerald-700 leading-relaxed">
                    Las variables son válidas, la tabla <span className="font-mono font-semibold">tv_announcements</span> respondió y la prueba de inserción fue exitosa. Cada nacimiento se guardará en tu base de datos Supabase.
                  </p>
                </div>
              </div>
            ) : diagnostics.isPathError || diagnostics.writeMessage?.includes('PGRST125') ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5">
                  <p className="font-bold text-amber-950">Detectado: Formato de URL con subruta (Error PGRST125)</p>
                  <p className="text-amber-800 leading-relaxed">
                    El error <span className="font-mono font-semibold">PGRST125 (Invalid path specified in request URL)</span> ocurre cuando la variable de entorno <span className="font-mono">VITE_SUPABASE_URL</span> incluye <span className="font-mono">/rest/v1</span> o una barra diagonal al final.
                  </p>
                  <p className="text-emerald-800 bg-emerald-100/70 p-2 rounded-lg font-medium">
                    ✅ La aplicación ahora la limpia y sanitiza automáticamente a: <span className="font-mono font-bold text-emerald-950">{diagnostics.url}</span>. Presiona "Volver a Probar Conexión" abajo para confirmar.
                  </p>
                </div>
              </div>
            ) : diagnostics.isRlsBlocked ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-950">Detectado: Bloqueo de Inserción por Políticas RLS (Error 42501)</p>
                  <p className="text-amber-800 leading-relaxed">
                    Tu base de datos Supabase y las 3 tablas existen correctamente, pero las políticas de seguridad (Row-Level Security) están rechazando los nuevos registros de nacimientos.
                  </p>
                  <p className="font-semibold text-amber-950 pt-1">
                    👉 Se soluciona ejecutando el script de permisos abajo en tu SQL Editor de Supabase.
                  </p>
                </div>
              </div>
            ) : diagnostics.tableExists ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-950">Tabla conectada pero con detalle en escritura</p>
                  <p className="text-amber-700 leading-relaxed">
                    {diagnostics.writeMessage || diagnostics.error || 'La tabla existe pero falló la prueba de inserción.'}
                  </p>
                </div>
              </div>
            ) : diagnostics.configured ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-950">Variables detectadas, pero falta la tabla en Supabase</p>
                  <p className="text-amber-700 leading-relaxed">
                    {diagnostics.error || 'La base de datos respondió, pero la tabla tv_announcements no existe aún.'}
                  </p>
                  <p className="font-medium text-amber-900 mt-2">
                    👉 Ejecuta el script SQL en el SQL Editor de tu panel de Supabase.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-slate-700">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900">Variables no configuradas o incompletas</p>
                  <p className="text-slate-600 leading-relaxed">
                    Revisa en Settings que existan <span className="font-mono">VITE_SUPABASE_URL</span> y <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
              <span>Verificando conexión y permisos con Supabase...</span>
            </div>
          )}

          {/* RLS Solution Box if blocked */}
          {diagnostics?.isRlsBlocked && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950">Solución Inmediata: Habilitar Permisos en Supabase</p>
                  <p className="text-emerald-800 leading-relaxed">
                    Copia este script de permisos, pégalo en el <strong>SQL Editor</strong> de Supabase y haz clic en <strong>RUN</strong>. Al instante podrás registrar nacimientos y verlos reflejados en tus tablas.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyFixSql}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {copiedFixSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>¡Script de Permisos Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Script de Solución de Permisos (1 Clic)</span>
                    </>
                  )}
                </button>

                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-semibold transition-all"
                >
                  <span>Abrir SQL Editor en Supabase</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              </div>
            </div>
          )}

          {/* Details table */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center justify-between">
              <span>Diagnóstico Detallado</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal">Environment & RLS</span>
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">VITE_SUPABASE_URL:</span>
                <span className="font-mono text-slate-800 font-semibold truncate max-w-xs text-right">
                  {supabaseUrl ? supabaseUrl : <span className="text-slate-400 italic">No configurada</span>}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Lectura de Tablas (SELECT):</span>
                <span className="font-semibold">
                  {diagnostics?.tableExists ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tabla tv_announcements responde
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> No encontrada
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Permisos de Inserción (INSERT):</span>
                <span className="font-semibold">
                  {diagnostics?.canWrite ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Permitido (Escritura activa)
                    </span>
                  ) : diagnostics?.isRlsBlocked ? (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Bloqueado por RLS (Error 42501)
                    </span>
                  ) : (
                    <span className="text-slate-500">No evaluado</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Step Guide to link */}
          <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/50 space-y-3 text-xs">
            <h4 className="font-bold text-sky-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Scripts SQL Disponibles</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyFixSql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium cursor-pointer"
              >
                {copiedFixSql ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFixSql ? '¡Copiado!' : 'Copiar Script de Permisos RLS'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar Migración Completa'}</span>
              </button>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium"
              >
                <span>Ir a Supabase SQL Editor</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={isTesting}
            onClick={runTest}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-sky-600' : 'text-slate-500'}`} />
            <span>{isTesting ? 'Comprobando...' : 'Volver a Probar Conexión'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
