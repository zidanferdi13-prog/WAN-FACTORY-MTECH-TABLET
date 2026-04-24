import { useEffect, useCallback, useRef } from 'react';
import { useMOStore, selectMaterialForScaleFixed } from '@/store/moStore';
import { useScaleStore } from '@/store/scaleStore';
import { useUIStore } from '@/store/uiStore';
import { shouldAutoConfirm } from '@/utils/scaleUtils';
import { WEIGHT_WS_URL } from '@/utils/config';
import { confirmLane } from '@/utils/confirmFlow';
import type { ScaleType } from '@/types';

interface WeightWsPayload {
  GW1?: number;
  GW2?: number;
  FW1?: number;
  FW2?: number;
  timestamp?: string;
}

const STABLE_DELAY_MS = 3000;

function getScaleTargetFromState(scale: ScaleType): number {
  const targetFromWs = useScaleStore.getState()[scale].target;
  if (targetFromWs > 0) return targetFromWs;

  const laneState = useMOStore.getState();
  const laneMaterial = selectMaterialForScaleFixed(laneState, scale);
  return laneMaterial?.targetWeight ?? 0;
}

export function useRealtimeWeight() {
  const stableTimersRef = useRef<Record<ScaleType, ReturnType<typeof setTimeout> | null>>({
    small: null,
    large: null,
  });

  const lastRoundedWeightRef = useRef<Record<ScaleType, number | null>>({
    small: null,
    large: null,
  });

  const lastRoundedTargetRef = useRef<Record<ScaleType, number | null>>({
    small: null,
    large: null,
  });

  const processScaleWeight = useCallback((scale: ScaleType, weight: number, stable: boolean, timestamp: string, allowAutoConfirm: boolean) => {
    const scaleActions = useScaleStore.getState();
    const uiActions = useUIStore.getState();

    scaleActions.setWeight(scale, weight, stable, timestamp);

    const { weightAboveZero, activeMO, setWeightAboveZero } = useMOStore.getState();
    if (weight > 0 && !weightAboveZero && !activeMO) {
      setWeightAboveZero(true);
      uiActions.openModal('moInput');
    } else if (weight === 0) {
      setWeightAboveZero(false);
      scaleActions.setOverload(scale, false);
      uiActions.closeModal('overload');
    }

    const target = getScaleTargetFromState(scale);
    const scaleState = useScaleStore.getState()[scale];

    if (target > 0) {
      if (weight > target && !scaleState.overloadShown) {
        scaleActions.setOverload(scale, true);
        uiActions.setOverloadInfo(weight, target);
        uiActions.openModal('overload');
      } else if (weight <= target && scaleState.overloadShown) {
        scaleActions.setOverload(scale, false);
        uiActions.closeModal('overload');
      }
    }

    if (!allowAutoConfirm) return;

    const laneState = useMOStore.getState();
    const laneMaterial = selectMaterialForScaleFixed(laneState, scale);
    const { moData, autoConfirmActive, confirmedByScale } = laneState;

    if (
      moData &&
      laneMaterial &&
      stable &&
      !autoConfirmActive &&
      !confirmedByScale[scale] &&
      target > 0 &&
      shouldAutoConfirm(weight, target, stable)
    ) {
      confirmLane({ scale, weight, target, source: 'auto' });
    }
  }, []);

  useEffect(() => {
    let isUnmounting = false;
    const ws = new WebSocket(WEIGHT_WS_URL);

    const scheduleStableCheck = (scale: ScaleType, roundedWeight: number) => {
      if (stableTimersRef.current[scale]) {
        clearTimeout(stableTimersRef.current[scale]!);
      }

      stableTimersRef.current[scale] = setTimeout(() => {
        if (isUnmounting) return;
        if (lastRoundedWeightRef.current[scale] !== roundedWeight) return;

        const currentWeight = useScaleStore.getState()[scale].weight;
        processScaleWeight(scale, currentWeight, true, new Date().toISOString(), true);
      }, STABLE_DELAY_MS);
    };

    ws.onopen = () => {
      if (isUnmounting) return;
      const actions = useScaleStore.getState();
      actions.setConnection('small', true);
      actions.setConnection('large', true);
    };

    ws.onclose = () => {
      if (isUnmounting) return;
      const actions = useScaleStore.getState();
      actions.setConnection('small', false);
      actions.setConnection('large', false);
    };

    ws.onerror = () => {
      if (isUnmounting) return;
      const actions = useScaleStore.getState();
      actions.setConnection('small', false);
      actions.setConnection('large', false);
    };

    ws.onmessage = (event) => {
      let data: WeightWsPayload;

      try {
        data = JSON.parse(event.data) as WeightWsPayload;
      } catch {
        return;
      }

      const scaleActions = useScaleStore.getState();
      const fw1 = Number(data.FW1);
      const fw2 = Number(data.FW2);

      if (Number.isFinite(fw1)) {
        scaleActions.setTarget('small', fw1);
      }
      if (Number.isFinite(fw2)) {
        scaleActions.setTarget('large', fw2);
      }

      const timestamp = data.timestamp ?? new Date().toISOString();
      const incoming: Array<{ scale: ScaleType; weight: number; target: number }> = [
        { scale: 'small', weight: Number(data.GW1), target: Number.isFinite(fw1) ? fw1 : getScaleTargetFromState('small') },
        { scale: 'large', weight: Number(data.GW2), target: Number.isFinite(fw2) ? fw2 : getScaleTargetFromState('large') },
      ];

      for (const item of incoming) {
        if (!Number.isFinite(item.weight)) continue;

        const roundedWeight = Math.round(item.weight * 100) / 100;
        const roundedTarget = Math.round(item.target * 100) / 100;
        const prevRoundedWeight = lastRoundedWeightRef.current[item.scale];
        const prevRoundedTarget = lastRoundedTargetRef.current[item.scale];

        const hasWeightChanged = prevRoundedWeight === null || prevRoundedWeight !== roundedWeight;
        const hasTargetChanged = prevRoundedTarget === null || prevRoundedTarget !== roundedTarget;

        if (hasWeightChanged || hasTargetChanged) {
          lastRoundedWeightRef.current[item.scale] = roundedWeight;
          lastRoundedTargetRef.current[item.scale] = roundedTarget;
          processScaleWeight(item.scale, item.weight, false, timestamp, false);

          if (hasWeightChanged) {
            scheduleStableCheck(item.scale, roundedWeight);
          }
        }
      }
    };

    return () => {
      isUnmounting = true;
      ws.close();

      if (stableTimersRef.current.small) {
        clearTimeout(stableTimersRef.current.small);
        stableTimersRef.current.small = null;
      }

      if (stableTimersRef.current.large) {
        clearTimeout(stableTimersRef.current.large);
        stableTimersRef.current.large = null;
      }
    };
  }, [processScaleWeight]);
}
