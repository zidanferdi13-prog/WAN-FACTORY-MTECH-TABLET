import { useState, useCallback, useEffect } from 'react';
import { CircleAlert, Printer, RefreshCcw } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useRealtimeWeight } from '@/hooks/useRealtimeWeight';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { MOInputModal } from '@/components/mo/MOInputModal';
import { MOConfirmModal } from '@/components/mo/MOConfirmModal';
import { ConfirmResetModal } from '@/components/modal/ConfirmResetModal';
import { OverloadAlertModal } from '@/components/modal/OverloadAlertModal';
import { LotCompleteToast } from '@/components/modal/LotCompleteToast';
import { CompletionModal } from '@/components/modal/CompletionModal';
import { MOHistoryList } from '@/components/dashboard/MOHistoryList';
import { MOTransactionTable } from '@/components/dashboard/MOTransactionTable';
import { MOHistoryDetailModal } from '@/components/dashboard/MOHistoryDetailModal';
import { findOneWeight, resetDataWeight } from '@/services/apiServices';
import { useMOStore } from '@/store/moStore';
import { useScaleStore } from '@/store/scaleStore';
import { useUIStore } from '@/store/uiStore';
import { confirmLane } from '@/utils/confirmFlow';
import {
  adaptFindOneWeightResponse,
  type MOTransactionDetail,
} from '@/utils/moHistoryAdapter';

const DETAIL_REFRESH_MS = 4000;

/**
 * Root page that bootstraps all runtime hooks and composes the full dashboard.
 */
export function DashboardPage() {
  useSocket();
  useRealtimeWeight();

  const moData = useMOStore((s) => s.moData);
  const resetMO = useMOStore((s) => s.resetMO);
  const small = useScaleStore((s) => s.small);
  const large = useScaleStore((s) => s.large);
  const resetScale = useScaleStore((s) => s.resetAll);
  const showToast = useUIStore((s) => s.showToast);

  const [selectedMOId, setSelectedMOId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MOTransactionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [reloadHistoryToken, setReloadHistoryToken] = useState(0);
  const [actionLoading, setActionLoading] = useState<'none' | 'refresh' | 'reset' | 'confirm'>('none');

  const loadHistoryDetail = useCallback(async (tMoId: string, openModal = false) => {
    setDetailLoading(true);
    try {
      const response = await findOneWeight(tMoId);
      const adapted = adaptFindOneWeightResponse(tMoId, response);
      setSelectedDetail(adapted);
      if (openModal) setIsHistoryModalOpen(true);
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleHistorySelect = useCallback((t_mo_id: string) => {
    setSelectedMOId(t_mo_id);
    void loadHistoryDetail(t_mo_id, true);
  }, [loadHistoryDetail]);

  useEffect(() => {
    const activeMoId = moData?.t_mo_id;
    if (!activeMoId) return;

    setSelectedMOId(activeMoId);
    void loadHistoryDetail(activeMoId, false);
  }, [moData?.t_mo_id, loadHistoryDetail]);

  useEffect(() => {
    if (!selectedMOId) return;

    const timer = window.setInterval(() => {
      void loadHistoryDetail(selectedMOId, false);
    }, DETAIL_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [selectedMOId, loadHistoryDetail]);

  const handleRefreshMO = async () => {
    setActionLoading('refresh');
    setReloadHistoryToken((v) => v + 1);
    if (selectedMOId) {
      await loadHistoryDetail(selectedMOId, false);
    }
    setActionLoading('none');
  };

  const handleResetAll = async () => {
    const tMoId = moData?.t_mo_id ?? selectedMOId;
    if (!tMoId) {
      showToast({ type: 'warning', title: 'Belum Ada MO Aktif', message: 'Tidak ada MO untuk di-reset', duration: 2500 });
      return;
    }

    setActionLoading('reset');
    try {
      await resetDataWeight(tMoId);
      resetMO();
      resetScale();
      setSelectedMOId(null);
      setSelectedDetail(null);
      setReloadHistoryToken((v) => v + 1);
      showToast({ type: 'success', title: 'Reset Berhasil', message: 'Data timbang sudah direset', duration: 2500 });
    } catch {
      showToast({ type: 'error', title: 'Reset Gagal', message: 'Coba lagi beberapa saat', duration: 3000 });
    } finally {
      setActionLoading('none');
    }
  };

  const handleGlobalConfirm = () => {
    setActionLoading('confirm');

    const didSmall = confirmLane({
      scale: 'small',
      weight: small.weight,
      target: small.target,
      source: 'manual',
    });

    const didLarge = confirmLane({
      scale: 'large',
      weight: large.weight,
      target: large.target,
      source: 'manual',
    });

    if (!didSmall && !didLarge) {
      showToast({
        type: 'warning',
        title: 'Belum Bisa Confirm',
        message: 'Pastikan MO aktif dan target FW1/FW2 sudah tersedia',
        duration: 3000,
      });
    }

    setTimeout(() => setActionLoading('none'), 300);
  };

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <DashboardScreen />
        </div>

        <div className="border-t border-b-card bg-bg-elevated px-4 py-3">
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              onClick={handleRefreshMO}
              disabled={actionLoading !== 'none'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw size={14} /> REFRESH MO
            </button>
            <button
              onClick={handleResetAll}
              disabled={actionLoading !== 'none'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CircleAlert size={14} /> RESET ALL
            </button>
            <button
              onClick={handleGlobalConfirm}
              disabled={actionLoading !== 'none'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-c-blue px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-c-blue-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer size={14} /> CONFIRM
            </button>
          </div>

          <MOHistoryList
            onSelect={handleHistorySelect}
            selectedId={selectedMOId ?? undefined}
            reloadToken={reloadHistoryToken}
          />

          <div className="mt-3">
            <MOTransactionTable
              rows={selectedDetail?.rows ?? []}
              loading={detailLoading}
              emptyText="Pilih MO pada riwayat untuk menampilkan transaksi produk secara live."
            />
          </div>
        </div>
      </div>

      <MOHistoryDetailModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        detail={selectedDetail}
        loading={detailLoading}
      />

      <MOInputModal />
      <MOConfirmModal />
      <ConfirmResetModal />
      <OverloadAlertModal />
      <LotCompleteToast />
      <CompletionModal />
    </MainLayout>
  );
}
