import { useQuery } from '@tanstack/react-query';
import { getCitizenAccessLog } from '@bsc/shared';
import { useAuth } from '../context/AuthContext';

export function useAccessLog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['access-log', user?.sub],
    queryFn:  () => getCitizenAccessLog(user!.sub),
    enabled:  !!user?.sub,
  });
}
