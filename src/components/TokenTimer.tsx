'use client';

import { useState, useEffect } from 'react';

interface TokenTimerProps {
  expiry: number | null;
}

export default function TokenTimer({ expiry }: TokenTimerProps) {
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiry) {
      setRemaining('--:--');
      return;
    }

    const update = () => {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setRemaining('Expiré');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiry]);

  const isExpired = remaining === 'Expiré';
  const isLow = !isExpired && remaining !== '--:--' && parseInt(remaining.split(':')[0]) < 5;

  return (
    <div
      className={`text-xs font-mono px-2 py-1 rounded-md ${
        isExpired
          ? 'bg-red-100 text-red-700'
          : isLow
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-600'
      }`}
      title="Temps restant du token d'accès"
    >
      🔑 {remaining}
    </div>
  );
}
