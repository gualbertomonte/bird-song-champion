import { useEffect, useRef } from "react";

// ... global

export default function AdSenseBanner({ slot, format = "fluid", responsive = true, className = "" }) {
  const pushed = useRef(false);
  const scriptLoaded = useRef(false);
  const isDev = import.meta.env.DEV;
  const isPlaceholder = PUBLISHER_ID.includes("PENDING") || slot.includes("PENDING");

  // Carrega o script do AdSense uma única vez
  useEffect(() => {
    if (scriptLoaded.current || isDev || isPlaceholder) return;
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      scriptLoaded.current = true;
    };
    document.head.appendChild(script);
  }, [isDev, isPlaceholder]);

  // Faz o push após o script carregado e o elemento existir no DOM
  useEffect(() => {
    if (isDev || isPlaceholder || !scriptLoaded.current || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.warn("[AdSense] push failed", e);
    }
  }, [isDev, isPlaceholder, scriptLoaded.current]);

  // ... placeholder e retorno do ins
}
