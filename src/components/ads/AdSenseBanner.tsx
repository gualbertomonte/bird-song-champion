import { useEffect, useRef, useState } from 'react';

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
  layoutKey?: string;
  /** Altura mínima reservada para evitar layout shift e bloco invisível. */
  minHeight?: number;
}

// Publisher ID público do AdSense.
const PUBLISHER_ID = 'ca-pub-2835871674648959';

export default function AdSenseBanner({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  layoutKey,
  minHeight = 120,
}: AdSenseBannerProps) {
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement | null>(null);
  const isDev = import.meta.env.DEV;
  const isPlaceholder = PUBLISHER_ID.includes('PENDING') || slot.includes('PENDING');
  const [status, setStatus] = useState<'loading' | 'filled' | 'unfilled' | 'blocked'>('loading');

  useEffect(() => {
    if (isDev || isPlaceholder) return;

    let cancelled = false;

    const tryPush = () => {
      if (pushed.current) return;
      try {
        if (!window.adsbygoogle) {
          // Script ainda não carregou — tenta de novo em breve.
          setTimeout(() => !cancelled && tryPush(), 500);
          return;
        }
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;

        // Após push, observa se o slot foi preenchido.
        setTimeout(() => {
          if (cancelled) return;
          const el = insRef.current;
          if (!el) return;
          const filled = el.getAttribute('data-ad-status') === 'filled' || el.clientHeight > 10;
          setStatus(filled ? 'filled' : 'unfilled');
        }, 2500);
      } catch (e) {
        console.warn('[AdSense] push failed', e);
        setStatus('blocked');
      }
    };

    tryPush();

    // Detecta possível bloqueador de anúncios.
    const adblockCheck = setTimeout(() => {
      if (cancelled) return;
      if (!window.adsbygoogle) setStatus('blocked');
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(adblockCheck);
    };
  }, [isDev, isPlaceholder]);

  // Preview / dev / placeholder: bloco visual claro.
  if (isDev || isPlaceholder) {
    return (
      <div
        className={`w-full max-w-3xl rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground ${className}`}
        style={{ minHeight }}
        aria-hidden="true"
      >
        Anúncio — preview ({isDev ? 'dev' : 'aguardando aprovação AdSense'})
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ minHeight }}
      aria-label="Espaço publicitário"
    >
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block', width: '100%', minHeight }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      />
      {status !== 'filled' && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground/70 pointer-events-none rounded-lg border border-dashed border-border/50 bg-muted/10"
          aria-hidden="true"
        >
          {status === 'loading' && 'Carregando anúncio…'}
          {status === 'unfilled' && 'Espaço publicitário'}
          {status === 'blocked' && 'Anúncios indisponíveis'}
        </div>
      )}
    </div>
  );
}
