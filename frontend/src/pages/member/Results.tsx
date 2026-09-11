import { useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Rate, Row, Segmented, Select, Tag, Tooltip } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, FireOutlined, LineChartOutlined, RiseOutlined, StarFilled, TrophyOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import dayjs from 'dayjs';
import Page from '../../components/Page';
import StatCard from '../../components/StatCard';
import SportTag from '../../components/SportTag';
import UserCell from '../../components/UserCell';
import BodyMetricsChart from '../../components/BodyMetricsChart';
import { useApp } from '../../store/AppContext';
import { entriesOf, fmtVal, improvement, metricDef } from '../../utils/results';

export default function MyResults() {
  const { data, currentUser, userById } = useApp();
  const me = currentUser!.id;
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [limit, setLimit] = useState(6);

  const results = useMemo(() => data.trainingResults.filter((r) => r.memberId === me)
    .map((r) => { const session = data.sessions.find((s) => s.id === r.sessionId)!; const cls = data.classes.find((c) => c.id === session?.classId); return { ...r, session, cls, entries: entriesOf(r) }; })
    .filter((r) => r.session && r.cls)
    .sort((a, b) => b.session.date.localeCompare(a.session.date)), [data, me]);
  const reviews = data.progressReviews.filter((r) => r.memberId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Chuỗi theo từng chỉ số (tăng dần theo ngày)
  const series = useMemo(() => {
    const map = new Map<string, { date: string; value: number; unit: string }[]>();
    for (const r of [...results].reverse()) for (const e of r.entries) { if (!map.has(e.name)) map.set(e.name, []); map.get(e.name)!.push({ date: r.session.date, value: e.value, unit: e.unit }); }
    return map;
  }, [results]);
  const metricNames = Array.from(series.keys());
  const [metric, setMetric] = useState<string | undefined>(undefined);
  const active = metric && series.has(metric) ? metric : metricNames[0];
  const activeSeries = active ? series.get(active)! : [];
  const activeDef = active ? metricDef(active) : undefined;

  const progress = metricNames.map((n) => { const s = series.get(n)!; return { name: n, unit: s[0].unit, first: s[0].value, last: s[s.length - 1].value, n: s.length, pct: s.length > 1 ? improvement(n, s[0].value, s[s.length - 1].value) : 0 }; });
  const best = [...progress].filter((p) => p.n > 1).sort((a, b) => b.pct - a.pct)[0];
  const pbs = metricNames.map((n) => { const s = series.get(n)!; const def = metricDef(n); const sorted = [...s].sort((a, b) => (def && !def.higherIsBetter ? a.value - b.value : b.value - a.value)); return { name: n, ...sorted[0] }; });
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const avgEffort = results.filter((r) => r.effort).length ? Math.round(results.reduce((s, r) => s + (r.effort ?? 0), 0) / results.filter((r) => r.effort).length * 10) / 10 : 0;

  const prevOf = (idx: number, name: string) => { for (let i = idx + 1; i < results.length; i++) { const e = results[i].entries.find((x) => x.name === name); if (e) return e.value; } return undefined; };
  const classes = Array.from(new Set(results.map((r) => r.cls!.id))).map((id) => data.classes.find((c) => c.id === id)!);
  const shown = results.filter((r) => classFilter === 'ALL' || r.cls!.id === classFilter);

  const Delta = ({ name, from, to }: { name: string; from?: number; to: number }) => {
    if (from === undefined) return <span style={{ fontSize: 10.5, color: '#9a968c' }}>mới</span>;
    const pct = improvement(name, from, to);
    if (pct === 0) return <span style={{ fontSize: 10.5, color: '#9a968c' }}>=</span>;
    const up = pct > 0;
    return <span style={{ fontSize: 10.5, fontWeight: 700, color: up ? '#16a34a' : '#dc2626' }}>{up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(pct)}%</span>;
  };

  return (
    <Page title="Kết quả tập luyện & tiến bộ" subtitle="HLV ghi nhận chỉ số sau mỗi buổi; hệ thống so sánh với buổi trước và theo dõi kỷ lục cá nhân" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}><StatCard title="Buổi có kết quả" value={results.length} icon={<LineChartOutlined />} color="#0f4d34" hint={`${metricNames.length} chỉ số theo dõi`} /></Col>
        <Col xs={12} xl={6}><StatCard title="Tiến bộ nổi bật" value={best ? `${best.pct > 0 ? '+' : ''}${best.pct}%` : '—'} icon={<RiseOutlined />} color="#16a34a" hint={best ? `${best.name}: ${fmtVal(best.first, metricDef(best.name))} → ${fmtVal(best.last, metricDef(best.name))}${best.unit}` : 'Cần ≥ 2 buổi'} /></Col>
        <Col xs={12} xl={6}><StatCard title="Gắng sức TB (RPE)" value={avgEffort ? `${avgEffort}/10` : '—'} icon={<FireOutlined />} color="#c94a1e" hint={avgEffort >= 8 ? 'Cường độ cao — chú ý hồi phục' : avgEffort >= 6 ? 'Cường độ vừa, phù hợp' : 'Có thể tăng độ khó'} /></Col>
        <Col xs={12} xl={6}><StatCard title="Đánh giá từ HLV" value={avgRating ? `${avgRating.toFixed(1)} ★` : '—'} icon={<StarFilled />} color="#eab308" hint={`${reviews.length} lần đánh giá`} /></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Tiến bộ theo chỉ số" size="small" style={{ height: '100%' }}
            extra={metricNames.length > 0 && <Select size="small" value={active} onChange={setMetric} style={{ width: 200 }} options={progress.map((p) => ({ value: p.name, label: `${p.name}${p.n > 1 ? ` (${p.pct > 0 ? '+' : ''}${p.pct}%)` : ''}` }))} />}>
            {activeSeries.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có chỉ số nào được ghi nhận" /> : (
              <>
                <div style={{ display: 'flex', gap: 20, marginBottom: 8, flexWrap: 'wrap' }}>
                  {[
                    { l: 'Buổi đầu', v: `${fmtVal(activeSeries[0].value, activeDef)}${activeSeries[0].unit}`, s: dayjs(activeSeries[0].date).format('DD/MM') },
                    { l: 'Mới nhất', v: `${fmtVal(activeSeries[activeSeries.length - 1].value, activeDef)}${activeSeries[0].unit}`, s: dayjs(activeSeries[activeSeries.length - 1].date).format('DD/MM') },
                    { l: 'Kỷ lục', v: `${fmtVal(pbs.find((p) => p.name === active)!.value, activeDef)}${activeSeries[0].unit}`, s: dayjs(pbs.find((p) => p.name === active)!.date).format('DD/MM') },
                    { l: 'Thay đổi', v: activeSeries.length > 1 ? `${improvement(active!, activeSeries[0].value, activeSeries[activeSeries.length - 1].value) > 0 ? '+' : ''}${improvement(active!, activeSeries[0].value, activeSeries[activeSeries.length - 1].value)}%` : '—', s: activeDef ? (activeDef.higherIsBetter ? 'cao hơn = tốt' : 'thấp hơn = tốt') : '' },
                  ].map((x) => <div key={x.l}><div style={{ fontSize: 11, color: '#9a968c' }}>{x.l}</div><div style={{ fontWeight: 700, fontSize: 16 }}>{x.v}</div><div style={{ fontSize: 11, color: '#9a968c' }}>{x.s}</div></div>)}
                </div>
                <Line data={activeSeries.map((s) => ({ date: dayjs(s.date).format('DD/MM'), value: s.value }))} xField="date" yField="value" height={220} smooth point={{ size: 4 }} scale={{ y: { domain: [Math.floor(Math.min(...activeSeries.map((x) => x.value)) * 0.9), Math.ceil(Math.max(...activeSeries.map((x) => x.value)) * 1.08)] } }} style={{ stroke: '#0f4d34', lineWidth: 2.5 }} area={{ style: { fill: 'linear-gradient(-90deg, rgba(15,77,52,.02) 0%, rgba(15,77,52,.25) 100%)' } }} axis={{ y: { grid: true, gridLineDash: [4, 4], labelFormatter: (v: number) => `${v}${activeSeries[0].unit}` } }} tooltip={{ items: [{ channel: 'y', name: active, valueFormatter: (v: number) => `${fmtVal(v, activeDef)}${activeSeries[0].unit}` }] }} />
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Chỉ số cơ thể theo tuần" size="small" style={{ height: '100%' }} extra={<span style={{ fontSize: 12, color: '#9a968c' }}>InBody / HLV đo</span>}>
            <BodyMetricsChart memberId={me} height={220} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Kết quả từng buổi" size="small" extra={classes.length > 1 && <Segmented size="small" value={classFilter} onChange={(v) => setClassFilter(v as string)} options={[{ value: 'ALL', label: 'Tất cả' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />}>
            {shown.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kết quả" />}
            {shown.slice(0, limit).map((r) => {
              const idx = results.indexOf(r);
              const sport = data.sports.find((s) => s.id === r.cls!.sportId);
              const coach = userById(r.coachId);
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 14, padding: '14px 0', borderBottom: '1px solid #f3f1ec' }}>
                  <div style={{ textAlign: 'center', borderRadius: 10, background: `${sport?.color ?? '#0f4d34'}12`, padding: '8px 4px', alignSelf: 'start' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: sport?.color, lineHeight: 1 }}>{dayjs(r.session.date).format('DD')}</div>
                    <div style={{ fontSize: 11, color: '#7a776f' }}>Th{dayjs(r.session.date).format('M')}</div>
                    <div style={{ fontSize: 16, marginTop: 4 }}>{sport?.icon}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div><b>{r.cls!.name}</b> <span style={{ marginLeft: 6 }}><SportTag id={r.cls!.sportId} size="small" /></span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {r.effort && (
                          <Tooltip title={`Mức gắng sức (RPE) ${r.effort}/10`}>
                            <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
                              <FireOutlined style={{ color: r.effort >= 8 ? '#dc2626' : r.effort >= 6 ? '#c94a1e' : '#16a34a', fontSize: 12 }} />
                              {Array.from({ length: 10 }).map((_, i) => <span key={i} style={{ width: 5, height: 10, borderRadius: 2, background: i < (r.effort ?? 0) ? (r.effort! >= 8 ? '#dc2626' : r.effort! >= 6 ? '#c94a1e' : '#16a34a') : '#e2ddd2' }} />)}
                            </span>
                          </Tooltip>
                        )}
                        <span style={{ fontSize: 12, color: '#9a968c' }}>{dayjs(r.session.date).format('DD/MM/YYYY')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {r.entries.map((e) => {
                        const prev = prevOf(idx, e.name);
                        const pb = pbs.find((p) => p.name === e.name);
                        const isPb = pb && pb.date === r.session.date && pb.value === e.value && series.get(e.name)!.length > 1;
                        return (
                          <div key={e.name} style={{ border: `1px solid ${isPb ? '#fde68a' : '#e2ddd2'}`, background: isPb ? '#fffbeb' : '#f7f5f0', borderRadius: 10, padding: '6px 10px', minWidth: 110 }}>
                            <div style={{ fontSize: 11, color: '#7a776f', whiteSpace: 'nowrap' }}>{e.name} {isPb && <Tooltip title="Kỷ lục cá nhân"><TrophyOutlined style={{ color: '#d97706' }} /></Tooltip>}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}><b style={{ fontSize: 15 }}>{fmtVal(e.value, metricDef(e.name))}<span style={{ fontSize: 11, fontWeight: 500, color: '#7a776f' }}>{e.unit}</span></b><Delta name={e.name} from={prev} to={e.value} /></div>
                          </div>
                        );
                      })}
                    </div>
                    {r.note && <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <UserCell user={coach} size={22} sub="" />
                      <div style={{ fontSize: 13, color: '#3d3b35', background: '#fff', border: '1px solid #ece8df', borderRadius: '0 10px 10px 10px', padding: '6px 10px', flex: 1 }}>“{r.note}”</div>
                    </div>}
                  </div>
                </div>
              );
            })}
            {shown.length > limit && <div style={{ textAlign: 'center', marginTop: 12 }}><Button onClick={() => setLimit(limit + 6)}>Xem thêm ({shown.length - limit})</Button></div>}
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title={<span><TrophyOutlined style={{ color: '#d97706' }} /> Kỷ lục cá nhân</span>} size="small">
            {pbs.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có" />}
            {pbs.map((p) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px dashed #f3f1ec' }}>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div><div style={{ fontSize: 11, color: '#9a968c' }}>{dayjs(p.date).format('DD/MM/YYYY')} · {series.get(p.name)!.length} lần đo</div></div>
                <b style={{ fontSize: 16, color: '#14130f' }}>{fmtVal(p.value, metricDef(p.name))}<span style={{ fontSize: 11, color: '#7a776f', fontWeight: 500 }}>{p.unit}</span></b>
              </div>
            ))}
          </Card>
          <Card title="Đánh giá tiến độ từ HLV" size="small" style={{ marginTop: 16 }}>
            {reviews.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đánh giá" />}
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px dashed #f3f1ec' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <UserCell id={r.coachId} size={28} sub={dayjs(r.createdAt).format('DD/MM/YYYY')} />
                  <Rate disabled value={r.rating} style={{ fontSize: 14 }} />
                </div>
                <div style={{ fontSize: 13, color: '#3d3b35', marginTop: 6 }}>{r.comment}</div>
                <Tag color={r.rating >= 4 ? 'green' : r.rating >= 3 ? 'blue' : 'orange'} style={{ marginTop: 6 }}>{r.rating >= 4 ? 'Tiến bộ tốt' : r.rating >= 3 ? 'Đúng lộ trình' : 'Cần cố gắng hơn'}</Tag>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
