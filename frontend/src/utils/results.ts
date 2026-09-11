import type { ResultEntry } from '../types';
import { sportKeyOf, type SportKey } from './aiPlan';

/** Định nghĩa chỉ số đo theo bộ môn: đơn vị, khoảng giá trị khởi điểm, bước tiến bộ, chiều tốt hơn. */
export interface MetricDef { name: string; unit: string; min: number; max: number; step: number; higherIsBetter: boolean; decimals?: number }

export const SPORT_METRICS: Record<SportKey, MetricDef[]> = {
  GYM: [
    { name: 'Squat', unit: 'kg', min: 30, max: 70, step: 2.5, higherIsBetter: true },
    { name: 'Bench Press', unit: 'kg', min: 25, max: 60, step: 2.5, higherIsBetter: true },
    { name: 'Deadlift', unit: 'kg', min: 40, max: 90, step: 5, higherIsBetter: true },
    { name: 'Plank', unit: 's', min: 40, max: 90, step: 10, higherIsBetter: true },
    { name: 'Chạy 3km', unit: 'phút', min: 16, max: 22, step: 0.4, higherIsBetter: false, decimals: 1 },
  ],
  YOGA: [
    { name: 'Giữ Plank', unit: 's', min: 30, max: 60, step: 8, higherIsBetter: true },
    { name: 'Sit-and-reach', unit: 'cm', min: 5, max: 18, step: 1, higherIsBetter: true },
    { name: 'Giữ thăng bằng Tree', unit: 's', min: 15, max: 40, step: 5, higherIsBetter: true },
    { name: 'Thiền/thở', unit: 'phút', min: 5, max: 10, step: 1, higherIsBetter: true },
  ],
  BOXING: [
    { name: 'Đấm bao 3 phút', unit: 'đòn', min: 180, max: 260, step: 10, higherIsBetter: true },
    { name: 'Nhảy dây liên tục', unit: 'phút', min: 2, max: 5, step: 0.5, higherIsBetter: true, decimals: 1 },
    { name: 'Hiệp pad work', unit: 'hiệp', min: 3, max: 5, step: 0.5, higherIsBetter: true, decimals: 0 },
    { name: 'Nhịp tim hồi phục 1 phút', unit: 'bpm', min: 25, max: 45, step: 2, higherIsBetter: true },
  ],
  SWIM: [
    { name: '50m tự do', unit: 's', min: 50, max: 75, step: 1.2, higherIsBetter: false, decimals: 1 },
    { name: '100m tự do', unit: 's', min: 110, max: 160, step: 2.5, higherIsBetter: false, decimals: 1 },
    { name: 'Quãng đường liên tục', unit: 'm', min: 200, max: 500, step: 50, higherIsBetter: true },
    { name: 'Số sải / 25m', unit: 'sải', min: 18, max: 26, step: 1, higherIsBetter: false },
  ],
  BADMINTON: [
    { name: 'Footwork 6 điểm / 45s', unit: 'lần', min: 18, max: 30, step: 1, higherIsBetter: true },
    { name: 'Smash trúng ô', unit: '%', min: 40, max: 70, step: 3, higherIsBetter: true },
    { name: 'Giao cầu chuẩn', unit: '%', min: 55, max: 80, step: 3, higherIsBetter: true },
    { name: 'Đánh bền liên tục', unit: 'quả', min: 15, max: 40, step: 3, higherIsBetter: true },
  ],
  TENNIS: [
    { name: 'Serve vào ô', unit: '%', min: 40, max: 65, step: 3, higherIsBetter: true },
    { name: 'Forehand liên tục', unit: 'quả', min: 8, max: 25, step: 2, higherIsBetter: true },
    { name: 'Spider run', unit: 's', min: 18, max: 26, step: 0.4, higherIsBetter: false, decimals: 1 },
    { name: 'Backhand vào sân', unit: '%', min: 45, max: 70, step: 3, higherIsBetter: true },
  ],
  PICKLEBALL: [
    { name: 'Dink liên tục', unit: 'quả', min: 10, max: 35, step: 3, higherIsBetter: true },
    { name: 'Third-shot drop vào kitchen', unit: '%', min: 35, max: 65, step: 3, higherIsBetter: true },
    { name: 'Volley phản xạ / 60s', unit: 'quả', min: 20, max: 40, step: 2, higherIsBetter: true },
  ],
  BASKETBALL: [
    { name: 'Ném phạt /10', unit: 'quả', min: 3, max: 8, step: 0.5, higherIsBetter: true, decimals: 0 },
    { name: 'Lay-up /10', unit: 'quả', min: 5, max: 9, step: 0.5, higherIsBetter: true, decimals: 0 },
    { name: 'Suicide run', unit: 's', min: 30, max: 40, step: 0.5, higherIsBetter: false, decimals: 1 },
    { name: 'Bật nhảy', unit: 'cm', min: 35, max: 55, step: 1, higherIsBetter: true },
  ],
  ZUMBA: [
    { name: 'Kcal tiêu hao', unit: 'kcal', min: 280, max: 450, step: 12, higherIsBetter: true },
    { name: 'Nhịp tim trung bình', unit: 'bpm', min: 135, max: 155, step: 1, higherIsBetter: true },
    { name: 'Thời gian theo kịp bài', unit: '%', min: 60, max: 95, step: 3, higherIsBetter: true },
  ],
  FOOTBALL: [
    { name: 'Shuttle run 5-10-15', unit: 's', min: 9, max: 13, step: 0.2, higherIsBetter: false, decimals: 1 },
    { name: 'Chuyền 1 chạm chính xác', unit: '%', min: 55, max: 85, step: 3, higherIsBetter: true },
    { name: 'Sút trúng đích /10', unit: 'quả', min: 4, max: 8, step: 0.5, higherIsBetter: true, decimals: 0 },
    { name: 'Quãng đường chạy', unit: 'km', min: 2.5, max: 4.5, step: 0.2, higherIsBetter: true, decimals: 1 },
  ],
};

