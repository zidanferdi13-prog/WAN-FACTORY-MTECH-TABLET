import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { findMoPlant } from '@/services/apiServices';
import type { MOHistoryItem } from '@/types/timbangan';
import { cn } from '@/utils/cn';

interface MOHistoryListProps {
  onSelect: (t_mo_id: string) => void;
  selectedId?: string;
  className?: string;
  reloadToken?: number;
}

export function MOHistoryList({ onSelect, selectedId, className, reloadToken = 0 }: MOHistoryListProps) {
  const [history, setHistory] = useState<MOHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = () => {
    setLoading(true);
    findMoPlant()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, [reloadToken]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-t-muted uppercase tracking-widest">
          Riwayat MO Scan
        </div>
        <button
          onClick={loadHistory}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border border-b-card px-2.5 py-1 text-[11px] font-semibold',
            'transition-colors',
            loading
              ? 'cursor-not-allowed opacity-60 text-t-muted'
              : 'text-t-secondary hover:bg-bg-elevated hover:text-t-primary',
          )}
        >
          <RotateCw size={12} className={cn(loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-b-card bg-bg-card p-3">
        {loading && <div className="text-xs text-t-muted">Memuat riwayat...</div>}

        {!loading && history.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {history.map((item) => (
              <button
                key={item.t_mo_id}
                className={cn(
                  'min-w-[230px] text-left rounded-lg border px-3 py-2.5 transition-all',
                  'bg-bg-elevated border-b-card hover:border-c-blue hover:bg-c-blue-dim',
                  selectedId === item.t_mo_id && 'border-c-blue bg-c-blue-dim',
                )}
                onClick={() => onSelect(item.t_mo_id)}
              >
                <div className="font-mono text-[15px] font-bold text-t-primary leading-tight">
                  {item.nomor_mo}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-t-muted uppercase tracking-wider">Scan Date</span>
                  <span className="text-xs text-t-secondary">{item.scan_date}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="text-xs text-t-muted">Belum ada MO yang discan hari ini.</div>
        )}
      </div>

    </div>
  );
}
