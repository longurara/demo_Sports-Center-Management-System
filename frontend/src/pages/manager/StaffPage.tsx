import { useState } from 'react';
import { Alert, Badge, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import SportTag from '../../components/SportTag';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import { useApp } from '../../store/AppContext';
import { activeCoachClasses, classPhase, coachSportIds } from '../../utils/classes';
import type { Role, User } from '../../types';

/** Quản lý Coach / Receptionist (UC_1.7): tạo account + profile, vô hiệu hóa; tab duyệt chuyên môn HLV (UC_1.14). */
export default function StaffPage({ role }: { role: Extract<Role, 'COACH' | 'RECEPTIONIST'> }) {
  const { data, add, update, log, notify, nameOf } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();
  const isCoach = role === 'COACH';
  const title = isCoach ? 'Huấn luyện viên' : 'Nhân viên lễ tân';
  const rows = data.users.filter((u) => u.role === role);
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const specs = data.coachSpecializations.map((s) => ({ ...s, coach: data.users.find((u) => u.id === s.coachId) })).sort((a, b) => (a.status === 'PENDING' ? -1 : 1) - (b.status === 'PENDING' ? -1 : 1) || b.createdAt.localeCompare(a.createdAt));

  const openModal = (u?: User) => { setEditing(u ?? null); form.resetFields(); if (u) form.setFieldsValue(u); setOpen(true); };
  const save = (v: Partial<User> & { sportIds?: string[] }) => {
    const { sportIds, ...rest } = v;
    if (editing) { update('users', editing.id, rest); log('UPDATE_USER', 'Account', editing.id, `Cập nhật ${title.toLowerCase()} ${v.fullName}`); }
    else {
      const u = add('users', { ...(rest as User), role, status: 'ACTIVE', createdAt: dayjs().format('YYYY-MM-DD') });
      // Manager tạo Coach có thể duyệt sẵn chuyên môn ban đầu
      (sportIds ?? []).forEach((sid) => add('coachSpecializations', { coachId: u.id, sportId: sid, status: 'APPROVED', createdAt: now, reviewedAt: now, reviewedBy: 'u1', note: 'Manager tạo tài khoản' }));
      log('CREATE_USER', 'Account', u.id, `Tạo tài khoản ${title.toLowerCase()} ${u.fullName} (kèm ${role.toLowerCase()}_profile)`);
    }
    message.success('Đã lưu'); setOpen(false);
  };

  /** Vô hiệu hóa Coach đang có lớp (BR_1.15): OPEN/PENDING → PENDING_APPROVAL không coach + notify; ONGOING → chặn. */
  const toggle = (u: User) => {
    const next = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (next === 'INACTIVE' && isCoach) {
      const ongoing = data.classes.filter((c) => c.coachId === u.id && classPhase(c) === 'ONGOING');
      if (ongoing.length) { message.error(`HLV đang dạy ${ongoing.length} lớp ONGOING (${ongoing.map((c) => c.name).join(', ')}) — phân công HLV mới trước`); return; }
      data.classes.filter((c) => c.coachId === u.id && (c.status === 'OPEN' || c.status === 'PENDING_APPROVAL')).forEach((c) => {
        update('classes', c.id, { coachId: undefined, status: 'PENDING_APPROVAL' });
        data.enrollments.filter((e) => e.classId === c.id && e.status === 'ENROLLED').forEach((e) => notify(e.memberId, 'Lớp đang tìm HLV thay thế', `Lớp ${c.name} tạm về trạng thái chờ duyệt, trung tâm đang tìm HLV mới.`));
        notify('u1', 'Lớp cần HLV mới', `Lớp ${c.name} mất HLV do vô hiệu hóa ${u.fullName}.`);
      });
    }
    update('users', u.id, { status: next });
    log(next === 'INACTIVE' ? 'DISABLE_USER' : 'ENABLE_USER', 'Account', u.id, `${next === 'INACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'} ${u.fullName}`);
  };

  const review = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const s = data.coachSpecializations.find((x) => x.id === id)!;
    update('coachSpecializations', id, { status, reviewedAt: now, reviewedBy: 'u1' });
    notify(s.coachId, status === 'APPROVED' ? 'Chuyên môn được duyệt' : 'Chuyên môn bị từ chối', `Bộ môn ${data.sports.find((x) => x.id === s.sportId)?.name}${status === 'REJECTED' ? ' — bạn có thể đăng ký lại.' : ' — bạn đã có thể đăng ký dạy lớp.'}`);
    log(status === 'APPROVED' ? 'APPROVE_SPECIALIZATION' : 'REJECT_SPECIALIZATION', 'CoachSpecialization', id, `${status === 'APPROVED' ? 'Duyệt' : 'Từ chối'} chuyên môn ${data.sports.find((x) => x.id === s.sportId)?.name} của ${nameOf(s.coachId)}`);
    message.success('Đã cập nhật');
  };

  const list = (
    <Table rowKey="id" dataSource={rows} columns={[
      { title: title, dataIndex: 'fullName', render: (_, r) => <UserCell user={r} /> },
      { title: 'SĐT', dataIndex: 'phone' },
      ...(isCoach ? [
        { title: 'Chuyên môn đã duyệt', render: (_: unknown, r: User) => { const ids = coachSportIds(data, r.id); return ids.length ? <Space wrap size={[4, 4]}>{ids.map((id) => <SportTag key={id} id={id} size="small" />)}</Space> : <span style={{ color: '#9a968c' }}>Chưa có</span>; } },
        { title: 'Chứng chỉ · KN', render: (_: unknown, r: User) => <span>{r.specialty}{r.experience ? ` · ${r.experience}` : ''}</span> },
        { title: 'Lớp phụ trách', render: (_: unknown, r: User) => activeCoachClasses(data, r.id).length },
      ] : [{ title: 'Ghi chú (staff_notes)', dataIndex: 'staffNotes', render: (v: string) => v || <span style={{ color: '#9a968c' }}>—</span> }]),
      { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
      { title: '', render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openModal(r)}>Sửa</Button>
          <Popconfirm title={r.status === 'ACTIVE' ? 'Vô hiệu hóa tài khoản?' : 'Kích hoạt lại?'} onConfirm={() => toggle(r)}>
            <Button size="small" danger={r.status === 'ACTIVE'}>{r.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}</Button>
          </Popconfirm>
        </Space>
      ) },
    ]} />
  );

  return (
    <Page title={`Quản lý ${title.toLowerCase()}`} subtitle={`${rows.length} tài khoản · account + ${role.toLowerCase()}_profile tạo cùng transaction`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tạo tài khoản</Button>}>
      {isCoach ? (
        <Tabs items={[
          { key: 'list', label: 'Danh sách HLV', children: list },
          { key: 'specs', label: <Badge count={specs.filter((s) => s.status === 'PENDING').length} size="small" offset={[10, 0]}>Duyệt chuyên môn</Badge>, children: (
            <>
              <Alert type="info" showIcon style={{ marginBottom: 12 }} title="Mỗi lần đăng ký là một record; REJECTED được đăng ký lại; mỗi (HLV, bộ môn) tối đa một PENDING/APPROVED. Chỉ dạy bộ môn APPROVED (BR_1.12)." />
              <Table rowKey="id" dataSource={specs} pagination={{ pageSize: 10 }} columns={[
                { title: 'HLV', render: (_, s) => <UserCell user={s.coach} sub={s.coach?.specialty} /> },
                { title: 'Bộ môn', render: (_, s) => <SportTag id={s.sportId} /> },
                { title: 'Ghi chú', dataIndex: 'note', render: (v) => v || '—' },
                { title: 'Gửi lúc', dataIndex: 'createdAt' },
                { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag value={v} /> },
                { title: 'Duyệt', render: (_, s) => s.reviewedAt ? <span style={{ fontSize: 12, color: '#7a776f' }}>{nameOf(s.reviewedBy)} · {s.reviewedAt}</span> : '' },
                { title: '', render: (_, s) => s.status === 'PENDING' && <Space><Button size="small" type="primary" onClick={() => review(s.id, 'APPROVED')}>Duyệt</Button><Button size="small" danger onClick={() => review(s.id, 'REJECTED')}>Từ chối</Button></Space> },
              ]} />
            </>
          ) },
        ]} />
      ) : list}
      <Modal title={editing ? `Cập nhật ${title.toLowerCase()}` : `Tạo tài khoản ${title.toLowerCase()}`} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="phone" label="SĐT" rules={[{ required: true }]}><Input /></Form.Item>
          {!editing && <Form.Item name="password" label="Mật khẩu tạm" rules={[{ required: true }]}><Input.Password /></Form.Item>}
          {isCoach && <>
            {!editing && <Form.Item name="sportIds" label="Chuyên môn duyệt sẵn (tùy chọn)" extra="HLV vẫn có thể tự đăng ký thêm bộ môn sau"><Select mode="multiple" placeholder="Chọn bộ môn" options={data.sports.filter((s) => !s.deletedAt).map((sp) => ({ value: sp.id, label: `${sp.icon} ${sp.name}` }))} /></Form.Item>}
            {editing && <div style={{ marginBottom: 12 }}>Chuyên môn: <Space wrap size={[4, 4]}>{coachSportIds(data, editing.id).map((id) => <SportTag key={id} id={id} size="small" />)}</Space> <Tag style={{ marginLeft: 6 }}>duyệt qua tab Duyệt chuyên môn</Tag></div>}
            <Form.Item name="specialty" label="Chứng chỉ"><Input placeholder="VD: NASM-CPT" /></Form.Item>
            <Form.Item name="experience" label="Kinh nghiệm"><Input placeholder="VD: 5 năm" /></Form.Item>
            <Form.Item name="bio" label="Giới thiệu"><Input.TextArea rows={3} /></Form.Item>
          </>}
          <Form.Item name="staffNotes" label="Ghi chú nội bộ (staff_notes — chỉ Manager sửa)"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
