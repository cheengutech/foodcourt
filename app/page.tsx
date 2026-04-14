'use client';

import { useCallback } from 'react';
import { useRoom } from '@/hooks/useRoom';
import EntryScreen from '@/components/EntryScreen';
import RoomCanvas from '@/components/RoomCanvas';
import StatusBar from '@/components/StatusBar';
import { AvatarConfig } from '@/constants/avatars';
import { UserStatus, incrementVisitCount, saveAvatarConfig, saveStatus } from '@/lib/presence';

export default function Home() {
  const {
    users, joined, sessionId, roomCount,
    join, updateStatus, toggleAway, moveTo, leave,
  } = useRoom();

  const handleEnter = useCallback((avatarConfig: AvatarConfig, status: UserStatus) => {
    incrementVisitCount();
    saveAvatarConfig(avatarConfig);
    saveStatus(status);
    join(avatarConfig, status);
  }, [join]);

  const handleStatusChange = useCallback((status: UserStatus) => {
    saveStatus(status);
    updateStatus(status);
  }, [updateStatus]);

  const handleMove = useCallback((x: number, y: number) => {
    moveTo(x, y);
  }, [moveTo]);

  if (!joined) {
    return <EntryScreen onEnter={handleEnter} roomCount={roomCount} />;
  }

  const me = users.find(u => u.sessionId === sessionId);

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0f0b08' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Food Court
          </span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 6px rgba(74,222,128,0.6)',
            display: 'inline-block',
          }} />
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>
          {users.length} {users.length === 1 ? 'person' : 'people'} here
        </span>
      </div>

      {/* Room */}
      <RoomCanvas users={users} mySessionId={sessionId} onMove={handleMove} />

      {/* Status bar */}
      {me && (
        <StatusBar
          status={me.status}
          avatarConfig={me.avatarConfig}
          isAway={me.isAway}
          onStatusChange={handleStatusChange}
          onAwayToggle={toggleAway}
          onLeave={leave}
        />
      )}
    </div>
  );
}
