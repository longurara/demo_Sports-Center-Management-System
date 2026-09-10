import dayjs from 'dayjs';
import type { Payment } from '../types';

export function nextInvoiceNo(payments: Payment[]) {
  const year = dayjs().format('YYYY');
  const nums = payments.map((p) => p.invoiceNo).filter((n) => n.startsWith(`INV-${year}-`)).map((n) => parseInt(n.split('-')[2], 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `INV-${year}-${String(next).padStart(4, '0')}`;
}
