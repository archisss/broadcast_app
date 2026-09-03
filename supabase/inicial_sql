-- ========================================================================
-- SISTEMA DE BROADCAST HOSPITALARIO (SUPABASE MIGRATION)
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Espacios de Transmisión Hospitalaria (Broadcast Spaces)
CREATE TABLE IF NOT EXISTS public.broadcast_spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre_espacio TEXT NOT NULL,
  direccion_web TEXT NOT NULL UNIQUE, -- ej: '/master_suite', '/cuarto22', '/tv'
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Lista de Médicos y Superadministrador autorizados
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('doctor', 'superadmin')),
  department TEXT DEFAULT 'Obstetricia y Maternidad',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. User profiles & roles table (compatibilidad)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'doctor', 'nurse', 'tv')),
  department TEXT DEFAULT 'Maternidad y Neonatología',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TV Announcements / Broadcast Images table
CREATE TABLE IF NOT EXISTS public.tv_announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  photo_path TEXT NOT NULL,
  baby_identifier TEXT, -- Ej. "RN-2026-089" (opcional)
  room TEXT,            -- Ej. "Master Suite" o "Cuarto 22" (opcional)
  birth_datetime TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by_name TEXT NOT NULL,
  hidden_at TIMESTAMPTZ,
  hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hidden_by_name TEXT,
  channel TEXT DEFAULT 'waiting-room' NOT NULL,
  space_id UUID REFERENCES public.broadcast_spaces(id) ON DELETE SET NULL,
  space_path TEXT DEFAULT '/tv',
  title TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add columns if tv_announcements already existed without them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tv_announcements' AND column_name='space_path') THEN
    ALTER TABLE public.tv_announcements ADD COLUMN space_path TEXT DEFAULT '/tv';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tv_announcements' AND column_name='space_id') THEN
    ALTER TABLE public.tv_announcements ADD COLUMN space_id UUID REFERENCES public.broadcast_spaces(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tv_announcements' AND column_name='title') THEN
    ALTER TABLE public.tv_announcements ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tv_announcements' AND column_name='message') THEN
    ALTER TABLE public.tv_announcements ADD COLUMN message TEXT;
  END IF;
END $$;

-- Indexes for fast queries by TVs, Spaces and Admin
CREATE INDEX IF NOT EXISTS idx_tv_announcements_active ON public.tv_announcements (is_active, channel);
CREATE INDEX IF NOT EXISTS idx_tv_announcements_space ON public.tv_announcements (is_active, space_path);
CREATE INDEX IF NOT EXISTS idx_tv_announcements_published_at ON public.tv_announcements (published_at DESC);

-- 5. Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  announcement_id UUID REFERENCES public.tv_announcements(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);

-- ========================================================================
-- INITIAL SEED DATA FOR SPACES AND DOCTORS
-- ========================================================================

-- Seed initial broadcast spaces
INSERT INTO public.broadcast_spaces (nombre_espacio, direccion_web, description)
VALUES 
  ('Master Suite', '/master_suite', 'Habitación VIP Master Suite'),
  ('Cuarto 22', '/cuarto22', 'Habitación Cuarto 22 Maternidad'),
  ('Sala de Espera Principal', '/tv', 'Pantalla principal de recepción de familiares')
ON CONFLICT (direccion_web) DO NOTHING;

-- Seed initial doctors & superadmin
INSERT INTO public.doctors (name, username, password, role, department)
VALUES 
  ('Super Administrador', 'superadmin', 'admin123', 'superadmin', 'Dirección General y Sistemas'),
  ('Dra. Elena Ruiz Valenzuela', 'dra.ruiz', 'doctor123', 'doctor', 'Obstetricia y Maternidad'),
  ('Dr. Roberto Silva', 'dr.silva', 'doctor123', 'doctor', 'Cuidados Neonatales'),
  ('Dr. Carlos Mendoza', 'dr.mendoza', 'doctor123', 'doctor', 'Pediatría')
ON CONFLICT (username) DO NOTHING;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENTES & TEST FRIENDLY)
-- ========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Broadcast spaces policies:
DROP POLICY IF EXISTS "Public can view active spaces" ON public.broadcast_spaces;
CREATE POLICY "Public can view active spaces"
  ON public.broadcast_spaces FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can manage spaces" ON public.broadcast_spaces;
CREATE POLICY "Admin can manage spaces"
  ON public.broadcast_spaces FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Doctors policies:
DROP POLICY IF EXISTS "Allow read doctors" ON public.doctors;
CREATE POLICY "Allow read doctors"
  ON public.doctors FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can manage doctors" ON public.doctors;
CREATE POLICY "Admin can manage doctors"
  ON public.doctors FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Profiles: Authenticated users can read profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated staff" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated staff"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- TV Announcements:
-- 1. Read: Public TVs & medical staff can read announcements
DROP POLICY IF EXISTS "Public TVs can read announcements" ON public.tv_announcements;
CREATE POLICY "Public TVs can read announcements"
  ON public.tv_announcements FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Insert: Allow medical staff and anon test client to publish
DROP POLICY IF EXISTS "Medical staff can insert announcements" ON public.tv_announcements;
CREATE POLICY "Medical staff can insert announcements"
  ON public.tv_announcements FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Update: Allow updating announcement status (hide / deactivate)
DROP POLICY IF EXISTS "Medical staff can update announcements" ON public.tv_announcements;
CREATE POLICY "Medical staff can update announcements"
  ON public.tv_announcements FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Delete: Allow cleaning test probes or removing invalid entries
DROP POLICY IF EXISTS "Medical staff can delete announcements" ON public.tv_announcements;
CREATE POLICY "Medical staff can delete announcements"
  ON public.tv_announcements FOR DELETE
  TO anon, authenticated
  USING (true);

-- Audit logs
DROP POLICY IF EXISTS "Medical staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Medical staff can view audit logs"
  ON public.audit_logs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "System can record audit logs" ON public.audit_logs;
CREATE POLICY "System can record audit logs"
  ON public.audit_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure public schema grants for anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;


-- ========================================================================
-- STORAGE BUCKET CONFIGURATION (Public or Signed URLs)
-- ========================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'baby-photos',
  'baby-photos',
  true, -- Set to true for direct TV display rendering via CDN URL
  15728640, -- 15MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage Policies
DROP POLICY IF EXISTS "Allow public read baby photos" ON storage.objects;
CREATE POLICY "Allow public read baby photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'baby-photos');

DROP POLICY IF EXISTS "Allow upload baby photos" ON storage.objects;
CREATE POLICY "Allow upload baby photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'baby-photos');

-- Realtime Publication for tv_announcements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'tv_announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tv_announcements;
  END IF;
END $$;

