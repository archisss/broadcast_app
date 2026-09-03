import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { TvAnnouncement, ConnectionState, AuditLog, CreateAnnouncementPayload, BroadcastSpace } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  activeAnnouncement: TvAnnouncement | null;
  activeList: TvAnnouncement[];
  announcements: TvAnnouncement[];
  auditLogs: AuditLog[];
  spaces: BroadcastSpace[];
  connectionState: ConnectionState;
  isPublishing: boolean;
  publishError: string | null;
  channel: string;
  currentSpacePath: string;
  setChannel: (channel: string) => void;
  setCurrentSpacePath: (spacePath: string) => void;
  publishAnnouncement: (
    payloadOrPhoto: CreateAnnouncementPayload | Blob | File | string,
    maybeIdentifier?: string,
    maybeRoom?: string,
    maybeMessage?: string,
    maybeBirthDatetime?: string,
    maybeKeepActive?: boolean,
    maybeSpacePath?: string
  ) => Promise<boolean>;
  hideAnnouncement: (id?: string) => Promise<boolean>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  refreshData: (spacePath?: string) => Promise<void>;
  fetchSpaces: () => Promise<BroadcastSpace[]>;
  lastUpdated: string | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeAnnouncement, setActiveAnnouncement] = useState<TvAnnouncement | null>(null);
  const [activeList, setActiveList] = useState<TvAnnouncement[]>([]);
  const [announcements, setAnnouncements] = useState<TvAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [spaces, setSpaces] = useState<BroadcastSpace[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('reconnecting');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [channel, setChannel] = useState<string>('waiting-room');
  const [currentSpacePath, setCurrentSpacePath] = useState<string>('/tv');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Synchronize space path when user has an assigned space
  useEffect(() => {
    if (user?.assigned_space_path) {
      const sp = user.assigned_space_path;
      setCurrentSpacePath(sp);
      setChannel(sp.replace(/^\//, '') || 'waiting-room');
    }
  }, [user?.assigned_space_path]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<any>(null);

  // Fetch available broadcast spaces
  const fetchSpaces = useCallback(async (): Promise<BroadcastSpace[]> => {
    try {
      const res = await fetch('/api/spaces');
      if (res.ok) {
        const data = await res.json();
        const list = data.spaces || [];
        setSpaces(list);
        return list;
      }
    } catch (err) {
      console.warn('Error loading spaces:', err);
    }
    return [];
  }, []);

  // Fetch current active announcements (both single item and 30s rotation list)
  const refreshData = useCallback(async (targetSpacePath?: string) => {
    const spaceToQuery = targetSpacePath || currentSpacePath || '/tv';
    try {
      // 1. Fetch current active for the requested space or TV channel
      const resCurrent = await fetch(
        `/api/announcements/current?space_path=${encodeURIComponent(spaceToQuery)}&channel=${encodeURIComponent(channel)}`
      );
      if (resCurrent.ok) {
        const data = await resCurrent.json();
        setActiveAnnouncement(data.active || null);
        setActiveList(data.activeList || (data.active ? [data.active] : []));
        setLastUpdated(new Date().toISOString());
      }

      // Check Supabase if configured for persistent state
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: supaActiveList } = await supabase
            .from('tv_announcements')
            .select('*')
            .or(`space_path.eq.${spaceToQuery},channel.eq.${channel}`)
            .eq('is_active', true)
            .order('published_at', { ascending: false });

          if (supaActiveList && supaActiveList.length > 0) {
            const mappedList: TvAnnouncement[] = supaActiveList.map((row: any) => ({
              id: row.id,
              photo_url:
                row.photo_path?.startsWith('http') || row.photo_path?.startsWith('/api') || row.photo_path?.startsWith('data:')
                  ? row.photo_path
                  : `/api/photos/${row.photo_path}`,
              photo_path: row.photo_path,
              baby_identifier: row.baby_identifier,
              room: row.room,
              birth_datetime: row.birth_datetime,
              published_at: row.published_at,
              channel: row.channel,
              is_active: row.is_active,
              published_by_name: row.published_by_name,
              published_by_id: row.published_by_id || 'usr_doc_01',
              created_at: row.created_at,
              space_path: row.space_path,
              space_id: row.space_id,
              title: row.title,
              message: row.message,
            }));
            setActiveAnnouncement(mappedList[0]);
            setActiveList(mappedList);
            setLastUpdated(new Date().toISOString());
          }
        } catch (supaErr) {
          console.warn('Supabase refresh check notice:', supaErr);
        }
      }

      // 2. If authenticated, fetch full history, spaces and audit logs
      if (user && user.role !== 'tv') {
        const [resList, resAudit] = await Promise.all([
          fetch('/api/announcements'),
          fetch('/api/audit-logs'),
        ]);

        if (resList.ok) {
          const listData = await resList.json();
          setAnnouncements(listData.announcements || []);
        }
        if (resAudit.ok) {
          const auditData = await resAudit.json();
          setAuditLogs(auditData.audit_logs || []);
        }
        await fetchSpaces();
      }
    } catch (err) {
      console.warn('Error fetching announcements data:', err);
    }
  }, [channel, currentSpacePath, user, fetchSpaces]);

  // Connect Real-Time SSE Stream
  useEffect(() => {
    let isMounted = true;

    function connectSSE() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setConnectionState('reconnecting');
      const sseUrl = `/api/realtime/stream?channel=${encodeURIComponent(channel)}&space_path=${encodeURIComponent(currentSpacePath)}`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setConnectionState('connected');
      };

      // Initial state event
      es.addEventListener('init', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(e.data);
          setActiveAnnouncement(data.active || null);
          setActiveList(data.activeList || (data.active ? [data.active] : []));
          setLastUpdated(new Date().toISOString());
          setConnectionState('connected');
        } catch (err) {
          console.error('Failed to parse SSE init:', err);
        }
      });

      // New announcement published in real-time
      es.addEventListener('announcement:published', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(e.data);
          const publishedSpace = data.space_path || data.announcement?.space_path;

          // If event matches our current space or is general
          if (!publishedSpace || publishedSpace === currentSpacePath || currentSpacePath === '/tv') {
            setActiveAnnouncement(data.active);
            setActiveList(data.activeList || (data.active ? [data.active] : []));
            setLastUpdated(new Date().toISOString());
          }

          if (data.announcement) {
            setAnnouncements((prev) => {
              const updated = data.keepExistingActive
                ? [data.announcement, ...prev]
                : [data.announcement, ...prev.map((a) => (a.space_path === publishedSpace ? { ...a, is_active: false } : a))];
              return updated;
            });
          }
        } catch (err) {
          console.error('Failed to handle announcement:published:', err);
        }
      });

      // Announcement hidden in real-time
      es.addEventListener('announcement:hidden', (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = e.data ? JSON.parse(e.data) : {};
          const hiddenSpace = data.space_path;

          if (!hiddenSpace || hiddenSpace === currentSpacePath || currentSpacePath === '/tv') {
            setActiveAnnouncement(data.active || null);
            setActiveList(data.activeList || []);
            setLastUpdated(new Date().toISOString());
          }

          setAnnouncements((prev) =>
            prev.map((a) => (a.id === data.id ? { ...a, is_active: false } : a))
          );
        } catch {
          setActiveAnnouncement(null);
          setActiveList([]);
        }
      });

      es.onerror = () => {
        if (!isMounted) return;
        setConnectionState('reconnecting');
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (isMounted) {
            connectSSE();
          }
        }, 5000);
      };
    }

    connectSSE();
    refreshData();
    fetchSpaces();

    // Supabase Realtime subscription
    let supabaseChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      supabaseChannel = supabase
        .channel('tv_announcements_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tv_announcements' },
          () => {
            refreshData();
          }
        )
        .subscribe();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [channel, currentSpacePath, refreshData, fetchSpaces]);

  // Publish new announcement / image (accepts either an object payload or positional arguments)
  const publishAnnouncement = async (
    payloadOrPhoto: CreateAnnouncementPayload | Blob | File | string,
    maybeIdentifier?: string,
    maybeRoom?: string,
    maybeMessage?: string,
    maybeBirthDatetime?: string,
    maybeKeepActive?: boolean,
    maybeSpacePath?: string
  ): Promise<boolean> => {
    setIsPublishing(true);
    setPublishError(null);

    try {
      // Normalize arguments
      let payload: CreateAnnouncementPayload;
      if (
        payloadOrPhoto &&
        typeof payloadOrPhoto === 'object' &&
        !('size' in payloadOrPhoto) &&
        !('slice' in payloadOrPhoto)
      ) {
        payload = payloadOrPhoto as CreateAnnouncementPayload;
      } else if (payloadOrPhoto instanceof Blob || payloadOrPhoto instanceof File) {
        payload = {
          photoFile: payloadOrPhoto,
          babyIdentifier: maybeIdentifier,
          room: maybeRoom,
          message: maybeMessage,
          birthDatetime: maybeBirthDatetime,
          keepExistingActive: maybeKeepActive !== undefined ? maybeKeepActive : true,
          space_path: maybeSpacePath,
          channel: maybeSpacePath ? maybeSpacePath.replace(/^\//, '') : undefined,
        };
      } else if (typeof payloadOrPhoto === 'string') {
        payload = {
          photoBase64: payloadOrPhoto,
          babyIdentifier: maybeIdentifier,
          room: maybeRoom,
          message: maybeMessage,
          birthDatetime: maybeBirthDatetime,
          keepExistingActive: maybeKeepActive !== undefined ? maybeKeepActive : true,
          space_path: maybeSpacePath,
          channel: maybeSpacePath ? maybeSpacePath.replace(/^\//, '') : undefined,
        };
      } else {
        throw new Error('Debes proporcionar una imagen válida para publicar');
      }

      let photoUrl = '';
      let photoPath = '';

      // 1. Upload photo to server private storage or accept pre-rendered base64
      if (payload.photoBase64) {
        const uploadRes = await fetch('/api/photos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: payload.photoBase64 }),
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || `Error (${uploadRes.status}) al procesar la fotografía`);
        }
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.photo_url;
        photoPath = uploadData.filename;
      } else if (payload.photoFile) {
        const formData = new FormData();
        const filename = payload.photoFile instanceof File ? payload.photoFile.name : 'foto_bebe.jpg';
        formData.append('photo', payload.photoFile, filename);
        const uploadRes = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || `Error (${uploadRes.status}) al procesar la fotografía`);
        }
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.photo_url;
        photoPath = uploadData.filename;
      } else {
        throw new Error('Debes capturar, seleccionar o generar una imagen');
      }

      const targetSpace = payload.space_path || currentSpacePath || '/tv';

      const isUuid = (val?: any) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

      // 2. Publish announcement to backend
      const publishRes = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_path: photoPath,
          photo_url: photoUrl,
          baby_identifier: payload.babyIdentifier,
          room: payload.room,
          birth_datetime: payload.birthDatetime || new Date().toISOString(),
          channel: payload.channel || (targetSpace ? targetSpace.replace(/^\//, '') : channel),
          space_path: targetSpace,
          space_id: isUuid(payload.space_id) ? payload.space_id : undefined,
          title: payload.title,
          message: payload.message,
          keepExistingActive: Boolean(payload.keepExistingActive),
          user_id: user?.id || 'usr_doc_01',
          user_name: user?.name || 'Personal Médico',
          user_role: user?.role || 'doctor',
        }),
      });

      if (!publishRes.ok) {
        const errData = await publishRes.json().catch(() => ({}));
        throw new Error(errData.error || `Error (${publishRes.status}) al publicar la imagen`);
      }

      const result = await publishRes.json();
      setActiveAnnouncement(result.announcement);
      if (result.activeList) {
        setActiveList(result.activeList);
      }

      // 3. Persist to Supabase ONLY if server has not already synced to Supabase (avoids duplicate entries)
      if (!result.supabaseSynced && isSupabaseConfigured && supabase) {
        try {
          // If not keeping existing, deactivate previous ones in this space
          if (!payload.keepExistingActive) {
            await supabase
              .from('tv_announcements')
              .update({
                is_active: false,
                hidden_at: new Date().toISOString(),
                hidden_by_name: 'Reemplazado por nueva publicación',
              })
              .or(`space_path.eq.${targetSpace},channel.eq.${payload.channel || channel}`)
              .eq('is_active', true);
          }

          // Insert into Supabase table
          const { data: supaSaved, error: supaInsertErr } = await supabase
            .from('tv_announcements')
            .insert({
              photo_path: photoUrl || photoPath,
              baby_identifier: payload.babyIdentifier?.trim() || null,
              room: payload.room?.trim() || null,
              birth_datetime: payload.birthDatetime || new Date().toISOString(),
              is_active: true,
              published_at: new Date().toISOString(),
              published_by_name: user?.name || 'Personal Médico',
              channel: payload.channel || (targetSpace ? targetSpace.replace(/^\//, '') : channel),
              space_path: targetSpace,
              space_id: isUuid(payload.space_id) ? payload.space_id : null,
              title: payload.title || null,
              message: payload.message || null,
            })
            .select();

          if (supaInsertErr) {
            console.error('Error al insertar en Supabase:', supaInsertErr);
          } else {
            console.log('✅ Guardado en Supabase tv_announcements:', supaSaved);
          }

          // Insert audit log
          await supabase.from('audit_logs').insert({
            action: 'photo_published',
            user_name: user?.name || 'Personal Médico',
            user_role: user?.role || 'doctor',
            details: `Imagen emitida en ${targetSpace} (${payload.channel || channel})`,
            timestamp: new Date().toISOString(),
          });
        } catch (supaErr) {
          console.warn('Sincronización Supabase omitida:', supaErr);
        }
      }

      await refreshData(targetSpace);
      return true;
    } catch (err: any) {
      console.error('Publish error:', err);
      setPublishError(err.message || 'No se pudo publicar la imagen. Intenta nuevamente.');
      throw err;
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete announcement (permanently delete photo uploaded by mistake)
  const deleteAnnouncement = async (id: string): Promise<boolean> => {
    if (!id) return false;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          user_name: user?.name || 'Personal Médico',
        }),
      });

      if (!res.ok) {
        throw new Error('Error al eliminar la publicación');
      }

      // Delete from Supabase if configured as fallback
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('tv_announcements').delete().eq('id', id);
          await supabase.from('audit_logs').insert({
            action: 'photo_hidden',
            user_name: user?.name || 'Personal Médico',
            user_role: user?.role || 'doctor',
            details: `Fotografía eliminada por el usuario (ID: ${id})`,
            timestamp: new Date().toISOString(),
          });
        } catch (supaErr) {
          console.warn('Supabase delete notification warning:', supaErr);
        }
      }

      await refreshData();
      return true;
    } catch (err) {
      console.error('Delete announcement error:', err);
      return false;
    }
  };

  // Hide active announcement
  const hideAnnouncement = async (id?: string): Promise<boolean> => {
    const targetId = id || activeAnnouncement?.id;
    if (!targetId) return false;

    try {
      const res = await fetch(`/api/announcements/${targetId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          user_name: user?.name || 'Personal Médico',
        }),
      });

      if (!res.ok) {
        throw new Error('Error al ocultar la publicación');
      }

      // Hide in Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('tv_announcements')
            .update({
              is_active: false,
              hidden_at: new Date().toISOString(),
              hidden_by_name: user?.name || 'Personal Médico',
            })
            .eq('id', targetId);

          await supabase.from('audit_logs').insert({
            action: 'photo_hidden',
            user_name: user?.name || 'Personal Médico',
            user_role: user?.role || 'doctor',
            details: `Imagen retirada de pantalla (${currentSpacePath})`,
            timestamp: new Date().toISOString(),
          });
        } catch (supaErr) {
          console.warn('Supabase hide notification warning:', supaErr);
        }
      }

      await refreshData();
      return true;
    } catch (err) {
      console.error('Hide error:', err);
      return false;
    }
  };

  return (
    <RealtimeContext.Provider
      value={{
        activeAnnouncement,
        activeList,
        announcements,
        auditLogs,
        spaces,
        connectionState,
        isPublishing,
        publishError,
        channel,
        currentSpacePath,
        setChannel,
        setCurrentSpacePath,
        publishAnnouncement,
        hideAnnouncement,
        deleteAnnouncement,
        refreshData,
        fetchSpaces,
        lastUpdated,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
