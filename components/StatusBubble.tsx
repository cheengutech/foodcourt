'use client';

import { UserStatus, formatStatus } from '@/lib/presence';

interface Props {
  status: UserStatus;
  isAway?: boolean;
}

export default function StatusBubble({ status, isAway }: Props) {
  const text = isAway ? 'away ··' : formatStatus(status);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 6,
        background: 'rgba(20,15,10,0.88)',
        border: '0.5px solid rgba(255,255,255,0.10)',
        borderRadius: 8,
        padding: '5px 10px',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        textAlign: 'center',
        fontSize: 11,
        color: isAway ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.80)',
        pointerEvents: 'none',
        maxWidth: 200,
        letterSpacing: '0.01em',
        lineHeight: 1.4,
        transition: 'opacity 0.3s',
      }}
    >
      {text}
      {/* Tail */}
      <span style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderTop: '4px solid rgba(20,15,10,0.88)',
      }} />
    </div>
  );
}
