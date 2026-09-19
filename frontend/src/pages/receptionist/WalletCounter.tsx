import { useState } from 'react';
import { Button, Card, Col, Descriptions, Form, InputNumber, Radio, Row, Select, Table, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { fmtMoney, useApp } from '../../store/AppContext';

/** Nạp ví tại quầy (UC_3.2) + xem số dư/lịch sử ví của member (UC_3.7). Không rút tiền. */
export default function WalletCounter() {
  const { data, topUp, log, nameOf, walletBalance } = useApp();
  const [params] = useSearchParams();
  const [memberId, setMemberId] = useState<string | undefined>(params.get('member') ?? undefined);
  const [form] = Form.useForm();
  const txns = data.walletTransactions.filter((w) => w.memberId === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const submit = (v: { amount: number; gateway: 'CASH' | 'BANK' }) => {
    if (!memberId) return;
    topUp(memberId, v.amount, v.gateway);
    log('WALLET_TOP_UP', 'Wallet', memberId, `Nạp ${fmtMoney(v.amount)} (${v.gateway === 'CASH' ? 'tiền mặt' : 'chuyển khoản'}) cho ${nameOf(memberId)}`);
    message.success(`Đã nạp ${fmtMoney(v.amount)} vào ví ${nameOf(memberId)}`); form.resetFields(['amount']);
  };

  return (
    <Page title="Nạp ví tại quầy" subtitle="Ví chỉ nạp / trả / hoàn — không rút. Nạp quầy ghi ledger TOP_UP không có gateway." noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Thành viên">
            <Select showSearch optionFilterProp="label" placeholder="Tìm theo tên / SĐT" style={{ width: '100%' }} value={memberId} onChange={setMemberId}
              options={data.users.filter((u) => u.role === 'MEMBER').map((u) => ({ value: u.id, label: `${u.fullName} - ${u.phone}` }))} />
            {memberId && (
              <>
                <Descriptions column={1} size="small" bordered style={{ marginTop: 16 }}>
                  <Descriptions.Item label="Số dư hiện tại"><b style={{ fontSize: 18 }}>{fmtMoney(walletBalance(memberId))}</b></Descriptions.Item>
                  <Descriptions.Item label="Tài khoản"><StatusTag value={data.users.find((u) => u.id === memberId)?.status} /></Descriptions.Item>
                </Descriptions>
                <Form form={form} layout="vertical" onFinish={submit} initialValues={{ gateway: 'CASH', amount: 500000 }} style={{ marginTop: 16 }}>
                  <Form.Item name="amount" label="Số tiền nạp (₫)" rules={[{ required: true }]}><InputNumber min={10000} step={50000} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item name="gateway" label="Hình thức"><Radio.Group options={[{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANK', label: 'Chuyển khoản' }]} /></Form.Item>
                  <Button type="primary" htmlType="submit" size="large" block disabled={data.users.find((u) => u.id === memberId)?.status !== 'ACTIVE'}>Xác nhận nạp ví</Button>
                </Form>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={`Lịch sử ví${memberId ? ` · ${txns.length} giao dịch` : ''}`}>
            <Table size="small" rowKey="id" pagination={{ pageSize: 10 }} dataSource={txns} locale={{ emptyText: 'Chọn thành viên để xem' }} columns={[
              { title: 'Thời gian', dataIndex: 'createdAt', render: (v) => <span className="sc-nowrap">{v}</span> },
              { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag value={v} /> },
              { title: 'Nội dung', render: (_, w) => <>{w.note}{w.gatewayRef && <div style={{ fontSize: 11, color: '#9a968c', fontFamily: 'ui-monospace, monospace' }}>{w.gateway} · {w.gatewayRef} · <StatusTag value={w.gatewayStatus} /></div>}</> },
              { title: 'Số tiền', align: 'right', render: (_, w) => <b className="sc-nowrap" style={{ color: w.type === 'PAYMENT' ? '#dc2626' : '#16a34a' }}>{w.type === 'PAYMENT' ? '−' : '+'}{fmtMoney(w.amount)}</b> },
              { title: 'Số dư sau', dataIndex: 'balanceAfter', align: 'right', render: (v) => <span className="sc-nowrap">{fmtMoney(v)}</span> },
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
