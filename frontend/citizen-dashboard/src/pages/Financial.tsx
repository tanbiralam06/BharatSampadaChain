import { Wallet } from 'lucide-react';
import { useFinancialAssets } from '../hooks/useFinancialAssets';
import {
  Card, Stat, PageSpinner, ErrorBanner, EmptyState, Badge,
  formatCrore, formatDate,
  type AssetType,
} from '@bsc/shared';

const ASSET_LABELS: Record<AssetType, string> = {
  BANK_ACCOUNT:  'Bank Account',
  MUTUAL_FUND:   'Mutual Fund',
  EPF:           'EPF',
  FD:            'Fixed Deposit',
  STOCKS:        'Stocks & Equities',
  NPS:           'NPS',
  FOREIGN_ASSET: 'Foreign Asset',
  OTHER:         'Other',
};

const BALANCE_LABELS: Record<string, string> = {
  UNDER_1L:   '< ₹1 Lakh',
  '1L_10L':   '₹1L – ₹10L',
  '10L_1CR':  '₹10L – ₹1 Cr',
  '1CR_10CR': '₹1 Cr – ₹10 Cr',
  ABOVE_10CR: '> ₹10 Cr',
};

export default function Financial() {
  const { data, isLoading, isError, refetch } = useFinancialAssets();

  if (isLoading) return <PageSpinner />;
  if (isError)   return <div className="p-8"><ErrorBanner message="Could not load financial assets." onRetry={refetch} /></div>;

  const totalApprox = (data ?? []).reduce((sum, a) => sum + (a.approximate_value ?? 0), 0);

  // Group assets by type for a cleaner layout
  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, asset) => {
    const key = asset.asset_type;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(asset);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Assets</h1>
          <p className="text-sm text-slate-400 mt-1">{data?.length ?? 0} assets on record</p>
        </div>
        {totalApprox > 0 && (
          <Card className="text-right py-4 px-5">
            <Stat label="Total Approx. Value" value={formatCrore(totalApprox)} sub="Midpoint estimate" />
          </Card>
        )}
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No financial assets found"
          description="No financial records are linked to your account yet."
          icon={<Wallet className="h-12 w-12" />}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, assets]) => (
            <div key={type}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                {ASSET_LABELS[type as AssetType] ?? type}
              </h2>
              <div className="grid gap-3">
                {assets!.map((a) => (
                  <Card key={a.asset_id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">
                            {a.institution_name ?? 'Unknown Institution'}
                          </p>
                          <Badge variant={a.verification_status === 'AGENCY_VERIFIED' ? 'green' : 'gray'}>
                            {a.verification_status === 'AGENCY_VERIFIED' ? 'Verified' : 'Self-Declared'}
                          </Badge>
                          {a.is_joint_account && (
                            <Badge variant="blue">Joint Account</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          {a.balance_range && (
                            <span>{BALANCE_LABELS[a.balance_range] ?? a.balance_range}</span>
                          )}
                          {a.as_of_date && (
                            <span>As of {formatDate(a.as_of_date)}</span>
                          )}
                          {a.source_agency && (
                            <span>Source: {a.source_agency}</span>
                          )}
                        </div>
                      </div>
                      {a.approximate_value > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-white">{formatCrore(a.approximate_value)}</p>
                          <p className="text-xs text-slate-500">Approx.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
