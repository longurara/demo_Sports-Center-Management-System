/** Đọc số tiền thành chữ tiếng Việt (dùng cho hóa đơn). */
const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const UNITS = ['', 'nghìn', 'triệu', 'tỷ'];

function readTriple(n: number, full: boolean): string {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
  const out: string[] = [];
  if (h > 0 || full) { out.push(DIGITS[h], 'trăm'); }
  if (t === 0) { if (u > 0 && (h > 0 || full)) out.push('lẻ'); }
  else if (t === 1) out.push('mười');
  else out.push(DIGITS[t], 'mươi');
  if (u > 0) {
    if (t >= 2 && u === 1) out.push('mốt');
    else if (t >= 1 && u === 5) out.push('lăm');
    else if (t >= 2 && u === 4) out.push('tư');
    else out.push(DIGITS[u]);
  }
  return out.join(' ');
}

export function readMoney(n: number): string {
  if (!n) return 'Không đồng';
  const triples: number[] = [];
  let x = Math.floor(Math.abs(n));
  while (x > 0) { triples.push(x % 1000); x = Math.floor(x / 1000); }
  const parts: string[] = [];
  for (let i = triples.length - 1; i >= 0; i--) {
    const v = triples[i];
    if (v === 0) continue;
    parts.push(readTriple(v, i !== triples.length - 1).trim(), UNITS[i]);
  }
  const s = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng';
}
