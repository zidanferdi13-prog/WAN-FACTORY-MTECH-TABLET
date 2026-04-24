// Types for Timbangan business logic and API

export interface MOHistoryItem {
  t_mo_id: string;
  nomor_mo: string;
  scan_date: string;
}

export interface MOActiveDetail {
  t_mo_id: string;
  nomor_mo: string;
  details: MODetailRow[];
}

export interface MODetailRow {
  id: string;
  name: string;
  qty: number;
  weight: number;
  time: string;
}

export interface WeightRealtime {
  weight1: number;
  weight2: number;
  cycle1: number;
  cycle2: number;
  weight: number;
}

export interface TransactionPlantPayload {
  t_mo_id: string;
  material: string;
  weight: number;
  cycle: number;
  time: string;
}

export interface ReceiptProductRow {
  name: string;
  qty: number;
  weight: number;
  time: string;
  seq: number;
}

export interface ReceiptData {
  nomor_mo: string;
  products: ReceiptProductRow[];
  totalSemen: number;
  totalKapur: number;
  seqSemen: number;
  seqKapur: number;
  printDate: string;
}
