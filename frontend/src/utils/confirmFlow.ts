import {
  useMOStore,
  selectMaterialForScaleFixed,
  selectMaterialIndexForScaleFixed,
} from '@/store/moStore';
import { useUIStore } from '@/store/uiStore';
import { findOneWeight, endProcesWeight } from '@/services/apiServices';
import { buildThermalReceipt } from '@/utils/receiptBuilder';
import { PRINT_URL } from '@/utils/config';
import { adaptFindOneWeightResponse } from '@/utils/moHistoryAdapter';
import type { ScaleType } from '@/types';

interface ConfirmLaneInput {
  scale: ScaleType;
  weight: number;
  target: number;
  source: 'manual' | 'auto';
}

function maybeCompleteMO() {
  const st = useMOStore.getState();
  if (!st.activeMO || !st.moData || st.completionSent) return;

  const smallExists = !!selectMaterialForScaleFixed(st, 'small');
  const largeExists = !!selectMaterialForScaleFixed(st, 'large');
  const smallDone = !smallExists || st.confirmedByScale.small;
  const largeDone = !largeExists || st.confirmedByScale.large;

  if (!smallDone || !largeDone) return;

  st.setCompletionSent(true);
  void (async () => {
    try {
      const tMoId = st.moData?.t_mo_id;
      if (tMoId) {
        await endProcesWeight(tMoId);
        const detailResponse = await findOneWeight(tMoId);
        const detail = adaptFindOneWeightResponse(tMoId, detailResponse);

        const totalSemen = detail.rows
          .filter((row) => row.product.toLowerCase().includes('semen'))
          .reduce((sum, row) => sum + row.actual, 0);
        const totalKapur = detail.rows
          .filter((row) => row.product.toLowerCase().includes('kapur'))
          .reduce((sum, row) => sum + row.actual, 0);
        const seqSemen = detail.rows.filter((row) => row.product.toLowerCase().includes('semen')).length;
        const seqKapur = detail.rows.filter((row) => row.product.toLowerCase().includes('kapur')).length;

        const receiptHtml = buildThermalReceipt({
          nomor_mo: detail.nomor_mo,
          products: detail.rows.map((row) => ({
            name: row.product,
            qty: row.standard,
            weight: row.actual,
            time: row.time ?? '',
            seq: row.sequence,
          })),
          totalSemen,
          totalKapur,
          seqSemen,
          seqKapur,
          printDate: new Date().toLocaleString('id-ID'),
        });

        await fetch(PRINT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: receiptHtml }),
        });
      }
    } catch {
      useUIStore.getState().showToast({
        type: 'warning',
        title: 'Print Summary Gagal',
        message: 'Data selesai diproses, namun printer tidak merespon',
        duration: 3500,
      });
    } finally {
      useUIStore.getState().openModal('completion');
    }
  })();
}

export function confirmLane({ scale, weight, target, source }: ConfirmLaneInput): boolean {
  const st = useMOStore.getState();
  if (!st.activeMO || !st.moData) return false;

  const laneMaterial = selectMaterialForScaleFixed(st, scale);
  if (!laneMaterial || target <= 0 || st.confirmedByScale[scale]) return false;

  selectMaterialIndexForScaleFixed(st, scale);

  st.markScaleConfirmed(scale, true);
  maybeCompleteMO();

  return true;
}
