import { createClient } from '@supabase/supabase-js';

export function sanitizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim().replace(/^['"]+|['"]+$/g, '');

  // If user pasted dashboard URL: e.g. https://supabase.com/dashboard/project/<ref>...
  const dashboardMatch =
    url.match(/supabase\.(?:com|co)\/dashboard\/project\/([a-zA-Z0-9_-]+)/i) ||
    url.match(/app\.supabase\.(?:com|co)\/project\/([a-zA-Z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Strip /rest/v1 or /rest accidentally copied from Supabase API docs
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/rest\/?$/i, '');

  // Final strip trailing slashes
  url = url.replace(/\/+$/, '');

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  return url;
}

export function sanitizeSupabaseKey(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^['"]+|['"]+$/g, '');
}

const rawUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL || 
  '';

const rawKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY || 
  '';

export let supabaseUrl = sanitizeSupabaseUrl(rawUrl);
export let supabaseAnonKey = sanitizeSupabaseKey(rawKey);

export function isValidSupabaseConfig(url: string, key: string): boolean {
  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    !url.includes('tu-proyecto') &&
    (url.startsWith('https://') || url.startsWith('http://'))
  );
}

export let isSupabaseConfigured = isValidSupabaseConfig(supabaseUrl, supabaseAnonKey);

let currentClient: ReturnType<typeof createClient> | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Synchronize with backend /api/supabase/config if frontend was built without build-time env vars
export async function syncRuntimeSupabase(): Promise<boolean> {
  if (currentClient && isSupabaseConfigured) return true;
  try {
    const res = await fetch('/api/supabase/config');
    if (!res.ok) return false;
    const data = await res.json();
    if (data.url && data.anonKey && isValidSupabaseConfig(data.url, data.anonKey)) {
      supabaseUrl = sanitizeSupabaseUrl(data.url);
      supabaseAnonKey = sanitizeSupabaseKey(data.anonKey);
      isSupabaseConfigured = true;
      currentClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      return true;
    }
  } catch {
    // Ignore error
  }
  return false;
}

// Auto-trigger sync on load in browser
if (typeof window !== 'undefined' && !currentClient) {
  syncRuntimeSupabase().catch(() => {});
}

export const supabase: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!currentClient) return undefined;
    const value = (currentClient as any)[prop];
    return typeof value === 'function' ? value.bind(currentClient) : value;
  },
});

export interface SupabaseDiagnostics {
  configured: boolean;
  url: string;
  maskedKey: string;
  tableExists?: boolean;
  canWrite?: boolean;
  isRlsBlocked?: boolean;
  isPathError?: boolean;
  writeMessage?: string;
  realtimeSubscribed?: boolean;
  error?: string;
}

export async function testSupabaseConnection(): Promise<SupabaseDiagnostics> {
  // Sync with runtime configuration if client not yet initialized
  if (!isSupabaseConfigured || !currentClient) {
    await syncRuntimeSupabase();
  }

  // Also query backend status to provide comprehensive error messaging
  let backendStatus: any = null;
  try {
    const sRes = await fetch('/api/supabase/status');
    if (sRes.ok) {
      backendStatus = await sRes.json();
    }
  } catch {
    // Ignore backend fetch error
  }

  if (!isSupabaseConfigured || !currentClient) {
    return {
      configured: false,
      url: supabaseUrl || backendStatus?.url || 'No configurada',
      maskedKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 8)}...` : 'No configurada',
      error: backendStatus?.error || 'Las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY aún no tienen valores válidos.',
    };
  }

  const maskedKey = supabaseAnonKey.length > 12 
    ? `${supabaseAnonKey.slice(0, 8)}...${supabaseAnonKey.slice(-4)}` 
    : '***';

  try {
    // 1. Test Select: check if tv_announcements exists and responds
    const { data: selectData, error: selectErr } = await supabase
      .from('tv_announcements')
      .select('id')
      .limit(1);

    if (selectErr) {
      if (selectErr.code === 'PGRST125' || selectErr.message?.includes('Invalid path')) {
        return {
          configured: true,
          url: supabaseUrl,
          maskedKey,
          tableExists: false,
          isPathError: true,
          error: 'Error PGRST125 (Ruta Inválida): La URL configurada no debe incluir "/rest/v1" ni barras finales. El sistema ha ajustado la URL automáticamente a: ' + supabaseUrl,
        };
      }

      if (selectErr.code === '42P01' || selectErr.message?.includes('does not exist')) {
        return {
          configured: true,
          url: supabaseUrl,
          maskedKey,
          tableExists: false,
          error: 'Conexión lograda, pero la tabla "tv_announcements" no existe. Falta ejecutar el script SQL en Supabase.',
        };
      }
      return {
        configured: true,
        url: supabaseUrl,
        maskedKey,
        tableExists: false,
        error: `Supabase respondió con error: ${selectErr.message} (${selectErr.code || 'código desconocido'})`,
      };
    }

    // 2. Test Insert/Delete to verify write permissions
    let canWrite = false;
    let isRlsBlocked = false;
    let isPathError = false;
    let writeMessage = '';

    const testProbeIdentifier = `PROBE_${Date.now()}`;
    const { data: insertRow, error: insertErr } = await supabase
      .from('tv_announcements')
      .insert({
        photo_path: 'probe_test',
        baby_identifier: testProbeIdentifier,
        published_by_name: 'Diagnóstico',
        is_active: false,
        channel: 'test-channel',
      })
      .select('id')
      .single();

    if (insertErr) {
      if (insertErr.code === 'PGRST125' || insertErr.message?.includes('Invalid path')) {
        isPathError = true;
        writeMessage = `Error de ruta en URL (PGRST125): Tu URL termina en "/rest/v1" o barra final. La URL correcta debe ser solo el dominio del proyecto: https://<tu-id>.supabase.co`;
      } else if (
        insertErr.code === '42501' ||
        insertErr.message?.toLowerCase().includes('row-level security') ||
        insertErr.message?.toLowerCase().includes('violates')
      ) {
        isRlsBlocked = true;
        writeMessage = 'Bloqueado por política RLS (Código 42501): La tabla existe pero rechaza inserciones de la clave pública (anon).';
      } else {
        writeMessage = `Error de inserción en Supabase: ${insertErr.message} (${insertErr.code})`;
      }
    } else {
      canWrite = true;
      writeMessage = 'Permisos de lectura y escritura verificados correctamente.';
      // Clean up test probe
      if (insertRow?.id) {
        await supabase.from('tv_announcements').delete().eq('id', insertRow.id);
      } else {
        await supabase.from('tv_announcements').delete().eq('baby_identifier', testProbeIdentifier);
      }
    }

    return {
      configured: true,
      url: supabaseUrl,
      maskedKey,
      tableExists: true,
      canWrite,
      isRlsBlocked,
      isPathError,
      writeMessage,
    };
  } catch (err: any) {
    return {
      configured: true,
      url: supabaseUrl,
      maskedKey,
      error: `Error de red al contactar Supabase: ${err.message}`,
    };
  }
}

