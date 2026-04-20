import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin',
      });
      if (error) throw error;
      return data === true;
    },
  });
  return { isAdmin: !!data, loading: isLoading };
}
