# Sistema Web de Bienvenida para Recién Nacidos en Hospital

Sistema web clínico en tiempo real diseñado para maternidades y hospitales. Permite al personal médico (médicos obstetras, neonatólogos y enfermeras) capturar o subir la primera fotografía del recién nacido de forma privada y transmitirla instantáneamente a las pantallas de televisión de la sala de espera para sus familiares, sin recargas de página.

---

## 🎯 Interfaces del Sistema

### 1. Panel del Personal Médico (`/admin`)
- **Autenticación y Control de Roles:** Acceso exclusivo para perfiles médicos (`doctor`, `nurse`, `admin`).
- **Captura Clínica con Cámara WebRTC:** Utiliza la cámara estándar del navegador (soporte prioritario para cámara trasera en dispositivos móviles y tablets de paritorio, encuadre guía y disparo con efecto flash).
- **Subida Segura de Archivos:** Drag-and-drop o selección de archivo con validación de tipo MIME (JPG, PNG, WebP) y límite de tamaño (hasta 15MB).
- **Sanitización y Optimización Automática:** Procesamiento en cliente mediante Canvas que **elimina metadatos EXIF** (geolocalización, modelo de cámara) y reduce la resolución a dimensiones óptimas para TV (1080p/4K) evitando transferir imágenes pesadas de 8–15 MB.
- **Previsualización y Confirmación:** Pantalla de revisión con campos opcionales no clínicos (identificador de cuna y habitación) y modal de doble confirmación antes de emitir.
- **Control de Emisión:** Monitoreo en vivo de la foto actualmente mostrada y botón inmediato para **retirar/ocultar fotografía** (volviendo al modo de bienvenida neutro).
- **Historial y Auditoría:** Bitácora inmutable de todas las publicaciones y retiros para cumplimiento normativo hospitalario.

### 2. Modo Televisión (`/tv`)
- **Diseñado para Smart TV / Mini PC / Chrome en pantalla completa (1080p / 4K).**
- **Sincronización en Tiempo Real:** Las televisiones reciben eventos push instantáneos (Server-Sent Events / Supabase Realtime) sin requerir encuestas de polling constantes.
- **Transición Visual Suave:** Animación fluida de fundido (`fade-in`) mediante `motion` que sustituye elegantemente la imagen previa o la pantalla de espera.
- **Aspect Ratio Seguro:** Uso de `object-fit: contain` para garantizar que la imagen del bebé nunca sea recortada ni distorsionada.
- **Estado Neutro Institucional:** Cuando no hay bebé activo, muestra un elegante protector institucional con logotipo, reloj sutil y mensaje cálido de bienvenida.
- **Tolerancia a Fallos y Modo Standby:** Mantiene la última imagen si cae la red local y re-sincroniza en silencio al recuperar la señal, sin desplegar alertas técnicas a los familiares.
- **100% Limpio de Controles:** Sin menús, barras de herramientas ni información clínica sensible.

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js 18+ (recomendado Node 20 o superior)
- npm o pnpm

### Pasos
```bash
# 1. Clonar el repositorio
git clone <tu-repositorio>
cd hospital-newborn-tv

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo en tiempo real (puerto 3000)
npm run dev
```

Abre tu navegador en:
- **Panel Médico:** `http://localhost:3000/#admin` (o `/admin`)
- **Pantalla TV Sala de Espera:** `http://localhost:3000/#tv` (o `/tv`)
- **Demostración Dual Lado a Lado:** Selecciona *"Vista Dual (Doctor + TV)"* en la esquina inferior derecha.

### Cuentas de Acceso Rápido (Demostración)
El sistema incluye perfiles preconfigurados para pruebas instantáneas:
- **Médico Obstetra:** `doctor@hospital.com` / `doctor123` (Dra. Elena Ruiz Valenzuela)
- **Enfermera Neonatal:** `enfermera@hospital.com` / `nurse123` (Lic. Carmen Morales)
- **Administrador:** `admin@hospital.com` / `admin123` (Dr. Roberto Silva)

