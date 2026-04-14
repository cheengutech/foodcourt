'use client';

import { useState } from 'react';
import { UserStatus } from '@/lib/presence';
import PixelAvatar from './PixelAvatar';
import { AvatarConfig } from '@/constants/avatars';

interface Props {
  status: UserStatus;
  avatarConfig: AvatarConfig;
  isAway: boolean;
  onStatusChange: (s: UserStatus) => void;
  onAwayToggle: () => void;
  onLeave: () => void;
}

export default function StatusBar({
  status, avatarConfig, isAway, onStatusChange, onAwayToggle, onLeave,
}: Props) {
  const [local, setLocal] = useState<UserStatus>(status);

  function handleBlur(field: keyof UserStatus, value: string) {
    const next = { ...local, [field]: value };
    setLocal(next);
    onStatusChange(next);
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 shrink-0"
      style={{
        background: 'rgba(13,10,6,0.96)',
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* My avatar — tiny in bar */}
      <div className="shrink-0 opacity-90">
        <PixelAvatar config={avatarConfig} pixelSize={4} isAway={isAway} />
      </div>

      {/* Status inputs */}
      <div className="flex-1 flex gap-1.5 min-w-0">
        <StatusInput
          placeholder="listening to..."
          value={local.music}
          onChange={v => setLocal(p => ({ ...p, music: v }))}
          onBlur={v => handleBlur('music', v)}
        />
        <StatusInput
          placeholder="doing..."
          value={local.doing}
          onChange={v => setLocal(p => ({ ...p, doing: v }))}
          onBlur={v => handleBlur('doing', v)}
        />
        <StatusInput
          placeholder="having..."
          value={local.having}
          onChange={v => setLocal(p => ({ ...p, having: v }))}
          onBlur={v => handleBlur('having', v)}
        />
      </div>

      {/* Away toggle */}
      <button
        onClick={onAwayToggle}
        style={{
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 8,
          border: isAway
            ? '0.5px solid rgba(251,191,36,0.4)'
            : '0.5px solid rgba(255,255,255,0.12)',
          color: isAway ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.28)',
          background: isAway ? 'rgba(251,191,36,0.08)' : 'transparent',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        {isAway ? 'away' : 'here'}
      </button>

      {/* Leave */}
      <button
        onClick={onLeave}
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.18)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          transition: 'color 0.2s',
          lineHeight: 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
        title="Leave"
      >
        ✕
      </button>
    </div>
  );
}

function StatusInput({
  placeholder, value, onChange, onBlur,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: (v: string) => void;
}) {
  return (
    <input
      type="text"
      maxLength={40}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={e => onBlur(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: 1,
        minWidth: 0,
        background: 'transparent',
        border: 'none',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        outline: 'none',
        fontSize: 11,
        color: 'rgba(255,255,255,0.65)',
        padding: '3px 4px',
        caretColor: 'rgba(167,139,250,0.8)',
      }}
      className="placeholder:text-neutral-700 focus:border-b-purple-500/40 transition-colors"
    />
  );
}
