'use client';

import React from 'react';
import { useAnnouncerStore } from '@/lib/client/announcer';

export const AriaLiveAnnouncer: React.FC = () => {
  const message = useAnnouncerStore((s) => s.message);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only pointer-events-none fixed -top-96 left-0 h-1 w-1 overflow-hidden opacity-0"
      data-testid="aria-live-announcer"
    >
      {message}
    </div>
  );
};
