import { useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, List, Modal, Radio, Rate, Row, Select, Slider, Space, Table, Tabs, Tag, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import { entriesOf, entriesToString, fmtVal, metricDef, metricsFor } from '../../utils/results';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';

function useMyStudents() {
  const { data, currentUser } = useApp();
  const myClasses = data.classes.filter((c) => c.coachId === currentUser!.id && c.status === 'OPEN');
  const ids = myClasses.map((c) => c.id);
  const memberIds = Array.from(new Set(data.enrollments.filter((e) => ids.includes(e.classId) && e.status === 'ACTIVE').map((e) => e.memberId)));
  const students = memberIds.map((id) => data.users.find((u) => u.id === id)!);
  return { myClasses, students };
}

export function TrainingPlans() {
  const { data, currentUser, add, notify, log } = useApp();
  const { myClasses, students } = useMyStudents();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(!!params.get('member'));
  const [form] = Form.useForm();
  const target = Form.useWatch('target', form);
  const plans = data.trainingPlans.filter((p) => p.coachId === currentUser!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const save = (v: { target: 'class' | 'member'; classId?: string; memberId?: string; title: string; content: string }) => {
    const p = add('trainingPlans', { coachId: currentUser!.id, classId: v.target === 'class' ? v.classId : undefined, memberId: v.target === 'member' ? v.memberId : undefined, title: v.title, content: v.content, createdAt: dayjs().format('YYYY-MM-DD HH:mm'), source: 'MANUAL' });
    const targets = v.target === 'member' ? [v.memberId!] : data.enrollments.filter((e) => e.classId === v.classId && e.status === 'ACTIVE').map((e) => e.memberId);
    targets.forEach((m) => notify(m, 'Kế hoạch tập luyện mới', `HLV ${currentUser!.fullName} đã tạo kế hoạch: ${v.title}`));
    log('CREATE_PLAN', 'TrainingPlan', p.id, `Tạo kế hoạch "${v.title}"`);
    message.success('Đã tạo kế hoạch và thông báo cho học viên'); setOpen(false); form.resetFields();
  };

  return (
    <Page title="Kế hoạch tập luyện" subtitle="Tạo giáo án cho cả lớp hoặc kế hoạch cá nhân cho từng học viên" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.setFieldsValue({ target: params.get('member') ? 'member' : 'class', memberId: params.get('member') ?? undefined }); setOpen(true); }}>Tạo kế hoạch</Button>}>
      <Tabs items={[
        { key: 'class', label: 'Theo lớp', children: <List dataSource={plans.filter((p) => p.classId)} renderItem={(p) => <List.Item><List.Item.Meta title={<Space>{p.title}<Tag color="blue">{data.classes.find((c) => c.id === p.classId)?.name}</Tag><StatusTag value={p.source} /></Space>} description={<><div style={{ whiteSpace: 'pre-line' }}>{p.content}</div><small>{p.createdAt}</small></>} /></List.Item>} /> },
        { key: 'member', label: 'Cá nhân', children: <List dataSource={plans.filter((p) => p.memberId)} renderItem={(p) => <List.Item><List.Item.Meta title={<Space>{p.title}<Tag color="purple">{data.users.find((u) => u.id === p.memberId)?.fullName}</Tag><StatusTag value={p.source} /></Space>} description={<><div style={{ whiteSpace: 'pre-line' }}>{p.content}</div><small>{p.createdAt}</small></>} /></List.Item>} /> },
      ]} />
      <Modal title="Tạo kế hoạch tập luyện" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Tạo" width={640}>
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ target: 'class' }}>
          <Form.Item name="target" label="Áp dụng cho"><Radio.Group options={[{ value: 'class', label: 'Cả lớp' }, { value: 'member', label: 'Học viên cá nhân' }]} /></Form.Item>
          {target === 'member'
            ? <Form.Item name="memberId" label="Học viên" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={students.map((s) => ({ value: s.id, label: `${s.fullName} — ${s.goal}` }))} /></Form.Item>
            : <Form.Item name="classId" label="Lớp" rules={[{ required: true }]}><Select options={myClasses.map((c) => ({ value: c.id, label: c.name }))} /></Form.Item>}
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="content" label="Nội dung kế hoạch" rules={[{ required: true }]}><Input.TextArea rows={6} placeholder="Tuần 1: ...&#10;Tuần 2: ..." /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}

