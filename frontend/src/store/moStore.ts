import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MOData, Material, ScaleType } from '@/types';
import { getScaleForWeight } from '@/utils/scaleUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AdvanceResult = 'next_rm' | 'complete';

interface MOStoreState {
  // ── State ──────────────────────────────────────────────────────────────────
  activeMO:          string | null;
  moData:            MOData | null;
  materials:         Material[];
  currentRMIndex:    number;
  currentLot:        number;
  totalLot:          number;
  autoConfirmActive: boolean;
  weightAboveZero:   boolean;
  confirmedByScale:  Record<ScaleType, boolean>;
  completionSent:    boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setActiveMO:           (mo: string) => void;
  confirmMOData:         (data: MOData) => void;
  resetMO:               () => void;
  /** Advance to the next RM (or lot, or signal completion) */
  advanceRM:             () => AdvanceResult;
  setAutoConfirmActive:  (active: boolean) => void;
  setWeightAboveZero:    (above: boolean) => void;
  markScaleConfirmed:    (scale: ScaleType, confirmed: boolean) => void;
  setCompletionSent:     (sent: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useMOStore = create<MOStoreState>()(
  devtools(
    (set, get) => ({
      activeMO:          null,
      moData:            null,
      materials:         [],
      currentRMIndex:    0,
      currentLot:        0,
      totalLot:          0,
      autoConfirmActive: false,
      weightAboveZero:   false,
      confirmedByScale:  { small: false, large: false },
      completionSent:    false,

      setActiveMO: (mo) => set({ activeMO: mo }),

      confirmMOData: (data) => {
        const materials: Material[] = data.produk_rm_items.map((name, i) => {
          const tw = parseFloat(data.target_weights[i]) || 0;
          return {
            name,
            targetWeight: tw,
            quantity:     data.produk_rm_qty[i] ?? 1,
            scaleType:    getScaleForWeight(tw),
          };
        });

        set({
          moData:         data,
          materials,
          currentRMIndex: 0,
          currentLot:     data.qty_plan ?? 0,
          totalLot:       data.qty_plan,
          confirmedByScale: { small: false, large: false },
          completionSent: false,
        });
      },

      resetMO: () =>
        set({
          activeMO:          null,
          moData:            null,
          materials:         [],
          currentRMIndex:    0,
          currentLot:        0,
          totalLot:          0,
          autoConfirmActive: false,
          weightAboveZero:   false,
          confirmedByScale:  { small: false, large: false },
          completionSent:    false,
        }),

      advanceRM: (): AdvanceResult => {
        const { currentRMIndex, materials } = get();
        const nextRM = currentRMIndex + 1;

        if (nextRM < materials.length) {
          set({ currentRMIndex: nextRM });
          return 'next_rm';
        }

        set({ currentRMIndex: 0 });
        return 'complete';
      },

      setAutoConfirmActive: (active) => set({ autoConfirmActive: active }),
      setWeightAboveZero:   (above)  => set({ weightAboveZero:  above  }),
      markScaleConfirmed:   (scale, confirmed) =>
        set((s) => ({ confirmedByScale: { ...s.confirmedByScale, [scale]: confirmed } })),
      setCompletionSent:    (sent) => set({ completionSent: sent }),
    }),
    { name: 'mo-store' },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Selectors (use these in components to avoid unnecessary re-renders)
// ─────────────────────────────────────────────────────────────────────────────

/** Current active material (or null when MO not loaded) */
export const selectCurrentMaterial = (s: MOStoreState): Material | null =>
  s.materials[s.currentRMIndex] ?? null;

/** Which scale the current RM should use */
export const selectExpectedScale = (s: MOStoreState): ScaleType => {
  const mat = s.materials[s.currentRMIndex];
  return mat ? getScaleForWeight(mat.targetWeight) : 'small';
};

function isKapur(name: string): boolean {
  return name.toLowerCase().includes('kapur');
}

function isSemen(name: string): boolean {
  return name.toLowerCase().includes('semen');
}

/** Fixed lane mapping: small=Kapur, large=Semen */
export const selectMaterialForScaleFixed = (
  s: MOStoreState,
  scale: ScaleType,
): Material | null => {
  if (scale === 'small') {
    return (
      s.materials.find((m) => isKapur(m.name)) ??
      s.materials.find((m) => m.scaleType === 'small') ??
      null
    );
  }

  return (
    s.materials.find((m) => isSemen(m.name)) ??
    s.materials.find((m) => m.scaleType === 'large') ??
    null
  );
};

export const selectMaterialIndexForScaleFixed = (
  s: MOStoreState,
  scale: ScaleType,
): number => {
  if (scale === 'small') {
    const idxKapur = s.materials.findIndex((m) => isKapur(m.name));
    if (idxKapur >= 0) return idxKapur;
    const idxSmall = s.materials.findIndex((m) => m.scaleType === 'small');
    return idxSmall >= 0 ? idxSmall : 0;
  }

  const idxSemen = s.materials.findIndex((m) => isSemen(m.name));
  if (idxSemen >= 0) return idxSemen;
  const idxLarge = s.materials.findIndex((m) => m.scaleType === 'large');
  return idxLarge >= 0 ? idxLarge : 0;
};

