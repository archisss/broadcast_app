-- =========================================================================
-- ESQUEMA COMPLETO PARA POSTGRESQL 18 (COOLIFY)
-- Hospital Broadcast & Neonatal System
-- =========================================================================

-- 1. Tabla de Médicos, Administradores y Personal
CREATE TABLE IF NOT EXISTS public.doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'admin123',
  role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('superadmin', 'admin', 'doctor', 'nurse', 'tv')),
  department TEXT DEFAULT 'Obstetricia y Maternidad',
  assigned_space_path TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Espacios de Broadcast (Pantallas y Suites)
CREATE TABLE IF NOT EXISTS public.broadcast_spaces (
  id TEXT PRIMARY KEY,
  nombre_espacio TEXT NOT NULL,
  direccion_web TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Emisiones / Anuncios de Pantallas (Con campos de recién nacido)
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

-- 4. Tabla de Ajustes e Identidad del Hospital
CREATE TABLE IF NOT EXISTS public.hospital_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  hospital_name TEXT NOT NULL DEFAULT 'HOSPITAL SAN LUCAS',
  hospital_subname TEXT NOT NULL DEFAULT 'Broadcast Hospitalario',
  logo_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Bitácora y Auditoría de Acciones
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

-- Índices de alto rendimiento para PostgreSQL
CREATE INDEX IF NOT EXISTS idx_tv_announcements_active ON public.tv_announcements(is_active, space_path);
CREATE INDEX IF NOT EXISTS idx_doctors_username ON public.doctors(username);
CREATE INDEX IF NOT EXISTS idx_doctors_assigned_space ON public.doctors(assigned_space_path);

-- Inserción de usuarios base si la tabla está vacía
INSERT INTO public.doctors (id, name, username, password, role, department, assigned_space_path, is_active)
VALUES 
  ('doc_superadmin', 'Super Administrador', 'superadmin', 'admin123', 'superadmin', 'Dirección General y Sistemas', '', true),
  ('doc_admin', 'Administrador Hospitalario', 'admin', 'admin123', 'admin', 'Dirección Médica y Operaciones', '', true),
  ('doc_elena_ruiz', 'Dra. Elena Ruiz Valenzuela', 'dra.ruiz', 'doctor123', 'doctor', 'Obstetricia y Maternidad', '/master_suite', true),
  ('doc_carmen_morales', 'Lic. Carmen Morales', 'carmen.morales', 'nurse123', 'nurse', 'Cuidados Neonatales', '/master_suite', true)
ON CONFLICT (username) DO NOTHING;

-- Inserción de espacios base si la tabla está vacía
INSERT INTO public.broadcast_spaces (id, nombre_espacio, direccion_web, description, is_active)
VALUES 
  ('space_01', 'Master Suite', '/master_suite', 'Habitación VIP Master Suite', true),
  ('space_02', 'Cuarto 22', '/cuarto22', 'Habitación Cuarto 22 Maternidad', true),
  ('space_03', 'Sala de Espera Principal', '/tv', 'Pantalla principal de recepción', true)
ON CONFLICT (direccion_web) DO NOTHING;
