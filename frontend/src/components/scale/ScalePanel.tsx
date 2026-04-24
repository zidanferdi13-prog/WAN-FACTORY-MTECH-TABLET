import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  useMOStore,
  selectMaterialForScaleFixed,
} from '@/store/moStore';
import { useScaleStore } from '@/store/scaleStore';
import { useUIStore } from '@/store/uiStore';
import { confirmLane } from '@/utils/confirmFlow';
import { WeightDisplay } from './WeightDisplay';
import { ProgressBar } from './ProgressBar';
import { StabilityIndicator } from './StabilityIndicator';
import type { ScaleType } from '@/types';

interface ScalePanelProps {
  scaleType: ScaleType;
}

const BADGE_LABEL = { small: 'SMALL', large: 'LARGE' } as const;
const RANGE_LABEL = { small: 'Kapur', large: 'Semen' } as const;

export const ScalePanel = memo(function ScalePanel({ scaleType }: ScalePanelProps) {
  const scaleState = useScaleStore((s) => s[scaleType]);
  const moData = useMOStore((s) => s.moData);
  const autoConfirm = useMOStore((s) => s.autoConfirmActive);
  const activeMO = useMOStore((s) => s.activeMO);
  const confirmedByScale = useMOStore((s) => s.confirmedByScale);
  const laneMaterial = useMOStore((s) => selectMaterialForScaleFixed(s, scaleType));

  const target = scaleState.target > 0 ? scaleState.target : (laneMaterial?.targetWeight ?? 0);
  const { weight, stable, lastUpdate } = scaleState;

  const handleManualConfirm = useCallback(() => {
    if (!laneMaterial || confirmedByScale[scaleType]) return;
    confirmLane({ scale: scaleType, weight, target, source: 'manual' });

    const confirmed = useUIStore.getState();
    confirmed.showToast({
      type: 'success',
      title: `Terkonfirmasi ${scaleType === 'small' ? 'Kapur' : 'Semen'}`,
      message: `${weight.toFixed(2)} / ${target.toFixed(2)} kg`,
      duration: 1800,
    });
  }, [laneMaterial, scaleType, weight, target, confirmedByScale]);

  const timestampText = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    : 'Menunggu data...';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'scale-panel relative flex flex-col gap-3 p-5 rounded-xl border-2 overflow-hidden',
        'transition-all duration-350',
        scaleType === 'small' && 'border-c-blue shadow-glow-blue shadow-inner-blue',
        scaleType === 'large' && 'border-c-purple shadow-glow-purple shadow-inner-purple',
        'bg-gradient-to-br from-white/[0.018] via-transparent to-transparent bg-bg-card',
      )}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-block px-2 py-[3px] rounded text-[10px] font-extrabold uppercase tracking-[1.5px]',
              scaleType === 'small'
                ? 'bg-c-blue-dim text-c-blue-bright'
                : 'bg-c-purple-dim text-[var(--c-purple)]',
            )}
          >
            {BADGE_LABEL[scaleType]}
          </span>
          <span className="text-xs text-t-secondary font-medium">{RANGE_LABEL[scaleType]}</span>
        </div>
        <StabilityIndicator stable={stable} />
      </div>

      <div className="text-center font-medium text-sm text-t-secondary truncate">
        {laneMaterial ? laneMaterial.name : 'Belum ada material lane ini'}
      </div>

      <div className="flex-1 flex items-center justify-center py-2">
        <WeightDisplay weight={weight} target={target} scaleType={scaleType} />
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-xs font-extrabold uppercase tracking-widest text-t-muted">TARGET</span>
        <span
          className={cn(
            'font-mono text-lg font-bold',
            scaleType === 'small' ? 'text-c-blue' : 'text-[var(--c-purple)]',
          )}
        >
          {target > 0 ? target.toFixed(2) : '--'}
        </span>
        <span className="text-sm text-t-secondary font-medium">kg</span>
      </div>

      <ProgressBar weight={weight} target={target} scaleType={scaleType} />

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-t-muted">{timestampText}</span>

        <button
          onClick={handleManualConfirm}
          disabled={!moData || !activeMO || !laneMaterial || autoConfirm || confirmedByScale[scaleType]}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-sm font-semibold',
            'transition-all duration-200',
            moData && activeMO && laneMaterial && !autoConfirm
              ? [
                scaleType === 'small'
                  ? 'border-c-blue text-c-blue bg-c-blue-dim hover:bg-c-blue hover:text-white hover:shadow-glow-blue'
                  : 'border-[var(--c-purple)] text-[var(--c-purple)] bg-c-purple-dim hover:bg-[var(--c-purple)] hover:text-white hover:shadow-glow-purple',
              ]
              : 'border-b-card text-t-muted bg-transparent cursor-not-allowed opacity-40',
          )}
        >
          <CheckCircle2 size={15} strokeWidth={2.5} />
          <span>Konfirmasi</span>
        </button>
      </div>
    </motion.section>
  );
});

