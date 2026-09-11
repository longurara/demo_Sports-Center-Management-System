import type { AppData, User } from '../types';

/*
 * Prototype: sinh kế hoạch theo rule từ thư viện bài tập.
 * Bản chính thức: backend gọi Claude API với cùng cấu trúc input/output (PlanInput → AiPlan) để frontend không đổi.
 */

export type Focus = 'FAT_LOSS' | 'MUSCLE' | 'ENDURANCE' | 'CORE' | 'MOBILITY' | 'STRENGTH';
export const FOCUS_LABEL: Record<Focus, string> = { FAT_LOSS: 'Giảm mỡ', MUSCLE: 'Tăng cơ', ENDURANCE: 'Sức bền', CORE: 'Core', MOBILITY: 'Dẻo dai', STRENGTH: 'Sức mạnh' };

export type SportKey = 'GYM' | 'YOGA' | 'BOXING' | 'SWIM' | 'BADMINTON' | 'TENNIS' | 'PICKLEBALL' | 'BASKETBALL' | 'ZUMBA' | 'FOOTBALL';
/** Suy ra khóa bộ môn từ tên (để thư viện bài tập không phụ thuộc id trong mock). */
export function sportKeyOf(name?: string): SportKey {
  const n = (name ?? '').toLowerCase();
  if (/yoga|pilates/.test(n)) return 'YOGA';
  if (/box|quyền/.test(n)) return 'BOXING';
  if (/bơi|swim/.test(n)) return 'SWIM';
  if (/cầu lông|badminton/.test(n)) return 'BADMINTON';
  if (/tennis|quần vợt/.test(n)) return 'TENNIS';
  if (/pickle/.test(n)) return 'PICKLEBALL';
  if (/rổ|basket/.test(n)) return 'BASKETBALL';
  if (/zumba|aerobic|dance/.test(n)) return 'ZUMBA';
  if (/bóng đá|football|futsal/.test(n)) return 'FOOTBALL';
  return 'GYM';
}

export interface PlanInput {
  sportId?: string;      // bộ môn trọng tâm (lớp học viên đang theo)
  sportName?: string;
  weeks: number;
  sessionsPerWeek: number;
  focus: Focus[];
  equipment: 'FULL_GYM' | 'BASIC' | 'BODYWEIGHT';
  minutes: number;
  note?: string;
}

export interface Exercise { name: string; sets: number; reps: string; rest: string; note?: string; group: string }
export interface Session { day: string; title: string; warmup: string; exercises: Exercise[]; cooldown: string; minutes: number }
export interface Week { week: number; intensity: number; theme: string; sessions: Session[] }
export interface AiPlan {
  title: string;
  summary: string;
  tags: string[];
  confidence: number;
  reasons: string[];
  warnings: string[];
  nutrition: string[];
  weeks: Week[];
  metrics: { label: string; value: string }[];
}

