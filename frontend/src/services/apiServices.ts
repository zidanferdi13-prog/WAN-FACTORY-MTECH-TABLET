import axios from 'axios';
import type {
  MOHistoryItem,
  TransactionPlantPayload,
} from '@/types/timbangan';
import { API_BASE_URL } from '@/utils/config';

export async function findOneMO(nomor_mo: string) {
  try {
    const res = await axios.post(`${API_BASE_URL}/kanban/findOne`, { nomor_mo });
    console.log('findOneMO response:', res.data);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function nomorMO(nomor_mo: string) {
  try {
    const res = await axios.get(`${API_BASE_URL}/timbangan/nomorMo?nomor_mo=${nomor_mo}`);
    console.log('nomorMO response:', res.data);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function addTransactionPlant(payload: TransactionPlantPayload) {
  try {
    const res = await axios.post(`${API_BASE_URL}/timbangan/addTransactionPlant`, payload);
    console.log('addTransactionPlant response:', res.data);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function refreshDataWeight(t_mo_id: string) {
  try {
    const res = await axios.get(`${API_BASE_URL}/timbangan/refreshDataWeight?t_mo_id=${t_mo_id}`);
    console.log('refreshDataWeight response:', res.data);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function resetDataWeight(t_mo_id: string) {
  try {
    const res = await axios.get(`${API_BASE_URL}/timbangan/resetDataWeight?t_mo_id=${t_mo_id}`);
    console.log('resetDataWeight response:', res.data);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function endProcesWeight(t_mo_id: string) {
  try {
    const res = await axios.get(`${API_BASE_URL}/timbangan/endProcesWeight?t_mo_id=${t_mo_id}`);
    console.log('endProcesWeight response:', res.data);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function findOneWeight(t_mo_id: string) {
  try {
    const res = await axios.get(`${API_BASE_URL}/timbangan/findOneWeight?t_mo_id=${t_mo_id}`);
    console.log('findOneWeight response:', res.data);
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function findMoPlant() {
  try {
    const res = await axios.get(`${API_BASE_URL}/timbangan/findMoPlant?tgl=${new Date().toISOString()}`);
    console.log('findMoPlant response:', res.data);
    return res.data as MOHistoryItem[];
  } catch (e) {
    throw e;
  }
}
