import React, { ReactNode, useState } from 'react';
import { HospitalLogo } from './HospitalLogo';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { SupabaseStatusModal } from './SupabaseStatusModal';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import {
  LayoutDashboard,
  ImagePlus,
  History,
  Tv,
  LogOut,
  User as UserIcon,
  ExternalLink,
  ShieldAlert,
  Database,
  Layers,
  Users,
  Building2,
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'new' | 'history' | 'spaces' | 'doctors' | 'hospital';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  onOpenTv: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  onOpenTv,
}) => {
  const { user, logout } = useAuth();
  const { connectionState, currentSpacePath } = useRealtime();
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const isSuperadminOrAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div id="admin-layout" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Top Hospital Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Hospital brand */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-left hover:opacity-90 transition-opacity cursor-pointer"
            >
              <HospitalLogo size="md" />
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <ConnectionStatusBadge status={connectionState} />

              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  isSupabaseConfigured
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title="Ver estado y diagnosticar conexión con Supabase"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSupabaseConfigured ? 'Supabase: Conectado' : 'Configurar Supabase'}</span>
              </button>
            </div>
          </div>

          {/* User Profile & TV Quick Action */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* TV Mode launcher button */}
            <button
              id="btn-nav-open-tv"
              type="button"
              onClick={onOpenTv}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Abrir la pantalla de TV del canal actual"
            >
              <Tv className="w-3.5 h-3.5 text-sky-400" />
              <span>Ver Pantalla ({currentSpacePath})</span>
              <ExternalLink className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Authenticated user pill */}
            {user && (
              <div className="flex items-center gap-2.5 pl-1">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-left text-xs leading-tight">
                  <span className="font-semibold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-sky-700 font-medium capitalize">
                    {user.role === 'superadmin'
                      ? 'Superadministrador'
                      : user.role === 'admin'
                      ? 'Administrador General'
                      : user.role === 'doctor'
                      ? 'Médico Autorizado'
                      : user.role === 'nurse'
                      ? 'Enfermera Neonatal'
                      : 'Operador'}
                  </span>
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              id="btn-logout"
              type="button"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Bar Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-slate-100 py-1.5 scrollbar-none">
          <button
            id="tab-nav-dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Panel Principal</span>
          </button>

          <button
            id="tab-nav-new"
            onClick={() => onNavigate('new')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'new'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            <ImagePlus className="w-4 h-4" />
            <span>Publicar Imagen</span>
          </button>

          <button
            id="tab-nav-history"
            onClick={() => onNavigate('history')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Emisiones</span>
          </button>

          {/* Broadcast Spaces Tab (Visible to all or admins) */}
          <button
            id="tab-nav-spaces"
            onClick={() => onNavigate('spaces')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'spaces'
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Espacios de Broadcast</span>
          </button>

          {/* Doctors & Users Management (Visible if superadmin or admin) */}
          {isSuperadminOrAdmin && (
            <button
              id="tab-nav-doctors"
              onClick={() => onNavigate('doctors')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'doctors'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Médicos & Usuarios</span>
            </button>
          )}

          {/* Hospital Details Tab (Superadmin only) */}
          {user?.role === 'superadmin' && (
            <button
              id="tab-nav-hospital"
              onClick={() => onNavigate('hospital')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'hospital'
                  ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Detalles del Hospital</span>
            </button>
          )}

          <button
            id="tab-nav-supabase"
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-all whitespace-nowrap ml-auto cursor-pointer"
            title="Verificar y probar conexión con la base de datos Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Probar Supabase</span>
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Broadcast Hospitalario</span>
            <span>•</span>
            <span>Hospital San Lucas</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Canal activo: {currentSpacePath}</span>
            <span className="text-slate-400">Sincronización SSE en Tiempo Real & Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
