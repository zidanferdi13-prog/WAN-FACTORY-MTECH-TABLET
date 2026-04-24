import { useEffect, useRef } from 'react';
import { addTransactionPlant, refreshDataWeight } from '@/services/timbangan.service';
import type { WeightRealtime } from '@/types/timbangan';

interface UseWeightProcessorProps {
  weight: WeightRealtime;
  t_mo_id: string;
  enabled: boolean;
}

export function useWeightProcessor({ weight, t_mo_id, enabled }: UseWeightProcessorProps) {
  const prevCycle1 = useRef<number>(weight.cycle1);
  const prevCycle2 = useRef<number>(weight.cycle2);
  const lockRef = useRef<{ cycle1: boolean; cycle2: boolean }>({ cycle1: false, cycle2: false });
  const latestWeightRef = useRef<WeightRealtime>(weight);

  useEffect(() => {
    latestWeightRef.current = weight;
  }, [weight]);

  useEffect(() => {
    if (!enabled || !t_mo_id) return;

    // Kapur
    if (weight.cycle1 !== prevCycle1.current && weight.weight1 > 0 && !lockRef.current.cycle1) {
      lockRef.current.cycle1 = true;
      setTimeout(async () => {
        try {
          await addTransactionPlant({
            t_mo_id,
            material: 'Kapur',
            weight: latestWeightRef.current.weight1,
            cycle: weight.cycle1,
            time: new Date().toISOString(),
          });
          await refreshDataWeight(t_mo_id);
        } catch (e) {
          // handle error
        } finally {
          lockRef.current.cycle1 = false;
        }
      }, 3000);
    }
    // Semen
    if (weight.cycle2 !== prevCycle2.current && weight.weight2 > 0 && !lockRef.current.cycle2) {
      lockRef.current.cycle2 = true;
      setTimeout(async () => {
        try {
          await addTransactionPlant({
            t_mo_id,
            material: 'Semen',
            weight: latestWeightRef.current.weight2,
            cycle: weight.cycle2,
            time: new Date().toISOString(),
          });
          await refreshDataWeight(t_mo_id);
        } catch (e) {
          // handle error
        } finally {
          lockRef.current.cycle2 = false;
        }
      }, 3000);
    }
    prevCycle1.current = weight.cycle1;
    prevCycle2.current = weight.cycle2;
  }, [weight, t_mo_id, enabled]);

  return null;
}
