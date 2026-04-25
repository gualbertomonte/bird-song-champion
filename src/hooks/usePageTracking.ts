import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const SESSION_KEY = 'mpp_session_id';
const UTM_KEY = 'mpp_utm';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectDevice(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

interface UTM {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

function captureUTM(): UTM {
  const params = new URLSearchParams(window.location.search);
  const utm: UTM = {};
  const src = params.get('utm_source');
  const med = params.get('utm_medium');
  const cmp = params.get('utm_campaign');
  if (src) utm.utm_source = src;
  if (med) utm.utm_medium = med;
  if (cmp) utm.utm_campaign = cmp;
  // Persiste UTM da primeira visita pra atribuir páginas seguintes
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    return utm;
  }
  try {
    const stored = sessionStorage.getItem(UTM_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    // Evita duplicatas (StrictMode / re-render rápido)
    const key = location.pathname + location.search;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const utm = captureUTM();
    const payload = {
      path: location.pathname,
      referrer: document.referrer || undefined,
      device_type: detectDevice(),
      session_id: getSessionId(),
      user_id: user?.id || null,
      ...utm,
    };

    // Fire and forget — não bloqueia render nem dá erro visível
    supabase.functions.invoke('track-pageview', { body: payload }).catch(() => {});
  }, [location.pathname, location.search, user?.id]);
}
