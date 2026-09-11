import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { theme } from './theme';
import { AppProvider, useApp } from './store/AppContext';
import AppLayout from './components/AppLayout';
import type { Role } from './types';

import Landing from './pages/landing/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/common/Profile';
import Notifications from './pages/common/Notifications';
import MemberDetail from './components/MemberDetail';
import SupportRequests from './components/SupportRequests';
import Invoice from './components/Invoice';

import ManagerDashboard from './pages/manager/Dashboard';
import Members from './pages/manager/Members';
import StaffPage from './pages/manager/StaffPage';
import Roles from './pages/manager/Roles';
import Plans from './pages/manager/Plans';
import { Rooms, Sports } from './pages/manager/SimpleCrud';
import Classes from './pages/manager/Classes';
import ClassDetail from './pages/manager/ClassDetail';
import ManagerSchedule from './pages/manager/Schedule';
import Reports from './pages/manager/Reports';
import AuditLogPage from './pages/manager/AuditLog';

import ReceptionistDashboard from './pages/receptionist/Dashboard';
import MemberLookup from './pages/receptionist/MemberLookup';
import RegisterMember from './pages/receptionist/RegisterMember';
import Subscriptions from './pages/receptionist/Subscriptions';
import CheckIn from './pages/receptionist/CheckIn';
import Enrollments from './pages/receptionist/Enrollments';
import Payments from './pages/receptionist/Payments';
import CourtBookings from './pages/receptionist/CourtBookings';

import MemberHome from './pages/member/Home';
import MemberPlans from './pages/member/Plans';
import Checkout from './pages/member/Checkout';
import Membership from './pages/member/Membership';
import MemberClasses from './pages/member/Classes';
import Courts from './pages/member/Courts';
import MemberClassDetail from './pages/member/ClassDetail';
import { Coaches, MyAttendance, MySupport, MyTrainingPlan, PaymentHistory } from './pages/member/Misc';
import MyResults from './pages/member/Results';
import MySchedule from './pages/member/Schedule';
import AiChat from './pages/member/AiChat';

import CoachDashboard from './pages/coach/Dashboard';
import { CoachClassDetail, CoachClasses, CoachSchedule, StudentDetail } from './pages/coach/ClassPages';
import Attendance from './pages/coach/Attendance';
import { Announcements, Progress, TrainingPlans, TrainingResults } from './pages/coach/Training';
import AiSuggest from './pages/coach/AiSuggest';

function RequireRole({ role }: { role: Role }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to={`/${currentUser.role.toLowerCase()}`} replace />;
  return <AppLayout />;
}

function Root() {
  const { currentUser } = useApp();
  return <Navigate to={currentUser ? `/${currentUser.role.toLowerCase()}` : '/login'} replace />;
}

const common = (
  <>
    <Route path="profile" element={<Profile />} />
    <Route path="notifications" element={<Notifications />} />
  </>
);

export default function App() {
  return (
    <ConfigProvider locale={viVN} theme={theme}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/manager" element={<RequireRole role="MANAGER" />}>
              <Route index element={<ManagerDashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="members/:id" element={<MemberDetail />} />
              <Route path="coaches" element={<StaffPage role="COACH" />} />
              <Route path="staff" element={<StaffPage role="RECEPTIONIST" />} />
              <Route path="roles" element={<Roles />} />
              <Route path="plans" element={<Plans />} />
              <Route path="sports" element={<Sports />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="classes" element={<Classes />} />
              <Route path="classes/:id" element={<ClassDetail />} />
              <Route path="schedule" element={<ManagerSchedule />} />
              <Route path="courts" element={<CourtBookings manager />} />
              <Route path="payments/:id" element={<Invoice />} />
              <Route path="reports" element={<Reports />} />
              <Route path="support" element={<SupportRequests />} />
              <Route path="audit-log" element={<AuditLogPage />} />
              {common}
            </Route>

            <Route path="/receptionist" element={<RequireRole role="RECEPTIONIST" />}>
              <Route index element={<ReceptionistDashboard />} />
              <Route path="members" element={<MemberLookup />} />
              <Route path="members/:id" element={<MemberDetail receptionist />} />
              <Route path="register-member" element={<RegisterMember />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="check-in" element={<CheckIn />} />
              <Route path="enrollments" element={<Enrollments />} />
              <Route path="courts" element={<CourtBookings />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payments/:id" element={<Invoice />} />
              <Route path="support" element={<SupportRequests />} />
              {common}
            </Route>

            <Route path="/member" element={<RequireRole role="MEMBER" />}>
              <Route index element={<MemberHome />} />
              <Route path="plans" element={<MemberPlans />} />
              <Route path="checkout/:kind/:id" element={<Checkout />} />
              <Route path="membership" element={<Membership />} />
              <Route path="classes" element={<MemberClasses />} />
              <Route path="classes/:id" element={<MemberClassDetail />} />
              <Route path="courts" element={<Courts />} />
              <Route path="schedule" element={<MySchedule />} />
              <Route path="coaches" element={<Coaches />} />
              <Route path="payments" element={<PaymentHistory />} />
              <Route path="payments/:id" element={<Invoice />} />
              <Route path="attendance" element={<MyAttendance />} />
              <Route path="results" element={<MyResults />} />
              <Route path="training-plan" element={<MyTrainingPlan />} />
              <Route path="support" element={<MySupport />} />
              <Route path="ai-chat" element={<AiChat />} />
              {common}
            </Route>

            <Route path="/coach" element={<RequireRole role="COACH" />}>
              <Route index element={<CoachDashboard />} />
              <Route path="schedule" element={<CoachSchedule />} />
              <Route path="classes" element={<CoachClasses />} />
              <Route path="classes/:id" element={<CoachClassDetail />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="training-plans" element={<TrainingPlans />} />
              <Route path="results" element={<TrainingResults />} />
              <Route path="progress" element={<Progress />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="ai-suggest" element={<AiSuggest />} />
              {common}
            </Route>

            <Route path="*" element={<Root />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ConfigProvider>
  );
}
