import { AvatarConfig } from '@/constants/avatars';

export interface UserStatus {
  music: string;
  doing: string;
  having: string;
}

export interface PresenceUser {
  sessionId: string;
  avatarConfig: AvatarConfig;
  status: UserStatus;
  joinedAt: number;
  isAway: boolean;
  // Position in room (0-1 normalized, set on join, stable)
  x: number;
  y: number;
}

export const EMPTY_STATUS: UserStatus = {
  music: '',
  doing: '',
  having: '',
};

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('fc_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('fc_session_id', id);
  }
  return id;
}

export function getVisitCount(): number {
  if (typeof window === 'undefined') return 0;
  const count = parseInt(localStorage.getItem('fc_visits') || '0', 10);
  return count;
}

export function incrementVisitCount(): number {
  if (typeof window === 'undefined') return 0;
  const count = getVisitCount() + 1;
  localStorage.setItem('fc_visits', String(count));
  return count;
}

export function getSavedAvatarConfig(): AvatarConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fc_avatar');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveAvatarConfig(config: AvatarConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fc_avatar', JSON.stringify(config));
}

export function getSavedStatus(): UserStatus | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fc_status');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveStatus(status: UserStatus) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fc_status', JSON.stringify(status));
}

export function randomRoomPosition(): { x: number; y: number } {
  // Keep away from edges (10-90%)
  return {
    x: 0.1 + Math.random() * 0.8,
    y: 0.15 + Math.random() * 0.65,
  };
}

export function formatStatus(s: UserStatus): string {
  const parts = [s.music, s.doing, s.having].filter(Boolean);
  return parts.length ? parts.join(' · ') : '·· ·· ··';
}
