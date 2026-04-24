export interface MOTransactionRow {
  id: string;
  product: string;
  standard: number;
  actual: number;
  sequence: number;
  time?: string;
}

export interface MOTransactionDetail {
  t_mo_id: string;
  nomor_mo: string;
  rows: MOTransactionRow[];
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function buildSequence<T extends { product: string; time?: string }>(
  list: T[],
): Array<T & { sequence: number }> {
  const counters = new Map<string, number>();
  return list.map((item) => {
    const seq = (counters.get(item.product) ?? 0) + 1;
    counters.set(item.product, seq);
    return { ...item, sequence: seq };
  });
}

export function adaptFindOneWeightResponse(
  tMoId: string,
  response: unknown,
): MOTransactionDetail {
  const raw = response as any;
  const payload = raw?.data?.data ?? raw?.data ?? raw;

  const nomorMO =
    String(payload?.nomor_mo ?? payload?.nomorMO ?? payload?.nomor ?? '').trim() ||
    tMoId;

  const fromLegacyProducts = Array.isArray(payload?.products)
    ? payload.products.map((item: any, idx: number) => ({
      id: String(item?.id ?? `${idx}`),
      product: String(item?.produk_name ?? item?.name ?? '-'),
      standard: parseNumber(item?.qty_plan),
      actual: parseNumber(item?.qty),
      time: String(item?.waktu ?? item?.time ?? ''),
    }))
    : [];

  const fromDetails = Array.isArray(payload?.details)
    ? payload.details.map((item: any, idx: number) => ({
      id: String(item?.id ?? `${idx}`),
      product: String(item?.name ?? item?.product_nrm ?? '-'),
      standard: parseNumber(item?.qty ?? item?.qty_plan),
      actual: parseNumber(item?.weight ?? item?.qty_actual ?? 0),
      time: String(item?.time ?? item?.waktu ?? ''),
    }))
    : [];

  const rawRows = fromLegacyProducts.length > 0 ? fromLegacyProducts : fromDetails;

  const sorted = [...rawRows].sort((a, b) => {
    if (a.product === b.product) return (a.time ?? '').localeCompare(b.time ?? '');
    return a.product.localeCompare(b.product);
  });

  const rows = buildSequence(sorted).map((item) => ({
    id: item.id,
    product: item.product,
    standard: item.standard,
    actual: item.actual,
    sequence: item.sequence,
    time: item.time,
  }));

  return {
    t_mo_id: String(payload?.t_mo_id ?? tMoId),
    nomor_mo: nomorMO,
    rows,
  };
}
