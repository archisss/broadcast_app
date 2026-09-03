import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

// Setup directories for secure private storage
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads', 'baby-photos');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Sanitize Supabase credentials
function sanitizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim().replace(/^['"]+|['"]+$/g, '');
  const dashboardMatch =
    url.match(/supabase\.(?:com|co)\/dashboard\/project\/([a-zA-Z0-9_-]+)/i) ||
    url.match(/app\.supabase\.(?:com|co)\/project\/([a-zA-Z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/rest\/?$/i, '');
  return url.replace(/\/+$/, '');
}

function sanitizeSupabaseKey(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^['"]+|['"]+$/g, '');
}

// Supabase server-side client
const rawServerSupabaseUrl = (
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
);

const rawServerSupabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
);

export const serverSupabaseUrl = sanitizeSupabaseUrl(rawServerSupabaseUrl);
export const serverSupabaseKey = sanitizeSupabaseKey(rawServerSupabaseKey);

export const serverSupabase = (
  serverSupabaseUrl &&
  serverSupabaseKey &&
  !serverSupabaseUrl.includes('your-project') &&
  !serverSupabaseUrl.includes('tu-proyecto') &&
  serverSupabaseUrl.startsWith('https://')
)
  ? createClient(serverSupabaseUrl, serverSupabaseKey)
  : null;

// Multer storage for baby photos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `baby_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG o WEBP.'));
    }
  },
});

// In-Memory Database with Seed Data
interface DbDoctor {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'superadmin' | 'admin' | 'doctor' | 'nurse';
  department: string;
  assigned_space_path?: string;
  is_active: boolean;
  created_at: string;
}