export function TrainingResults() {
  const { data, currentUser, add, nameOf, notify } = useApp();
  const { myClasses } = useMyStudents();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const sessionId = Form.useWatch('sessionId', form);
  const sessions = data.sessions.filter((s) => myClasses.some((c) => c.id === s.classId)).sort((a, b) => b.date.localeCompare(a.date));
  const sess = sessions.find((s) => s.id === sessionId);
  const attendees = sess ? data.attendances.filter((a) => a.sessionId === sess.id && a.status !== 'ABSENT') : [];
  const rows = data.trainingResults.filter((r) => r.coachId === currentUser!.id).map((r) => ({ ...r, session: data.sessions.find((s) => s.id === r.sessionId)! })).sort((a, b) => b.session.date.localeCompare(a.session.date));

  const sessSport = sess ? data.sports.find((x) => x.id === data.classes.find((c) => c.id === sess.classId)?.sportId)?.name : undefined;
  const defs = metricsFor(sessSport);
  const save = (v: { sessionId: string; memberId: string; entries?: { name: string; value: number }[]; effort?: number; note: string }) => {
    const entries = (v.entries ?? []).filter((e) => e && e.name && e.value !== undefined && e.value !== null).map((e) => ({ name: e.name, value: Number(e.value), unit: metricDef(e.name)?.unit ?? '' }));
    if (!entries.length) { message.warning('Nhập ít nhất 1 chỉ số'); return; }
    const metrics = entriesToString(entries);
    add('trainingResults', { sessionId: v.sessionId, memberId: v.memberId, coachId: currentUser!.id, metrics, note: v.note ?? '', entries, effort: v.effort });
    notify(v.memberId, 'Kết quả buổi tập', `HLV đã ghi nhận kết quả buổi ${sess?.date}: ${metrics}`);
    message.success('Đã ghi nhận kết quả'); setOpen(false); form.resetFields();
  };

  return (
    <Page title="Kết quả tập luyện sau buổi tập" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Ghi nhận kết quả</Button>}>
      <Table rowKey="id" dataSource={rows} columns={[
        { title: 'Ngày', render: (_, r) => r.session.date },
        { title: 'Lớp', render: (_, r) => data.classes.find((c) => c.id === r.session.classId)?.name },
        { title: 'Học viên', render: (_, r) => nameOf(r.memberId) },
        { title: 'Chỉ số', dataIndex: 'metrics', render: (_, r) => <Space wrap size={[4, 4]}>{entriesOf(r).map((e) => <Tag key={e.name} style={{ margin: 0 }}>{e.name} <b>{fmtVal(e.value, metricDef(e.name))}{e.unit}</b></Tag>)}</Space> },
        { title: 'RPE', dataIndex: 'effort', align: 'center', render: (v) => v ? <Tag color={v >= 8 ? 'red' : v >= 6 ? 'orange' : 'green'} style={{ margin: 0 }}>{v}/10</Tag> : '—' },
        { title: 'Nhận xét', dataIndex: 'note' },
      ]} />
      <Modal title="Ghi nhận kết quả buổi tập" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="sessionId" label="Buổi tập" rules={[{ required: true }]}><Select options={sessions.map((s) => ({ value: s.id, label: `${s.date} — ${data.classes.find((c) => c.id === s.classId)?.name}` }))} /></Form.Item>
          <Form.Item name="memberId" label="Học viên (có mặt)" rules={[{ required: true }]}><Select options={attendees.map((a) => ({ value: a.memberId, label: nameOf(a.memberId) }))} /></Form.Item>
          <div style={{ fontSize: 12, color: '#7a776f', marginBottom: 6 }}>Chỉ số theo bộ môn {sessSport ? <Tag style={{ marginLeft: 4 }}>{sessSport}</Tag> : '(chọn buổi tập trước)'}</div>
          <Form.List name="entries" initialValue={[{}]}>
            {(fields, { add: addRow, remove }) => (
              <>
                {fields.map((f) => (
                  <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 32px', gap: 8, marginBottom: 8 }}>
                    <Form.Item name={[f.name, 'name']} noStyle rules={[{ required: true, message: 'Chọn chỉ số' }]}>
                      <Select placeholder="Chỉ số" options={defs.map((d) => ({ value: d.name, label: `${d.name} (${d.unit})` }))} disabled={!sess} />
                    </Form.Item>
                    <Form.Item name={[f.name, 'value']} noStyle rules={[{ required: true, message: 'Nhập giá trị' }]}>
                      <InputNumber placeholder="Giá trị" style={{ width: '100%' }} min={0} />
                    </Form.Item>
                    <Button icon={<DeleteOutlined />} onClick={() => remove(f.name)} disabled={fields.length === 1} />
                  </div>
                ))}
                <Button type="dashed" size="small" onClick={() => addRow({})} disabled={fields.length >= 4}>+ Thêm chỉ số</Button>
              </>
            )}
          </Form.List>
          <Form.Item name="effort" label="Mức gắng sức (RPE 1–10)" style={{ marginTop: 16 }} initialValue={7}><Slider min={1} max={10} marks={{ 1: 'Nhẹ', 5: 'Vừa', 10: 'Tối đa' }} /></Form.Item>
          <Form.Item name="note" label="Nhận xét"><Input.TextArea rows={3} placeholder="Kỹ thuật, điểm cần cải thiện, mục tiêu buổi sau…" /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}

