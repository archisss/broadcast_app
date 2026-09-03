export type UserRole = 'superadmin' | 'admin' | 'doctor' | 'nurse' | 'tv';

export interface User {
  id: string;
  email?: string;
  username?: string;
  name: string;
  role: UserRole;
  department?: string;
  licenseNumber?: string;
  assigned_space_path?: string; // Broadcast space assigned to this staff member (e.g. "/master_suite")
}

export interface Doctor {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'superadmin' | 'admin' | 'doctor' | 'nurse';
  department?: string;
  assigned_space_path?: string; // Broadcast space assigned to this staff member
  is_active: boolean;
  created_at: string;
}

export interface BroadcastSpace {
  id: string;
  nombre_espacio: string;
  direccion_web: string; // ej: "/master_suite", "/cuarto22", "/tv"
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface TvAnnouncement {
  id: string;
  photo_path: string; // File path or storage key or data url
  photo_url: string; // Signed or access URL
  thumbnail_url?: string;
  baby_identifier?: string; // e.g. "RN-2026-089" (optional)
  room?: string; // e.g. "Habitación 302" o "Master Suite" (optional)
  birth_datetime?: string; // ISO date string (optional)
  is_active: boolean;
  published_at: string; // ISO date string
  published_by_id: string;
  published_by_name: string;
  created_at: string;
  hidden_at?: string;
  hidden_by_name?: string;
  channel: string; // e.g. "waiting-room", "master_suite", "cuarto22"
  space_id?: string;
  space_path?: string; // e.g. "/master_suite", "/cuarto22", "/tv"
  title?: string;
  message?: string;
}

export type Announcement = TvAnnouncement;

export interface AuditLog {
  id: string;
  action: 'photo_published' | 'photo_hidden' | 'login' | 'logout' | 'user_created' | 'space_created' | 'doctor_created';
  announcement_id?: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  details: string;
  timestamp: string;
  ip_address?: string;
}

export interface CreateAnnouncementPayload {
  photoBase64?: string;
  photoFile?: File | Blob;
  babyIdentifier?: string;
  room?: string;
  birthDatetime?: string;
  channel?: string;
  space_path?: string;
  space_id?: string;
  title?: string;
  message?: string;
  keepExistingActive?: boolean; // if true, adds to the 30-second loop
}

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

