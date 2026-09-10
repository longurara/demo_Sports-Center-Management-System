import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Collapse, Divider, Empty, Input, InputNumber, List, Popconfirm, Progress, Row, Segmented, Select, Slider, Space, Steps, Table, Tabs, Tag, Tooltip, message } from 'antd';
import { BulbOutlined, CheckCircleFilled, CopyOutlined, DeleteOutlined, ReloadOutlined, RobotOutlined, SafetyOutlined, SaveOutlined, ThunderboltFilled, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import UserCell from '../../components/UserCell';
import BodyMetricsChart from '../../components/BodyMetricsChart';
import { useApp } from '../../store/AppContext';
import { FOCUS_LABEL, generatePlan, inferFocus, planToText, type AiPlan, type Focus, type PlanInput } from '../../utils/aiPlan';

const STEPS = ['Đọc hồ sơ & mục tiêu', 'Đối chiếu lịch sử tập luyện', 'Chọn bài tập phù hợp', 'Kiểm tra an toàn & cân bằng nhóm cơ'];

export default function AiSuggest() {
  const { data, currentUser, add, notify, log } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const myClasses = data.classes.filter((c) => c.coachId === currentUser!.id && c.status === 'OPEN');
  const myIds = myClasses.map((c) => c.id);
  const students = Array.from(new Set(data.enrollments.filter((e) => myIds.includes(e.classId) && e.status === 'ACTIVE').map((e) => e.memberId))).map((id) => data.users.find((u) => u.id === id)!);

  const [memberId, setMemberId] = useState<string | undefined>(params.get('member') ?? undefined);
  const u = students.find((s) => s.id === memberId);
  const [input, setInput] = useState<PlanInput>({ weeks: 4, sessionsPerWeek: 3, focus: [], equipment: 'FULL_GYM', minutes: 60, note: '' });
  const [step, setStep] = useState(-1);          // -1 idle, 0..3 đang phân tích, 4 xong
  const [plan, setPlan] = useState<AiPlan | null>(null);
  const [activeWeek, setActiveWeek] = useState('1');

  useEffect(() => { if (u) setInput((i) => ({ ...i, focus: inferFocus(u) })); setPlan(null); setStep(-1); }, [memberId]); // eslint-disable-line react-hooks/exhaustive-deps

  const profile = useMemo(() => {
    if (!u) return null;
    const att = data.attendances.filter((a) => a.memberId === u.id);
    const rate = att.length ? Math.round(att.filter((a) => a.status !== 'ABSENT').length / att.length * 100) : 0;
    const results = data.trainingResults.filter((r) => r.memberId === u.id).map((r) => ({ ...r, s: data.sessions.find((s) => s.id === r.sessionId)! })).sort((a, b) => b.s.date.localeCompare(a.s.date));
    const bm = data.bodyMetrics.filter((m) => m.memberId === u.id).sort((a, b) => a.date.localeCompare(b.date));
    const cls = data.enrollments.filter((e) => e.memberId === u.id && e.status === 'ACTIVE').map((e) => data.classes.find((c) => c.id === e.classId)?.name).filter(Boolean);
    const aiPlans = data.trainingPlans.filter((p) => p.memberId === u.id && p.source === 'AI').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { att, rate, results, bm, cls, aiPlans };
  }, [u, data]);

  const run = () => {
    if (!u) return;
    setPlan(null); setStep(0);
    STEPS.forEach((_, i) => setTimeout(() => setStep(i + 1), 450 * (i + 1)));
    setTimeout(() => { setPlan(generatePlan(u, data, input)); setActiveWeek('1'); }, 450 * STEPS.length + 250);
  };

  const removeExercise = (w: number, s: number, e: number) => {
    if (!plan) return;
    const next = structuredClone(plan);
    next.weeks[w].sessions[s].exercises.splice(e, 1);
    setPlan(next);
  };
  const patchExercise = (w: number, s: number, e: number, patch: Partial<AiPlan['weeks'][0]['sessions'][0]['exercises'][0]>) => {
    if (!plan) return;
    const next = structuredClone(plan);
    Object.assign(next.weeks[w].sessions[s].exercises[e], patch);
    setPlan(next);
  };

  const save = (toClass?: string) => {
    if (!u || !plan) return;
    const content = planToText(plan);
    if (toClass) {
      add('trainingPlans', { coachId: currentUser!.id, classId: toClass, title: plan.title, content, createdAt: dayjs().format('YYYY-MM-DD HH:mm'), source: 'AI' });
      data.enrollments.filter((e) => e.classId === toClass && e.status === 'ACTIVE').forEach((e) => notify(e.memberId, 'Giáo án mới cho lớp', `HLV ${currentUser!.fullName} đã gửi: ${plan.title}`));
      message.success('Đã lưu giáo án cho cả lớp');
    } else {
      const p = add('trainingPlans', { coachId: currentUser!.id, memberId: u.id, title: plan.title, content, createdAt: dayjs().format('YYYY-MM-DD HH:mm'), source: 'AI' });
      notify(u.id, 'Kế hoạch tập luyện mới', `HLV ${currentUser!.fullName} đã gửi: ${plan.title}`);
      log('AI_PLAN', 'TrainingPlan', p.id, `Lưu kế hoạch AI cho ${u.fullName}`);
      message.success('Đã lưu kế hoạch và gửi cho học viên');
    }
  };

  const copy = () => { if (plan) { navigator.clipboard?.writeText(planToText(plan)); message.success('Đã sao chép nội dung kế hoạch'); } };

  return (
    <Page title="AI gợi ý bài tập" subtitle="Kế hoạch cá nhân hóa theo mục tiêu, trình độ, sức khỏe và lịch sử tập luyện — HLV duyệt và chỉnh trước khi gửi" noCard
      extra={<Tag color="purple" icon={<RobotOutlined />}>Prototype: sinh theo rule · bản chính thức gọi Claude API</Tag>}>
      <Row gutter={[16, 16]}>
        {/* ===== Cột trái: học viên + tham số ===== */}
        <Col xs={24} xl={8}>
          <Card title="1. Học viên" size="small">
            <Select showSearch optionFilterProp="label" value={memberId} onChange={setMemberId} placeholder="Chọn học viên trong lớp bạn phụ trách" style={{ width: '100%' }}
              options={students.map((s) => ({ value: s.id, label: `${s.fullName} · ${s.goal ?? ''}` }))} />
            {u && profile && (
              <div style={{ marginTop: 14 }}>
                <UserCell user={u} sub={`${u.phone} · ${dayjs().diff(dayjs(u.dob), 'year') || '?'} tuổi`} size={40} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  {[
                    { l: 'Mục tiêu', v: u.goal ?? '—' },
                    { l: 'Trình độ', v: <StatusTag value={u.level} /> },
                    { l: 'Sức khỏe', v: u.healthNote ?? 'Không ghi chú' },
                    { l: 'Chuyên cần', v: <span><b>{profile.rate}%</b> <span style={{ color: '#94a3b8' }}>/ {profile.att.length} buổi</span></span> },
                  ].map((x) => <div key={x.l} style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}><div style={{ fontSize: 11, color: '#94a3b8' }}>{x.l}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{x.v}</div></div>)}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>Lớp: {profile.cls.join(', ') || '—'}</div>
                {profile.bm.length > 1 && <div style={{ marginTop: 12 }}><BodyMetricsChart memberId={u.id} height={120} /></div>}
                {profile.results.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>KẾT QUẢ GẦN ĐÂY</div>
                    {profile.results.slice(0, 3).map((r) => <div key={r.id} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed #eef1f6' }}><span>{r.metrics}</span><span style={{ color: '#94a3b8' }}>{dayjs(r.s.date).format('DD/MM')}</span></div>)}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="2. Tham số lộ trình" size="small" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Trọng tâm (AI tự suy từ mục tiêu, có thể chỉnh)</div>
            <Space wrap size={6}>
              {(Object.keys(FOCUS_LABEL) as Focus[]).map((f) => {
                const on = input.focus.includes(f);
                return <Tag key={f} onClick={() => setInput({ ...input, focus: on ? input.focus.filter((x) => x !== f) : [...input.focus, f] })} style={{ cursor: 'pointer', padding: '4px 12px', border: `1px solid ${on ? '#2563eb' : '#e2e8f0'}`, background: on ? '#2563eb' : '#fff', color: on ? '#fff' : '#475569', fontWeight: 500 }}>{on && <CheckCircleFilled style={{ marginRight: 4 }} />}{FOCUS_LABEL[f]}</Tag>;
              })}
            </Space>
            <Divider style={{ margin: '14px 0' }} />
            <Row gutter={12}>
              <Col span={12}><div style={{ fontSize: 12, color: '#64748b' }}>Số tuần</div><Segmented block value={input.weeks} onChange={(v) => setInput({ ...input, weeks: v as number })} options={[2, 4, 6, 8]} /></Col>
              <Col span={12}><div style={{ fontSize: 12, color: '#64748b' }}>Buổi / tuần</div><Segmented block value={input.sessionsPerWeek} onChange={(v) => setInput({ ...input, sessionsPerWeek: v as number })} options={[2, 3, 4, 5]} /></Col>
            </Row>
            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>Thời lượng mỗi buổi: <b style={{ color: '#0f172a' }}>{input.minutes} phút</b></div>
            <Slider min={30} max={90} step={15} value={input.minutes} onChange={(v) => setInput({ ...input, minutes: v })} marks={{ 30: '30', 60: '60', 90: '90' }} />
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Thiết bị sẵn có</div>
            <Select value={input.equipment} onChange={(v) => setInput({ ...input, equipment: v })} style={{ width: '100%' }} options={[{ value: 'FULL_GYM', label: 'Phòng gym đầy đủ máy & tạ' }, { value: 'BASIC', label: 'Tạ tay + dây kháng lực' }, { value: 'BODYWEIGHT', label: 'Chỉ trọng lượng cơ thể (tập tại nhà)' }]} />
            <div style={{ fontSize: 12, color: '#64748b', margin: '12px 0 4px' }}>Ghi chú thêm cho AI (tùy chọn)</div>
            <Input.TextArea rows={2} value={input.note} onChange={(e) => setInput({ ...input, note: e.target.value })} placeholder="VD: học viên sắp thi đấu, tránh bài tập vai vì đang chấn thương nhẹ…" />
            <Button type="primary" size="large" block icon={<ThunderboltFilled />} style={{ marginTop: 16 }} disabled={!u || (step >= 0 && step < STEPS.length)} onClick={run}>
              {plan ? 'Sinh lại kế hoạch' : 'Sinh kế hoạch bằng AI'}
            </Button>
          </Card>

          {profile && profile.aiPlans.length > 0 && (
            <Card title={`Kế hoạch AI đã gửi (${profile.aiPlans.length})`} size="small" style={{ marginTop: 16 }}>
              <List size="small" dataSource={profile.aiPlans.slice(0, 4)} renderItem={(p) => <List.Item><List.Item.Meta title={<span style={{ fontSize: 13 }}>{p.title}</span>} description={dayjs(p.createdAt).fromNow()} /></List.Item>} />
            </Card>
          )}
        </Col>

        {/* ===== Cột phải: kết quả ===== */}
        <Col xs={24} xl={16}>
          {!u && <Card><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn học viên để bắt đầu" style={{ padding: 40 }} /></Card>}

          {u && step >= 0 && !plan && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><RobotOutlined /></div>
                <div><b>AI đang phân tích hồ sơ của {u.fullName}</b><div style={{ fontSize: 12, color: '#64748b' }}>Sử dụng {profile?.att.length ?? 0} bản ghi điểm danh · {profile?.results.length ?? 0} kết quả buổi tập · {profile?.bm.length ?? 0} lần đo chỉ số</div></div>
              </div>
              <Steps orientation="vertical" size="small" current={step} items={STEPS.map((s) => ({ title: s }))} />
            </Card>
          )}

          {u && !plan && step < 0 && (
            <Card>
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 12px 30px rgba(124,58,237,.3)' }}><RobotOutlined /></div>
                <h3 style={{ marginBottom: 4 }}>Sẵn sàng xây lộ trình cho {u.fullName.split(' ').pop()}</h3>
                <div style={{ color: '#64748b', maxWidth: 460, margin: '0 auto' }}>AI sẽ dùng mục tiêu, trình độ, ghi chú sức khỏe, chuyên cần, chỉ số cơ thể và kết quả buổi tập để đề xuất bài tập, số hiệp, thời gian nghỉ và tiến trình cường độ theo tuần.</div>
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                  {[['Cá nhân hóa', 'theo 6 nguồn dữ liệu'], ['An toàn', 'lọc bài theo ghi chú sức khỏe'], ['Chỉnh sửa được', 'HLV duyệt trước khi gửi']].map(([a, b]) => <div key={a} style={{ textAlign: 'center' }}><div style={{ fontWeight: 600 }}>{a}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{b}</div></div>)}
                </div>
              </div>
            </Card>
          )}

          {u && plan && (
            <div className="sc-fade">
              {/* Header kết quả */}
              <Card style={{ background: 'linear-gradient(135deg,#0b1220 0%,#1e3a8a 100%)', color: '#fff', border: 'none' }} styles={{ body: { padding: 22 } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 12, opacity: .7, letterSpacing: '.08em' }}>KẾ HOẠCH ĐỀ XUẤT</div>
                    <h2 style={{ margin: '4px 0 6px', fontSize: 22, letterSpacing: -0.3 }}>{plan.title}</h2>
                    <div style={{ opacity: .85, fontSize: 13.5 }}>{plan.summary}</div>
                    <Space wrap size={6} style={{ marginTop: 10 }}>{plan.tags.map((t) => <Tag key={t} style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: 'none' }}>{t}</Tag>)}</Space>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 120 }}>
                    <Progress type="dashboard" percent={plan.confidence} size={96} strokeColor={{ '0%': '#fb923c', '100%': '#22c55e' }} railColor="rgba(255,255,255,.15)" format={(p) => <span style={{ color: '#fff', fontWeight: 700 }}>{p}%</span>} />
                    <div style={{ fontSize: 12, opacity: .75, marginTop: -6 }}>Độ tin cậy<br /><span style={{ fontSize: 11, opacity: .7 }}>theo lượng dữ liệu đầu vào</span></div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 18 }}>
                  {plan.metrics.map((m) => <div key={m.label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '10px 12px' }}><div style={{ fontSize: 11, opacity: .7 }}>{m.label}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div></div>)}
                </div>
              </Card>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={14}>
                  <Card size="small" title={<span><BulbOutlined style={{ color: '#f59e0b' }} /> Vì sao AI đề xuất như vậy</span>} style={{ height: '100%' }}>
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, lineHeight: 1.7, color: '#334155' }}>{plan.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                  </Card>
                </Col>
                <Col xs={24} md={10}>
                  <Card size="small" title={<span><SafetyOutlined style={{ color: '#16a34a' }} /> Kiểm tra an toàn</span>} style={{ height: '100%' }}>
                    {plan.warnings.map((w) => <Alert key={w} type={/Không phát hiện/.test(w) ? 'success' : 'warning'} showIcon title={w} style={{ marginBottom: 8, fontSize: 12.5 }} />)}
                  </Card>
                </Col>
              </Row>

              {/* Lộ trình theo tuần */}
              <Card style={{ marginTop: 16 }} title="Lộ trình chi tiết" extra={<span style={{ fontSize: 12, color: '#94a3b8' }}>Bấm vào số hiệp / rep để chỉnh · xóa bài không phù hợp</span>}>
                <Tabs activeKey={activeWeek} onChange={setActiveWeek} items={plan.weeks.map((w, wi) => ({
                  key: String(w.week),
                  label: <span>Tuần {w.week} <Tag style={{ marginLeft: 4, background: w.intensity >= 90 ? '#fee2e2' : w.intensity >= 75 ? '#ffedd5' : '#dcfce7', color: w.intensity >= 90 ? '#dc2626' : w.intensity >= 75 ? '#ea580c' : '#16a34a' }}>{w.intensity}%</Tag></span>,
                  children: (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <b>{w.theme}</b>
                        <Progress percent={w.intensity} size="small" style={{ flex: 1, maxWidth: 260, margin: 0 }} strokeColor={w.intensity >= 90 ? '#dc2626' : w.intensity >= 75 ? '#f97316' : '#16a34a'} format={(p) => `cường độ ${p}%`} />
                      </div>
                      <Collapse defaultActiveKey={['0']} items={w.sessions.map((s, si) => ({
                        key: String(si),
                        label: <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><span><Tag color="blue" style={{ marginRight: 8 }}>{s.day}</Tag><b>{s.title}</b></span><span style={{ fontSize: 12, color: '#94a3b8' }}>{s.exercises.length} bài · {s.minutes} phút</span></div>,
                        children: (
                          <div>
                            <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 8 }}><b>Khởi động:</b> {s.warmup}</div>
                            <Table size="small" pagination={false} rowKey={(r) => r.name} dataSource={s.exercises} columns={[
                              { title: '#', render: (_, __, i) => i + 1, width: 40 },
                              { title: 'Bài tập', render: (_, e) => <><b>{e.name}</b>{e.note && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{e.note}</div>}</> },
                              { title: 'Nhóm', dataIndex: 'group', render: (v) => <Tag style={{ background: '#f1f5f9', color: '#475569' }}>{v}</Tag> },
                              { title: 'Hiệp', width: 90, render: (_, e, ei) => <InputNumber size="small" min={1} max={8} value={e.sets} onChange={(v) => patchExercise(wi, si, ei, { sets: v ?? e.sets })} style={{ width: 64 }} /> },
                              { title: 'Rep / thời gian', width: 130, render: (_, e, ei) => <Input size="small" value={e.reps} onChange={(ev) => patchExercise(wi, si, ei, { reps: ev.target.value })} /> },
                              { title: 'Nghỉ', dataIndex: 'rest', width: 80 },
                              { title: '', width: 40, render: (_, __, ei) => <Popconfirm title="Bỏ bài này?" onConfirm={() => removeExercise(wi, si, ei)}><Button size="small" type="text" danger icon={<DeleteOutlined />} /></Popconfirm> },
                            ]} />
                            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 8 }}><b>Thả lỏng:</b> {s.cooldown}</div>
                          </div>
                        ),
                      }))} />
                    </div>
                  ),
                }))} />
              </Card>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={14}>
                  <Card size="small" title="Dinh dưỡng & phục hồi">
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, lineHeight: 1.7, color: '#334155' }}>{plan.nutrition.map((n) => <li key={n}>{n}</li>)}</ul>
                  </Card>
                </Col>
                <Col xs={24} md={10}>
                  <Card size="small" title="Hành động">
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      <Button type="primary" block icon={<SaveOutlined />} onClick={() => save()}>Lưu & gửi cho {u.fullName.split(' ').pop()}</Button>
                      <Tooltip title="Lưu thành giáo án chung cho lớp học viên đang theo">
                        <Select placeholder={<span><TeamOutlined /> Áp dụng cho cả lớp…</span>} style={{ width: '100%' }} value={undefined} onChange={(v) => save(v)} options={myClasses.map((c) => ({ value: c.id, label: c.name }))} />
                      </Tooltip>
                      <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
                        <Button block icon={<ReloadOutlined />} onClick={run}>Sinh lại</Button>
                        <Button block icon={<CopyOutlined />} onClick={copy}>Sao chép</Button>
                      </Space>
                      <Button type="link" block onClick={() => navigate(`/coach/students/${u.id}`)}>Xem hồ sơ học viên →</Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Col>
      </Row>
    </Page>
  );
}
