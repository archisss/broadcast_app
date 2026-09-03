import React, { useState, useEffect } from 'react';
import { Doctor, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import {
  UserPlus,
  Stethoscope,
  Shield,
  Key,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  UserCheck,
  UserX,
  Tv,
  HeartPulse,
  KeyRound,
} from 'lucide-react';

export const DoctorsManagementPage: React.FC = () => {
  const { isSuperadmin, user, refreshUser } = useAuth();
  const { spaces } = useRealtime();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('Obstetricia y Ginecología');
  const [role, setRole] = useState<'doctor' | 'nurse' | 'admin' | 'superadmin'>('doctor');
  const [assignedSpacePath, setAssignedSpacePath] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const loadDoctors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/doctors');
      if (!res.ok) throw new Error('Error al consultar lista de doctores');
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los doctores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('Nombre, usuario y contraseña son obligatorios');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          specialty: specialty.trim(),
          role,
          assigned_space_path: assignedSpacePath.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar doctor');

      setSuccessMsg(`Usuario "${name}" registrado exitosamente.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
      setName('');
      setUsername('');
      setPassword('');
      setAssignedSpacePath('');
      await loadDoctors();
    } catch (err: any) {
      setError(err.message || 'Error al crear doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleUpdateDoctorSpace = async (id: string, newSpace: string) => {
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_space_path: newSpace }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al actualizar espacio asignado');

      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, assigned_space_path: newSpace } : d))
      );

      if (user && (user.id === id || user.username === id)) {
        await refreshUser();
      }

      setSuccessMsg('Espacio asignado actualizado exitosamente.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar espacio asignado');
      setTimeout(() => setError(null), 5000);
    }
  };

  const copySqlToClipboard = () => {
    const sql = `-- Copia y corre esto en el SQL Editor de tu Supabase si utilizas base de datos externa:
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS assigned_space_path TEXT DEFAULT '';
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_role_check;
ALTER TABLE public.doctors ADD CONSTRAINT doctors_role_check CHECK (role IN ('superadmin', 'admin', 'doctor', 'nurse'));
CREATE INDEX IF NOT EXISTS idx_doctors_assigned_space ON public.doctors(assigned_space_path);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDeleteDoctor = async (id: string, doctorName: string) => {
    if (doctors.length <= 1) {
      alert('Debe existir al menos un usuario en el sistema.');
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario "${doctorName}"?`)) return;

    try {
      const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      setSuccessMsg(`Usuario "${doctorName}" eliminado del sistema.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el doctor');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/doctors/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: !currentActive } : d))
      );
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar estado');
    }
  };

  return (
    <div id="doctors-management-page" className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-800 rounded-full text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>Control de Acceso y Gestión de Médicos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Médicos y Administradores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Administra los usuarios autorizados para ingresar al sistema y publicar fotografías o comunicados en las pantallas del hospital. Como <span className="font-semibold text-slate-700">Superadministrador</span> tienes control total sobre credenciales y permisos.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Ver SQL para base de datos Supabase externa"
          >
            <KeyRound className="w-4 h-4 text-sky-600" />
            <span>{showSqlGuide ? 'Ocultar SQL' : 'Script SQL Supabase'}</span>
          </button>

          <button
            id="btn-open-new-doctor-modal"
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-900/15 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Médico</span>
          </button>
        </div>
      </div>

      {/* Supabase SQL Helper Panel */}
      {showSqlGuide && (
        <div className="p-5 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 space-y-3 animate-fade-in text-xs font-mono">
          <div className="flex items-center justify-between font-sans">
            <div>
              <p className="font-bold text-sky-400">Actualización de tabla Supabase (Opcional si usas Supabase externo)</p>
              <p className="text-slate-400 text-[11px]">
                El sistema ya guarda y actualiza automáticamente los espacios asignados. Si deseas sincronizar la columna en tu SQL Editor de Supabase, ejecuta:
              </p>
            </div>
            <button
              type="button"
              onClick={copySqlToClipboard}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-2xl overflow-x-auto text-[11px] text-sky-200 border border-slate-800">
{`ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS assigned_space_path TEXT DEFAULT '';
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_role_check;
ALTER TABLE public.doctors ADD CONSTRAINT doctors_role_check CHECK (role IN ('superadmin', 'admin', 'doctor', 'nurse'));
CREATE INDEX IF NOT EXISTS idx_doctors_assigned_space ON public.doctors(assigned_space_path);`}
          </pre>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Doctors Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lista de Usuarios Autorizados ({doctors.length})
            </span>
          </div>

          <button
            onClick={loadDoctors}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {isLoading && doctors.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Cargando plantilla médica...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Médico / Usuario</th>
                  <th className="py-3.5 px-6">Nombre de Usuario</th>
                  <th className="py-3.5 px-6">Contraseña</th>
                  <th className="py-3.5 px-6">Especialidad</th>
                  <th className="py-3.5 px-6">Rol</th>
                  <th className="py-3.5 px-6">Espacio Asignado (Broadcast)</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {doctors.map((doc) => {
                  const isPassVisible = visiblePasswords[doc.id];
                  const isCurrentLoggedUser = user?.username === doc.username;

                  const roleBadgeConfig = {
                    superadmin: { label: 'Superadmin', classes: 'bg-purple-100 text-purple-800 border-purple-200' },
                    admin: { label: 'Admin', classes: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
                    nurse: { label: 'Enfermera', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                    doctor: { label: 'Médico', classes: 'bg-sky-100 text-sky-800 border-sky-200' },
                    tv: { label: 'Dispositivo', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
                  }[doc.role as UserRole] || { label: doc.role, classes: 'bg-slate-100 text-slate-700 border-slate-200' };

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{doc.name}</span>
                            {isCurrentLoggedUser && (
                              <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-1.5 py-0.5 rounded">
                                Sesión Actual
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-lg border border-slate-200">
                          {doc.username}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-600">
                            {isPassVisible ? doc.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(doc.id)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title={isPassVisible ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {isPassVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {doc.specialty || doc.department || 'Servicio Médico'}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleBadgeConfig.classes}`}
                        >
                          {roleBadgeConfig.label}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={doc.assigned_space_path || ''}
                          onChange={(e) => handleUpdateDoctorSpace(doc.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        >
                          <option value="">Todos los espacios</option>
                          <option value="/tv">Sala de Espera (/tv)</option>
                          {spaces
                            .filter((s) => s.direccion_web !== '/tv')
                            .map((s) => (
                              <option key={s.id} value={s.direccion_web}>
                                {s.nombre_espacio} ({s.direccion_web})
                              </option>
                            ))}
                        </select>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            doc.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {doc.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(doc.id, doc.is_active)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={doc.is_active ? 'Desactivar acceso' : 'Activar acceso'}
                          >
                            {doc.is_active ? (
                              <UserX className="w-4 h-4 text-amber-600" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>

                          {!isCurrentLoggedUser && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar médico"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Registrar Nuevo Médico / Personal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Registrar Personal Hospitalario</h3>
                  <p className="text-xs text-slate-400">
                    Crea credenciales con espacio de emisión asignado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Dr. Roberto Mendoza"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usuario de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ej. dr.mendoza"
                    className="w-full font-mono px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña segura"
                    className="w-full font-mono px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Especialidad / Área
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ej. Neonatología"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rol en el Sistema
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="doctor">Médico / Especialista</option>
                    <option value="nurse">Enfermera / Cuidados</option>
                    <option value="admin">Administrador (Mismas funciones que Superadmin)</option>
                    <option value="superadmin">Superadministrador</option>
                  </select>
                </div>
              </div>

              {/* Space Selection for Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-sky-700" />
                  <span>Espacio de Broadcast Asignado</span>
                </label>
                <select
                  value={assignedSpacePath}
                  onChange={(e) => setAssignedSpacePath(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="">Todos los espacios (Sin restricción)</option>
                  <option value="/tv">Sala de Espera General (/tv)</option>
                  {spaces
                    .filter((s) => s.direccion_web !== '/tv')
                    .map((s) => (
                      <option key={s.id} value={s.direccion_web}>
                        {s.nombre_espacio} ({s.direccion_web})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Al iniciar sesión, este espacio quedará precargado para evitar publicaciones en pantallas equivocadas.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
