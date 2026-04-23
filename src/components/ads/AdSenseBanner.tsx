import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const PUBLISHER_ID = "ca-pub-2835871674648959";

interface AdSenseBannerProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  layoutKey?: string;
  className?: string;
  minHeight?: number;
}

export default function AdSenseBanner({
  slot,
  format = "auto",
  responsive = true,
  layoutKey,
  className = "",
  minHeight = 100,
}: AdSenseBannerProps) {
  const pushed = useRef(false);
  const isDev = import.meta.env.DEV;
  const isPlaceholder = PUBLISHER_ID.includes("PENDING") || slot.includes("PENDING");

  useEffect(() => {
    if (isDev || isPlaceholder || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.warn("[AdSense] push failed", e);
    }
  }, [isDev, isPlaceholder]);

  if (isDev || isPlaceholder) {
    return (
      <div
        className={`relative w-full rounded-lg border border-dashed border-border/60 bg-muted/20 flex items-center justify-center ${className}`}
        style={{ minHeight }}
        aria-label="Espaço publicitário (preview)"
      >
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
          Anúncio (preview)
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ minHeight }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
        {...(responsive ? { "data-full-width-responsive": "true" } : {})}
      />
    </div>
  );
}
