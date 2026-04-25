import { useQuery } from '@tanstack/react-query';
import { getCitizenFinancialAssets } from '@bsc/shared';
import { useAuth } from '../context/AuthContext';

export function useFinancialAssets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['financial-assets', user?.sub],
    queryFn:  () => getCitizenFinancialAssets(user!.sub),
    enabled:  !!user?.sub,
  });
}
