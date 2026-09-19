import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { fmtMoney, useApp } from '../../store/AppContext';

/** Gói thành viên (UC_1.9): thêm MEMBERSHIP item vào đơn đang soạn; đang có gói → chỉ gia hạn cùng gói, nối từ ngày hết hạn. */
export default function MemberPlans() {
  const { data, currentUser, activeSubscription, cart, addToCart } = useApp();
  const navigate = useNavigate();
  const sub = activeSubscription(currentUser!.id);
  const plans = data.plans.filter((p) => p.active && !p.deletedAt);
  const popularId = data.plans.reduce((best, p) => { const n = data.subscriptions.filter((s) => s.planId === p.id).length; return n > best.n ? { id: p.id, n } : best; }, { id: '', n: -1 }).id;
  const daysLeft = sub ? dayjs(sub.endDate).diff(dayjs(), 'day') : 0;
  const inCart = cart.lines.some((l) => l.type === 'MEMBERSHIP');

  const add = (p: typeof plans[number]) => {
    const start = sub ? dayjs(sub.endDate) : dayjs();
    addToCart({ type: 'MEMBERSHIP', planId: p.id, name: `Gói ${p.name}`, detail: `${sub ? 'Gia hạn nối từ' : 'Kích hoạt từ'} ${start.format('DD/MM/YYYY')} → ${start.add(p.durationDays, 'day').format('DD/MM/YYYY')} · ${p.durationDays} ngày` });
    message.success('Đã thêm gói vào đơn đang soạn'); navigate('/member/checkout');
  };

  return (
    <Page title="Gói thành viên" subtitle="Không cần gói vẫn đặt sân và đăng ký lớp. Gói thêm quyền lợi: vào gym, giảm giá đặt sân & học phí, slot sân miễn phí. Thanh toán bằng ví." noCard>
      <div className="sc-plans">
        {plans.map((p) => {
          const current = sub?.planId === p.id;
          const popular = p.id === popularId;
          const perMonth = Math.round((p.price / p.durationDays) * 30);
          const months = Math.round(p.durationDays / 30);
          const locked = !!sub && !current;
          return (
            <div key={p.id} className={`sc-plan ${popular ? 'hot' : ''} ${current ? 'current' : ''}`} style={locked ? { opacity: .6 } : undefined}>
              <div className="sc-plan-flag">{current ? `Gói của bạn · còn ${daysLeft} ngày` : popular ? 'Được chọn nhiều nhất' : ' '}</div>
              <h3>{p.name}</h3>
              <div className="sc-plan-scope">{p.description}</div>
              <div className="sc-plan-price">{fmtMoney(p.price)}</div>
              <div className="sc-plan-per">{months >= 12 ? '12 tháng' : months > 1 ? `${months} tháng` : `${p.durationDays} ngày`}{months > 1 ? ` · ${fmtMoney(perMonth)}/tháng` : ''}</div>
              <ul className="sc-plan-list">
                <li className={p.gymAccess ? 'hl' : ''}>{p.gymAccess ? 'Vào gym miễn phí (đặt slot, không trừ tiền)' : 'Không bao gồm gym'}</li>
                <li className={p.bookingDiscountPct ? 'hl' : ''}>Giảm {p.bookingDiscountPct}% đặt sân / phòng</li>
                <li className={p.classDiscountPct ? 'hl' : ''}>Giảm {p.classDiscountPct}% học phí lớp</li>
                <li>{p.freeBookingSlotsPerMonth ? `${p.freeBookingSlotsPerMonth} slot sân miễn phí mỗi tháng` : 'Không có slot miễn phí'}</li>
              </ul>
              <button type="button" className={`sc-plan-btn ${popular || current ? 'solid' : ''}`} disabled={locked || inCart} title={locked ? 'Đang có gói khác còn hiệu lực — đổi gói sau khi hết hạn / hủy' : inCart ? 'Đơn đã có 1 dòng membership' : ''} onClick={() => add(p)}>
                {current ? 'Gia hạn gói này' : locked ? 'Không đổi khi còn gói' : 'Đăng ký gói này'}
              </button>
            </div>
          );
        })}
      </div>
      <div className="sc-plans-foot">
        <span>Gia hạn nối tiếp từ ngày hết hạn; gói mua trong cùng đơn chưa giảm giá cho các dòng khác của đơn đó.</span>
        <span>Hủy gói: mất quyền lợi ngay, không hoàn tiền. <Link to="/member/membership">Gói của tôi</Link></span>
      </div>
    </Page>
  );
}
