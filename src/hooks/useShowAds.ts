import { useAuth } from '@/context/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/**
 * Regra centralizada para decidir quando exibir anúncios.
 * - Admin (confirmado) nunca vê ads.
 * - Erro/atraso na checagem de admin NÃO esconde anúncio para usuário comum.
 * - Apenas exige que auth tenha terminado de carregar e exista usuário logado.
 */
export function useShowAds() {
  const { loading: authLoading, user } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError } = useIsAdmin();

  if (authLoading) return false;
  if (!user) return false;
  // Se a checagem de admin ainda está carregando E não houve erro, espera.
  if (adminLoading && !adminError) return false;
  // Apenas oculta se confirmadamente é admin.
  if (isAdmin) return false;
  return true;
}
