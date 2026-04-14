'use client';

import { useEffect, useRef } from 'react';
import { AvatarConfig, AVATARS, getColorMap } from '@/constants/avatars';

interface Props {
  config: AvatarConfig;
  pixelSize?: number;
  isAway?: boolean;
  className?: string;
}

export default function PixelAvatar({ config, pixelSize = 6, isAway = false, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cols = 10;
  const rows = 12;
  const w = cols * pixelSize;
  const h = rows * pixelSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    const colorMap = getColorMap(config);
    const av = AVATARS.find(a => a.id === config.avatarId) ?? AVATARS[0];

    ctx.globalAlpha = isAway ? 0.4 : 1;
    av.base.forEach((row, r) => {
      row.forEach((v, c) => {
        if (!v) return;
        ctx.fillStyle = colorMap[v];
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
      });
    });
    ctx.globalAlpha = 1;
  }, [config, pixelSize, isAway, w, h]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      className={className}
      style={{ imageRendering: 'pixelated', width: w, height: h }}
    />
  );
}
