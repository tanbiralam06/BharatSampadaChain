import { useQuery } from '@tanstack/react-query';
import { getCitizenFlags } from '@bsc/shared';
import { useAuth } from '../context/AuthContext';

export function useFlags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['flags', user?.sub],
    queryFn:  () => getCitizenFlags(user!.sub),
    enabled:  !!user?.sub,
  });
}