interface Lib { name: string; group: string; focus: Focus[]; equipment: PlanInput['equipment'][]; level: number; note?: string; sport?: SportKey; reps?: string; sets?: number }
const ANY: PlanInput['equipment'][] = ['FULL_GYM', 'BASIC', 'BODYWEIGHT'];
/* Bài tập chuyên môn theo bộ môn — nhóm: Kỹ thuật / Thể lực chuyên môn / Ứng dụng */
const SPORT_LIB: Lib[] = [
  // Bơi lội
  { sport: 'SWIM', name: 'Kick board (đạp chân sải)', group: 'Kỹ thuật', focus: ['ENDURANCE'], equipment: ANY, level: 1, sets: 4, reps: '50m', note: 'Giữ hông nổi, đạp từ hông' },
  { sport: 'SWIM', name: 'Drill thở nghiêng 3-5-7', group: 'Kỹ thuật', focus: ['ENDURANCE', 'MOBILITY'], equipment: ANY, level: 1, sets: 4, reps: '25m' },
  { sport: 'SWIM', name: 'Catch-up freestyle', group: 'Kỹ thuật', focus: ['ENDURANCE'], equipment: ANY, level: 2, sets: 4, reps: '50m', note: 'Tay chờ tay, kéo nước dài' },
  { sport: 'SWIM', name: 'Pull buoy (kéo tay)', group: 'Thể lực', focus: ['STRENGTH', 'MUSCLE'], equipment: ANY, level: 2, sets: 4, reps: '100m' },
  { sport: 'SWIM', name: 'Bơi interval 100m', group: 'Thể lực', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ANY, level: 2, sets: 6, reps: '100m / nghỉ 20s' },
  { sport: 'SWIM', name: 'Bơi liên tục 400m', group: 'Ứng dụng', focus: ['ENDURANCE'], equipment: ANY, level: 2, sets: 1, reps: '400m', note: 'Giữ nhịp đều, đếm sải' },
  { sport: 'SWIM', name: 'Bơi ếch kỹ thuật chân', group: 'Kỹ thuật', focus: ['MOBILITY', 'ENDURANCE'], equipment: ANY, level: 1, sets: 4, reps: '25m' },
  // Boxing
  { sport: 'BOXING', name: 'Shadow boxing', group: 'Kỹ thuật', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ANY, level: 1, sets: 3, reps: '3 phút', note: 'Tập trung footwork và đòn 1-2' },
  { sport: 'BOXING', name: 'Heavy bag rounds', group: 'Thể lực', focus: ['STRENGTH', 'FAT_LOSS', 'ENDURANCE'], equipment: ['FULL_GYM', 'BASIC'], level: 2, sets: 4, reps: '3 phút / nghỉ 1 phút' },
  { sport: 'BOXING', name: 'Pad work với HLV', group: 'Ứng dụng', focus: ['STRENGTH', 'ENDURANCE'], equipment: ANY, level: 2, sets: 4, reps: '2 phút', note: 'Combo 1-2-3-2, slip, roll' },
  { sport: 'BOXING', name: 'Jump rope boxing', group: 'Thể lực', focus: ['FAT_LOSS', 'ENDURANCE'], equipment: ANY, level: 1, sets: 3, reps: '3 phút' },
  { sport: 'BOXING', name: 'Slip rope / head movement', group: 'Kỹ thuật', focus: ['MOBILITY', 'CORE'], equipment: ANY, level: 1, sets: 3, reps: '2 phút' },
  { sport: 'BOXING', name: 'Medicine ball rotational throw', group: 'Thể lực', focus: ['STRENGTH', 'CORE'], equipment: ['FULL_GYM', 'BASIC'], level: 2, sets: 3, reps: '8 mỗi bên' },
  // Yoga
  { sport: 'YOGA', name: 'Sun Salutation A/B', group: 'Kỹ thuật', focus: ['MOBILITY', 'ENDURANCE'], equipment: ANY, level: 1, sets: 5, reps: 'vòng', note: 'Thở Ujjayi đều theo chuyển động' },
  { sport: 'YOGA', name: 'Warrior I–II–III flow', group: 'Kỹ thuật', focus: ['STRENGTH', 'MOBILITY'], equipment: ANY, level: 1, sets: 2, reps: '5 nhịp thở mỗi tư thế' },
  { sport: 'YOGA', name: 'Chaturanga → Upward dog', group: 'Thể lực', focus: ['STRENGTH', 'MUSCLE'], equipment: ANY, level: 2, sets: 3, reps: '8' },
  { sport: 'YOGA', name: 'Boat pose (Navasana)', group: 'Thể lực', focus: ['CORE'], equipment: ANY, level: 1, sets: 3, reps: '30–45s' },
  { sport: 'YOGA', name: 'Hip opener: Pigeon, Lizard', group: 'Kỹ thuật', focus: ['MOBILITY'], equipment: ANY, level: 1, sets: 1, reps: '2 phút mỗi bên' },
  { sport: 'YOGA', name: 'Balance: Tree → Eagle', group: 'Ứng dụng', focus: ['CORE', 'MOBILITY'], equipment: ANY, level: 2, sets: 2, reps: '45s mỗi bên' },
  { sport: 'YOGA', name: 'Pranayama 4-7-8 + Savasana', group: 'Ứng dụng', focus: ['MOBILITY'], equipment: ANY, level: 1, sets: 1, reps: '8 phút' },
  // Cầu lông
  { sport: 'BADMINTON', name: 'Footwork 6 điểm (shadow)', group: 'Kỹ thuật', focus: ['ENDURANCE', 'MOBILITY'], equipment: ANY, level: 1, sets: 4, reps: '45s / nghỉ 30s', note: 'Bước chéo về góc, hồi vị trung tâm' },
  { sport: 'BADMINTON', name: 'Đập cầu (smash) đa cầu', group: 'Kỹ thuật', focus: ['STRENGTH'], equipment: ANY, level: 2, sets: 4, reps: '20 cầu' },
  { sport: 'BADMINTON', name: 'Bỏ nhỏ – lốp (net & lift)', group: 'Kỹ thuật', focus: ['MOBILITY'], equipment: ANY, level: 1, sets: 3, reps: '2 phút' },
  { sport: 'BADMINTON', name: 'Agility ladder', group: 'Thể lực', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ANY, level: 1, sets: 4, reps: '4 kiểu bước' },
  { sport: 'BADMINTON', name: 'Lunge nhảy đổi chân', group: 'Thể lực', focus: ['STRENGTH', 'ENDURANCE'], equipment: ANY, level: 2, sets: 3, reps: '12 mỗi bên' },
  { sport: 'BADMINTON', name: 'Đánh đơn điểm điều kiện', group: 'Ứng dụng', focus: ['ENDURANCE'], equipment: ANY, level: 2, sets: 3, reps: 'set 11 điểm', note: 'Chỉ được ghi điểm bằng bỏ nhỏ' },
  // Tennis
  { sport: 'TENNIS', name: 'Forehand cross-court', group: 'Kỹ thuật', focus: ['STRENGTH'], equipment: ANY, level: 1, sets: 4, reps: '20 bóng', note: 'Xoay hông, kết thúc qua vai' },
  { sport: 'TENNIS', name: 'Backhand 2 tay', group: 'Kỹ thuật', focus: ['STRENGTH', 'MOBILITY'], equipment: ANY, level: 1, sets: 4, reps: '20 bóng' },
  { sport: 'TENNIS', name: 'Giao bóng (serve) 3 vùng', group: 'Kỹ thuật', focus: ['STRENGTH'], equipment: ANY, level: 2, sets: 3, reps: '15 quả' },
  { sport: 'TENNIS', name: 'Spider run', group: 'Thể lực', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ANY, level: 1, sets: 5, reps: '1 vòng / nghỉ 45s' },
  { sport: 'TENNIS', name: 'Medicine ball side throw', group: 'Thể lực', focus: ['STRENGTH', 'CORE'], equipment: ['FULL_GYM', 'BASIC'], level: 2, sets: 3, reps: '10 mỗi bên' },
  { sport: 'TENNIS', name: 'Đánh điểm tie-break', group: 'Ứng dụng', focus: ['ENDURANCE'], equipment: ANY, level: 2, sets: 2, reps: '7 điểm' },
  // Pickleball
  { sport: 'PICKLEBALL', name: 'Dink cross-court', group: 'Kỹ thuật', focus: ['MOBILITY'], equipment: ANY, level: 1, sets: 4, reps: '2 phút', note: 'Gối chùng, vợt trước người' },
  { sport: 'PICKLEBALL', name: 'Third shot drop', group: 'Kỹ thuật', focus: ['MOBILITY', 'STRENGTH'], equipment: ANY, level: 2, sets: 4, reps: '15 bóng' },
  { sport: 'PICKLEBALL', name: 'Volley phản xạ ở kitchen', group: 'Kỹ thuật', focus: ['ENDURANCE'], equipment: ANY, level: 2, sets: 3, reps: '90s' },
  { sport: 'PICKLEBALL', name: 'Lateral shuffle + cone', group: 'Thể lực', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ANY, level: 1, sets: 4, reps: '30s' },
  { sport: 'PICKLEBALL', name: 'Đánh đôi tình huống', group: 'Ứng dụng', focus: ['ENDURANCE'], equipment: ANY, level: 1, sets: 2, reps: 'game 11 điểm' },
  // Bóng rổ
  { sport: 'BASKETBALL', name: 'Dẫn bóng 2 tay (crossover)', group: 'Kỹ thuật', focus: ['ENDURANCE', 'MOBILITY'], equipment: ANY, level: 1, sets: 4, reps: '1 phút' },
  { sport: 'BASKETBALL', name: 'Form shooting gần rổ', group: 'Kỹ thuật', focus: ['STRENGTH'], equipment: ANY, level: 1, sets: 5, reps: '10 quả / vị trí', note: 'Khuỷu dưới bóng, gập cổ tay' },
  { sport: 'BASKETBALL', name: 'Lay-up 2 bên', group: 'Kỹ thuật', focus: ['MOBILITY'], equipment: ANY, level: 1, sets: 4, reps: '10 mỗi bên' },
  { sport: 'BASKETBALL', name: 'Suicide run', group: 'Thể lực', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ANY, level: 2, sets: 4, reps: '1 lượt / nghỉ 60s' },
  { sport: 'BASKETBALL', name: 'Box jump', group: 'Thể lực', focus: ['STRENGTH'], equipment: ['FULL_GYM', 'BASIC'], level: 2, sets: 4, reps: '6' },
  { sport: 'BASKETBALL', name: '3v3 half-court', group: 'Ứng dụng', focus: ['ENDURANCE'], equipment: ANY, level: 1, sets: 3, reps: 'game 7 điểm' },
  // Zumba
  { sport: 'ZUMBA', name: 'Merengue march & step-touch', group: 'Kỹ thuật', focus: ['FAT_LOSS', 'ENDURANCE'], equipment: ANY, level: 1, sets: 2, reps: '4 phút' },
  { sport: 'ZUMBA', name: 'Salsa basic + cumbia', group: 'Kỹ thuật', focus: ['FAT_LOSS', 'MOBILITY'], equipment: ANY, level: 1, sets: 2, reps: '4 phút' },
  { sport: 'ZUMBA', name: 'Reggaeton bounce', group: 'Thể lực', focus: ['FAT_LOSS', 'ENDURANCE'], equipment: ANY, level: 2, sets: 2, reps: '4 phút' },
  { sport: 'ZUMBA', name: 'Choreo full song', group: 'Ứng dụng', focus: ['FAT_LOSS', 'ENDURANCE'], equipment: ANY, level: 2, sets: 3, reps: '1 bài', note: 'Giữ nhịp tim 70–80% max' },
  // Bóng đá mini
  { sport: 'FOOTBALL', name: 'Chuyền – nhận 1 chạm', group: 'Kỹ thuật', focus: ['ENDURANCE'], equipment: ANY, level: 1, sets: 4, reps: '2 phút' },
  { sport: 'FOOTBALL', name: 'Dẫn bóng qua cone', group: 'Kỹ thuật', focus: ['MOBILITY', 'ENDURANCE'], equipment: ANY, level: 1, sets: 4, reps: '4 lượt' },
  { sport: 'FOOTBALL', name: 'Sút cầu môn 2 chân', group: 'Kỹ thuật', focus: ['STRENGTH'], equipment: ANY, level: 2, sets: 3, reps: '10 quả mỗi chân' },
  { sport: 'FOOTBALL', name: 'Shuttle run 5-10-15m', group: 'Thể lực', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ANY, level: 1, sets: 5, reps: '1 lượt / nghỉ 45s' },
  { sport: 'FOOTBALL', name: 'Rondo 4v2', group: 'Ứng dụng', focus: ['ENDURANCE'], equipment: ANY, level: 1, sets: 3, reps: '3 phút' },
];
const LIB: Lib[] = [
  { name: 'Goblet Squat', group: 'Chân', focus: ['STRENGTH', 'MUSCLE', 'FAT_LOSS'], equipment: ['FULL_GYM', 'BASIC'], level: 1 },
  { name: 'Back Squat', group: 'Chân', focus: ['STRENGTH', 'MUSCLE'], equipment: ['FULL_GYM'], level: 2, note: 'Giữ lưng trung tính, gối theo hướng mũi chân' },
  { name: 'Romanian Deadlift', group: 'Chân/Mông', focus: ['STRENGTH', 'MUSCLE'], equipment: ['FULL_GYM', 'BASIC'], level: 2 },
  { name: 'Deadlift', group: 'Toàn thân', focus: ['STRENGTH'], equipment: ['FULL_GYM'], level: 3, note: 'Bắt đầu 60% 1RM' },
  { name: 'Walking Lunges', group: 'Chân', focus: ['FAT_LOSS', 'ENDURANCE', 'MUSCLE'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'Leg Press', group: 'Chân', focus: ['MUSCLE', 'STRENGTH'], equipment: ['FULL_GYM'], level: 1 },
  { name: 'Hip Thrust', group: 'Mông', focus: ['MUSCLE', 'STRENGTH'], equipment: ['FULL_GYM', 'BASIC'], level: 2 },
  { name: 'Bench Press', group: 'Ngực', focus: ['STRENGTH', 'MUSCLE'], equipment: ['FULL_GYM'], level: 2 },
  { name: 'Push-up', group: 'Ngực', focus: ['ENDURANCE', 'FAT_LOSS', 'MUSCLE'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'Dumbbell Row', group: 'Lưng', focus: ['MUSCLE', 'STRENGTH'], equipment: ['FULL_GYM', 'BASIC'], level: 1 },
  { name: 'Lat Pulldown', group: 'Lưng', focus: ['MUSCLE'], equipment: ['FULL_GYM'], level: 1 },
  { name: 'Pull-up', group: 'Lưng', focus: ['STRENGTH', 'MUSCLE'], equipment: ['FULL_GYM', 'BODYWEIGHT'], level: 3 },
  { name: 'Shoulder Press', group: 'Vai', focus: ['MUSCLE', 'STRENGTH'], equipment: ['FULL_GYM', 'BASIC'], level: 2 },
  { name: 'Lateral Raise', group: 'Vai', focus: ['MUSCLE'], equipment: ['FULL_GYM', 'BASIC'], level: 1 },
  { name: 'Plank', group: 'Core', focus: ['CORE', 'FAT_LOSS', 'MOBILITY'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'Dead Bug', group: 'Core', focus: ['CORE', 'MOBILITY'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'Hanging Leg Raise', group: 'Core', focus: ['CORE', 'STRENGTH'], equipment: ['FULL_GYM'], level: 3 },
  { name: 'Russian Twist', group: 'Core', focus: ['CORE', 'FAT_LOSS'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'Burpee', group: 'Cardio', focus: ['FAT_LOSS', 'ENDURANCE'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 2 },
  { name: 'Mountain Climber', group: 'Cardio', focus: ['FAT_LOSS', 'ENDURANCE', 'CORE'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'Rowing Machine', group: 'Cardio', focus: ['ENDURANCE', 'FAT_LOSS'], equipment: ['FULL_GYM'], level: 1 },
  { name: 'Treadmill Interval', group: 'Cardio', focus: ['FAT_LOSS', 'ENDURANCE'], equipment: ['FULL_GYM'], level: 2, note: '1 phút nhanh / 2 phút chậm' },
  { name: 'Jump Rope', group: 'Cardio', focus: ['FAT_LOSS', 'ENDURANCE'], equipment: ['BASIC', 'BODYWEIGHT', 'FULL_GYM'], level: 1 },
  { name: 'Kettlebell Swing', group: 'Toàn thân', focus: ['FAT_LOSS', 'STRENGTH', 'ENDURANCE'], equipment: ['FULL_GYM', 'BASIC'], level: 2 },
  { name: 'Hip Opener Flow', group: 'Mobility', focus: ['MOBILITY'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'Cat-Cow + Thoracic Rotation', group: 'Mobility', focus: ['MOBILITY', 'CORE'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
  { name: 'World Greatest Stretch', group: 'Mobility', focus: ['MOBILITY'], equipment: ['FULL_GYM', 'BASIC', 'BODYWEIGHT'], level: 1 },
];

const LEVEL_NUM = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 } as const;
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export function inferFocus(u: User): Focus[] {
  const g = (u.goal ?? '').toLowerCase();
  const f: Focus[] = [];
  if (/giảm|mỡ|cân/.test(g)) f.push('FAT_LOSS');
  if (/cơ|tăng/.test(g)) f.push('MUSCLE');
  if (/bền|marathon|tim/.test(g)) f.push('ENDURANCE');
  if (/bụng|core/.test(g)) f.push('CORE');
  if (/dẻo|lưng|stress|giữ dáng/.test(g)) f.push('MOBILITY');
  if (/mạnh|boxing|tự vệ/.test(g)) f.push('STRENGTH');
  return f.length ? f : ['FAT_LOSS', 'CORE'];
}

export function generatePlan(u: User, data: AppData, input: PlanInput): AiPlan {
  let seed = u.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + input.weeks * 7 + input.sessionsPerWeek;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const lvl = LEVEL_NUM[u.level ?? 'BEGINNER'];
  const focus = input.focus.length ? input.focus : inferFocus(u);
  const losing = focus.includes('FAT_LOSS');
  const health = (u.healthNote ?? '').toLowerCase();
  const kneeIssue = /gối|knee/.test(health);
  const backIssue = /lưng|back/.test(health);
  const heartIssue = /tim|huyết áp/.test(health);

  // Dữ liệu lịch sử
  const results = data.trainingResults.filter((r) => r.memberId === u.id).map((r) => ({ ...r, date: data.sessions.find((s) => s.id === r.sessionId)?.date ?? '' })).sort((a, b) => a.date.localeCompare(b.date));
  const att = data.attendances.filter((a) => a.memberId === u.id);
  const attRate = att.length ? Math.round(att.filter((a) => a.status !== 'ABSENT').length / att.length * 100) : 0;
  const bm = data.bodyMetrics.filter((m) => m.memberId === u.id).sort((a, b) => a.date.localeCompare(b.date));
  const wDiff = bm.length > 1 ? Math.round((bm[bm.length - 1].weight - bm[0].weight) * 10) / 10 : 0;
  const bfDiff = bm.length > 1 && bm[0].bodyFat && bm[bm.length - 1].bodyFat ? Math.round(((bm[bm.length - 1].bodyFat ?? 0) - (bm[0].bodyFat ?? 0)) * 10) / 10 : 0;

  const sportKey = sportKeyOf(input.sportName);
  const sportName = input.sportName ?? 'Gym';
  const pool = [...LIB, ...SPORT_LIB.filter((e) => e.sport === sportKey)].filter((e) => e.equipment.includes(input.equipment) && e.level <= lvl + (attRate > 85 ? 1 : 0))
    .filter((e) => !(kneeIssue && /Squat|Lunge|Burpee|Jump/.test(e.name)))
    .filter((e) => !(backIssue && /Deadlift|Russian/.test(e.name)))
    .filter((e) => !(heartIssue && /Burpee|Interval/.test(e.name)));
  const score = (e: Lib) => e.focus.filter((f) => focus.includes(f)).length * 2 + (e.level === lvl ? 1 : 0) + (e.sport ? 1.5 : 0) + rnd() * 0.8;
  const byGroup = (g: RegExp) => pool.filter((e) => g.test(e.group)).sort((a, b) => score(b) - score(a));

  const perSession = Math.max(4, Math.min(7, Math.round(input.minutes / 12)));
  const templates: { title: string; groups: RegExp[] }[] = input.sessionsPerWeek >= 4
    ? [{ title: 'Thân dưới', groups: [/Chân|Mông/, /Chân|Mông/, /Mông|Chân/, /Core/, /Cardio/, /Mobility/] }, { title: 'Thân trên', groups: [/Ngực/, /Lưng/, /Vai/, /Ngực|Lưng/, /Core/, /Cardio/] }, { title: 'Cardio & Core', groups: [/Cardio/, /Cardio/, /Core/, /Core/, /Toàn thân/, /Mobility/] }, { title: 'Toàn thân', groups: [/Toàn thân|Chân/, /Lưng/, /Ngực/, /Vai/, /Core/, /Cardio/] }]
    : [{ title: 'Toàn thân A', groups: [/Chân|Mông/, /Ngực/, /Lưng/, /Core/, /Cardio/, /Mobility/] }, { title: 'Toàn thân B', groups: [/Toàn thân|Chân/, /Vai/, /Lưng/, /Mông|Chân/, /Core/, /Cardio/] }, { title: 'Cardio & Core', groups: [/Cardio/, /Cardio/, /Core/, /Core/, /Toàn thân/, /Mobility/] }];
  if (focus.includes('MOBILITY')) templates.forEach((t) => t.groups.unshift(/Mobility/));
  // Bộ môn khác Gym: ~60% bài chuyên môn (Kỹ thuật / Thể lực / Ứng dụng), ~40% thể lực nền
  if (sportKey !== 'GYM') {
    templates.length = 0;
    templates.push(
      { title: `Kỹ thuật ${sportName}`, groups: [/Kỹ thuật/, /Kỹ thuật/, /Kỹ thuật/, /Thể lực/, /Core/, /Mobility/] },
      { title: `Thể lực chuyên môn`, groups: [/Thể lực/, /Thể lực/, /Chân|Toàn thân/, /Cardio/, /Core/, /Mobility/] },
      { title: `Ứng dụng & thi đấu`, groups: [/Ứng dụng/, /Kỹ thuật/, /Thể lực/, /Ngực|Lưng|Vai/, /Core/, /Mobility/] },
    );
    if (input.sessionsPerWeek >= 4) templates.push({ title: 'Thể lực nền (gym)', groups: [/Chân|Mông/, /Ngực|Lưng/, /Vai/, /Core/, /Cardio/, /Mobility/] });
  }

  const reps = (e: Lib, week: number) => {
    if (e.reps) return e.reps;
    if (/Cardio/.test(e.group)) return `${Math.min(20, 8 + week * 2 + lvl * 2)} phút`;
    if (/Plank/.test(e.name)) return `${30 + week * 10 + lvl * 10}s`;
    if (/Mobility/.test(e.group)) return '8–10 mỗi bên';
    if (focus.includes('STRENGTH')) return lvl >= 2 ? '5–6' : '6–8';
    if (losing) return '12–15';
    return '8–12';
  };
  const sets = (e: Lib, week: number) => (e.sets ? Math.min(e.sets + (week >= 3 ? 1 : 0), e.sets + 1) : /Cardio|Mobility/.test(e.group) ? 1 : Math.min(5, (lvl >= 2 ? 4 : 3) + (week >= 3 ? 1 : 0)));
  const rest = (e: Lib) => (/Cardio/.test(e.group) ? '—' : e.sport ? '30–60s' : focus.includes('STRENGTH') ? '120s' : losing ? '45s' : '60–90s');

  const dayIdx = input.sessionsPerWeek >= 4 ? [0, 1, 3, 4, 5] : input.sessionsPerWeek === 3 ? [0, 2, 4] : [1, 4];
  const weeks: Week[] = Array.from({ length: input.weeks }).map((_, wi) => {
    const week = wi + 1;
    const deload = input.weeks >= 6 && week % 4 === 0;
    const intensity = deload ? 70 : Math.min(100, 65 + wi * Math.round(30 / Math.max(1, input.weeks - 1)));
    const sessions: Session[] = Array.from({ length: input.sessionsPerWeek }).map((_, si) => {
      const t = templates[si % templates.length];
      const used = new Set<string>();
      const exercises: Exercise[] = [];
      for (const g of t.groups) {
        const cand = byGroup(g).find((e) => !used.has(e.name));
        if (!cand) continue;
        used.add(cand.name);
        exercises.push({ name: cand.name, group: cand.group, sets: deload ? Math.max(2, sets(cand, week) - 1) : sets(cand, week), reps: reps(cand, week), rest: rest(cand), note: cand.note });
        if (exercises.length >= perSession) break;
      }
      const warmBySport: Partial<Record<SportKey, string>> = { SWIM: 'Khởi động khớp vai/hông 5 phút + bơi nhẹ 200m', BOXING: 'Nhảy dây 3 phút + xoay khớp + shadow nhẹ 2 phút', YOGA: 'Thở bụng 3 phút, Cat-Cow, Child pose', BADMINTON: 'Chạy nhẹ 5 phút + bước chân shadow + xoay vai/cổ tay', TENNIS: 'Chạy nhẹ + skipping + xoay thân 8 phút', PICKLEBALL: 'Đi bộ nhanh + xoay khớp + dink nhẹ 5 phút', BASKETBALL: 'Chạy nhẹ + dẫn bóng tại chỗ 6 phút', ZUMBA: 'Warm-up song: march, step-touch 4 phút', FOOTBALL: 'Chạy nhẹ + FIFA 11+ rút gọn 8 phút' };
      const cardioFirst = warmBySport[sportKey] ?? (losing ? 'Cardio nhẹ 10 phút (máy chạy / xe đạp) + khởi động khớp' : 'Khởi động động 8 phút: jumping jack, arm circle, leg swing');
      return { day: DAYS[dayIdx[si] ?? si], title: `${t.title}${deload ? ' (deload)' : ''}`, warmup: cardioFirst, exercises, cooldown: 'Giãn cơ tĩnh 5–8 phút, hít thở 4-7-8', minutes: input.minutes };
    });
    const theme = deload ? 'Tuần giảm tải – phục hồi' : week === 1 ? 'Làm quen kỹ thuật' : week === input.weeks ? 'Đo lại chỉ số & tổng kết' : wi < input.weeks / 2 ? 'Xây nền tảng' : 'Tăng cường độ';
    return { week, intensity, theme, sessions };
  });

  const reasons = [
    ...(sportKey !== 'GYM' ? [`Bộ môn ${sportName} → ~60% khối lượng là bài chuyên môn (kỹ thuật, thể lực chuyên môn, ứng dụng), ~40% thể lực nền để tránh chấn thương.`] : []),
    `Mục tiêu "${u.goal ?? 'chưa rõ'}" → ưu tiên ${focus.map((f) => FOCUS_LABEL[f]).join(' + ')}${losing ? ', hiệp cao, nghỉ ngắn để tăng tiêu hao năng lượng' : ''}.`,
    `Trình độ ${u.level === 'ADVANCED' ? 'nâng cao' : u.level === 'INTERMEDIATE' ? 'trung bình' : 'mới bắt đầu'} → ${lvl === 1 ? 'chọn biến thể cơ bản, 3 hiệp/bài, tập trung kỹ thuật' : lvl === 2 ? 'dùng compound lifts với 4 hiệp' : 'cho phép bài nặng (Deadlift, Pull-up) và 5 hiệp'}.`,
    attRate ? `Chuyên cần ${attRate}% (${att.length} buổi) → ${attRate >= 85 ? 'đủ điều kiện tăng độ khó sớm hơn 1 bậc' : attRate >= 70 ? 'giữ lộ trình tiêu chuẩn' : 'giảm số bài mỗi buổi để dễ duy trì'}.` : 'Chưa có dữ liệu điểm danh → lộ trình tiêu chuẩn, đánh giá lại sau 2 tuần.',
    bm.length > 1 ? `Cân nặng ${wDiff <= 0 ? 'giảm' : 'tăng'} ${Math.abs(wDiff)}kg${bfDiff ? `, mỡ ${bfDiff <= 0 ? 'giảm' : 'tăng'} ${Math.abs(bfDiff)}%` : ''} trong ${bm.length} tuần → ${losing ? (wDiff < -0.3 * bm.length ? 'nhịp giảm tốt, giữ nguyên cường độ cardio' : 'tăng cardio interval thêm 1 buổi/tuần') : 'tăng khối lượng tạ 2.5–5% mỗi tuần'}.` : 'Chưa có chỉ số cơ thể → nên đo InBody ở buổi đầu để theo dõi.',
    results.length ? `Kết quả gần nhất: "${results[results.length - 1].metrics}" → dùng làm mức khởi điểm cho tuần 1.` : 'Chưa có kết quả buổi tập → tuần 1 dùng tạ nhẹ để tìm mức phù hợp.',
  ];
  const warnings: string[] = [];
  if (kneeIssue) warnings.push('Ghi chú sức khỏe liên quan đến gối → đã loại Squat sâu, Lunge, Burpee, các bài nhảy.');
  if (backIssue) warnings.push('Ghi chú liên quan đến lưng → đã loại Deadlift, Russian Twist; nhắc giữ lưng trung tính.');
  if (heartIssue) warnings.push('Ghi chú tim mạch/huyết áp → không dùng HIIT, giữ nhịp tim ≤ 75% max.');
  if (lvl === 1 && input.sessionsPerWeek >= 5) warnings.push('Người mới tập 5 buổi/tuần dễ quá tải — cân nhắc 3–4 buổi trong 2 tuần đầu.');
  if (input.weeks >= 6) warnings.push('Lộ trình dài ≥ 6 tuần → đã chèn tuần deload (giảm tải) mỗi 4 tuần.');
  if (!warnings.length) warnings.push('Không phát hiện chống chỉ định từ hồ sơ. Vẫn cần HLV quan sát kỹ thuật ở buổi đầu.');

  const nutrition = losing
    ? ['Thâm hụt ~400–500 kcal/ngày, protein 1.6–2 g/kg cân nặng', 'Ưu tiên rau xanh, hạn chế đường lỏng', 'Uống 2–2.5 L nước/ngày', 'Ngủ 7–8 giờ để kiểm soát cortisol']
    : focus.includes('MUSCLE') ? ['Thặng dư ~250–300 kcal/ngày, protein 1.8–2.2 g/kg', 'Carb quanh buổi tập (trước 60 phút / sau 30 phút)', 'Creatine 3–5 g/ngày nếu HLV đồng ý', 'Ngủ 7–9 giờ']
    : ['Ăn đủ 3 bữa chính, protein mỗi bữa', 'Bổ sung điện giải khi tập > 60 phút', 'Uống 2 L nước/ngày', 'Ngủ 7–8 giờ'];

  const confidence = Math.min(96, 62 + (att.length ? 10 : 0) + (bm.length > 1 ? 10 : 0) + (results.length ? 8 : 0) + (u.goal ? 4 : 0) + (u.healthNote ? 2 : 0));
  const totalEx = weeks.reduce((s, w) => s + w.sessions.reduce((x, se) => x + se.exercises.length, 0), 0);

  return {
    title: `Lộ trình ${sportName} ${input.weeks} tuần · ${focus.map((f) => FOCUS_LABEL[f]).join(' & ')}`,
    summary: `${input.sessionsPerWeek} buổi/tuần × ${input.minutes} phút, ${input.equipment === 'FULL_GYM' ? 'đủ máy & tạ' : input.equipment === 'BASIC' ? 'tạ tay + dây kháng lực' : 'chỉ trọng lượng cơ thể'}. Cường độ tăng dần ${weeks[0].intensity}% → ${weeks[weeks.length - 1].intensity}%${input.weeks >= 6 ? ', có tuần deload' : ''}.`,
    tags: [sportName, ...focus.map((f) => FOCUS_LABEL[f]), u.level === 'ADVANCED' ? 'Nâng cao' : u.level === 'INTERMEDIATE' ? 'Trung bình' : 'Người mới', `${input.sessionsPerWeek} buổi/tuần`],
    confidence, reasons, warnings, nutrition, weeks,
    metrics: [
      { label: 'Tổng buổi tập', value: `${input.weeks * input.sessionsPerWeek}` },
      { label: 'Bài tập / buổi', value: `${Math.round(totalEx / (input.weeks * input.sessionsPerWeek))}` },
      { label: 'Thời lượng', value: `${input.minutes} phút` },
      { label: 'Mục tiêu đo lại', value: losing ? `-${Math.max(1, Math.round(input.weeks * 0.5))} kg` : focus.includes('MUSCLE') ? `+${Math.round(input.weeks * 0.25 * 10) / 10} kg cơ` : `+${input.weeks * 3}% sức bền` },
    ],
  };
}

/** Chuyển kế hoạch có cấu trúc thành văn bản để lưu vào TrainingPlan.content */
export function planToText(p: AiPlan): string {
  const lines: string[] = [p.title, p.summary, ''];
  lines.push('VÌ SAO:'); p.reasons.forEach((r) => lines.push(`• ${r}`)); lines.push('');
  for (const w of p.weeks) {
    lines.push(`TUẦN ${w.week} — ${w.theme} (cường độ ${w.intensity}%)`);
    for (const s of w.sessions) {
      lines.push(`  ${s.day} · ${s.title} (${s.minutes} phút)`);
      lines.push(`    Khởi động: ${s.warmup}`);
      s.exercises.forEach((e) => lines.push(`    - ${e.name}: ${e.sets} × ${e.reps}, nghỉ ${e.rest}${e.note ? ` — ${e.note}` : ''}`));
      lines.push(`    Thả lỏng: ${s.cooldown}`);
    }
    lines.push('');
  }
  lines.push('DINH DƯỠNG & PHỤC HỒI:'); p.nutrition.forEach((n) => lines.push(`• ${n}`)); lines.push('');
  lines.push('LƯU Ý AN TOÀN:'); p.warnings.forEach((n) => lines.push(`• ${n}`));
  return lines.join('\n');
}
