-- ========================================================================
-- ACTUALIZACIÓN PARA TABLA DOCTORS EN SUPABASE
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- 1) Agrega la columna assigned_space_path para vincular espacios a médicos y enfermeras
-- 2) Actualiza la restricción de roles para admitir: superadmin, admin, doctor, nurse
-- ========================================================================

-- 1. Agregar columna de espacio asignado si no existe
ALTER TABLE IF EXISTS public.doctors 
ADD COLUMN IF NOT EXISTS assigned_space_path TEXT DEFAULT '';

-- 2. Actualizar restricción de roles permitidos
ALTER TABLE IF EXISTS public.doctors 
DROP CONSTRAINT IF EXISTS doctors_role_check;

ALTER TABLE IF EXISTS public.doctors 
ADD CONSTRAINT doctors_role_check 
CHECK (role IN ('superadmin', 'admin', 'doctor', 'nurse'));

-- 3. Crear índice para acelerar consultas por espacio asignado
CREATE INDEX IF NOT EXISTS idx_doctors_assigned_space ON public.doctors(assigned_space_path);

-- 4. Actualizar políticas RLS de acceso universal
DROP POLICY IF EXISTS "Allow all for doctors" ON public.doctors;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for doctors"
  ON public.doctors
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 5. Otorgar permisos al rol anon y authenticated
GRANT ALL ON TABLE public.doctors TO anon, authenticated;
