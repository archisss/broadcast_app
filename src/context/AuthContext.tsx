import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  canPublish: boolean;
  canHide: boolean;
  canViewAudit: boolean;
  isSuperadmin: boolean;
  canManageSpaces: boolean;
  canManageDoctors: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, User> = {
  superadmin: {
    id: 'usr_superadmin',
    username: 'superadmin',
    email: 'superadmin@hospital.com',
    name: 'Superadministrador Hospitalario',
    role: 'superadmin',
    department: 'Dirección General de Sistemas & Operaciones',
    assigned_space_path: '',
  },
  admin: {
    id: 'usr_admin',
    username: 'admin',
    email: 'admin@hospital.com',
    name: 'Administrador Hospitalario',
    role: 'admin',
    department: 'Dirección Médica y Operaciones',
    licenseNumber: 'DIR-100293',
    assigned_space_path: '',
  },
  doctor: {
    id: 'usr_doc_01',
    username: 'dra.ruiz',
    email: 'doctor@hospital.com',
    name: 'Dra. Elena Ruiz Valenzuela',
    role: 'doctor',
    department: 'Obstetricia y Maternidad',
    licenseNumber: 'MED-849201',
    assigned_space_path: '',
  },
  nurse: {
    id: 'usr_nurse_01',
    username: 'carmen.morales',
    email: 'enfermera@hospital.com',
    name: 'Lic. Carmen Morales',
    role: 'nurse',
    department: 'Cuidados Neonatales',
    licenseNumber: 'ENF-390192',
    assigned_space_path: '',
  },
  tv: {
    id: 'usr_tv_01',
    username: 'tv_waiting',
    email: 'tv-waiting-room@hospital.com',
    name: 'Dispositivo TV Sala de Espera',
    role: 'tv',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async (): Promise<User | null> => {
    try {
      const stored = localStorage.getItem('hospital_auth_user');
      const currentUser = user || (stored ? JSON.parse(stored) : null);
      if (!currentUser) return null;

      const identifier = currentUser.username || currentUser.id;
      if (!identifier) return null;

      const res = await fetch(`/api/auth/profile/${encodeURIComponent(identifier)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const updatedUser: User = {
            ...currentUser,
            ...data.user,
            assigned_space_path: data.user.assigned_space_path || '',
          };
          setUser(updatedUser);
          localStorage.setItem('hospital_auth_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
      }
    } catch (err) {
      console.warn('Error refrescando perfil de usuario:', err);
    }
    return null;
  };

  useEffect(() => {
    // Restore session if available
    try {
      const storedUser = localStorage.getItem('hospital_auth_user');
      const storedToken = localStorage.getItem('hospital_auth_token');
      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);

        // Immediate background revalidation with server database
        const identifier = parsed.username || parsed.id;
        if (identifier) {
          fetch(`/api/auth/profile/${encodeURIComponent(identifier)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data?.success && data?.user) {
                const refreshed: User = {
                  ...parsed,
                  ...data.user,
                  assigned_space_path: data.user.assigned_space_path || '',
                };
                setUser(refreshed);
                localStorage.setItem('hospital_auth_user', JSON.stringify(refreshed));
              }
            })
            .catch(() => {});
        }
      } else {
        // Pre-load superadmin so administrator can immediately access all tools
        setUser(DEMO_USERS.superadmin);
        setToken('token_usr_superadmin_demo');
      }
    } catch {
      setUser(DEMO_USERS.superadmin);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (identifier: string, password?: string, role?: UserRole): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Attempt login with backend API
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem('hospital_auth_user', JSON.stringify(data.user));
          localStorage.setItem('hospital_auth_token', data.token);
          return { success: true };
        } else if (data.error && !data.error.includes('no encontrado')) {
          return { success: false, error: data.error };
        }
      } catch (err) {
        console.warn('Backend login notice, checking demo fallback:', err);
      }

      // 2. Fallback to demo users
      const match = Object.values(DEMO_USERS).find(
        (u) =>
          u.username?.toLowerCase() === identifier.toLowerCase() ||
          u.email?.toLowerCase() === identifier.toLowerCase()
      ) || {
        id: `usr_${Date.now()}`,
        username: identifier,
        name: identifier,
        role: role || (identifier.toLowerCase().includes('super') ? 'superadmin' : 'doctor'),
        department: 'Servicio Hospitalario',
        assigned_space_path: '',
      };

      const generatedToken = `token_${match.id}_${Date.now()}`;
      setUser(match);
      setToken(generatedToken);
      localStorage.setItem('hospital_auth_user', JSON.stringify(match));
      localStorage.setItem('hospital_auth_token', generatedToken);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error al iniciar sesión' };
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { user: string; pass: string }> = {
      doctor: { user: 'dra.ruiz', pass: 'doctor123' },
      nurse: { user: 'carmen.morales', pass: 'nurse123' },
      admin: { user: 'admin', pass: 'admin123' },
      superadmin: { user: 'superadmin', pass: 'admin123' },
      tv: { user: 'tv_waiting', pass: 'tv123' },
    };

    const targetCred = creds[role];
    if (targetCred) {
      const res = await login(targetCred.user, targetCred.pass, role);
      if (res.success) return;
    }

    const selected = DEMO_USERS[role] || DEMO_USERS.doctor;
    const generatedToken = `token_${selected.id}_${Date.now()}`;
    setUser(selected);
    setToken(generatedToken);
    localStorage.setItem('hospital_auth_user', JSON.stringify(selected));
    localStorage.setItem('hospital_auth_token', generatedToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hospital_auth_user');
    localStorage.removeItem('hospital_auth_token');
  };

  const isSuperadmin = user?.role === 'superadmin' || user?.role === 'admin';
  const canManageSpaces = isSuperadmin || user?.role === 'admin';
  const canManageDoctors = isSuperadmin || user?.role === 'admin';
  const canPublish = user ? ['superadmin', 'admin', 'doctor', 'nurse'].includes(user.role) : false;
  const canHide = user ? ['superadmin', 'admin', 'doctor', 'nurse'].includes(user.role) : false;
  const canViewAudit = user ? ['superadmin', 'admin', 'doctor'].includes(user.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        quickLogin,
        logout,
        refreshUser,
        canPublish,
        canHide,
        canViewAudit,
        isSuperadmin,
        canManageSpaces,
        canManageDoctors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
