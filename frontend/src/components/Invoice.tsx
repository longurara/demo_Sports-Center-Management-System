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

const VAT = 0.08;
export const COMPANY = {
  name: 'CÔNG TY TNHH TRUNG TÂM THỂ THAO SPORTS CENTER',
  short: 'Sports Center',
  taxCode: '0312 345 678',
  address: '123 Đường Thể Thao, P. Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  phone: '1900 1234',
  email: 'billing@sportscenter.vn',
  bank: 'Vietcombank – CN Thủ Đức · STK 0071 000 123 456',
  invoiceSymbol: `1C${dayjs().format('YY')}TSC`, // ký hiệu hóa đơn điện tử: 1 = HĐ GTGT, C = có mã CQT
};

/** Bản thể hiện hóa đơn điện tử — bố cục theo mẫu hóa đơn GTGT (NĐ 123/2020), in được trên A4. */
export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById, nameOf, currentUser } = useApp();
  // Tờ A4 (794px) thu nhỏ theo bề rộng màn hình — điện thoại vẫn xem đúng bố cục bản in
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
  const p = data.payments.find((x) => x.id === id);
  // Thành viên chỉ xem được hóa đơn của chính mình
  if (!p || (currentUser?.role === 'MEMBER' && p.memberId !== currentUser.id)) return <Page title="Không tìm thấy hóa đơn"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const m = userById(p.memberId);
  const seq = p.invoiceNo.split('-')[2] ?? '0000';
  const taxCode = `M1-${dayjs(p.paidAt).format('YY')}-${(p.id + p.invoiceNo).split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16).toUpperCase().padStart(8, '0').slice(0, 8)}-${seq.padStart(11, '0')}`;
  const lookupUrl = `https://hoadon.sportscenter.vn/tra-cuu?ma=${taxCode}`;

  // Dòng hàng hóa: đơn vị tính, số lượng và đơn giá (chưa VAT). Số tiền lưu trong hệ thống là giá đã gồm VAT.
  const total = p.amount;
  const net = Math.round(total / (1 + VAT));
  const vat = total - net;
  let unit = 'Gói', qty = 1, listNet = net, desc = p.refName, note = '';
  if (p.type === 'PLAN') {
    const pl = data.plans.find((x) => x.name === p.refName);
    note = pl ? `Thời hạn ${pl.durationDays} ngày · ${pl.sportIds.length === 0 ? 'All-access (mọi bộ môn)' : pl.sportIds.map((s) => data.sports.find((x) => x.id === s)?.name).join(', ')}` : '';
    desc = `Gói thành viên ${p.refName}`;
  } else if (p.type === 'CLASS') {
    const c = data.classes.find((x) => x.name === p.refName);
    unit = 'Khóa';
    note = c ? `${data.sports.find((s) => s.id === c.sportId)?.name} · HLV ${nameOf(c.coachId)} · ${dayjs(c.startDate).format('DD/MM/YYYY')} → ${dayjs(c.endDate).format('DD/MM/YYYY')}` : '';
    desc = `Học phí lớp ${p.refName}`;
  } else {
    const r = data.rooms.find((x) => p.refName.startsWith(x.name));
    const tm = p.refName.match(/(\d{2}):00[–-](\d{2}):00/);
    unit = 'Giờ';
    qty = tm ? Math.max(1, Number(tm[2]) - Number(tm[1])) : 1;
    listNet = r ? Math.round((r.hourlyRate ?? 0) * qty / (1 + VAT)) : net;
    note = r ? `${r.location} · ${data.sports.find((s) => s.id === r.sportId)?.name}` : '';
    desc = `Thuê ${p.refName}`;
  }
  const discount = Math.max(0, listNet - net);
  const unitPrice = Math.round(listNet / qty);
  const online = p.createdBy === p.memberId;
  const base = `/${(currentUser?.role ?? 'member').toLowerCase()}`;

  const cell = { padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 13 } as const;
  const head = { ...cell, background: '#f1f5f9', fontWeight: 700, fontSize: 12, color: '#334155', borderBottom: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' } as const;
  const label = { fontSize: 12.5, color: '#64748b', width: 150, flexShrink: 0 } as const;
  const row = { display: 'flex', gap: 8, padding: '3px 0', fontSize: 13 } as const;

  return (
    <Page title={`Hóa đơn ${p.invoiceNo}`} subtitle={`Phát hành ${dayjs(p.paidAt).format('HH:mm DD/MM/YYYY')} · ${labelOf(p.method)} · Mã CQT ${taxCode}`} extra={
      <Space className="sc-no-print">
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        <Button icon={<MailOutlined />} onClick={() => message.success(`Đã gửi bản thể hiện hóa đơn tới ${m?.email} (giả lập)`)}>Gửi email</Button>
        <Button icon={<DownloadOutlined />} onClick={() => { message.info('Chọn "Save as PDF" trong hộp thoại in để tải file PDF', 3); setTimeout(() => window.print(), 300); }}>Tải PDF</Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>In hóa đơn</Button>
      </Space>
    } noCard>
      <div className="sc-invoice-wrap" ref={wrapRef}>
        <div className="sc-invoice-scaler" style={{ width: 794 * scale, height: sheetH * scale }}>
        <div className="sc-invoice" id="invoice" ref={sheetRef} style={{ transform: `scale(${scale})` }}>
          {/* ===== Header: đơn vị bán + số hóa đơn ===== */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#f97316)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}><ThunderboltFilled /></div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#334155' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', letterSpacing: .2 }}>{COMPANY.name}</div>
                <div>Mã số thuế: <b>{COMPANY.taxCode}</b></div>
                <div>Địa chỉ: {COMPANY.address}</div>
                <div>Điện thoại: {COMPANY.phone} · Email: {COMPANY.email}</div>
                <div>Số tài khoản: {COMPANY.bank}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12.5, lineHeight: 1.6, flexShrink: 0 }}>
              <div style={{ color: '#64748b' }}>Mẫu số: <b style={{ color: '#0f172a' }}>01GTKT0/001</b></div>
              <div style={{ color: '#64748b' }}>Ký hiệu: <b style={{ color: '#0f172a' }}>{COMPANY.invoiceSymbol}</b></div>
              <div style={{ color: '#64748b' }}>Số: <b style={{ color: '#dc2626', fontFamily: 'ui-monospace, monospace', fontSize: 16 }}>{seq.padStart(8, '0')}</b></div>
              <Tag color="green" icon={<CheckCircleFilled />} style={{ marginTop: 4, marginRight: 0 }}>ĐÃ THANH TOÁN</Tag>
            </div>
          </div>

          {/* ===== Title ===== */}
          <div style={{ textAlign: 'center', margin: '22px 0 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, color: '#0f172a' }}>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>
            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>(VAT INVOICE) · Bản thể hiện của hóa đơn điện tử</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ngày <b>{dayjs(p.paidAt).format('DD')}</b> tháng <b>{dayjs(p.paidAt).format('MM')}</b> năm <b>{dayjs(p.paidAt).format('YYYY')}</b></div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Mã của Cơ quan Thuế: <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: '#0f172a' }}>{taxCode}</span></div>
          </div>

          {/* ===== Buyer ===== */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '0 24px' }}>
            <div>
              <div style={row}><span style={label}>Họ tên người mua hàng</span><b>{m?.fullName}</b></div>
              <div style={row}><span style={label}>Tên đơn vị</span><span>Khách hàng cá nhân</span></div>
              <div style={row}><span style={label}>Mã số thuế</span><span style={{ color: '#94a3b8' }}>—</span></div>
              <div style={row}><span style={label}>Địa chỉ</span><span style={{ color: '#94a3b8' }}>—</span></div>
            </div>
            <div>
              <div style={row}><span style={label}>Mã thành viên</span><b style={{ fontFamily: 'ui-monospace, monospace' }}>{p.memberId.toUpperCase()}</b></div>
              <div style={row}><span style={label}>Điện thoại / Email</span><span>{m?.phone} · {m?.email}</span></div>
              <div style={row}><span style={label}>Hình thức thanh toán</span><b>{labelOf(p.method)}{online ? ' (online)' : ''}</b></div>
              <div style={row}><span style={label}>Số hóa đơn nội bộ</span><span style={{ fontFamily: 'ui-monospace, monospace' }}>{p.invoiceNo}</span></div>
            </div>
          </div>

          {/* ===== Items ===== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr>
                <th style={{ ...head, width: 44, textAlign: 'center' }}>STT</th>
                <th style={{ ...head, textAlign: 'left' }}>Tên hàng hóa, dịch vụ</th>
                <th style={{ ...head, width: 64, textAlign: 'center' }}>ĐVT</th>
                <th style={{ ...head, width: 70, textAlign: 'center' }}>Số lượng</th>
                <th style={{ ...head, width: 130, textAlign: 'right' }}>Đơn giá</th>
                <th style={{ ...head, width: 140, textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cell, textAlign: 'center' }}>1</td>
                <td style={cell}><b>{desc}</b>{note && <div style={{ fontSize: 12, color: '#64748b' }}>{note}</div>}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{unit}</td>
                <td style={{ ...cell, textAlign: 'center' }}>{qty}</td>
                <td style={{ ...cell, textAlign: 'right' }} className="sc-nowrap">{fmtMoney(unitPrice)}</td>
                <td style={{ ...cell, textAlign: 'right' }} className="sc-nowrap">{fmtMoney(listNet)}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td style={{ ...cell, textAlign: 'center' }}>2</td>
                  <td style={cell}>Chiết khấu thành viên<div style={{ fontSize: 12, color: '#64748b' }}>Ưu đãi gói thành viên áp dụng cho thuê sân</div></td>
                  <td style={{ ...cell, textAlign: 'center' }}>—</td>
                  <td style={{ ...cell, textAlign: 'center' }}>1</td>
                  <td style={{ ...cell, textAlign: 'right' }} className="sc-nowrap">−{fmtMoney(discount)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: '#16a34a' }} className="sc-nowrap">−{fmtMoney(discount)}</td>
                </tr>
              )}
              {Array.from({ length: discount > 0 ? 1 : 2 }).map((_, i) => <tr key={i}><td style={{ ...cell, height: 34 }} colSpan={6} /></tr>)}
            </tbody>
          </table>

          {/* ===== Totals ===== */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, maxWidth: 380 }}>
              <b style={{ color: '#0f172a' }}>Ghi chú</b><br />
              • Gói thành viên / học phí đã thanh toán không hoàn lại; bảo lưu tối đa 30 ngày khi có xác nhận y tế.<br />
              • Thuê sân: hủy trước giờ chơi ≥ 2 giờ được hoàn 100%.<br />
              • Vui lòng xuất trình mã thành viên khi check-in.
            </div>
            <div style={{ width: 320, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2e8f0' }}><span>Cộng tiền hàng</span><span className="sc-nowrap">{fmtMoney(net)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2e8f0' }}><span>Thuế suất GTGT</span><span>{VAT * 100}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e2e8f0' }}><span>Tiền thuế GTGT</span><span className="sc-nowrap">{fmtMoney(vat)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 17, fontWeight: 800, borderBottom: '2px solid #0f172a' }}><span>Tổng tiền thanh toán</span><span className="sc-nowrap">{fmtMoney(total)}</span></div>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 6, fontStyle: 'italic' }}>Số tiền viết bằng chữ: <b>{readMoney(total)}</b></div>
            </div>
          </div>

          {/* ===== Signatures ===== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 28, textAlign: 'center' }}>
            <div>
              <b>NGƯỜI MUA HÀNG</b>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>(Ký, ghi rõ họ tên)</div>
              <div style={{ height: 70 }} />
              <div style={{ fontWeight: 600 }}>{m?.fullName}</div>
            </div>
            <div>
              <b>NGƯỜI BÁN HÀNG</b>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>(Ký, ghi rõ họ tên)</div>
              <div style={{ margin: '10px auto 6px', width: 250, border: '1.5px solid #16a34a', borderRadius: 6, padding: '6px 10px', textAlign: 'left', fontSize: 11, color: '#166534', background: '#f0fdf4', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}><CheckCircleFilled /> Signature Valid</div>
                <div>Ký bởi: {COMPANY.name}</div>
                <div>Ký ngày: {dayjs(p.paidAt).format('DD/MM/YYYY HH:mm:ss')}</div>
              </div>
              <div style={{ fontWeight: 600 }}>{online ? 'Hệ thống thanh toán online' : nameOf(p.createdBy)}</div>
            </div>
          </div>

          {/* ===== Footer: tra cứu ===== */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 24, paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: 11.5, color: '#64748b' }}>
            <div style={{ lineHeight: 1.6 }}>
              Tra cứu hóa đơn điện tử tại <b style={{ color: '#2563eb' }}>hoadon.sportscenter.vn</b> · Mã tra cứu: <b style={{ fontFamily: 'ui-monospace, monospace', color: '#0f172a' }}>{taxCode}</b><br />
              Hóa đơn được khởi tạo từ hệ thống {COMPANY.short} Management System · Người lập: {online ? 'Tự động (cổng thanh toán)' : nameOf(p.createdBy)} · Trang 1/1
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <QRCodeSVG value={lookupUrl} size={72} level="M" />
              <div style={{ fontSize: 10, marginTop: 2 }}>Quét để tra cứu</div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div className="sc-no-print" style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
        Bản in theo khổ A4 · Số tiền trong hệ thống đã bao gồm {VAT * 100}% VAT · <a onClick={() => navigate(`${base}/payments`)}>Danh sách hóa đơn</a>
      </div>
    </Page>
  );
}
