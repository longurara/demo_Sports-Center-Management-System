import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Select, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';

/** Coach đăng ký bộ môn chuyên môn (UC_1.13, BR_1.12): mỗi lần là một record; REJECTED được gửi lại; chỉ dạy bộ môn APPROVED. */
export default function Specializations() {
  const { data, currentUser, add, notify, log, nameOf } = useApp();
  const me = currentUser!;
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const mine = data.coachSpecializations.filter((s) => s.coachId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const blocked = new Set(mine.filter((s) => s.status === 'PENDING' || s.status === 'APPROVED').map((s) => s.sportId));
  const approved = mine.filter((s) => s.status === 'APPROVED');

  const submit = (v: { sportId: string; note?: string }) => {
    const s = add('coachSpecializations', { coachId: me.id, sportId: v.sportId, status: 'PENDING', note: v.note, createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    data.users.filter((u) => u.role === 'MANAGER').forEach((u) => notify(u.id, 'Yêu cầu duyệt chuyên môn', `${me.fullName} đăng ký bộ môn ${data.sports.find((x) => x.id === v.sportId)?.name}.`));
    log('REQUEST_SPECIALIZATION', 'CoachSpecialization', s.id, `${me.fullName} đăng ký chuyên môn ${data.sports.find((x) => x.id === v.sportId)?.name}`);
    message.success('Đã gửi, chờ Manager duyệt'); setOpen(false); form.resetFields();
  };

  return (
    <Page title="Chuyên môn của tôi" subtitle="Chỉ được đăng ký dạy / được phân công lớp thuộc bộ môn đã duyệt. Bị từ chối thì gửi lại được." extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Đăng ký bộ môn</Button>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Đang được dạy">
            {approved.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{approved.map((s) => <SportTag key={s.id} id={s.sportId} />)}</div> : <Alert type="warning" showIcon title="Chưa có bộ môn nào được duyệt" />}
            <div style={{ fontSize: 12, color: '#9a968c', marginTop: 12 }}>Chứng chỉ: {me.specialty ?? '—'} · Kinh nghiệm: {me.experience ?? '—'}</div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Lịch sử đăng ký">
            <Table size="small" rowKey="id" pagination={false} dataSource={mine} columns={[
              { title: 'Bộ môn', render: (_, s) => <SportTag id={s.sportId} /> },
              { title: 'Ghi chú', dataIndex: 'note', render: (v) => v || '—' },
              { title: 'Gửi lúc', dataIndex: 'createdAt' },
              { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
              { title: 'Xét duyệt', render: (_, s) => s.reviewedAt ? <span style={{ fontSize: 12, color: '#7a776f' }}>{nameOf(s.reviewedBy)} · {s.reviewedAt}</span> : <Tag>Chờ</Tag> },
            ]} />
          </Card>
        </Col>
      </Row>
      <Modal title="Đăng ký bộ môn chuyên môn" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Gửi Manager duyệt">
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="sportId" label="Bộ môn" rules={[{ required: true }]}><Select options={data.sports.filter((s) => !s.deletedAt).map((s) => ({ value: s.id, label: `${s.icon} ${s.name}`, disabled: blocked.has(s.id) }))} /></Form.Item>
          <Form.Item name="note" label="Chứng chỉ / kinh nghiệm liên quan"><Input.TextArea rows={3} placeholder="VD: Chứng chỉ ITF Level 1 (2024), 3 năm dạy phong trào" /></Form.Item>
          <div style={{ fontSize: 12, color: '#9a968c' }}>Mỗi bộ môn tối đa một yêu cầu PENDING/APPROVED. Bộ môn đã duyệt hoặc đang chờ bị mờ.</div>
        </Form>
      </Modal>
    </Page>
  );
}
