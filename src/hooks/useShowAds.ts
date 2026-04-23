import { useAuth } from '@/context/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/**
 * Regra centralizada para decidir quando exibir anúncios.
 * - Admin nunca vê ads.
 * - Enquanto auth/admin estão carregando, não mostra (evita flash).
 */
export function useShowAds() {
  const { loading: authLoading, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (authLoading || adminLoading) return false;
  if (!user) return false;
  if (isAdmin) return false;
  return true;
}
