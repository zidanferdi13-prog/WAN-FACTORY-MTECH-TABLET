import { useRef, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { ModalOverlay } from '@/components/modal/ModalOverlay';
import { useMOStore } from '@/store/moStore';
import { useUIStore } from '@/store/uiStore';
import { nomorMO } from '@/services/apiServices';
import type { MOData } from '@/types';

interface FindOneMOItem {
  item?: string;
  qty?: number;
}

interface FindOneMOData {
  t_mo_id?: string;
  nomor_mo?: string;
  qty_plan?: number;
  produk_rm?: FindOneMOItem[];
}

interface FindOneMOResponse {
  respone_code?: number;
  respone_desc?: string;
  data?: FindOneMOData;
}

function mapFindOneMOToMOData(response: unknown): MOData | null {
  // Support both legacy payloads and the new `detail` payload shape.
  const payload = response as any;
  const source = payload?.data ?? payload;
  if (!source) return null;

  // Extract common fields
  const nomor_mo = source.nomor_mo ?? source.nomor ?? source.product_name ?? null;
  if (!nomor_mo) return null;

  const t_mo_id = source.t_mo_id ?? source.premix_temp_id ?? null;
  const qtyPlan = Number(source.qty_plan ?? source.qty ?? source.qty_plan_total ?? 0) || 0;

  // Normalise detail array (new payload: `detail`, legacy: `produk_rm`)
  const rawItems = Array.isArray(source.detail)
    ? source.detail
    : Array.isArray(source.produk_rm)
    ? source.produk_rm
    : [];

  const mappedItems = rawItems.map((it: any) => {
    return {
      name: String(it.product_nrm ?? it.item ?? it.name ?? '-'),
      qty: Number(it.qty_plan ?? it.qty ?? it.qty_actual ?? 0) || 0,
    };
  });

  // Prefer only kapur/semen items if present
  const filtered = mappedItems.filter((it: any) => {
    const n = String(it.name ?? '').toLowerCase();
    return n.includes('kapur') || n.includes('semen');
  });
  const produkRM = filtered.length > 0 ? filtered : mappedItems;

  const total_rm = produkRM.length;
  const produk_rm_items = produkRM.map((it: any) => it.name);
  const produk_rm_qty = produkRM.map((it: any) => Number(it.qty) || 0);

  const target_weights = produkRM.map((it: any) => {
    const totalQty = Number(it.qty) || 0;
    const perLotTarget = qtyPlan > 0 ? totalQty / qtyPlan : 0;
    return String(perLotTarget);
  });

  return {
    t_mo_id,
    nomor_mo,
    qty_plan: qtyPlan,
    total_rm,
    produk_rm_items,
    produk_rm_qty,
    target_weights,
    lot: qtyPlan,
  } as MOData;
}

export function MOInputModal() {
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = useUIStore((s) => s.openModals.has('moInput'));
  const closeModal = useUIStore((s) => s.closeModal);
  const openModal = useUIStore((s) => s.openModal);
  const showToast = useUIStore((s) => s.showToast);
  const setActiveMO = useMOStore((s) => s.setActiveMO);
  const setWeightAboveZero = useMOStore((s) => s.setWeightAboveZero);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 60);
  }, [isOpen]);

  const handleSubmit = async () => {
    const value = inputRef.current?.value.trim() ?? '';
    if (!value) return;

    setActiveMO(value);

    try {
      const response = await nomorMO(value);
      const mappedData = mapFindOneMOToMOData(response);

      if (!mappedData) {
        throw new Error('Format data MO tidak valid');
      }

      setActiveMO(mappedData.nomor_mo);
      window.__tempMOData = mappedData;
      closeModal('moInput');
      openModal('moConfirm');

      if (inputRef.current) inputRef.current.value = '';
    } catch {
      showToast({
        type: 'error',
        title: 'MO Tidak Ditemukan',
        message: 'Periksa nomor MO lalu coba lagi',
        duration: 3500,
      });
    }
  };

  const handleCancel = () => {
    closeModal('moInput');
    if (inputRef.current) inputRef.current.value = '';
    setWeightAboveZero(false);
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleCancel}>
      <div className="dialog w-full max-w-md bg-bg-card border border-b-card rounded-xl shadow-2xl overflow-hidden">
        {/* Head */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-b-card">
          <div className="text-3xl mb-2"><ClipboardList className="mx-auto text-c-blue" size={32} /></div>
          <h2 className="text-lg font-bold text-t-primary">Input Nomor MO</h2>
          <p className="text-sm text-t-secondary mt-1">
            Masukkan nomor Manufacturing Order untuk memulai penimbangan
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-xs font-semibold text-t-secondary uppercase tracking-widest mb-2">
            Nomor MO
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder="Contoh: WAN/MO/26/1234"
            maxLength={50}
            autoComplete="off"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-elevated border border-b-card text-t-primary
                       placeholder-t-muted font-mono text-sm
                       focus:outline-none focus:border-c-blue focus:ring-1 focus:ring-c-blue
                       transition-colors duration-150"
          />
        </div>

        {/* Foot */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-5 py-2 rounded-lg border border-b-card text-t-secondary text-sm font-medium
                       hover:bg-bg-elevated transition-colors duration-150"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-c-blue text-white text-sm font-semibold
                       hover:bg-c-blue-bright hover:shadow-glow-blue transition-all duration-150"
          >
            Mulai
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
