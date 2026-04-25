import { useQuery } from '@tanstack/react-query';
import { getCitizen } from '@bsc/shared';
import { useAuth } from '../context/AuthContext';

export function useCitizen() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['citizen', user?.sub],
    queryFn:  () => getCitizen(user!.sub),
    enabled:  !!user?.sub,
  });
}
