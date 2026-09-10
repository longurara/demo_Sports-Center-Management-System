import { Card, Checkbox, Col, Row, Select, Table, Typography, message } from 'antd';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';
import type { Role } from '../../types';

const PERMISSIONS = [
  'Quản lý người dùng', 'Quản lý gói thành viên', 'Quản lý lớp học & lịch', 'Phân công HLV', 'Xem báo cáo',
  'Ghi nhận thanh toán', 'Xuất hóa đơn', 'Check-in thành viên', 'Điểm danh lớp', 'Tạo kế hoạch tập luyện',
  'Đăng ký lớp học', 'Gửi yêu cầu hỗ trợ', 'Xem lịch sử thao tác', 'Sử dụng AI gợi ý',
];

const MATRIX: Record<Role, boolean[]> = {
  MANAGER:      [true, true, true, true, true, false, false, false, false, false, false, false, true, false],
  RECEPTIONIST: [false, false, false, false, false, true, true, true, false, false, true, false, false, false],
  COACH:        [false, false, false, false, false, false, false, false, true, true, false, false, false, true],
  MEMBER:       [false, false, false, false, false, false, false, false, false, false, true, true, false, true],
};

export default function Roles() {
  const { data, update, log, currentUser } = useApp();
  const users = data.users.filter((u) => u.id !== currentUser?.id);

  return (
    <Page title="Phân quyền truy cập" subtitle="Gán vai trò cho tài khoản và xem ma trận quyền của từng vai trò" noCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Vai trò của tài khoản">
            <Table
              rowKey="id"
              size="small"
              dataSource={users}
              pagination={{ pageSize: 8 }}
              columns={[
                { title: 'Họ tên', dataIndex: 'fullName' },
                { title: 'Email', dataIndex: 'email' },
                {
                  title: 'Vai trò', dataIndex: 'role', render: (v, r) => (
                    <Select size="small" value={v} style={{ width: 160 }} onChange={(role: Role) => { update('users', r.id, { role }); log('CHANGE_ROLE', 'User', r.id, `Đổi vai trò ${r.fullName} → ${role}`); message.success('Đã cập nhật vai trò'); }}
                      options={(['MANAGER', 'RECEPTIONIST', 'COACH', 'MEMBER'] as Role[]).map((x) => ({ value: x, label: <StatusTag value={x} /> }))} />
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Ma trận quyền theo vai trò">
            <Typography.Paragraph type="secondary">Prototype: ma trận cố định, bản chính thức lưu trong DB.</Typography.Paragraph>
            <Table
              size="small"
              pagination={false}
              rowKey="perm"
              dataSource={PERMISSIONS.map((perm, i) => ({ perm, i }))}
              columns={[
                { title: 'Quyền', dataIndex: 'perm' },
                ...(['MANAGER', 'RECEPTIONIST', 'COACH', 'MEMBER'] as Role[]).map((role) => ({
                  title: <StatusTag value={role} />, align: 'center' as const,
                  render: (_: unknown, r: { i: number }) => <Checkbox defaultChecked={MATRIX[role][r.i]} />,
                })),
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
