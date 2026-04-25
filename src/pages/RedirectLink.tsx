import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/track-link-click`;

export default function RedirectLink() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (!slug) {
      window.location.replace('/');
      return;
    }
    window.location.replace(`${FN_URL}?slug=${encodeURIComponent(slug)}`);
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
      Redirecionando...
    </div>
  );
}
