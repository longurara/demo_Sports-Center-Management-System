import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';

/** Tách quyền lợi theo dấu phẩy ngoài ngoặc; ưu đãi thuê sân hiện riêng bằng courtDiscount. */
const benefitsOf = (text: string) => text.split(/,(?![^(]*\))|\s\+\s/).map((b) => b.trim()).filter((b) => b && !/thuê sân/i.test(b)).map((b) => b.charAt(0).toUpperCase() + b.slice(1));

export default function MemberPlans() {
  const { data, currentUser, activeSubscription } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [sport, setSport] = useState<string>(params.get('sport') ?? 'ALL');
  const sub = activeSubscription(currentUser!.id);
  const plans = data.plans.filter((p) => p.active).filter((p) => sport === 'ALL' || p.sportIds.length === 0 || p.sportIds.includes(sport));
  // "Được chọn nhiều nhất" tính theo số đăng ký thực tế
  const popularId = data.plans.reduce((best, p) => {
    const n = data.subscriptions.filter((s) => s.planId === p.id).length;
    return n > best.n ? { id: p.id, n } : best;
  }, { id: '', n: -1 }).id;
  const daysLeft = sub ? dayjs(sub.endDate).diff(dayjs(), 'day') : 0;

  return (
    <Page title="Gói thành viên" subtitle="All-access dùng mọi bộ môn. Gói theo môn rẻ hơn nếu bạn chỉ tập 1–2 môn. Thanh toán online, kích hoạt ngay." noCard>
      <div className="sc-filter" style={{ marginBottom: 0 }}>
        <button type="button" className={`sc-filter-btn ${sport === 'ALL' ? 'on' : ''}`} onClick={() => setSport('ALL')}>Tất cả gói</button>
        {data.sports.map((s) => (
          <button key={s.id} type="button" className={`sc-filter-btn ${sport === s.id ? 'on' : ''}`} onClick={() => setSport(s.id)}>{s.name}</button>
        ))}
      </div>

      <div className="sc-plans">
        {plans.map((p) => {
          const current = sub?.planId === p.id;
          const popular = p.id === popularId;
          const perMonth = Math.round((p.price / p.durationDays) * 30);
          const months = Math.round(p.durationDays / 30);
          const scope = p.sportIds.length === 0 ? `Mọi bộ môn · ${data.sports.length} môn` : p.sportIds.map((id) => data.sports.find((x) => x.id === id)?.name).filter(Boolean).join(' + ');
          return (
            <div key={p.id} className={`sc-plan ${popular ? 'hot' : ''} ${current ? 'current' : ''}`}>
              <div className="sc-plan-flag">{current ? `Gói của bạn · còn ${daysLeft} ngày` : popular ? 'Được chọn nhiều nhất' : ' '}</div>
              <h3>{p.name}</h3>
              <div className="sc-plan-scope">{scope}</div>
              <div className="sc-plan-price">{fmtMoney(p.price)}</div>
              <div className="sc-plan-per">{months >= 12 ? '12 tháng' : months > 1 ? `${months} tháng` : `${p.durationDays} ngày`}{months > 1 ? ` · ${fmtMoney(perMonth)}/tháng` : ''}</div>
              <ul className="sc-plan-list">
                {benefitsOf(p.benefits).map((b) => <li key={b}>{b}</li>)}
                {p.courtDiscount > 0 && <li className="hl">Giảm {p.courtDiscount}% giá thuê sân</li>}
              </ul>
              <button type="button" className={`sc-plan-btn ${popular || current ? 'solid' : ''}`} onClick={() => navigate(`/member/checkout/plan/${p.id}`)}>
                {current ? 'Gia hạn gói này' : sub ? 'Chuyển sang gói này' : 'Đăng ký gói này'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="sc-plans-foot">
        <span>Chưa có gói vẫn thuê sân được theo giờ — <Link to="/member/courts">xem sân trống</Link>.</span>
        <span>Đổi gói giữa chừng: số ngày còn lại được quy đổi vào gói mới. Hỏi lễ tân nếu cần bảo lưu.</span>
      </div>
    </Page>
  );
}
