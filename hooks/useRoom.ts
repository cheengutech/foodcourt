'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  PresenceUser, UserStatus, getSessionId, randomRoomPosition,
} from '@/lib/presence';
import { AvatarConfig } from '@/constants/avatars';

const CHANNEL = 'foodcourt:main';

export function useRoom() {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [joined, setJoined] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myDataRef = useRef<PresenceUser | null>(null);
  const sessionId = getSessionId();

  const syncUsers = useCallback((state: Record<string, unknown[]>) => {
    const all: PresenceUser[] = [];
    for (const presences of Object.values(state)) {
      for (const p of presences) {
        all.push(p as PresenceUser);
      }
    }
    setUsers(all);
  }, []);

  const join = useCallback((avatarConfig: AvatarConfig, status: UserStatus) => {
    const pos = randomRoomPosition();
    const me: PresenceUser = {
      sessionId,
      avatarConfig,
      status,
      joinedAt: Date.now(),
      isAway: false,
      x: pos.x,
      y: pos.y,
    };
    myDataRef.current = me;

    // Persist session to DB (best-effort, non-blocking)
    supabase.rpc('upsert_session', {
      p_session_id: sessionId,
      p_avatar_config: avatarConfig,
      p_last_status: status,
    }).then(({ error }) => {
      if (error) console.warn('upsert_session failed:', error.message);
    });

    const channel = supabase.channel(CHANNEL, {
      config: { presence: { key: sessionId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        syncUsers(channel.presenceState());
      })
      .on('presence', { event: 'join' }, () => {
        syncUsers(channel.presenceState());
      })
      .on('presence', { event: 'leave' }, () => {
        syncUsers(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(me);
          setJoined(true);
        }
      });

    channelRef.current = channel;
  }, [sessionId, syncUsers]);

  const updateStatus = useCallback(async (status: UserStatus) => {
    if (!channelRef.current || !myDataRef.current) return;
    const updated = { ...myDataRef.current, status };
    myDataRef.current = updated;
    await channelRef.current.track(updated);
  }, []);

  const toggleAway = useCallback(async () => {
    if (!channelRef.current || !myDataRef.current) return;
    const updated = { ...myDataRef.current, isAway: !myDataRef.current.isAway };
    myDataRef.current = updated;
    await channelRef.current.track(updated);
  }, []);

  // Move to a new position — broadcast via presence track
  const moveTo = useCallback(async (x: number, y: number) => {
    if (!channelRef.current || !myDataRef.current) return;
    const updated = { ...myDataRef.current, x, y };
    myDataRef.current = updated;
    await channelRef.current.track(updated);
  }, []);

  const leave = useCallback(async () => {
    if (!channelRef.current) return;
    await channelRef.current.untrack();
    await supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    myDataRef.current = null;
    setJoined(false);
    setUsers([]);
  }, []);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Peek room count before joining
  const [roomCount, setRoomCount] = useState(0);
  useEffect(() => {
    if (joined) return;
    const channel = supabase.channel('foodcourt:peek');
    channel
      .on('presence', { event: 'sync' }, () => {
        setRoomCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [joined]);

  return {
    users,
    joined,
    sessionId,
    roomCount: joined ? users.length : roomCount,
    join,
    updateStatus,
    toggleAway,
    moveTo,
    leave,
  };
}
