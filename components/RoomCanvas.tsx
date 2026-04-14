'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { PresenceUser } from '@/lib/presence';
import PixelAvatar from './PixelAvatar';
import StatusBubble from './StatusBubble';

interface Props {
  users: PresenceUser[];
  mySessionId: string;
  onMove?: (x: number, y: number) => void;
}

// Smaller tables — w/h as % of container width
// On mobile, tables will be slightly larger for easier interaction
const getTables = (isMobile: boolean) => {
  const scale = isMobile ? 1.3 : 1;
  return [
    { id: 't1', x: 0.15, y: 0.30, w: 0.055 * scale, h: 0.032 * scale },
    { id: 't2', x: 0.38, y: 0.24, w: 0.055 * scale, h: 0.032 * scale },
    { id: 't3', x: 0.62, y: 0.30, w: 0.055 * scale, h: 0.032 * scale },
    { id: 't4', x: 0.80, y: 0.24, w: 0.055 * scale, h: 0.032 * scale },
    { id: 't5', x: 0.28, y: 0.62, w: 0.060 * scale, h: 0.035 * scale },
    { id: 't6', x: 0.58, y: 0.58, w: 0.060 * scale, h: 0.035 * scale },
    { id: 't7', x: 0.82, y: 0.60, w: 0.055 * scale, h: 0.032 * scale },
  ];
};

const CHAIR_OFFSETS = [
  { l: '5%',  t: '-55%' },
  { l: '65%', t: '-55%' },
  { l: '5%',  t: '105%' },
  { l: '65%', t: '105%' },
];

const BOB_CLASSES = ['avatar-bob', 'avatar-bob-slow', 'avatar-bob-fast'];
function bobClass(id: string) {
  return BOB_CLASSES[id.charCodeAt(0) % BOB_CLASSES.length];
}

interface Ripple { id: number; px: number; py: number; }

export default function RoomCanvas({ users, mySessionId, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const rippleId = useRef(0);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onMove || !containerRef.current) return;
    if ((e.target as HTMLElement).closest('.avatar-node')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = Math.max(0.04, Math.min(0.96, px / rect.width));
    const y = Math.max(0.12, Math.min(0.88, py / rect.height));
    onMove(x, y);

    const id = ++rippleId.current;
    setRipples(r => [...r, { id, px, py }]);
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 520);
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1 overflow-hidden select-none"
      style={{ background: '#0f0b08', minHeight: '340px', cursor: 'crosshair' }}
      onClick={handleClick}
    >
      {/* Ambient glows */}
      <div className="absolute pointer-events-none glow-pulse" style={{
        left: '8%', top: '15%', width: 500, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(190,95,30,0.18) 0%, transparent 65%)',
        animationDelay: '0s',
      }} />
      <div className="absolute pointer-events-none glow-pulse" style={{
        right: '5%', bottom: '20%', width: 440, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(110,85,180,0.14) 0%, transparent 65%)',
        animationDelay: '1.8s',
      }} />
      <div className="absolute pointer-events-none glow-pulse" style={{
        left: '38%', bottom: '5%', width: 340, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(160,110,40,0.10) 0%, transparent 65%)',
        animationDelay: '3.2s',
      }} />

      {/* Vignettes */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: 100,
        background: 'linear-gradient(to top, rgba(25,15,5,0.55) 0%, transparent 100%)',
      }} />
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
        height: 60,
        background: 'linear-gradient(to bottom, rgba(15,11,8,0.6) 0%, transparent 100%)',
      }} />

      {/* Tables */}
      {getTables(isMobile).map(t => (
        <div key={t.id} className="absolute pointer-events-none" style={{
          left: `${t.x * 100}%`,
          top: `${t.y * 100}%`,
          width: `${t.w * 100}%`,
          paddingTop: `${t.h * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}>
          {/* Table surface */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(70,48,24,0.60)',
            border: '0.5px solid rgba(200,140,60,0.22)',
            borderRadius: 5,
          }} />
          {/* Table shadow */}
          <div style={{
            position: 'absolute',
            top: '90%', left: '15%', right: '15%', height: '40%',
            background: 'rgba(0,0,0,0.28)',
            borderRadius: '50%',
            filter: 'blur(3px)',
          }} />
          {/* Chairs */}
          {CHAIR_OFFSETS.map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: pos.l, top: pos.t,
              width: 10, height: 10,
              background: 'rgba(55,38,20,0.80)',
              border: '0.5px solid rgba(200,140,60,0.14)',
              borderRadius: 2,
            }} />
          ))}
        </div>
      ))}

      {/* Empty state */}
      {users.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p style={{ color: 'rgba(255,255,255,0.16)', fontSize: 13 }}>
            click anywhere to walk in
          </p>
        </div>
      )}

      {/* Ripples */}
      {ripples.map(r => (
        <div key={r.id} className="move-ripple" style={{ left: r.px, top: r.py }} />
      ))}

      {/* Users */}
      {users.map(user => {
        const isMe = user.sessionId === mySessionId;
        return (
          <div
            key={user.sessionId}
            className="avatar-node absolute"
            style={{
              left: `${user.x * 100}%`,
              top: `${user.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.55s cubic-bezier(0.4,0,0.2,1), top 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease',
              opacity: user.isAway ? 0.32 : 1,
              zIndex: Math.round(user.y * 100),
            }}
          >
            <div className="relative flex flex-col items-center">
              <StatusBubble status={user.status} isAway={user.isAway} />
              <div
                className={user.isAway ? '' : bobClass(user.sessionId)}
                style={{ marginTop: 28 }}
              >
                <div style={{
                  display: 'inline-block',
                  outline: isMe ? '2px solid rgba(167,139,250,0.55)' : 'none',
                  outlineOffset: 3,
                  borderRadius: 2,
                }}>
                  <PixelAvatar config={user.avatarConfig} pixelSize={isMobile ? 10 : 8} isAway={user.isAway} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
