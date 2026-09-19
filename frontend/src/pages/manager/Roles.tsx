import { Alert, Card, Col, Row, Table, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import Page from '../../components/Page';
import StatusTag from '../../components/StatusTag';
import { useApp } from '../../store/AppContext';
import type { Role } from '../../types';

/** RBAC cố định (BR_1.2): 4 role, quyền hardcode, không đổi role qua UI. Trang chỉ để tra cứu. */
const PERMISSIONS: [string, Role[]][] = [
  ['Tạo/quản lý Coach, Receptionist; xem/vô hiệu hóa Member', ['MANAGER']],
  ['CRUD bộ môn, facility, lịch bảo trì, System Settings', ['MANAGER']],
  ['CRUD khóa học, lớp; phân công HLV; duyệt mở lớp', ['MANAGER']],
  ['Duyệt chuyên môn HLV', ['MANAGER']],
  ['CRUD gói thành viên, coupon', ['MANAGER']],
  ['Overview, báo cáo, audit log', ['MANAGER']],
  ['Đăng ký chuyên môn, đăng ký dạy lớp, rút khỏi lớp OPEN', ['COACH']],
  ['Điểm danh, session notes, đánh giá học viên', ['COACH', 'MANAGER']],
  ['Xem member trong lớp mình', ['COACH']],
  ['Check-in, tra cứu thành viên, nạp ví tại quầy', ['RECEPTIONIST']],
  ['Đặt sân tại quầy (member + guest), ghi nhận thanh toán, xuất hóa đơn, hoàn tiền', ['RECEPTIONIST']],
  ['Xử lý yêu cầu hỗ trợ', ['RECEPTIONIST']],
  ['Mua gói, đặt sân online, đăng ký lớp, nạp ví, yêu cầu hỗ trợ', ['MEMBER']],
  ['Cập nhật hồ sơ cá nhân, đổi mật khẩu', ['MANAGER', 'COACH', 'MEMBER', 'RECEPTIONIST']],
];

export default function Roles() {
  const { data } = useApp();
  const ROLES: Role[] = ['MANAGER', 'RECEPTIONIST', 'COACH', 'MEMBER'];
  return (
    <Page title="Phân quyền (cố định)" subtitle="4 vai trò với quyền hardcode; Manager đầu tiên tạo bằng seed. Không có thao tác đổi role — thay role cần xử lý profile/ví ngoài workflow." noCard>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} title="Mỗi account có đúng một profile theo role (member_profile / coach_profile / receptionist_profile / manager_profile), tạo cùng transaction." />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="Số tài khoản theo vai trò">
            <Table size="small" pagination={false} rowKey="role" dataSource={ROLES.map((r) => ({ role: r, total: data.users.filter((u) => u.role === r).length, active: data.users.filter((u) => u.role === r && u.status === 'ACTIVE').length }))} columns={[
              { title: 'Vai trò', dataIndex: 'role', render: (v) => <StatusTag value={v} /> },
              { title: 'Tổng', dataIndex: 'total', align: 'center' },
              { title: 'Đang hoạt động', dataIndex: 'active', align: 'center' },
            ]} />
          </Card>
        </Col>
        <Col xs={24} xl={15}>
          <Card title="Ma trận quyền">
            <Table size="small" pagination={false} rowKey="perm" dataSource={PERMISSIONS.map(([perm, roles]) => ({ perm, roles }))} columns={[
              { title: 'Quyền', dataIndex: 'perm' },
              ...ROLES.map((role) => ({ title: <StatusTag value={role} />, align: 'center' as const, render: (_: unknown, r: { roles: Role[] }) => r.roles.includes(role) ? <Tag color="green" style={{ margin: 0 }}><CheckOutlined /></Tag> : <span style={{ color: '#d9d4c8' }}>—</span> })),
            ]} />
          </Card>
        </Col>
      </Row>
    </Page>
  );
}
