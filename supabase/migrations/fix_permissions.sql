-- ========================================================================
-- PERMISOS TOTALES PARA HOSPITAL BABY TV EN SUPABASE
-- Ejecuta este script en el SQL Editor de Supabase para habilitar
-- inserciones y lecturas sin restricciones de RLS.
-- ========================================================================

-- 1. Eliminar políticas restrictivas previas
DROP POLICY IF EXISTS "Public TVs can only read active announcements" ON public.tv_announcements;
DROP POLICY IF EXISTS "Public TVs can read announcements" ON public.tv_announcements;
DROP POLICY IF EXISTS "Medical staff can view all announcements" ON public.tv_announcements;
DROP POLICY IF EXISTS "Medical staff can insert announcements" ON public.tv_announcements;
DROP POLICY IF EXISTS "Medical staff can update announcements" ON public.tv_announcements;
DROP POLICY IF EXISTS "Allow all for tv_announcements" ON public.tv_announcements;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tv_announcements;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.tv_announcements;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.tv_announcements;

-- 2. Habilitar política universal para tv_announcements (permite a anon y authenticated guardar y leer)
ALTER TABLE public.tv_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for tv_announcements"
  ON public.tv_announcements
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 3. Habilitar política universal para audit_logs
DROP POLICY IF EXISTS "Medical staff can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can record audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all for audit_logs" ON public.audit_logs;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for audit_logs"
  ON public.audit_logs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 4. Habilitar política universal para profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated staff" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for profiles" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for profiles"
  ON public.profiles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 5. Habilitar política universal para broadcast_spaces
CREATE TABLE IF NOT EXISTS public.broadcast_spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_espacio TEXT NOT NULL,
  direccion_web TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP POLICY IF EXISTS "Allow all for broadcast_spaces" ON public.broadcast_spaces;
ALTER TABLE public.broadcast_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for broadcast_spaces"
  ON public.broadcast_spaces
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 6. Habilitar política universal para doctors
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'doctor',
  department TEXT DEFAULT 'Obstetricia y Maternidad',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP POLICY IF EXISTS "Allow all for doctors" ON public.doctors;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for doctors"
  ON public.doctors
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Seed initial spaces and doctors if empty
INSERT INTO public.broadcast_spaces (nombre_espacio, direccion_web, description)
VALUES 
  ('Master Suite', '/master_suite', 'Habitación VIP Master Suite'),
  ('Cuarto 22', '/cuarto22', 'Habitación Cuarto 22 Maternidad'),
  ('Sala de Espera Principal', '/tv', 'Pantalla principal de recepción de familiares')
ON CONFLICT (direccion_web) DO NOTHING;

INSERT INTO public.doctors (name, username, password, role, department)
VALUES 
  ('Super Administrador', 'superadmin', 'admin123', 'superadmin', 'Dirección General y Sistemas'),
  ('Dra. Elena Ruiz Valenzuela', 'dra.ruiz', 'doctor123', 'doctor', 'Obstetricia y Maternidad'),
  ('Dr. Roberto Silva', 'dr.silva', 'doctor123', 'doctor', 'Cuidados Neonatales'),
  ('Dr. Carlos Mendoza', 'dr.mendoza', 'doctor123', 'doctor', 'Pediatría')
ON CONFLICT (username) DO NOTHING;

-- 7. Asegurar permisos en el esquema public para el rol anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
