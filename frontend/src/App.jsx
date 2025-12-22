import { Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Landing from "./pages/Public/LandingPage";
import LoginPage from "./pages/Public/LoginPage";
import RegisterClientPage from "./pages/Public/RegisterClientPage";
import RegisterFreelancerPage from "./pages/Public/RegisterFreelancerPage";
import ForgotPasswordPage from "./pages/Public/ForgotPasswordPage";
import OTPConfirmPage from "./pages/Public/OTPConfirmPage";
import NewPasswordPage from "./pages/Public/NewPasswordPage";
import EmailVerificationPage from "./pages/Public/EmailVerificationPage";
import ServiceListPage from "./pages/Public/ServiceListPage";
import SearchPage from "./pages/Public/SearchPage";
import NotFoundPage from "./pages/Public/NotFoundPage";
import FreelancerPublicProfile from "./pages/Public/FreelancerPublicProfile";
import FreelancerDetailPage from "./pages/Public/FreelancerDetailPage";
import ServiceDetailPage from "./pages/jobs/ServiceDetailPage";
import StartWorkPage from "./pages/Public/StartWorkPage";

// Client pages
import DashboardPage from "./pages/Client/DashboardPage";
import BookmarkPage from "./pages/Client/BookmarkPage";

// Profile routers (auto-detect role)
import ProfileRouter from "./components/Routers/ProfileRouter";
import ProfileEditRouter from "./components/Routers/ProfileEditRouter";
import FavoritePage from "./pages/Client/FavoritePage";
import HiddenRecommendationsPage from "./pages/Client/HiddenRecommendationsPage";
import RiwayatPesananPage from "./pages/Client/RiwayatPesananPage";
import OrderListPage from "./pages/Client/OrderListPage";
import OrderDetailPage from "./pages/Client/OrderDetailPage";
import CreateOrderPage from "./pages/Client/CreateOrderPage";
import ClientSpendingPage from "./pages/Client/ClientSpendingPage";

// Freelancer pages
import ServicePage from "./pages/Freelancer/ServicePage";
import ServiceCreatePage from "./pages/Freelancer/ServiceCreatePage";
import ServiceEditPage from "./pages/Freelancer/ServiceEditPage";
import OrdersIncomingPage from "./pages/Freelancer/OrdersIncomingPage";
import FreelancerEarningsPage from "./pages/Freelancer/FreelancerEarningsPage";
import WithdrawalPage from "./pages/freelancer/WithdrawalPage";
import WithdrawalHistoryPage from "./pages/freelancer/WithdrawalHistoryPage";

// Admin pages
import AdminDashboardPage from "./pages/Admin/DashboardPage";
import AdminUserManagementPage from "./pages/Admin/UserManagementPage";
import AdminServiceManagementPage from "./pages/Admin/ServiceManagementPage";
import AdminCategoryManagementPage from "./pages/Admin/CategoryManagementPage";
import AdminSubCategoryManagementPage from "./pages/Admin/SubCategoryManagementPage";
import TransactionTrendsPage from "./pages/Admin/TransactionTrendsPage";
import AdminTransactionsPage from "./pages/Admin/TransactionsPage";
import EscrowManagementPage from "./pages/Admin/EscrowManagementPage";
import WithdrawalManagementPage from "./pages/Admin/WithdrawalManagementPage";
import AllNotificationsPage from "./pages/Admin/AllNotificationsPage";
import FraudReportDetailPage from "./pages/Admin/FraudReportDetailPage";
import RecommendationMonitoringPage from "./pages/Admin/RecommendationMonitoringPage";
import ReviewPage from "./pages/Admin/ReviewPage";
import PlatformSettingsPage from "./pages/Admin/PlatformSettingsPage";

// Payment pages
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";
import PaymentPendingPage from "./pages/payment/PaymentPendingPage";
import PaymentErrorPage from "./pages/payment/PaymentErrorPage";
import PaymentExpiredPage from "./pages/payment/PaymentExpiredPage";
import PaymentGatewayPage from "./pages/payment/PaymentGatewayPage";
import PaymentProcessingPage from "./pages/payment/PaymentProcessingPage";

// Guards
import ProtectedRoute from "./components/Guards/ProtectedRoute";

// Chats
import MessagesPage from "./pages/Chat/MessagePage";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/client" element={<RegisterClientPage />} />
      <Route
        path="/register/freelancer"
        element={
          <ProtectedRoute>
            <RegisterFreelancerPage />
          </ProtectedRoute>
        }
      />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/otp" element={<OTPConfirmPage />} />
      <Route
        path="/reset-password/new-password"
        element={<NewPasswordPage />}
      />

      {/* Halaman Panduan publik */}
      <Route path="/cara-jual-pekerjaan" element={<StartWorkPage />} />

      {/* List layanan publik */}
      <Route path="/services" element={<ServiceListPage />} />

      {/* Halaman detail layanan pakai slug */}
      <Route path="/services/:slug" element={<ServiceDetailPage />} />

      {/* Halaman Pencarian (public) */}
      <Route path="/search" element={<SearchPage />} />

      {/* Dashboard client */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboardadmin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminUserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute>
            <AdminServiceManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kategori"
        element={
          <ProtectedRoute>
            <AdminCategoryManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subkategori"
        element={
          <ProtectedRoute>
            <AdminSubCategoryManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute>
            <AdminTransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transaction-trends"
        element={
          <ProtectedRoute>
            <TransactionTrendsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/escrow"
        element={
          <ProtectedRoute>
            <EscrowManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/withdrawals"
        element={
          <ProtectedRoute>
            <WithdrawalManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute>
            <AllNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fraud-report/:type/:id"
        element={
          <ProtectedRoute>
            <FraudReportDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute>
            <ReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/recommendations"
        element={
          <ProtectedRoute>
            <RecommendationMonitoringPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/platform-settings"
        element={
          <ProtectedRoute>
            <PlatformSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Client bookmarks & favorite */}
      <Route
        path="/bookmarks"
        element={
          <ProtectedRoute>
            <BookmarkPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorit"
        element={
          <ProtectedRoute>
            <FavoritePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/layanan-disembunyikan"
        element={
          <ProtectedRoute>
            <HiddenRecommendationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riwayat-pesanan"
        element={
          <ProtectedRoute>
            <RiwayatPesananPage />
          </ProtectedRoute>
        }
      />

      {/* Freelancer service management */}
      <Route
        path="/freelance/service"
        element={
          <ProtectedRoute>
            <ServicePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelance/service/new"
        element={
          <ProtectedRoute>
            <ServiceCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelance/service/:id/edit"
        element={
          <ProtectedRoute>
            <ServiceEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freelance/orders"
        element={
          <ProtectedRoute>
            <OrdersIncomingPage />
          </ProtectedRoute>
        }
      />

      {/* Profile - Auto-detect role and show appropriate profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <ProfileEditRouter />
          </ProtectedRoute>
        }
      />

      {/* Freelancer public profile */}
      <Route path="/freelancer/:id/detail" element={<FreelancerDetailPage />} />
      <Route path="/freelancer/:id" element={<FreelancerPublicProfile />} />

      {/* Orders (client) */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrderListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Create order */}
      <Route
        path="/create-order/:id"
        element={
          <ProtectedRoute>
            <CreateOrderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-order"
        element={
          <ProtectedRoute>
            <CreateOrderPage />
          </ProtectedRoute>
        }
      />

      {/* Payment */}
      <Route path="/payment/:orderId" element={<PaymentGatewayPage />} />
      <Route
        path="/payment/processing/:paymentId"
        element={<PaymentProcessingPage />}
      />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/pending" element={<PaymentPendingPage />} />
      <Route path="/payment/error" element={<PaymentErrorPage />} />
      <Route path="/payment/expired" element={<PaymentExpiredPage />} />

      {/* Analytics */}
      <Route
        path="/analytics/earnings"
        element={
          <ProtectedRoute>
            <FreelancerEarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/spending"
        element={
          <ProtectedRoute>
            <ClientSpendingPage />
          </ProtectedRoute>
        }
      />

      {/* Withdrawal (Freelancer) */}
      <Route
        path="/withdrawal/create"
        element={
          <ProtectedRoute>
            <WithdrawalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/withdrawal/history"
        element={
          <ProtectedRoute>
            <WithdrawalHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Chat & Messages */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
