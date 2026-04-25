import { useQuery } from '@tanstack/react-query';
import { getCitizenProperties } from '@bsc/shared';
import { useAuth } from '../context/AuthContext';

export function useProperties() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['properties', user?.sub],
    queryFn:  () => getCitizenProperties(user!.sub),
    enabled:  !!user?.sub,
  });
}
