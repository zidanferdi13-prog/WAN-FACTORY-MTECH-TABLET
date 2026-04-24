import { useEffect, useRef } from 'react';
import { socketService } from '@/services/socket';
import type { WeightRealtime } from '@/types/timbangan';

export function useScaleSocket(onData: (data: WeightRealtime) => void) {
  const handlerRef = useRef(onData);

  useEffect(() => {
    handlerRef.current = onData;
  }, [onData]);

  useEffect(() => {
    const socket = socketService.connect();
    function handleWeight(data: any) {
      handlerRef.current(data as WeightRealtime);
    }
    socket.on('weightData', handleWeight);
    return () => {
      socket.off('weightData', handleWeight);
    };
  }, []);
}
