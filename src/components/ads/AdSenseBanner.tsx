import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSenseBannerProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}

// Publisher ID público — substituir quando o AdSense for aprovado.
const PUBLISHER_ID = 'ca-pub-PENDING';

export default function AdSenseBanner({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}: AdSenseBannerProps) {
  const pushed = useRef(false);
  const isDev = import.meta.env.DEV;
  const isPlaceholder = PUBLISHER_ID.includes('PENDING') || slot.includes('PENDING');

  useEffect(() => {
    if (isDev || isPlaceholder || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.warn('[AdSense] push failed', e);
    }
  }, [isDev, isPlaceholder]);

  if (isDev || isPlaceholder) {
    return (
      <div
        className={`w-full max-w-3xl h-24 rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground ${className}`}
        aria-hidden="true"
      >
        Anúncio — preview ({isDev ? 'dev' : 'aguardando aprovação AdSense'})
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block' }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}
