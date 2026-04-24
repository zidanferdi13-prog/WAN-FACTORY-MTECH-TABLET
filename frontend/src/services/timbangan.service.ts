import axios from 'axios';
import type {
  MOHistoryItem,
  MOActiveDetail,
  TransactionPlantPayload,
  ReceiptData,
} from '@/types/timbangan';

const API_BASE = '/api/timbangan';

export async function nomorMO(nomor_mo: string) {
  try {
    const res = await axios.get(`${API_BASE}/nomorMO/${nomor_mo}`);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function addTransactionPlant(payload: TransactionPlantPayload) {
  try {
    const res = await axios.post(`${API_BASE}/addTransactionPlant`, payload);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function refreshDataWeight(t_mo_id: string) {
  try {
    const res = await axios.get(`${API_BASE}/refreshDataWeight/${t_mo_id}`);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function resetDataWeight(t_mo_id: string) {
  try {
    const res = await axios.post(`${API_BASE}/resetDataWeight`, { t_mo_id });
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function endProcesWeight(t_mo_id: string) {
  try {
    const res = await axios.post(`${API_BASE}/endProcesWeight`, { t_mo_id });
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function findOneWeight(t_mo_id: string) {
  try {
    const res = await axios.get(`${API_BASE}/findOneWeight/${t_mo_id}`);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function findMoPlant() {
  try {
    const res = await axios.get(`${API_BASE}/findMoPlant`);
    return res.data as MOHistoryItem[];
  } catch (e) {
    throw e;
  }
}

export async function getMO(t_mo_id: string) {
  try {
    const res = await axios.get(`${API_BASE}/getMO/${t_mo_id}`);
    return res.data as MOActiveDetail;
  } catch (e) {
    throw e;
  }
}