export function Progress() {
  const { data, currentUser, add, nameOf, notify } = useApp();
  const { students } = useMyStudents();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const rows = data.progressReviews.filter((r) => r.coachId === currentUser!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const save = (v: { memberId: string; rating: number; comment: string }) => {
    add('progressReviews', { ...v, coachId: currentUser!.id, createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    notify(v.memberId, 'Nhận xét mới từ HLV', v.comment);
    message.success('Đã lưu đánh giá'); setOpen(false); form.resetFields();
  };

  return (
    <Page title="Đánh giá tiến độ học viên" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Đánh giá mới</Button>} noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Học viên của tôi">
            <Table size="small" rowKey="id" pagination={false} dataSource={students} columns={[
              { title: 'Học viên', dataIndex: 'fullName' }, { title: 'Mục tiêu', dataIndex: 'goal' },
              { title: 'Đánh giá gần nhất', render: (_, r) => { const rv = rows.find((x) => x.memberId === r.id); return rv ? <Rate disabled value={rv.rating} style={{ fontSize: 12 }} /> : '—'; } },
              { title: '', render: (_, r) => <Button size="small" onClick={() => { form.setFieldsValue({ memberId: r.id }); setOpen(true); }}>Đánh giá</Button> },
            ]} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Lịch sử đánh giá">
            <List dataSource={rows} renderItem={(r) => <List.Item><List.Item.Meta title={<Space><b>{nameOf(r.memberId)}</b><Rate disabled value={r.rating} /></Space>} description={`${r.comment} · ${r.createdAt}`} /></List.Item>} />
          </Card>
        </Col>
      </Row>
      <Modal title="Đánh giá tiến độ" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ rating: 4 }}>
          <Form.Item name="memberId" label="Học viên" rules={[{ required: true }]}><Select options={students.map((s) => ({ value: s.id, label: s.fullName }))} /></Form.Item>
          <Form.Item name="rating" label="Mức độ tiến bộ"><Rate /></Form.Item>
          <Form.Item name="comment" label="Nhận xét" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}

export function Announcements() {
  const { data, currentUser, add, notify, nameOf } = useApp();
  const { myClasses } = useMyStudents();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const kind = Form.useWatch('kind', form);
  const hws = data.homeworks.filter((h) => h.coachId === currentUser!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const save = (v: { kind: 'HOMEWORK' | 'NOTICE'; classId: string; title: string; content: string }) => {
    const targets = data.enrollments.filter((e) => e.classId === v.classId && e.status === 'ACTIVE').map((e) => e.memberId);
    if (v.kind === 'HOMEWORK') add('homeworks', { classId: v.classId, coachId: currentUser!.id, title: v.title, content: v.content, createdAt: dayjs().format('YYYY-MM-DD HH:mm') });
    targets.forEach((m) => notify(m, v.kind === 'HOMEWORK' ? `Bài tập về nhà: ${v.title}` : v.title, v.content));
    message.success(`Đã gửi tới ${targets.length} học viên`); setOpen(false); form.resetFields();
  };

  return (
    <Page title="Thông báo & bài tập về nhà" subtitle="Gửi thông báo hoặc giao bài tập cho học viên trong lớp" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Gửi mới</Button>}>
      <List dataSource={hws} renderItem={(h) => <List.Item><List.Item.Meta title={<Space>{h.title}<Tag color="blue">{data.classes.find((c) => c.id === h.classId)?.name}</Tag></Space>} description={`${h.content} · ${h.createdAt} · ${nameOf(h.coachId)}`} /></List.Item>} />
      <Modal title="Gửi thông báo / bài tập" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Gửi">
        <Form form={form} layout="vertical" onFinish={save} initialValues={{ kind: 'HOMEWORK' }}>
          <Form.Item name="kind" label="Loại"><Radio.Group options={[{ value: 'HOMEWORK', label: 'Bài tập về nhà' }, { value: 'NOTICE', label: 'Thông báo' }]} /></Form.Item>
          <Form.Item name="classId" label="Lớp" rules={[{ required: true }]}><Select options={myClasses.map((c) => ({ value: c.id, label: c.name }))} /></Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="content" label={kind === 'HOMEWORK' ? 'Nội dung bài tập' : 'Nội dung thông báo'} rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </Page>
  );
}
