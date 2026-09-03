import React, { useState } from 'react';
import { HospitalLogo } from '../components/HospitalLogo';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, Stethoscope, HeartPulse, Shield, KeyRound } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenTv: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onOpenTv }) => {
  const { login, quickLogin, isLoading } = useAuth();
  const [username, setUsername] = useState('dra.ruiz');
  const [password, setPassword] = useState('doctor123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setError('Por favor ingresa tu nombre de usuario y contraseña');
      return;
    }

    try {
      const res = await login(cleanUsername, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Usuario o contraseña incorrectos');
      }
    } catch {
      setError('Error al conectar con el servidor');
    }
  };

  const handleQuick = async (role: UserRole) => {
    await quickLogin(role);
    onSuccess();
  };

  return (
    <div id="login-page-root" className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <HospitalLogo size="lg" />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Acceso Personal Médico
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sistema Seguro de Bienvenida y Transmisión para Pantallas Hospitalarias
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de Usuario
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: dra.ruiz, admin, superadmin"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded-xl text-xs text-slate-800 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 rounded-xl text-xs text-slate-800 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-sky-700 hover:bg-sky-600 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-900/15 transition-all cursor-pointer"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Quick Demo Logins for easy testing */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Acceso Rápido por Rol
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername('dra.ruiz');
                  setPassword('doctor123');
                  handleQuick('doctor');
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-center transition-all group cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 mx-auto mb-1 text-sky-700 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-800">Médico</span>
                <span className="block text-[9px] text-slate-400 font-mono">dra.ruiz</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('carmen.morales');
                  setPassword('nurse123');
                  handleQuick('nurse');
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-center transition-all group cursor-pointer"
              >
                <HeartPulse className="w-4 h-4 mx-auto mb-1 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-800">Enfermera</span>
                <span className="block text-[9px] text-slate-400 font-mono">carmen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                  handleQuick('admin');
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-center transition-all group cursor-pointer"
              >
                <Shield className="w-4 h-4 mx-auto mb-1 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-800">Admin</span>
                <span className="block text-[9px] text-slate-400 font-mono">admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('superadmin');
                  setPassword('admin123');
                  handleQuick('superadmin');
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-center transition-all group cursor-pointer"
              >
                <KeyRound className="w-4 h-4 mx-auto mb-1 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-800">Superadmin</span>
                <span className="block text-[9px] text-slate-400 font-mono">root</span>
              </button>
            </div>
          </div>

          {/* TV Link for public waiting room */}
          <div className="mt-6 pt-4 text-center">
            <button
              id="btn-login-open-tv"
              type="button"
              onClick={onOpenTv}
              className="text-xs text-slate-600 hover:text-sky-700 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Abrir pantalla directa de TV de Sala de Espera</span>
              <span className="text-sky-600 font-mono text-[11px]">(/tv)</span>
            </button>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div className="mt-4 text-center flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acceso restringido según políticas hospitalarias de privacidad</span>
        </div>
      </div>
    </div>
  );
};
