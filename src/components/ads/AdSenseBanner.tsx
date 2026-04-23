import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSenseBannerProps {
  slot: string;
  format?: string;
  layoutKey?: string;
  responsive?: boolean;
  className?: string;
  minHeight?: number;
}

const PUBLISHER_ID = "ca-pub-2835871674648959";

const AdSenseBanner = ({
  slot,
  format = "auto",
  layoutKey,
  responsive = true,
  className = "",
  minHeight,
}: AdSenseBannerProps) => {
  const pushed = useRef(false);
  const isDev = import.meta.env.DEV;
  const isPlaceholder = PUBLISHER_ID.includes("PENDING") || slot.includes("PENDING");

  useEffect(() => {
    if (isDev || isPlaceholder || pushed.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (error) {
      console.warn("[AdSense] push failed", error);
    }
  }, [isDev, isPlaceholder]);

  if (isDev || isPlaceholder) {
    return (
      <div
        className={`flex w-full max-w-3xl items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground ${className}`}
        style={{ minHeight: minHeight ?? 96 }}
        aria-hidden="true"
      >
        Anúncio — preview ({isDev ? "dev" : "aguardando aprovação AdSense"})
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block", minHeight }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-ad-layout-key={layoutKey}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
};

export default AdSenseBanner;

