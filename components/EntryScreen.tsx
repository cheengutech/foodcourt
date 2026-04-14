'use client';

import { useState, useEffect } from 'react';
import AvatarPicker from './AvatarPicker';
import { AvatarConfig, DEFAULT_CONFIG } from '@/constants/avatars';
import { UserStatus, EMPTY_STATUS, getSavedAvatarConfig, getSavedStatus } from '@/lib/presence';

interface Props {
  onEnter: (avatarConfig: AvatarConfig, status: UserStatus) => void;
  roomCount: number;
}

export default function EntryScreen({ onEnter, roomCount }: Props) {
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<UserStatus>(EMPTY_STATUS);
  const [ready, setReady] = useState(false);

  // Defer all localStorage reads to client — prevents SSR hydration mismatch
  useEffect(() => {
    const saved = getSavedAvatarConfig();
    if (saved) setAvatarConfig(saved);
    const savedStatus = getSavedStatus();
    if (savedStatus) setStatus(savedStatus);
    setReady(true);
  }, []);

  function handleEnter() {
    onEnter(avatarConfig, status);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0b08' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-neutral-100 mb-1">Food Court</h1>
          <p className="text-sm text-neutral-500">
            {roomCount > 0
              ? `${roomCount} ${roomCount === 1 ? 'person' : 'people'} hanging out`
              : 'nobody here yet — be the first'}
          </p>
        </div>

        {/* Avatar picker — only render after client hydration */}
        {ready && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4">
            <AvatarPicker initial={avatarConfig} onChange={setAvatarConfig} />
          </div>
        )}

        {/* Status */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium mb-3">Status (optional)</p>
          {[
            { key: 'music' as const, placeholder: 'what are you listening to?' },
            { key: 'doing' as const, placeholder: 'what are you up to?' },
            { key: 'having' as const, placeholder: 'what are you having?' },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              type="text"
              maxLength={60}
              value={status[key]}
              onChange={e => setStatus(p => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full bg-neutral-800 text-neutral-200 text-sm rounded-lg px-3 py-2.5
                placeholder-neutral-600 outline-none focus:ring-1 focus:ring-purple-500/50
                border border-transparent focus:border-purple-500/30 transition-all"
            />
          ))}
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all
            bg-purple-600 hover:bg-purple-500 active:scale-[0.98]"
        >
          join the food court
        </button>

        <p className="text-center text-xs text-neutral-700 mt-4">
          no account needed · anonymous by default
        </p>
      </div>
    </div>
  );
}