export const metricsFor = (sportName?: string) => SPORT_METRICS[sportKeyOf(sportName)];
export const metricDef = (name: string) => Object.values(SPORT_METRICS).flat().find((m) => m.name === name);

export const fmtVal = (v: number, def?: MetricDef) => (def?.decimals !== undefined ? v.toFixed(def.decimals) : Number.isInteger(v) ? String(v) : v.toFixed(1));

export const entriesToString = (entries: ResultEntry[]) => entries.map((e) => `${e.name} ${fmtVal(e.value, metricDef(e.name))}${e.unit === '%' || e.unit === 's' || e.unit === 'kg' || e.unit === 'cm' || e.unit === 'm' || e.unit === 'km' ? e.unit : ` ${e.unit}`}`).join(' · ');

/** Suy ra entries từ chuỗi chỉ số cũ ("Squat 35kg x 10, Cardio 20 phút") để UI vẫn vẽ được. */
export function parseMetrics(s: string): ResultEntry[] {
  return s.split(/[,·]/).map((x) => x.trim()).filter(Boolean).map((part) => {
    const m = part.match(/^(.*?)[\s:]+(\d+(?:[.,]\d+)?)\s*([a-zA-Zđ%]+)?/);
    if (!m) return { name: part, value: 0, unit: '' };
    return { name: m[1].trim(), value: parseFloat(m[2].replace(',', '.')), unit: (m[3] ?? '').replace('kgx', 'kg') };
  });
}

export const entriesOf = (r: { entries?: ResultEntry[]; metrics: string }) => r.entries?.length ? r.entries : parseMetrics(r.metrics);

/** % thay đổi giữa 2 giá trị theo chiều "tốt hơn". Dương = tiến bộ. */
export function improvement(name: string, from: number, to: number) {
  if (!from) return 0;
  const def = metricDef(name);
  const raw = ((to - from) / Math.abs(from)) * 100;
  return Math.round((def && !def.higherIsBetter ? -raw : raw) * 10) / 10;
}
