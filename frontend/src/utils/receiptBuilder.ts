import type { ReceiptData, ReceiptProductRow } from '@/types/timbangan';

export function buildThermalReceipt(data: ReceiptData): string {
  // 80mm printer-friendly HTML
  return `
    <div style="width: 300px; font-family: 'Consolas', monospace; font-size: 13px;">
      <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 8px;">PRODUCTION RECEIPT</div>
      <div style="margin-bottom: 8px;">MO: <b>${data.nomor_mo}</b></div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <thead>
          <tr>
            <th style="text-align:left;">Product</th>
            <th style="text-align:right;">Qty</th>
            <th style="text-align:right;">Weight</th>
            <th style="text-align:right;">Time</th>
            <th style="text-align:right;">Seq</th>
          </tr>
        </thead>
        <tbody>
          ${data.products.map(row => `
            <tr>
              <td>${row.name}</td>
              <td style="text-align:right;">${row.qty}</td>
              <td style="text-align:right;">${row.weight.toFixed(2)}</td>
              <td style="text-align:right;">${row.time}</td>
              <td style="text-align:right;">${row.seq}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-bottom: 4px;">Total Semen: <b>${data.totalSemen.toFixed(2)} kg</b></div>
      <div style="margin-bottom: 4px;">Total Kapur: <b>${data.totalKapur.toFixed(2)} kg</b></div>
      <div style="margin-bottom: 4px;">Seq Semen: <b>${data.seqSemen}</b></div>
      <div style="margin-bottom: 4px;">Seq Kapur: <b>${data.seqKapur}</b></div>
      <div style="text-align: right; margin-top: 12px; font-size: 12px;">${data.printDate}</div>
    </div>
  `;
}
