import dayjs from 'dayjs';
import type { Order } from '../types';

/** Số hóa đơn = order_number: ORD-YYYY-NNNN */
export function nextOrderNumber(orders: Order[]) {
  const year = dayjs().format('YYYY');
  const nums = orders.map((o) => o.orderNumber).filter((n) => n.startsWith(`ORD-${year}-`)).map((n) => parseInt(n.split('-')[2], 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `ORD-${year}-${String(next).padStart(4, '0')}`;
}
