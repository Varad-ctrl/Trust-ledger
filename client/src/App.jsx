import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './routes/Guards';
import AppLayout           from './components/layout/AppLayout';
import LoginPage           from './pages/auth/LoginPage';
import RegisterPage        from './pages/auth/RegisterPage';
import DashboardPage       from './pages/dashboard/DashboardPage';
import AccountsPage        from './pages/accounts/AccountsPage';
import BeneficiariesPage   from './pages/beneficiaries/BeneficiariesPage';
import TransferPage        from './pages/transactions/TransferPage';
import TransactionsPage    from './pages/transactions/TransactionsPage';
import ProfilePage         from './pages/profile/ProfilePage';
import ScheduledPage       from './pages/scheduled/ScheduledPage';
import StandingPage        from './pages/standing/StandingPage';
import UpiPage             from './pages/upi/UpiPage';
import AdminPage           from './pages/admin/AdminPage';
// Phase 5 — AI
import SmartDashboardPage  from './pages/ai/SmartDashboardPage';
import AiChatPage          from './pages/ai/AiChatPage';
import AiInsightsPage      from './pages/ai/AiInsightsPage';
import FraudPage           from './pages/ai/FraudPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"          element={<DashboardPage />} />
              <Route path="/accounts"           element={<AccountsPage />} />
              <Route path="/beneficiaries"      element={<BeneficiariesPage />} />
              <Route path="/transfer"           element={<TransferPage />} />
              <Route path="/transactions"       element={<TransactionsPage />} />
              <Route path="/profile"            element={<ProfilePage />} />
              <Route path="/scheduled"          element={<ScheduledPage />} />
              <Route path="/standing"           element={<StandingPage />} />
              <Route path="/upi"                element={<UpiPage />} />
              {/* Phase 5 — AI routes */}
              <Route path="/ai/smart-dashboard" element={<SmartDashboardPage />} />
              <Route path="/ai/chat"            element={<AiChatPage />} />
              <Route path="/ai/insights"        element={<AiInsightsPage />} />
              <Route path="/ai/fraud"           element={<FraudPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '14px', fontWeight: '500' } }} />
    </AuthProvider>
  );
}