---

## 🗄️ Configuración con Supabase (Producción)

El proyecto incluye la migración SQL completa lista para ejecutar en Supabase en `supabase/migrations/20260902_init_hospital_births.sql`.

### 1. Crear el Proyecto en Supabase
1. Ingresa en [https://supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Copia la **URL del proyecto** y la **Anon Key (public)** en tu archivo `.env`:
   ```env
   VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

### 2. Ejecutar la Migración SQL
En el panel de Supabase, ve a **SQL Editor**, crea una nueva consulta y pega el contenido de `supabase/migrations/20260902_init_hospital_births.sql`. Esto creará:
- Tabla `profiles` con roles (`doctor`, `nurse`, `admin`, `tv`).
- Tabla `tv_announcements` con índices para consultas ultra-rápidas.
- Tabla `audit_logs` para trazabilidad de privacidad.
- Publicación de eventos en tiempo real: `ALTER PUBLICATION supabase_realtime ADD TABLE public.tv_announcements;`.
- Bucket de almacenamiento privado `baby-photos` con políticas RLS de acceso restringido.

### 3. Crear Usuarios Iniciales
En Supabase Auth:
1. Crea el usuario `doctor@hospital.com` en **Authentication -> Users**.
2. En la tabla `profiles`, asocia el UID con el rol `doctor`:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role, department)
   VALUES ('<UID-DEL-USUARIO>', 'doctor@hospital.com', 'Dra. Elena Ruiz', 'doctor', 'Obstetricia');
   ```

---

## 📺 Configuración de la Televisión en la Sala de Espera

### Hardware Recomendado
- **Opción A:** Smart TV con navegador integrado compatible con HTML5/Chromium.
- **Opción B (Óptima):** Mini PC (Intel N100 / Raspberry Pi 4/5 / Chromebox) conectado por HDMI a la televisión.

### Configuración del Navegador
1. Abrir la URL directa del canal:
   ```
   https://tu-dominio.com/#tv
   ```
2. **Modo Pantalla Completa:**
   - Presiona la tecla `F11` del teclado, o
   - Mueve el ratón para revelar el botón discreto de pantalla completa en la esquina superior derecha.
3. **Modo Kiosco (Opcional en Mini PC / Chrome):**
   ```bash
   google-chrome --kiosk --noerrdialogs --disable-infobars "https://tu-dominio.com/#tv"
   ```
4. **Prevención de Suspensión:**
   Configura el sistema operativo del Mini PC o Smart TV para desactivar el apagado automático de pantalla o protector de pantalla.

---

## 🔒 Privacidad, Seguridad y Protección de Menores

Dado que se gestionan imágenes de recién nacidos dentro de un entorno hospitalario:
1. **Mínimo Privilegio:** La pantalla de TV solo puede consultar y recibir el registro marcado con `is_active = true`. Nunca tiene acceso al historial general ni a datos clínicos.
2. **Sin Datos Sensibles:** La pantalla TV prohíbe explícitamente nombres completos de los padres, diagnósticos médicos o datos confidenciales. Únicamente muestra la imagen, el identificador opcional de cuna (ej. `RN-2026-089`) y la habitación.
3. **Limpieza EXIF:** Todo archivo tomado con smartphone o subido es redibujado en un lienzo Canvas antes de su transmisión, eliminando metadatos de GPS y dispositivo.
4. **Auditoría Inmutable:** Cada vez que una fotografía es publicada o retirada, queda registrado en `audit_logs` con sello de tiempo y usuario responsable.

---

## 🎨 Personalización del Hospital

Para modificar el nombre o identidad del hospital:
- Edita el archivo `src/components/HospitalLogo.tsx` para cambiar la denominación, colores o emblema.
- Las variables de entorno `VITE_HOSPITAL_NAME` y `VITE_TV_CHANNEL` permiten adaptar la aplicación a múltiples áreas (ej. *Sala de Espera Maternidad*, *UCI Neonatal*, etc.).