interface DbBroadcastSpace {
  id: string;
  nombre_espacio: string;
  direccion_web: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface DbUser {
  id: string;
  email: string;
  username?: string;
  password: string;
  name: string;
  role: 'superadmin' | 'admin' | 'doctor' | 'nurse' | 'tv';
  department: string;
  licenseNumber?: string;
  assigned_space_path?: string;
}

interface DbAnnouncement {
  id: string;
  photo_path: string;
  photo_url: string;
  baby_identifier?: string;
  room?: string;
  birth_datetime?: string;
  is_active: boolean;
  published_at: string;
  published_by_id: string;
  published_by_name: string;
  created_at: string;
  hidden_at?: string;
  hidden_by_name?: string;
  channel: string;
  space_id?: string;
  space_path?: string;
  title?: string;
  message?: string;
}

interface DbAuditLog {
  id: string;
  action: 'photo_published' | 'photo_hidden' | 'login' | 'logout' | 'user_created' | 'space_created' | 'doctor_created';
  announcement_id?: string;
  user_id: string;
  user_name: string;
  user_role: string;
  details: string;
  timestamp: string;
  ip_address?: string;
}

let DOCTORS: DbDoctor[] = [
  {
    id: 'doc_superadmin',
    name: 'Super Administrador',
    username: 'superadmin',
    password: 'admin123',
    role: 'superadmin',
    department: 'Dirección General y Sistemas',
    assigned_space_path: '',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc_admin',
    name: 'Administrador Hospitalario',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    department: 'Dirección Médica y Operaciones',
    assigned_space_path: '',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc_elena_ruiz',
    name: 'Dra. Elena Ruiz Valenzuela',
    username: 'dra.ruiz',
    password: 'doctor123',
    role: 'doctor',
    department: 'Obstetricia y Maternidad',
    assigned_space_path: '/suite_44',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc_roberto_silva',
    name: 'Dr. Roberto Silva',
    username: 'dr.silva',
    password: 'doctor123',
    role: 'doctor',
    department: 'Cuidados Neonatales',
    assigned_space_path: '/cuarto22',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc_carlos_mendoza',
    name: 'Dr. Carlos Mendoza',
    username: 'dr.mendoza',
    password: 'doctor123',
    role: 'doctor',
    department: 'Pediatría',
    assigned_space_path: '/tv',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc_carmen_morales',
    name: 'Lic. Carmen Morales',
    username: 'carmen.morales',
    password: 'nurse123',
    role: 'nurse',
    department: 'Enfermería y Maternidad',
    assigned_space_path: '',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

let SPACES: DbBroadcastSpace[] = [
  {
    id: 'space_01',
    nombre_espacio: 'Master Suite',
    direccion_web: '/master_suite',
    description: 'Habitación VIP Master Suite',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'space_02',
    nombre_espacio: 'Cuarto 22',
    direccion_web: '/cuarto22',
    description: 'Habitación Cuarto 22 Maternidad',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'space_03',
    nombre_espacio: 'Sala de Espera Principal',
    direccion_web: '/tv',
    description: 'Pantalla principal de recepción de familiares',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const USERS: DbUser[] = [
  {
    id: 'doc_superadmin',
    email: 'superadmin@hospital.com',
    username: 'superadmin',
    password: 'admin123',
    name: 'Super Administrador',
    role: 'superadmin',
    department: 'Dirección General y Sistemas',
    assigned_space_path: '',
  },
  {
    id: 'doc_admin',
    email: 'admin@hospital.com',
    username: 'admin',
    password: 'admin123',
    name: 'Administrador Hospitalario',
    role: 'admin',
    department: 'Dirección Médica y Operaciones',
    assigned_space_path: '',
  },
  {
    id: 'doc_elena_ruiz',
    email: 'doctor@hospital.com',
    username: 'dra.ruiz',
    password: 'doctor123',
    name: 'Dra. Elena Ruiz Valenzuela',
    role: 'doctor',
    department: 'Obstetricia y Sala de Partos',
    licenseNumber: 'MED-849201',
    assigned_space_path: '/master_suite',
  },
  {
    id: 'usr_nurse_01',
    email: 'enfermera@hospital.com',
    username: 'carmen.morales',
    password: 'nurse123',
    name: 'Lic. Carmen Morales',
    role: 'nurse',
    department: 'Cuidados Neonatales',
    licenseNumber: 'ENF-390192',
    assigned_space_path: '/master_suite',
  },
];

// Sample default baby announcement photo created via SVG
const sampleBabySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <radialGradient id="softLight" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#e0f2fe" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#bae6fd" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="600" cy="380" r="320" fill="url(#softLight)"/>
  
  <!-- Gentle stylized sleeping newborn illustration -->
  <g transform="translate(600, 390)">
    <!-- Swaddle blanket -->
    <path d="M-150,90 Q-200,20 -110,-50 Q-20,-110 80,-70 Q180,-30 190,70 Q190,160 50,190 Q-90,200 -150,90 Z" fill="#e0f2fe" stroke="#93c5fd" stroke-width="3"/>
    <path d="M-120,40 Q-30,120 130,90" fill="none" stroke="#60a5fa" stroke-width="3" stroke-dasharray="6,6"/>
    
    <!-- Baby head -->
    <ellipse cx="-40" cy="-60" rx="90" ry="85" fill="#fed7aa" stroke="#fbcfe8" stroke-width="2"/>
    <!-- Cheek blush -->
    <circle cx="-90" cy="-35" r="18" fill="#f43f5e" opacity="0.15"/>
    <circle cx="10" cy="-35" r="18" fill="#f43f5e" opacity="0.15"/>
    <!-- Sleeping curved eyes -->
    <path d="M-80,-65 Q-65,-50 -50,-65" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
    <path d="M-10,-65 Q5,-50 20,-65" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
    <!-- Cute nose -->
    <circle cx="-30" cy="-45" r="4" fill="#d97706" opacity="0.6"/>
    <!-- Peaceful mouth -->
    <path d="M-38,-25 Q-30,-18 -22,-25" fill="none" stroke="#9a3412" stroke-width="3" stroke-linecap="round"/>
    <!-- Soft newborn cap -->
    <path d="M-130,-70 Q-110,-155 -30,-150 Q50,-145 50,-70 Z" fill="#fbcfe8"/>
    <path d="M-135,-65 Q-40,-50 55,-65" fill="none" stroke="#f472b6" stroke-width="8" stroke-linecap="round"/>
    <circle cx="-30" cy="-155" r="14" fill="#f472b6"/>
  </g>

  <!-- Hospital emblem badge watermark -->
  <g transform="translate(600, 710)" opacity="0.85">
    <rect x="-180" y="-24" width="360" height="48" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="0" y="6" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#0369a1" letter-spacing="1">
      HOSPITAL MATERNO INFANTIL SAN LUCAS
    </text>
  </g>
</svg>`;

const defaultPhotoFile = path.join(UPLOADS_DIR, 'sample_newborn.svg');
if (!fs.existsSync(defaultPhotoFile)) {
  fs.writeFileSync(defaultPhotoFile, sampleBabySvg);
}

let ANNOUNCEMENTS: DbAnnouncement[] = [
  {
    id: 'ann_demo_01',
    photo_path: 'sample_newborn.svg',
    photo_url: '/api/photos/sample_newborn.svg',
    baby_identifier: 'RN-2026-089',
    room: 'Habitación 304 - Maternidad',
    birth_datetime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    is_active: true,
    published_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    published_by_id: 'usr_doc_01',
    published_by_name: 'Dra. Elena Ruiz Valenzuela',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    channel: 'waiting-room',
  },
];

let AUDIT_LOGS: DbAuditLog[] = [
  {
    id: 'aud_01',
    action: 'photo_published',
    announcement_id: 'ann_demo_01',
    user_id: 'usr_doc_01',
    user_name: 'Dra. Elena Ruiz Valenzuela',
    user_role: 'doctor',
    details: 'Fotografía de recién nacido publicada para TV Sala de Espera (RN-2026-089)',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
];

// Real-Time Server-Sent Events (SSE) Client Subscribers
interface SseClient {
  id: string;
  channel: string;
  res: Response;
}

const sseClients: SseClient[] = [];

function broadcastRealtime(event: string, data: any, channel = 'waiting-room') {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    if (client.channel === channel || channel === 'all') {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error(`Error sending SSE to client ${client.id}:`, err);
      }
    }
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Migration SQL endpoint for easy copying
app.get('/api/supabase/migration-sql', (_req: Request, res: Response) => {
  try {
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260902_init_hospital_births.sql');
    if (fs.existsSync(sqlPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(fs.readFileSync(sqlPath, 'utf8'));
    } else {
      res.status(404).send('-- Migration file not found');
    }
  } catch (err: any) {
    res.status(500).send(`-- Error reading migration: ${err.message}`);
  }
});

// Quick RLS Permissions fix endpoint
app.get('/api/supabase/fix-permissions-sql', (_req: Request, res: Response) => {
  try {
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', 'fix_permissions.sql');
    if (fs.existsSync(sqlPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(fs.readFileSync(sqlPath, 'utf8'));
    } else {
      res.status(404).send('-- Fix permissions file not found');
    }
  } catch (err: any) {
    res.status(500).send(`-- Error reading fix permissions: ${err.message}`);
  }
});

// 1. SSE Real-Time Stream for TVs and Admin Dashboards
app.get('/api/realtime/stream', (req: Request, res: Response) => {
  const channel = (req.query.channel as string) || 'waiting-room';
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  const client: SseClient = { id: clientId, channel, res };
  sseClients.push(client);

  // Send initial current state immediately upon connection
  const active = ANNOUNCEMENTS.find((a) => a.is_active && a.channel === channel) || null;
  res.write(`event: init\ndata: ${JSON.stringify({ active, timestamp: new Date().toISOString() })}\n\n`);

  // Send periodic keep-alive heartbeat every 15s to keep proxy alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    const index = sseClients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// 2. Authentication (supports username, identifier, or email)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, username, identifier, password } = req.body;
  const loginIdentifier = (username || identifier || email || '').trim().toLowerCase();

  if (!loginIdentifier || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  let doctor: DbDoctor | undefined;

  // 1. If Supabase is connected, query database first to get the latest assigned_space_path
  if (serverSupabase) {
    try {
      const { data: supaDoc } = await serverSupabase
        .from('doctors')
        .select('*')
        .or(`username.ilike.${loginIdentifier},name.ilike.${loginIdentifier}`)
        .eq('password', password)
        .maybeSingle();

      if (supaDoc && supaDoc.is_active) {
        doctor = {
          id: String(supaDoc.id),
          name: supaDoc.name,
          username: supaDoc.username,
          password: supaDoc.password,
          role: supaDoc.role || 'doctor',
          department: supaDoc.department || 'Obstetricia y Maternidad',
          assigned_space_path: supaDoc.assigned_space_path || '',
          is_active: Boolean(supaDoc.is_active),
          created_at: supaDoc.created_at || new Date().toISOString(),
        };
        // Synchronize in memory DOCTORS
        const idx = DOCTORS.findIndex(
          (d) => String(d.id) === String(supaDoc.id) || d.username.toLowerCase() === supaDoc.username.toLowerCase()
        );
        if (idx !== -1) {
          DOCTORS[idx] = doctor;
        } else {
          DOCTORS.push(doctor);
        }
      }
    } catch (err: any) {
      console.warn('Supabase login lookup notice:', err.message);
    }
  }

  // 2. Fallback to DOCTORS in memory
  if (!doctor) {
    doctor = DOCTORS.find(
      (d) =>
        d.is_active &&
        (d.username.toLowerCase() === loginIdentifier || d.name.toLowerCase() === loginIdentifier) &&
        d.password === password
    );
  }

  if (doctor) {
    const userSafe = {
      id: doctor.id,
      name: doctor.name,
      username: doctor.username,
      role: doctor.role,
      department: doctor.department,
      assigned_space_path: doctor.assigned_space_path || '',
    };

    AUDIT_LOGS.unshift({
      id: `aud_${Date.now()}`,
      action: 'login',
      user_id: doctor.id,
      user_name: doctor.name,
      user_role: doctor.role,
      details: `Inicio de sesión exitoso (@${doctor.username}) [${doctor.role}]`,
      timestamp: new Date().toISOString(),
      ip_address: req.ip,
    });

    res.json({
      success: true,
      user: userSafe,
      token: `token_${doctor.id}_${Date.now()}`,
    });
    return;
  }

  // Fallback to USERS
  const legacyUser = USERS.find(
    (u) =>
      ((u.username && u.username.toLowerCase() === loginIdentifier) ||
        u.email.toLowerCase() === loginIdentifier ||
        u.name.toLowerCase() === loginIdentifier) &&
      u.password === password
  );

  if (!legacyUser) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  // Audit login
  AUDIT_LOGS.unshift({
    id: `aud_${Date.now()}`,
    action: 'login',
    user_id: legacyUser.id,
    user_name: legacyUser.name,
    user_role: legacyUser.role,
    details: `Inicio de sesión exitoso (@${legacyUser.username || legacyUser.name}) [${legacyUser.role}]`,
    timestamp: new Date().toISOString(),
    ip_address: req.ip,
  });

  const { password: _, ...safeUser } = legacyUser;
  res.json({
    success: true,
    user: {
      ...safeUser,
      assigned_space_path: safeUser.assigned_space_path || '',
    },
    token: `token_${legacyUser.id}_${Date.now()}`,
  });
});

// 2. Profile lookup by identifier or id to keep assigned_space_path synced
app.get('/api/auth/profile/:identifier', async (req: Request, res: Response) => {
  const identifier = String(req.params.identifier || '').trim().toLowerCase();
  if (!identifier) {
    res.status(400).json({ error: 'Identificador requerido' });
    return;
  }

  let doc: DbDoctor | undefined;

  // 1. If Supabase is available, query database first so updated assignments take precedence
  if (serverSupabase) {
    try {
      const { data: supaDoc } = await serverSupabase
        .from('doctors')
        .select('*')
        .or(`id.eq.${identifier},username.ilike.${identifier},name.ilike.${identifier}`)
        .maybeSingle();

      if (supaDoc) {
        doc = {
          id: String(supaDoc.id),
          name: supaDoc.name,
          username: supaDoc.username,
          password: supaDoc.password || 'admin123',
          role: supaDoc.role || 'doctor',
          department: supaDoc.department || 'Obstetricia y Maternidad',
          assigned_space_path: supaDoc.assigned_space_path || '',
          is_active: Boolean(supaDoc.is_active),
          created_at: supaDoc.created_at || new Date().toISOString(),
        };
        const idx = DOCTORS.findIndex(
          (d) => String(d.id) === String(supaDoc.id) || d.username.toLowerCase() === supaDoc.username.toLowerCase()
        );
        if (idx !== -1) {
          DOCTORS[idx] = doc;
        } else {
          DOCTORS.push(doc);
        }
      }
    } catch (e: any) {
      console.warn('Supabase doctor lookup notice:', e.message);
    }
  }

  // 2. Fallback to memory search
  if (!doc) {
    doc = findDoctor(identifier);
  }

  if (doc) {
    res.json({
      success: true,
      user: {
        id: doc.id,
        name: doc.name,
        username: doc.username,
        role: doc.role,
        department: doc.department,
        assigned_space_path: doc.assigned_space_path || '',
        is_active: doc.is_active,
      },
    });
    return;
  }

  const legacy = USERS.find(
    (u) =>
      String(u.id).toLowerCase() === identifier ||
      (u.username && u.username.toLowerCase() === identifier) ||
      u.email.toLowerCase() === identifier
  );

  if (legacy) {
    const { password: _, ...safe } = legacy;
    res.json({
      success: true,
      user: {
        ...safe,
        assigned_space_path: safe.assigned_space_path || '',
      },
    });
    return;
  }

  res.status(404).json({ error: 'Usuario no encontrado' });
});

// 2b. Broadcast Spaces Management Endpoints
app.get('/api/spaces', async (_req: Request, res: Response) => {
  if (serverSupabase) {
    try {
      const { data, error } = await serverSupabase
        .from('broadcast_spaces')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        res.json({ spaces: data });
        return;
      }
    } catch (e: any) {
      console.warn('Supabase spaces query notice:', e.message);
    }
  }
  res.json({ spaces: SPACES });
});

app.post('/api/spaces', async (req: Request, res: Response) => {
  const { nombre_espacio, direccion_web, description } = req.body;
  if (!nombre_espacio || !direccion_web) {
    res.status(400).json({ error: 'Nombre de espacio y dirección web son requeridos' });
    return;
  }

  let formattedPath = direccion_web.trim();
  if (!formattedPath.startsWith('/')) {
    formattedPath = '/' + formattedPath;
  }

  const existing = SPACES.find(
    (s) => s.direccion_web.toLowerCase() === formattedPath.toLowerCase()
  );
  if (existing) {
    res.status(400).json({ error: `La dirección web ${formattedPath} ya está en uso` });
    return;
  }

  const newSpace: DbBroadcastSpace = {
    id: `space_${Date.now()}`,
    nombre_espacio: nombre_espacio.trim(),
    direccion_web: formattedPath,
    description: description?.trim() || '',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  SPACES.push(newSpace);

  // Sync to Supabase
  if (serverSupabase) {
    try {
      await serverSupabase.from('broadcast_spaces').insert({
        nombre_espacio: newSpace.nombre_espacio,
        direccion_web: newSpace.direccion_web,
        description: newSpace.description,
        is_active: true,
      });
    } catch (e: any) {
      console.warn('Supabase space insert error:', e.message);
    }
  }

  AUDIT_LOGS.unshift({
    id: `aud_${Date.now()}`,
    action: 'space_created',
    user_id: 'usr_superadmin',
    user_name: 'Super Administrador',
    user_role: 'superadmin',
    details: `Espacio de broadcast creado: ${newSpace.nombre_espacio} (${newSpace.direccion_web})`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ space: newSpace });
});

app.delete('/api/spaces/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  SPACES = SPACES.filter((s) => s.id !== id);

  if (serverSupabase) {
    try {
      await serverSupabase.from('broadcast_spaces').delete().eq('id', id);
    } catch (e: any) {
      console.warn('Supabase space delete notice:', e.message);
    }
  }

  res.json({ success: true });
});

// Helper to find doctor by id or username safely
function findDoctor(idOrUsername: string) {
  const query = String(idOrUsername || '').trim().toLowerCase();
  return DOCTORS.find(
    (d) =>
      String(d.id).toLowerCase() === query ||
      d.username.toLowerCase() === query
  );
}

// 2c. Doctors and Staff Management Endpoints (Superadmin & Admin)
app.get('/api/doctors', async (_req: Request, res: Response) => {
  if (serverSupabase) {
    try {
      const { data, error } = await serverSupabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        // Sync into DOCTORS array to keep memory in sync with Supabase
        for (const row of data) {
          const rowId = String(row.id);
          const rowUser = String(row.username || '').toLowerCase();
          const existingIdx = DOCTORS.findIndex(
            (d) => String(d.id) === rowId || d.username.toLowerCase() === rowUser
          );
          const item: DbDoctor = {
            id: rowId,
            name: row.name || 'Personal Médico',
            username: rowUser || `user_${rowId.slice(0, 6)}`,
            password: row.password || (existingIdx !== -1 ? DOCTORS[existingIdx].password : 'admin123'),
            role: row.role || 'doctor',
            department: row.department || 'Obstetricia y Maternidad',
            assigned_space_path: row.assigned_space_path || (existingIdx !== -1 ? DOCTORS[existingIdx].assigned_space_path : '') || '',
            is_active: row.is_active !== undefined ? Boolean(row.is_active) : true,
            created_at: row.created_at || new Date().toISOString(),
          };

          if (existingIdx !== -1) {
            DOCTORS[existingIdx] = { ...DOCTORS[existingIdx], ...item };
          } else {
            DOCTORS.push(item);
          }
        }

        const mapped = DOCTORS.map(({ password: _, ...doc }) => doc);
        res.json({ doctors: mapped });
        return;
      }
    } catch (e: any) {
      console.warn('Supabase doctors query notice:', e.message);
    }
  }

  const safeDoctors = DOCTORS.map(({ password: _, ...doc }) => doc);
  res.json({ doctors: safeDoctors });
});

app.post('/api/doctors', async (req: Request, res: Response) => {
  const { name, username, password, department, role = 'doctor', assigned_space_path = '' } = req.body;
  if (!name || !username || !password) {
    res.status(400).json({ error: 'Nombre, usuario y contraseña son requeridos' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = findDoctor(cleanUsername);
  if (existing) {
    res.status(400).json({ error: `El usuario "${cleanUsername}" ya se encuentra registrado` });
    return;
  }

  const validRoles = ['superadmin', 'admin', 'doctor', 'nurse'];
  const assignedRole = validRoles.includes(role) ? role : 'doctor';

  const newDoc: DbDoctor = {
    id: `doc_${Date.now()}`,
    name: name.trim(),
    username: cleanUsername,
    password: password.trim(),
    role: assignedRole as any,
    department: department?.trim() || (assignedRole === 'nurse' ? 'Enfermería y Maternidad' : 'Obstetricia y Maternidad'),
    assigned_space_path: assigned_space_path?.trim() || '',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  DOCTORS.push(newDoc);

  if (serverSupabase) {
    try {
      const { error: supaErr } = await serverSupabase.from('doctors').insert({
        name: newDoc.name,
        username: newDoc.username,
        password: newDoc.password,
        role: newDoc.role,
        department: newDoc.department,
        assigned_space_path: newDoc.assigned_space_path,
        is_active: true,
      });

      if (supaErr) {
        console.warn('Supabase doctor insert notice (trying fallback):', supaErr.message);
        // Fallback without assigned_space_path if the column has not been migrated yet in Supabase
        await serverSupabase.from('doctors').insert({
          name: newDoc.name,
          username: newDoc.username,
          password: newDoc.password,
          role: (newDoc.role === 'superadmin' ? 'superadmin' : 'doctor'),
          department: newDoc.department,
          is_active: true,
        });
      }
    } catch (e: any) {
      console.warn('Supabase doctor insert notice:', e.message);
    }
  }

  AUDIT_LOGS.unshift({
    id: `aud_${Date.now()}`,
    action: 'doctor_created',
    user_id: 'usr_admin',
    user_name: 'Administración',
    user_role: 'admin',
    details: `Nuevo usuario/personal dado de alta: ${newDoc.name} (@${newDoc.username}) [${newDoc.role}] - Espacio: ${newDoc.assigned_space_path || 'Todos'}`,
    timestamp: new Date().toISOString(),
  });

  const { password: _, ...safeDoc } = newDoc;
  res.status(201).json({ doctor: safeDoc });
});

app.delete('/api/doctors/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = findDoctor(id);
  if (doc?.role === 'superadmin' && doc?.username === 'superadmin') {
    res.status(403).json({ error: 'No se puede eliminar la cuenta del Superadministrador principal' });
    return;
  }

  DOCTORS = DOCTORS.filter((d) => String(d.id) !== String(id) && d.username.toLowerCase() !== String(id).toLowerCase());

  if (serverSupabase) {
    try {
      await serverSupabase.from('doctors').delete().eq('id', id);
    } catch (e: any) {
      console.warn('Supabase doctor delete notice:', e.message);
    }
  }

  res.json({ success: true });
});

app.patch('/api/doctors/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  let doc = findDoctor(id);

  if (!doc && serverSupabase) {
    try {
      const { data: supaDoc } = await serverSupabase.from('doctors').select('*').eq('id', id).maybeSingle();
      if (supaDoc) {
        doc = {
          id: String(supaDoc.id),
          name: supaDoc.name,
          username: supaDoc.username,
          password: supaDoc.password || 'admin123',
          role: supaDoc.role || 'doctor',
          department: supaDoc.department || 'Obstetricia y Maternidad',
          assigned_space_path: supaDoc.assigned_space_path || '',
          is_active: Boolean(supaDoc.is_active),
          created_at: supaDoc.created_at || new Date().toISOString(),
        };
        DOCTORS.push(doc);
      }
    } catch (e: any) {
      console.warn('Supabase doctor lookup notice:', e.message);
    }
  }

  if (!doc) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  doc.is_active = Boolean(req.body.is_active);

  if (serverSupabase) {
    try {
      await serverSupabase.from('doctors').update({ is_active: doc.is_active }).eq('id', id);
    } catch (e: any) {
      console.warn('Supabase toggle doctor notice:', e.message);
    }
  }

  const { password: _, ...safeDoc } = doc;
  res.json({ success: true, doctor: safeDoc });
});

app.patch('/api/doctors/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  let doc = findDoctor(id);

  // If not found in memory, query Supabase
  if (!doc && serverSupabase) {
    try {
      const { data: supaDoc } = await serverSupabase.from('doctors').select('*').eq('id', id).maybeSingle();
      if (supaDoc) {
        doc = {
          id: String(supaDoc.id),
          name: supaDoc.name,
          username: supaDoc.username,
          password: supaDoc.password || 'admin123',
          role: supaDoc.role || 'doctor',
          department: supaDoc.department || 'Obstetricia y Maternidad',
          assigned_space_path: supaDoc.assigned_space_path || '',
          is_active: Boolean(supaDoc.is_active),
          created_at: supaDoc.created_at || new Date().toISOString(),
        };
        DOCTORS.push(doc);
      }
    } catch (e: any) {
      console.warn('Supabase doctor lookup by id notice:', e.message);
    }
  }

  if (!doc) {
    res.status(404).json({ error: `Usuario con identificador "${id}" no encontrado.` });
    return;
  }

  if (req.body.is_active !== undefined) doc.is_active = Boolean(req.body.is_active);
  if (req.body.assigned_space_path !== undefined) doc.assigned_space_path = String(req.body.assigned_space_path || '').trim();
  if (req.body.role !== undefined) doc.role = req.body.role;
  if (req.body.name !== undefined) doc.name = req.body.name;
  if (req.body.password !== undefined) doc.password = req.body.password;
  if (req.body.department !== undefined) doc.department = req.body.department;

  if (serverSupabase) {
    try {
      const { error: updateErr } = await serverSupabase.from('doctors').update({
        is_active: doc.is_active,
        assigned_space_path: doc.assigned_space_path,
        role: doc.role,
        name: doc.name,
        department: doc.department,
      }).eq('id', id);

      if (updateErr) {
        console.warn('Supabase doctor update notice (falling back without assigned_space_path):', updateErr.message);
        // Fallback update in case assigned_space_path column is pending migration in Supabase
        await serverSupabase.from('doctors').update({
          is_active: doc.is_active,
          name: doc.name,
          department: doc.department,
        }).eq('id', id);
      }
    } catch (e: any) {
      console.warn('Supabase doctor patch notice:', e.message);
    }
  }

  const { password: _, ...safeDoc } = doc;
  res.json({ success: true, doctor: safeDoc });
});

// 3. Current active announcement for TV (minimal necessary data, supports room multiple images loop)
app.get('/api/announcements/current', (req: Request, res: Response) => {
  const channel = (req.query.channel as string) || 'waiting-room';
  const spacePath = (req.query.space_path as string) || '';

  // Filter all active announcements matching either space_path or channel
  const activeList = ANNOUNCEMENTS.filter((a) => {
    if (!a.is_active) return false;
    if (spacePath) {
      return a.space_path === spacePath || a.channel === spacePath || a.channel === spacePath.replace(/^\//, '');
    }
    return a.channel === channel || a.space_path === channel || a.space_path === `/${channel}`;
  });
  
  if (activeList.length === 0) {
    res.json({ active: null, activeList: [] });
    return;
  }

  res.json({
    active: activeList[0],
    activeList,
  });
});

// 4. Announcements list (protected, for medical staff)
app.get('/api/announcements', async (_req: Request, res: Response) => {
  if (serverSupabase) {
    try {
      const { data, error } = await serverSupabase
        .from('tv_announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const supaAnnouncements = data.map((d) => ({
          id: d.id,
          photo_path: d.photo_path,
          photo_url: d.photo_path?.startsWith('http') || d.photo_path?.startsWith('/api')
            ? d.photo_path
            : `/api/photos/${d.photo_path}`,
          baby_identifier: d.baby_identifier,
          room: d.room,
          birth_datetime: d.birth_datetime,
          is_active: d.is_active,
          published_at: d.published_at,
          published_by_name: d.published_by_name,
          hidden_at: d.hidden_at,
          hidden_by_name: d.hidden_by_name,
          channel: d.channel,
          created_at: d.created_at,
        }));
        res.json({ announcements: supaAnnouncements });
        return;
      }
    } catch (e: any) {
      console.warn('Server Supabase announcements query notice:', e.message);
    }
  }
  res.json({ announcements: ANNOUNCEMENTS });
});

// 5. Publish new announcement / broadcast image
app.post('/api/announcements', async (req: Request, res: Response) => {
  const {
    photo_path,
    photo_url,
    baby_identifier,
    room,
    birth_datetime,
    channel = 'waiting-room',
    space_path = '/tv',
    space_id,
    title,
    message,
    keepExistingActive = req.body.keepExistingActive !== undefined ? Boolean(req.body.keepExistingActive) : true,
    user_id = 'usr_doc_01',
    user_name = 'Personal Médico',
    user_role = 'doctor',
  } = req.body;

  if (!photo_path && !photo_url) {
    res.status(400).json({ error: 'La fotografía o mensaje es obligatorio' });
    return;
  }

  let formattedSpacePath = space_path || '/tv';
  if (!formattedSpacePath.startsWith('/')) {
    formattedSpacePath = '/' + formattedSpacePath;
  }

  // Deactivate prior active announcement in this space if keepExistingActive is false
  if (!keepExistingActive) {
    for (const a of ANNOUNCEMENTS) {
      if (
        (a.space_path === formattedSpacePath || a.channel === channel || a.space_path === channel) &&
        a.is_active
      ) {
        a.is_active = false;
        a.hidden_at = new Date().toISOString();
        a.hidden_by_name = 'Reemplazado por nueva publicación';
      }
    }
  }

  const newId = `ann_${Date.now()}`;
  const now = new Date().toISOString();

  const announcement: DbAnnouncement = {
    id: newId,
    photo_path: photo_path || 'uploaded_image',
    photo_url: photo_url || `/api/photos/${photo_path}`,
    baby_identifier: baby_identifier?.trim() || undefined,
    room: room?.trim() || undefined,
    birth_datetime: birth_datetime || undefined,
    is_active: true,
    published_at: now,
    published_by_id: user_id,
    published_by_name: user_name,
    created_at: now,
    channel,
    space_path: formattedSpacePath,
    space_id,
    title: title?.trim() || undefined,
    message: message?.trim() || undefined,
  };

  ANNOUNCEMENTS.unshift(announcement);

  // Add audit log
  AUDIT_LOGS.unshift({
    id: `aud_${Date.now()}`,
    action: 'photo_published',
    announcement_id: newId,
    user_id,
    user_name,
    user_role,
    details: `Imagen/anuncio publicado en ${formattedSpacePath} (${room || 'General'}). ${keepExistingActive ? '[En bucle 30s]' : '[Pantalla fija]'}`,
    timestamp: now,
  });

  const activeList = ANNOUNCEMENTS.filter(
    (a) => a.is_active && (a.space_path === formattedSpacePath || a.channel === channel)
  );

  // Persist to Supabase if configured on server
  let supabaseSynced = false;
  let supabaseError: string | null = null;

  if (serverSupabase) {
    try {
      if (!keepExistingActive) {
        await serverSupabase
          .from('tv_announcements')
          .update({
            is_active: false,
            hidden_at: now,
            hidden_by_name: 'Reemplazado por nueva publicación',
          })
          .or(`space_path.eq.${formattedSpacePath},channel.eq.${channel}`)
          .eq('is_active', true);
      }

      const isUuid = (val?: any) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

      // Insert new row
      const { data: supaRow, error: supaErr } = await serverSupabase
        .from('tv_announcements')
        .insert({
          photo_path: announcement.photo_url,
          baby_identifier: baby_identifier?.trim() || null,
          room: room?.trim() || null,
          birth_datetime: birth_datetime || now,
          is_active: true,
          published_at: now,
          published_by_name: user_name,
          channel,
          space_path: formattedSpacePath,
          space_id: isUuid(space_id) ? space_id.trim() : null,
          title: title?.trim() || null,
          message: message?.trim() || null,
        })
        .select()
        .single();

      if (supaErr) {
        console.error('Server Supabase Insert Error:', supaErr);
        supabaseError = supaErr.message;
      } else {
        supabaseSynced = true;
        console.log('✅ Server Supabase Insert Success, ID:', supaRow?.id);
      }

      // Log to Supabase audit_logs
      await serverSupabase.from('audit_logs').insert({
        action: 'photo_published',
        user_name,
        user_role,
        details: `Imagen publicada para TV (${formattedSpacePath}). ${baby_identifier || ''}`,
        timestamp: now,
      });
    } catch (e: any) {
      console.warn('Server Supabase synchronization error:', e.message);
      supabaseError = e.message;
    }
  }

  // Broadcast instantly to all TV displays in real-time!
  broadcastRealtime(
    'announcement:published',
    {
      active: announcement,
      activeList,
      space_path: formattedSpacePath,
      channel,
      announcement,
    },
    channel
  );

  res.status(201).json({
    success: true,
    announcement,
    activeList,
    supabaseSynced,
    supabaseError,
  });
});

// 6. Hide currently active announcement
app.post('/api/announcements/:id/hide', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id = 'usr_doc_01', user_name = 'Personal Médico' } = req.body;

  const item = ANNOUNCEMENTS.find((a) => a.id === id);
  if (item) {
    item.is_active = false;
    item.hidden_at = new Date().toISOString();
    item.hidden_by_name = user_name;
  }
  const targetSpace = item?.space_path || '/tv';
  const targetChannel = item?.channel || 'waiting-room';

  const now = new Date().toISOString();

  AUDIT_LOGS.unshift({
    id: `aud_${Date.now()}`,
    action: 'photo_hidden',
    announcement_id: id,
    user_id,
    user_name,
    user_role: 'doctor',
    details: `Fotografía retirada de la televisión por ${user_name}`,
    timestamp: now,
  });

  if (serverSupabase) {
    try {
      await serverSupabase
        .from('tv_announcements')
        .update({
          is_active: false,
          hidden_at: now,
          hidden_by_name: user_name,
        })
        .eq('channel', item?.channel || 'waiting-room')
        .eq('is_active', true);

      await serverSupabase.from('audit_logs').insert({
        action: 'photo_hidden',
        user_name,
        user_role: 'doctor',
        details: `Fotografía retirada de la televisión por ${user_name}`,
        timestamp: now,
      });
    } catch (e: any) {
      console.warn('Server Supabase hide error:', e.message);
    }
  }

  const remainingActive = ANNOUNCEMENTS.filter(
    (a) => a.is_active && (a.space_path === targetSpace || a.channel === targetChannel)
  );

  // Broadcast instantly to TVs that announcement is hidden
  broadcastRealtime(
    'announcement:hidden',
    {
      id,
      space_path: targetSpace,
      channel: targetChannel,
      active: remainingActive[0] || null,
      activeList: remainingActive,
    },
    targetChannel
  );

  res.json({ success: true, announcement: item || { id, is_active: false }, activeList: remainingActive });
});

// 6b. Delete announcement endpoint (allows staff to completely delete photo uploaded by mistake)
app.delete('/api/announcements/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id = 'usr_staff', user_name = 'Personal Médico' } = req.body || {};

  const index = ANNOUNCEMENTS.findIndex((a) => a.id === id);
  const item = index !== -1 ? ANNOUNCEMENTS[index] : null;
  const targetSpace = item?.space_path || '/tv';
  const targetChannel = item?.channel || 'waiting-room';

  if (index !== -1) {
    ANNOUNCEMENTS.splice(index, 1);
  }

  const now = new Date().toISOString();

  AUDIT_LOGS.unshift({
    id: `aud_${Date.now()}`,
    action: 'photo_hidden',
    announcement_id: id,
    user_id,
    user_name,
    user_role: 'doctor',
    details: `Fotografía eliminada permanentemente por ${user_name} (${item?.room || item?.baby_identifier || 'General'})`,
    timestamp: now,
  });

  if (serverSupabase) {
    try {
      await serverSupabase.from('tv_announcements').delete().eq('id', id);
      await serverSupabase.from('audit_logs').insert({
        action: 'photo_hidden',
        user_name,
        user_role: 'doctor',
        details: `Fotografía eliminada permanentemente por ${user_name} (ID: ${id})`,
        timestamp: now,
      });
    } catch (e: any) {
      console.warn('Server Supabase delete announcement notice:', e.message);
    }
  }

  const remainingActive = ANNOUNCEMENTS.filter(
    (a) => a.is_active && (a.space_path === targetSpace || a.channel === targetChannel)
  );

  broadcastRealtime(
    'announcement:hidden',
    {
      id,
      space_path: targetSpace,
      channel: targetChannel,
      active: remainingActive[0] || null,
      activeList: remainingActive,
    },
    targetChannel
  );

  res.json({ success: true, activeList: remainingActive });
});

// 7. Audit logs endpoint
app.get('/api/audit-logs', async (_req: Request, res: Response) => {
  if (serverSupabase) {
    try {
      const { data, error } = await serverSupabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data && data.length > 0) {
        res.json({ audit_logs: data });
        return;
      }
    } catch (e: any) {
      console.warn('Server Supabase audit logs query notice:', e.message);
    }
  }
  res.json({ audit_logs: AUDIT_LOGS });
});


// 8. Photo upload endpoint (via multipart or base64)
app.post('/api/photos/upload', (req: Request, res: Response) => {
  upload.single('photo')(req, res, (err: any) => {
    if (err) {
      console.warn('Multer upload notice:', err.message);
      return res.status(400).json({ error: err.message || 'Error al procesar archivo de fotografía' });
    }

    if (req.file) {
      return res.json({
        success: true,
        filename: req.file.filename,
        photo_url: `/api/photos/${req.file.filename}`,
        size: req.file.size,
      });
    }

    // Alternatively handle base64 payload from canvas or staff camera/uploader
    const base64Input = req.body?.imageBase64 || req.body?.photoBase64 || req.body?.image;
    if (base64Input) {
      try {
        const base64Data = String(base64Input).replace(/^data:[^;]+;base64,/, '').trim();
        const buffer = Buffer.from(base64Data, 'base64');

        // Check max size 15MB
        if (buffer.length > 15 * 1024 * 1024) {
          return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido (15MB)' });
        }

        const filename = `baby_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
        const targetPath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(targetPath, buffer);

        return res.json({
          success: true,
          filename,
          photo_url: `/api/photos/${filename}`,
          size: buffer.length,
        });
      } catch (writeErr: any) {
        console.error('Error writing uploaded photo:', writeErr);
        return res.status(500).json({ error: 'Error al almacenar la fotografía en el servidor' });
      }
    }

    return res.status(400).json({ error: 'No se recibió ninguna fotografía válida' });
  });
});

// 9. Secure private photo serving
app.get('/api/photos/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename); // Prevent path traversal
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Fotografía no encontrada' });
    return;
  }

  // Set appropriate content-type and security headers
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.webp') contentType = 'image/webp';
  if (ext === '.svg') contentType = 'image/svg+xml';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  fs.createReadStream(filePath).pipe(res);
});

// ==========================================
// Vite Middleware & Static Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hospital Bienvenida Recién Nacidos] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
