import { useEffect, useRef, useState } from 'react';
import { Button, Space, Tag, message } from 'antd';
import { CheckCircleFilled, DownloadOutlined, MailOutlined, PrinterOutlined, ThunderboltFilled } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from './Page';
import { labelOf } from './StatusTag';
import { fmtMoney, useApp } from '../store/AppContext';
import { readMoney } from '../utils/money';
import { ITEM_TYPE_LABEL } from '../utils/pricing';

const VAT = 0.08;
export const COMPANY = {
  name: 'CÔNG TY TNHH TRUNG TÂM THỂ THAO SPORTS CENTER',
  short: 'Sports Center',
  taxCode: '0312 345 678',
  address: '123 Đường Thể Thao, P. Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  phone: '1900 1234',
  email: 'billing@sportscenter.vn',
  bank: 'Vietcombank – CN Thủ Đức · STK 0071 000 123 456',
  invoiceSymbol: `1C${dayjs().format('YY')}TSC`,
};

/** Bản thể hiện hóa đơn = Order (đầu hóa đơn) + order_items (dòng dịch vụ), số liệu lấy từ snapshot đã chốt (UC_3.6, BR_3.4). */
export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById, nameOf, currentUser } = useApp();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(1123);
  useEffect(() => {
    const calc = () => { setScale(Math.min(1, ((wrapRef.current?.clientWidth ?? 794)) / 794)); setSheetH(sheetRef.current?.offsetHeight ?? 1123); };
    calc();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calc) : null;
    if (ro && sheetRef.current) ro.observe(sheetRef.current);
    window.addEventListener('resize', calc);
    return () => { window.removeEventListener('resize', calc); ro?.disconnect(); };
  }, [id]);
  const o = data.orders.find((x) => x.id === id);
  if (!o || (currentUser?.role === 'MEMBER' && o.buyerId !== currentUser.id)) return <Page title="Không tìm thấy hóa đơn"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const items = data.orderItems.filter((it) => it.orderId === o.id).sort((a, b) => a.lineNumber - b.lineNumber);
  const m = userById(o.buyerId);
  const seq = o.orderNumber.split('-')[2] ?? '0000';
  const taxCode = `M1-${dayjs(o.paidAt).format('YY')}-${(o.id + o.orderNumber).split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16).toUpperCase().padStart(8, '0').slice(0, 8)}-${seq.padStart(11, '0')}`;
  const lookupUrl = `https://hoadon.sportscenter.vn/tra-cuu?ma=${taxCode}`;
  const net = Math.round(o.total / (1 + VAT));
  const vat = o.total - net;
  const online = o.paymentMethod === 'WALLET';
  const base = `/${(currentUser?.role ?? 'member').toLowerCase()}`;
  const unitOf = (t: string) => t === 'MEMBERSHIP' ? 'Kỳ' : t === 'COURSE_ENROLLMENT' ? 'Khóa' : t === 'FACILITY_PACKAGE' ? 'Gói' : 'Lượt';

  const cell = { padding: '7px 10px', borderBottom: '1px solid #e2ddd2', fontSize: 12.5 } as const;
  const head = { ...cell, background: '#f3f1ec', fontWeight: 700, fontSize: 11.5, color: '#3d3b35', borderBottom: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' } as const;
  const label = { fontSize: 12.5, color: '#7a776f', width: 150, flexShrink: 0 } as const;
  const row = { display: 'flex', gap: 8, padding: '3px 0', fontSize: 13 } as const;

  return (
    <Page title={`Hóa đơn ${o.orderNumber}`} subtitle={`Phát hành ${dayjs(o.paidAt).format('HH:mm DD/MM/YYYY')} · ${labelOf(o.paymentMethod)} · ${labelOf(o.status)}${o.refundedAmount ? ` (đã hoàn ${fmtMoney(o.refundedAmount)})` : ''}`} extra={
      <Space className="sc-no-print">
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        <Button icon={<MailOutlined />} onClick={() => message.success(`Đã gửi bản thể hiện hóa đơn tới ${m?.email ?? o.guestPhone} (giả lập)`)}>Gửi email</Button>
        <Button icon={<DownloadOutlined />} onClick={() => { message.info('Chọn "Save as PDF" trong hộp thoại in để tải file PDF', 3); setTimeout(() => window.print(), 300); }}>Tải PDF</Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>In hóa đơn</Button>
      </Space>
    } noCard>
      <div className="sc-invoice-wrap" ref={wrapRef}>
        <div className="sc-invoice-scaler" style={{ width: 794 * scale, height: sheetH * scale }}>
        <div className="sc-invoice" id="invoice" ref={sheetRef} style={{ transform: `scale(${scale})` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: '#d6f24b', color: '#14130f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}><ThunderboltFilled /></div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#3d3b35' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#14130f', letterSpacing: .2 }}>{COMPANY.name}</div>
                <div>Mã số thuế: <b>{COMPANY.taxCode}</b></div>
                <div>Địa chỉ: {COMPANY.address}</div>
                <div>Điện thoại: {COMPANY.phone} · Email: {COMPANY.email}</div>
                <div>Số tài khoản: {COMPANY.bank}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12.5, lineHeight: 1.6, flexShrink: 0 }}>
              <div style={{ color: '#7a776f' }}>Mẫu số: <b style={{ color: '#14130f' }}>01GTKT0/001</b></div>
              <div style={{ color: '#7a776f' }}>Ký hiệu: <b style={{ color: '#14130f' }}>{COMPANY.invoiceSymbol}</b></div>
              <div style={{ color: '#7a776f' }}>Số: <b style={{ color: '#dc2626', fontFamily: 'ui-monospace, monospace', fontSize: 16 }}>{seq.padStart(8, '0')}</b></div>
              <Tag color={o.status === 'PAID' ? 'green' : o.status === 'REFUNDED' ? 'red' : 'orange'} icon={<CheckCircleFilled />} style={{ marginTop: 4, marginRight: 0 }}>{o.status === 'PAID' ? 'ĐÃ THANH TOÁN' : o.status === 'REFUNDED' ? 'ĐÃ HOÀN TOÀN BỘ' : 'HOÀN MỘT PHẦN'}</Tag>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, color: '#14130f' }}>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>
            <div style={{ fontSize: 12, color: '#7a776f', fontStyle: 'italic' }}>(VAT INVOICE) · Bản thể hiện của hóa đơn điện tử</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ngày <b>{dayjs(o.paidAt).format('DD')}</b> tháng <b>{dayjs(o.paidAt).format('MM')}</b> năm <b>{dayjs(o.paidAt).format('YYYY')}</b></div>
            <div style={{ fontSize: 12, color: '#3d3b35', marginTop: 2 }}>Mã của Cơ quan Thuế: <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: '#14130f' }}>{taxCode}</span></div>
          </div>

          <div style={{ border: '1px solid #e2ddd2', borderRadius: 8, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '0 24px' }}>
            <div>
              <div style={row}><span style={label}>Họ tên người mua hàng</span><b>{m?.fullName ?? o.guestName}</b></div>
              <div style={row}><span style={label}>Tên đơn vị</span><span>{m ? 'Khách hàng cá nhân' : 'Khách vãng lai (guest)'}</span></div>
              <div style={row}><span style={label}>Mã số thuế</span><span style={{ color: '#9a968c' }}>—</span></div>
              <div style={row}><span style={label}>Địa chỉ</span><span>{m?.address ?? <span style={{ color: '#9a968c' }}>—</span>}</span></div>
            </div>
            <div>
              <div style={row}><span style={label}>Mã thành viên</span><b style={{ fontFamily: 'ui-monospace, monospace' }}>{o.buyerId?.toUpperCase() ?? '—'}</b></div>
              <div style={row}><span style={label}>Điện thoại / Email</span><span>{m ? `${m.phone} · ${m.email}` : o.guestPhone}</span></div>
              <div style={row}><span style={label}>Hình thức thanh toán</span><b>{labelOf(o.paymentMethod)}{online ? ' (online)' : ' (tại quầy)'}</b></div>
              <div style={row}><span style={label}>Số hóa đơn nội bộ</span><span style={{ fontFamily: 'ui-monospace, monospace' }}>{o.orderNumber}{o.couponCode ? ` · coupon ${o.couponCode}` : ''}</span></div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
            <thead>
              <tr>
                <th style={{ ...head, width: 36, textAlign: 'center' }}>STT</th>
                <th style={{ ...head, textAlign: 'left' }}>Tên hàng hóa, dịch vụ</th>
                <th style={{ ...head, width: 50, textAlign: 'center' }}>ĐVT</th>
                <th style={{ ...head, width: 110, textAlign: 'right' }}>Đơn giá</th>
                <th style={{ ...head, width: 100, textAlign: 'right' }}>Ưu đãi gói</th>
                <th style={{ ...head, width: 90, textAlign: 'right' }}>Coupon</th>
                <th style={{ ...head, width: 120, textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ ...cell, textAlign: 'center' }}>{it.lineNumber}</td>
                  <td style={cell}><b>{it.name}</b><div style={{ fontSize: 11.5, color: '#7a776f' }}>{ITEM_TYPE_LABEL[it.type]} · {it.detail}{it.refundedAmount > 0 && <span style={{ color: '#dc2626' }}> · đã hoàn {fmtMoney(it.refundedAmount)}</span>}</div></td>
                  <td style={{ ...cell, textAlign: 'center' }}>{unitOf(it.type)}</td>
                  <td style={{ ...cell, textAlign: 'right' }} className="sc-nowrap">{fmtMoney(it.unitPrice)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#16a34a' }} className="sc-nowrap">{it.membershipDiscount ? `−${fmtMoney(it.membershipDiscount)}` : '—'}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#16a34a' }} className="sc-nowrap">{it.couponDiscount ? `−${fmtMoney(it.couponDiscount)}` : '—'}</td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 600 }} className="sc-nowrap">{fmtMoney(it.total)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => <tr key={i}><td style={{ ...cell, height: 30 }} colSpan={7} /></tr>)}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#7a776f', lineHeight: 1.7, maxWidth: 380 }}>
              <b style={{ color: '#14130f' }}>Ghi chú</b><br />
              • Gói thành viên không hoàn tiền. Học phí hoàn 100% về ví nếu hủy trước ngày học đầu ≥ {data.settings.courseCancelDeadlineDays} ngày.<br />
              • Đặt sân/phòng: hủy trước giờ bắt đầu ≥ {data.settings.bookingCancelDeadlineHours} giờ được hoàn 100% về ví. Khách vãng lai không hoàn.<br />
              • Hóa đơn bất biến; hoàn tiền ghi nhận riêng từng dòng.
            </div>
            <div style={{ width: 320, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2ddd2' }}><span>Tổng giá gốc</span><span className="sc-nowrap">{fmtMoney(o.subtotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2ddd2', color: '#16a34a' }}><span>Ưu đãi membership</span><span className="sc-nowrap">−{fmtMoney(o.membershipDiscount)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2ddd2', color: '#16a34a' }}><span>Coupon{o.couponCode ? ` ${o.couponCode}` : ''}</span><span className="sc-nowrap">−{fmtMoney(o.couponDiscount)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2ddd2' }}><span>Cộng tiền hàng (chưa VAT)</span><span className="sc-nowrap">{fmtMoney(net)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2ddd2' }}><span>Thuế GTGT {VAT * 100}%</span><span className="sc-nowrap">{fmtMoney(vat)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 17, fontWeight: 800, borderBottom: '2px solid #14130f' }}><span>Tổng thanh toán</span><span className="sc-nowrap">{fmtMoney(o.total)}</span></div>
              {o.refundedAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626' }}><span>Đã hoàn về ví</span><span className="sc-nowrap">−{fmtMoney(o.refundedAmount)}</span></div>}
              <div style={{ fontSize: 12, color: '#3d3b35', marginTop: 6, fontStyle: 'italic' }}>Số tiền viết bằng chữ: <b>{readMoney(o.total)}</b></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24, textAlign: 'center' }}>
            <div>
              <b>NGƯỜI MUA HÀNG</b>
              <div style={{ fontSize: 11, color: '#9a968c' }}>(Ký, ghi rõ họ tên)</div>
              <div style={{ height: 60 }} />
              <div style={{ fontWeight: 600 }}>{m?.fullName ?? o.guestName}</div>
            </div>
            <div>
              <b>NGƯỜI BÁN HÀNG</b>
              <div style={{ fontSize: 11, color: '#9a968c' }}>(Ký, ghi rõ họ tên)</div>
              <div style={{ margin: '10px auto 6px', width: 250, border: '1.5px solid #16a34a', borderRadius: 6, padding: '6px 10px', textAlign: 'left', fontSize: 11, color: '#166534', background: '#f0fdf4', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}><CheckCircleFilled /> Signature Valid</div>
                <div>Ký bởi: {COMPANY.name}</div>
                <div>Ký ngày: {dayjs(o.paidAt).format('DD/MM/YYYY HH:mm:ss')}</div>
              </div>
              <div style={{ fontWeight: 600 }}>{online ? 'Hệ thống thanh toán online' : nameOf(o.createdBy)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 20, paddingTop: 12, borderTop: '1px solid #e2ddd2', fontSize: 11.5, color: '#7a776f' }}>
            <div style={{ lineHeight: 1.6 }}>
              Tra cứu hóa đơn điện tử tại <b style={{ color: '#0f4d34' }}>hoadon.sportscenter.vn</b> · Mã tra cứu: <b style={{ fontFamily: 'ui-monospace, monospace', color: '#14130f' }}>{taxCode}</b><br />
              Hóa đơn được khởi tạo từ hệ thống {COMPANY.short} Management System · Người lập: {online ? 'Tự động (ví điện tử)' : nameOf(o.createdBy)} · Trang 1/1
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <QRCodeSVG value={lookupUrl} size={72} level="M" />
              <div style={{ fontSize: 10, marginTop: 2 }}>Quét để tra cứu</div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div className="sc-no-print" style={{ textAlign: 'center', fontSize: 12, color: '#9a968c', marginTop: 12 }}>
        Bản in theo khổ A4 · Số tiền trong hệ thống đã bao gồm {VAT * 100}% VAT · <a onClick={() => navigate(`${base}/orders`)}>Danh sách hóa đơn</a>
      </div>
    </Page>
  );
}
