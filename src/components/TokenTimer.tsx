'use client';

import { memo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { KeyRound } from 'lucide-react';

interface TokenTimerProps {
  expiry: number | null;
}

function TokenTimerInner({ expiry }: TokenTimerProps) {
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
    <Badge
      variant={isExpired ? 'destructive' : isLow ? 'outline' : 'secondary'}
      className={`font-mono text-xs gap-1 ${
        isExpired ? 'bg-red-100 text-red-700 border-red-200' :
        isLow ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
        'bg-muted text-muted-foreground'
      }`}
      title="Temps restant du token d'accès"
    >
      <KeyRound className="h-3 w-3" />
      {remaining}
    </Badge>
  );
}

const TokenTimer = memo(TokenTimerInner);
TokenTimer.displayName = 'TokenTimer';
export default TokenTimer;
