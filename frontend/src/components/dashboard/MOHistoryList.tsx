import { useEffect, useState } from 'react';
import { findMoPlant, findOneWeight } from '@/services/timbangan.service';
import type { MOHistoryItem } from '@/types/timbangan';
import { cn } from '@/utils/cn';

interface MOHistoryListProps {
  onSelect: (t_mo_id: string) => void;
  selectedId?: string;
}

export function MOHistoryList({ onSelect, selectedId }: MOHistoryListProps) {
  const [history, setHistory] = useState<MOHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    findMoPlant()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="text-xs font-bold text-t-muted uppercase mb-1">MO Hari Ini</div>
      {loading && <div className="text-xs text-t-muted">Memuat...</div>}
      {history.map((item) => (
        <button
          key={item.t_mo_id}
          className={cn(
            'w-full text-left px-4 py-2 rounded-lg border border-b-card bg-bg-elevated hover:bg-c-blue-dim transition-all',
            selectedId === item.t_mo_id && 'border-c-blue bg-c-blue-dim text-c-blue-bright',
          )}
          onClick={() => onSelect(item.t_mo_id)}
        >
          <div className="font-mono text-sm font-semibold">{item.nomor_mo}</div>
          <div className="text-xs text-t-muted">{item.scan_date}</div>
        </button>
      ))}
      {!loading && history.length === 0 && (
        <div className="text-xs text-t-muted">Belum ada MO hari ini.</div>
      )}
    </div>
  );
}
