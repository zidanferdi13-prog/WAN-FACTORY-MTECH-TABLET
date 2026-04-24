import { useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useRealtimeWeight } from '@/hooks/useRealtimeWeight';
import { useMODataListener } from '@/hooks/useMODataListener';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { MOInputModal } from '@/components/mo/MOInputModal';
import { MOConfirmModal } from '@/components/mo/MOConfirmModal';
import { ConfirmResetModal } from '@/components/modal/ConfirmResetModal';
import { OverloadAlertModal } from '@/components/modal/OverloadAlertModal';
import { LotCompleteToast } from '@/components/modal/LotCompleteToast';
import { CompletionModal } from '@/components/modal/CompletionModal';
import { MOHistoryList } from '@/components/dashboard/MOHistoryList';
import { findOneWeight, resetDataWeight, endProcesWeight } from '@/services/timbangan.service';
import { buildThermalReceipt } from '@/utils/receiptBuilder';
import { PRINT_URL } from '@/utils/config';
import type { MOActiveDetail } from '@/types/timbangan';

/**
 * Root page that bootstraps all runtime hooks and composes the full dashboard.
 * All Socket.IO listeners are registered here via custom hooks.
 */
export function DashboardPage() {
  // Initialise socket connection + status listeners
  useSocket();
  useRealtimeWeight();
  useMODataListener();

  // State for MO scan and history
  const [scanInput, setScanInput] = useState('');
  const [selectedMOId, setSelectedMOId] = useState<string | null>(null);
  const [moDetail, setMoDetail] = useState<MOActiveDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  // Handler for MO scan input
  const handleScanInput = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const value = scanInput.trim();
    if (value.length <= 15) return;
    // Call nomorMO and filter
    try {
      setLoadingDetail(true);
      const data = await findOneWeight(value);
      // Filter allowed products
      const allowed = [
        'WAN Semen Abu-abu OPC Tipe I-Curah',
        'WAN Kapur 200 mesh (CaCO3) Curah',
      ];
      const filtered = {
        ...data,
        details: (data.details || []).filter((row: any) => allowed.includes(row.name)),
      };
      setMoDetail(filtered);
      setShowDetailModal(true);
    } catch (err) {
      // handle error, show toast if needed
    } finally {
      setLoadingDetail(false);
    }
  }, [scanInput]);

  // Handler for MO history click
  const handleHistorySelect = useCallback(async (t_mo_id: string) => {
    setSelectedMOId(t_mo_id);
    setLoadingDetail(true);
    try {
      const data = await findOneWeight(t_mo_id);
      setMoDetail(data);
      setShowDetailModal(true);
    } catch (err) {
      // handle error
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Handler for reset process
  const handleReset = useCallback(async () => {
    if (!moDetail?.t_mo_id) return;
    try {
      await resetDataWeight(moDetail.t_mo_id);
      setMoDetail(null);
      setShowDetailModal(false);
    } catch (err) {
      // handle error
    }
  }, [moDetail]);

  // Handler for confirm + print
  const handlePrint = useCallback(async () => {
    if (!moDetail?.t_mo_id) return;
    setPrintLoading(true);
    try {
      await endProcesWeight(moDetail.t_mo_id);
      const data = await findOneWeight(moDetail.t_mo_id);
      // Sort, remove qty 0, generate seq, calculate totals
      let products = (data.details || []).filter((row: any) => row.qty > 0);
      products = products.sort((a: any, b: any) => {
        if (a.name === b.name) return a.time.localeCompare(b.time);
        return a.name.localeCompare(b.name);
      });
      let seqSemen = 0, seqKapur = 0, totalSemen = 0, totalKapur = 0;
      products = products.map((row: any) => {
        let seq = 0;
        if (row.name.includes('Semen')) {
          seq = ++seqSemen;
          totalSemen += row.weight;
        } else if (row.name.includes('Kapur')) {
          seq = ++seqKapur;
          totalKapur += row.weight;
        }
        return { ...row, seq };
      });
      const receipt = buildThermalReceipt({
        nomor_mo: data.nomor_mo,
        products,
        totalSemen,
        totalKapur,
        seqSemen,
        seqKapur,
        printDate: new Date().toLocaleString('id-ID'),
      });
      // Send print request
      await fetch(PRINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: receipt }),
      });
      setMoDetail(null);
      setShowDetailModal(false);
    } catch (err) {
      // handle error
    } finally {
      setPrintLoading(false);
    }
  }, [moDetail]);

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row h-full">
        {/* Main dashboard area */}
        <div className="flex-1">
          <DashboardScreen />
        </div>
        {/* MO scan + history BOTTOMBAR */}
        <div className="w-full md:w-80 bg-bg-elevated border-t border-b-card p-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-t-muted uppercase mb-1">Scan Nomor MO</label>
            <input
              type="text"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={handleScanInput}
              placeholder="Scan/masukkan nomor MO..."
              className="w-full px-3 py-2 rounded-lg border border-b-card bg-bg-card text-t-primary font-mono text-sm focus:outline-none focus:border-c-blue focus:ring-1 focus:ring-c-blue"
            />
          </div>
          <MOHistoryList onSelect={handleHistorySelect} selectedId={selectedMOId ?? undefined} />
        </div>
      </div>

      {/* MO Detail Modal */}
      {showDetailModal && moDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
            <button className="absolute top-3 right-3 text-t-muted hover:text-c-red" onClick={() => setShowDetailModal(false)}>&times;</button>
            <div className="mb-4">
              <div className="font-bold text-lg mb-1">Detail MO</div>
              <div className="font-mono text-base">{moDetail.nomor_mo}</div>
            </div>
            <div className="mb-4 max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-t-muted">
                    <th className="text-left">Produk</th>
                    <th>Qty</th>
                    <th>Berat</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {moDetail.details?.map(row => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td className="text-center">{row.qty}</td>
                      <td className="text-right">{row.weight}</td>
                      <td className="text-right">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button
                className="px-4 py-2 rounded-lg border border-b-card text-t-secondary text-sm font-medium hover:bg-bg-elevated"
                onClick={handleReset}
                disabled={loadingDetail}
              >Reset</button>
              <button
                className="px-4 py-2 rounded-lg bg-c-blue text-white text-sm font-semibold hover:bg-c-blue-bright hover:shadow-glow-blue"
                onClick={handlePrint}
                disabled={printLoading}
              >{printLoading ? 'Mencetak...' : 'Konfirmasi & Print'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals & Toasts ───────────────────────────────────────────────── */}
      <MOInputModal />
      <MOConfirmModal />
      <ConfirmResetModal />
      <OverloadAlertModal />
      <LotCompleteToast />
      <CompletionModal />
    </MainLayout>
  );
}
