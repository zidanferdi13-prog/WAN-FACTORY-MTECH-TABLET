import { ModalOverlay } from '@/components/modal/ModalOverlay';
import { MOTransactionTable } from './MOTransactionTable';
import type { MOTransactionDetail } from '@/utils/moHistoryAdapter';

interface MOHistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: MOTransactionDetail | null;
  loading?: boolean;
}

export function MOHistoryDetailModal({
  isOpen,
  onClose,
  detail,
  loading = false,
}: MOHistoryDetailModalProps) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="dialog w-full max-w-4xl rounded-xl border border-b-card bg-bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-b-card px-6 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-t-muted">
              Detail Riwayat MO
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-t-primary">
              {detail?.nomor_mo ?? '-'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-b-card px-3 py-1 text-xs font-semibold text-t-secondary transition-colors hover:bg-bg-elevated hover:text-t-primary"
          >
            Tutup
          </button>
        </div>

        <div className="px-6 py-4">
          <MOTransactionTable
            rows={detail?.rows ?? []}
            loading={loading}
            emptyText="Belum ada transaksi untuk MO ini."
            className="border-none bg-transparent p-0"
          />
        </div>
      </div>
    </ModalOverlay>
  );
}
