import { useState } from 'react';
import { Alert, Button, Card, Col, Popconfirm, Radio, Row, Select, Space, Table, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { DAY_NAMES, fmtMoney, useApp } from '../../store/AppContext';
import { memberConflict, seatsLeft } from '../../utils/conflicts';
import { nextInvoiceNo } from '../../utils/invoice';

export default function Enrollments() {
  const { data, add, update, log, notify, nameOf, membershipStatus, currentUser } = useApp();
  const [params] = useSearchParams();
  const [memberId, setMemberId] = useState<string | undefined>(params.get('member') ?? undefined);
  const [classId, setClassId] = useState<string | undefined>();
  const [method, setMethod] = useState<'CASH' | 'BANK' | 'VNPAY'>('CASH');

  const cls = data.classes.find((c) => c.id === classId);
  const st = memberId ? membershipStatus(memberId) : undefined;
  const errors: string[] = [];
  if (memberId && cls) {
    if (st === 'EXPIRED' || st === 'NONE') errors.push('Gói thành viên đã hết hạn / chưa có — cần gia hạn trước.');
    if (seatsLeft(data, cls.id) <= 0) errors.push('Lớp đã đủ sĩ số.');
    if (data.enrollments.some((e) => e.memberId === memberId && e.classId === cls.id && e.status === 'ACTIVE')) errors.push('Thành viên đã đăng ký lớp này.');
    const conflict = memberConflict(data, memberId, cls.id);
    if (conflict) errors.push(`Trùng lịch với lớp "${conflict.name}" đã đăng ký.`);
  }

  const enroll = () => {
    if (!memberId || !cls) return;
    add('enrollments', { classId: cls.id, memberId, enrolledAt: dayjs().format('YYYY-MM-DD'), status: 'ACTIVE' });
    add('payments', { invoiceNo: nextInvoiceNo(data.payments), memberId, amount: cls.price, method, type: 'CLASS', refName: cls.name, paidAt: dayjs().format('YYYY-MM-DD HH:mm'), createdBy: currentUser!.id });
    log('ENROLL', 'Enrollment', cls.id, `Đăng ký lớp ${cls.name} cho ${nameOf(memberId)} - thu ${fmtMoney(cls.price)}`);
    notify(memberId, 'Đăng ký lớp thành công', `Bạn đã được đăng ký lớp ${cls.name}.`);
    message.success('Đăng ký lớp thành công, đã tạo hóa đơn'); setClassId(undefined);
  };

  const cancel = (id: string, name: string) => {
    update('enrollments', id, { status: 'CANCELLED' });
    log('CANCEL_ENROLL', 'Enrollment', id, `Hủy lớp ${name} cho ${nameOf(memberId)}`);
    message.success('Đã hủy đăng ký');
  };

  const mine = data.enrollments.filter((e) => e.memberId === memberId);

  return (
    <Page title="Đăng ký / hủy lớp cho thành viên" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Thành viên">
            <Select showSearch optionFilterProp="label" placeholder="Tìm theo tên / SĐT" style={{ width: '100%' }} value={memberId} onChange={(v) => { setMemberId(v); setClassId(undefined); }}
              options={data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} />
            {memberId && <div style={{ marginTop: 12 }}>Trạng thái gói: <StatusTag value={st} /></div>}
          </Card>
          {memberId && (
            <Card title="Lớp đã đăng ký" style={{ marginTop: 16 }}>
              <Table size="small" rowKey="id" pagination={false} dataSource={mine} columns={[
                { title: 'Lớp', render: (_, r) => data.classes.find((c) => c.id === r.classId)?.name },
                { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
                { title: '', render: (_, r) => r.status === 'ACTIVE' && <Popconfirm title="Hủy đăng ký lớp này?" onConfirm={() => cancel(r.id, data.classes.find((c) => c.id === r.classId)?.name ?? '')}><Button size="small" danger>Hủy</Button></Popconfirm> },
              ]} />
            </Card>
          )}
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Đăng ký lớp mới">
            {!memberId ? <Alert type="info" title="Chọn thành viên trước" /> : (
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <Select placeholder="Chọn lớp" style={{ width: '100%' }} value={classId} onChange={setClassId}
                  options={data.classes.filter((c) => c.status === 'OPEN').map((c) => ({ value: c.id, label: `${c.name} · HLV ${nameOf(c.coachId)} · còn ${seatsLeft(data, c.id)} chỗ · ${fmtMoney(c.price)}` }))} />
                {cls && (
                  <div>
                    <b>Lịch:</b> {data.schedules.filter((s) => s.classId === cls.id).map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ')}
                  </div>
                )}
                {errors.map((e) => <Alert key={e} type="error" showIcon title={e} />)}
                {cls && errors.length === 0 && <>
                  <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)} options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Chuyển khoản' }, { value: 'VNPAY', label: 'VNPay' }]} />
                  <Button type="primary" size="large" onClick={enroll}>Đăng ký & thu {fmtMoney(cls.price)}</Button>
                </>}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
