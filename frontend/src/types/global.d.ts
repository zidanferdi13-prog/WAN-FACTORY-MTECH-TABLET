import type { MOData } from '@/types';

declare global {
  interface Window {
    __tempMOData?: MOData;
  }
}

export {};
