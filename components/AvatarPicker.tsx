'use client';

import { useState, useEffect } from 'react';
import {
  AVATARS, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS, HAT_COLORS,
  AvatarConfig, DEFAULT_CONFIG, AvatarId,
} from '@/constants/avatars';
import { getVisitCount } from '@/lib/presence';
import PixelAvatar from './PixelAvatar';

interface Props {
  initial?: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

export default function AvatarPicker({ initial = DEFAULT_CONFIG, onChange }: Props) {
  const [config, setConfig] = useState<AvatarConfig>(initial);
  // Defer localStorage read to client only — avoids SSR hydration mismatch
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    setVisitCount(getVisitCount());
  }, []);

  const advancedUnlocked = visitCount >= 3;

  function update(patch: Partial<AvatarConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    onChange(next);
  }

  return (
    <div className="space-y-5">
      {/* Character grid */}
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2 font-medium">Choose your character</p>
        <div className="grid grid-cols-4 gap-2">
          {AVATARS.map(av => (
            <button
              key={av.id}
              onClick={() => update({ avatarId: av.id as AvatarId })}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all
                ${config.avatarId === av.id
                  ? 'border-purple-400 border-2 bg-purple-50/40'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
            >
              <PixelAvatar config={{ ...config, avatarId: av.id as AvatarId }} pixelSize={4} />
              <span className="text-[10px] text-neutral-500 leading-none">{av.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customization */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
        <SwatchRow
          label="Skin"
          colors={SKIN_TONES}
          active={config.skinIdx}
          onChange={i => update({ skinIdx: i })}
        />
        <SwatchRow
          label="Hair"
          colors={HAIR_COLORS}
          active={config.hairIdx}
          onChange={i => update({ hairIdx: i })}
        />
        <SwatchRow
          label="Outfit"
          colors={OUTFIT_COLORS}
          active={config.outfitIdx}
          onChange={i => update({ outfitIdx: i })}
        />
        {advancedUnlocked && (
          <SwatchRow
            label="Hat"
            colors={HAT_COLORS}
            active={config.hatIdx}
            onChange={i => update({ hatIdx: i })}
          />
        )}
        {!advancedUnlocked && (
          <p className="text-[11px] text-neutral-400 pt-1">
            Hat colors unlock after 3 visits ({3 - visitCount} to go)
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-8 py-5 flex flex-col items-center gap-3">
          <PixelAvatar config={config} pixelSize={8} />
          <span className="text-xs text-neutral-500">
            {AVATARS.find(a => a.id === config.avatarId)?.name}
          </span>
        </div>
      </div>
    </div>
  );
}

function SwatchRow({
  label, colors, active, onChange,
}: {
  label: string;
  colors: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-500 w-10 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {colors.map((col, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            style={{ background: col }}
            className={`w-5 h-5 rounded transition-all
              ${i === active ? 'ring-2 ring-offset-1 ring-neutral-700 scale-110' : 'hover:scale-105'}`}
          />
        ))}
      </div>
    </div>
  );
}
