import { cn } from '@/utils/cn';
import type { MOTransactionRow } from '@/utils/moHistoryAdapter';

interface MOTransactionTableProps {
  rows: MOTransactionRow[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function MOTransactionTable({
  rows,
  loading = false,
  emptyText = 'Pilih MO dari riwayat untuk melihat detail.',
  className,
}: MOTransactionTableProps) {
  return (
    <div className={cn('rounded-xl border border-b-card bg-bg-card p-3', className)}>
      <div className="grid grid-cols-4 rounded-lg border border-b-card bg-bg-elevated px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-t-muted">
        <span>Product</span>
        <span className="text-center">Standard</span>
        <span className="text-center">Actual</span>
        <span className="text-right">Sequence</span>
      </div>

      <div className="mt-2 max-h-56 overflow-y-auto">
        {loading && <div className="px-1 py-2 text-xs text-t-muted">Memuat detail...</div>}

        {!loading && rows.length === 0 && (
          <div className="px-1 py-2 text-xs text-t-muted">{emptyText}</div>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-1">
            {rows.map((row) => (
              <div
                key={`${row.id}-${row.sequence}`}
                className="grid grid-cols-4 items-center rounded-md border border-b-card/70 bg-bg-elevated px-3 py-2 text-xs text-t-primary"
              >
                <span className="truncate pr-2" title={row.product}>{row.product}</span>
                <span className="text-center font-mono">{row.standard.toFixed(2)}</span>
                <span className="text-center font-mono font-semibold">{row.actual.toFixed(2)}</span>
                <span className="text-right font-mono">{row.sequence}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
