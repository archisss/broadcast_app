import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

export function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    return process.env.DATABASE_URL.trim();
  }
  if (process.env.PGHOST) {
    const user = process.env.PGUSER || 'postgres';
    const pass = process.env.PGPASSWORD || '';
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || '5432';
    const db = process.env.PGDATABASE || 'postgres';
    return `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
  }
  return null;
}

export async function initPostgres(): Promise<{ connected: boolean; error?: string }> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return { connected: false, error: 'No se ha configurado DATABASE_URL o PGHOST en las variables de entorno' };
  }

  try {
    if (pool) {
      await pool.end().catch(() => {});
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('ssl=true') ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      isConnected = true;
      lastError = null;
      console.log('✅ Conexión exitosa con base de datos PostgreSQL (Coolify / Postgres 18)');

      // Run automatic migrations for Coolify PostgreSQL 18
      await runMigrations(client);
      return { connected: true };
    } finally {
      client.release();
    }
  } catch (err: any) {
    isConnected = false;
    lastError = err.message || 'Error al conectar con PostgreSQL';
    console.warn('⚠️ No se pudo conectar a PostgreSQL:', lastError);
    return { connected: false, error: lastError };
  }
}

async function runMigrations(client: pg.PoolClient) {
  console.log('🔄 Verificando tablas en PostgreSQL...');
  
  // 1. Doctors table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT 'admin123',
      role TEXT NOT NULL DEFAULT 'doctor',
      department TEXT DEFAULT 'Obstetricia y Maternidad',
      assigned_space_path TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. Broadcast Spaces table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.broadcast_spaces (
      id TEXT PRIMARY KEY,
      nombre_espacio TEXT NOT NULL,
      direccion_web TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 3. TV Announcements table (with newborn fields)
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tv_announcements (
      id TEXT PRIMARY KEY,
      photo_path TEXT NOT NULL,
      photo_url TEXT,
      baby_identifier TEXT,
      baby_name TEXT,
      weight TEXT,
      height TEXT,
      apgar INTEGER,
      gender TEXT,
      birth_time TEXT,
      foot_size TEXT,
      room TEXT,
      birth_datetime TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      published_at TIMESTAMPTZ DEFAULT NOW(),
      published_by_id TEXT,
      published_by_name TEXT,
      channel TEXT DEFAULT 'waiting-room',
      space_path TEXT DEFAULT '/tv',
      space_id TEXT,
      title TEXT,
      message TEXT,
      hidden_at TIMESTAMPTZ,
      hidden_by_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 4. Hospital settings table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.hospital_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      hospital_name TEXT NOT NULL DEFAULT 'HOSPITAL SAN LUCAS',
      hospital_subname TEXT NOT NULL DEFAULT 'Broadcast Hospitalario',
      logo_url TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 5. Audit logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      announcement_id TEXT,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      details TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ Tablas de PostgreSQL 18 sincronizadas correctamente.');
}

export function getPostgresPool(): pg.Pool | null {
  return isConnected ? pool : null;
}

export function getPostgresStatus() {
  return {
    configured: Boolean(getDatabaseUrl()),
    connected: isConnected,
    lastError,
    databaseUrl: getDatabaseUrl() ? getDatabaseUrl()!.replace(/:[^:@]+@/, ':****@') : null,
  };
}
