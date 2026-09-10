import { Button, Card, Space, Table, Tag } from 'antd';
import { DownloadOutlined, MailOutlined, PrinterOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from './Page';
import { labelOf } from './StatusTag';
import { fmtMoney, useApp } from '../store/AppContext';
import { message } from 'antd';

const VAT = 0.08;

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, userById, nameOf } = useApp();
  const p = data.payments.find((x) => x.id === id);
  if (!p) return <Page title="Không tìm thấy hóa đơn"><Button onClick={() => navigate(-1)}>Quay lại</Button></Page>;
  const m = userById(p.memberId);
  const net = Math.round(p.amount / (1 + VAT));
  const vat = p.amount - net;
  const detail = p.type === 'PLAN'
    ? (() => { const pl = data.plans.find((x) => x.name === p.refName); return pl ? `Thời hạn ${pl.durationDays} ngày · ${pl.benefits}` : ''; })()
    : (() => { const c = data.classes.find((x) => x.name === p.refName); return c ? `HLV ${nameOf(c.coachId)} · ${dayjs(c.startDate).format('DD/MM/YYYY')} → ${dayjs(c.endDate).format('DD/MM/YYYY')}` : ''; })();

  return (
    <Page title={`Hóa đơn ${p.invoiceNo}`} subtitle={`Phát hành ${dayjs(p.paidAt).format('HH:mm DD/MM/YYYY')} · ${labelOf(p.method)}`} extra={
      <Space>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
        <Button icon={<MailOutlined />} onClick={() => message.success(`Đã gửi hóa đơn tới ${m?.email} (giả lập)`)}>Gửi email</Button>
        <Button icon={<DownloadOutlined />} onClick={() => window.print()}>Xuất PDF</Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>In hóa đơn</Button>
      </Space>
    } noCard>
      <Card style={{ maxWidth: 760, margin: '0 auto' }} styles={{ body: { padding: 0 } }} id="invoice">
        <div style={{ background: 'linear-gradient(135deg,#0b1220,#1d4ed8)', color: '#fff', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}><ThunderboltFilled /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.3 }}>SPORTS CENTER</div>
              <div style={{ fontSize: 12, opacity: .75 }}>123 Đường Thể Thao, P. Hiệp Phú, TP. Thủ Đức, TP.HCM</div>
              <div style={{ fontSize: 12, opacity: .75 }}>Hotline 1900 1234 · MST 0312 345 678</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, opacity: .7, letterSpacing: '.1em' }}>HÓA ĐƠN</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 20 }}>{p.invoiceNo}</div>
            <Tag color="green" style={{ marginTop: 4, marginRight: 0 }}>ĐÃ THANH TOÁN</Tag>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '.08em', marginBottom: 6 }}>KHÁCH HÀNG</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{m?.fullName}</div>
              <div style={{ color: '#475569', fontSize: 13 }}>Mã TV: {p.memberId.toUpperCase()}</div>
              <div style={{ color: '#475569', fontSize: 13 }}>{m?.phone} · {m?.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '.08em', marginBottom: 6 }}>THÔNG TIN THANH TOÁN</div>
              <div style={{ fontSize: 13, color: '#475569' }}>Ngày: <b style={{ color: '#0f172a' }}>{dayjs(p.paidAt).format('DD/MM/YYYY HH:mm')}</b></div>
              <div style={{ fontSize: 13, color: '#475569' }}>Phương thức: <b style={{ color: '#0f172a' }}>{labelOf(p.method)}</b></div>
              <div style={{ fontSize: 13, color: '#475569' }}>Thu ngân: <b style={{ color: '#0f172a' }}>{p.createdBy === p.memberId ? 'Thanh toán online' : nameOf(p.createdBy)}</b></div>
            </div>
          </div>

          <Table size="middle" pagination={false} rowKey="id" dataSource={[p]} columns={[
            { title: 'STT', render: () => 1, width: 56 },
            { title: 'Mô tả', render: () => <><b>{labelOf(p.type)}: {p.refName}</b><div style={{ fontSize: 12, color: '#64748b' }}>{detail}</div></> },
            { title: 'SL', render: () => 1, width: 56, align: 'center' },
            { title: 'Đơn giá', render: () => fmtMoney(net), align: 'right', width: 140 },
            { title: 'Thành tiền', render: () => fmtMoney(net), align: 'right', width: 140 },
          ]} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <div style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#475569' }}><span>Tạm tính</span><span>{fmtMoney(net)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#475569' }}><span>Thuế GTGT ({VAT * 100}%)</span><span>{fmtMoney(vat)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#475569' }}><span>Giảm giá</span><span>0 ₫</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #0f172a', marginTop: 4, fontSize: 18, fontWeight: 700 }}><span>Tổng cộng</span><span>{fmtMoney(p.amount)}</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'end', marginTop: 24, paddingTop: 20, borderTop: '1px dashed #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
              <b style={{ color: '#0f172a' }}>Điều khoản</b><br />
              • Gói thành viên/học phí đã thanh toán không hoàn lại, có thể bảo lưu tối đa 30 ngày khi có xác nhận y tế.<br />
              • Vui lòng mang theo mã thành viên khi check-in. Hỗ trợ: 1900 1234 · support@sportscenter.vn
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 84, height: 84, borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: 6 }}>
                {Array.from({ length: 49 }).map((_, i) => <span key={i} style={{ background: ((i * 7919 + p.invoiceNo.length * 31) % 3) ? '#0f172a' : 'transparent', borderRadius: 1 }} />)}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Mã tra cứu</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: 28 }}>
            <div><b>Khách hàng</b><div style={{ fontSize: 11, color: '#94a3b8' }}>(Ký, ghi rõ họ tên)</div><div style={{ height: 56 }} />{m?.fullName}</div>
            <div><b>Thu ngân</b><div style={{ fontSize: 11, color: '#94a3b8' }}>(Ký, ghi rõ họ tên)</div><div style={{ height: 56 }} />{p.createdBy === p.memberId ? 'Hệ thống' : nameOf(p.createdBy)}</div>
          </div>
        </div>
      </Card>
    </Page>
  );
}
