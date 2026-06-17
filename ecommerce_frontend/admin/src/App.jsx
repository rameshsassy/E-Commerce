import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PortalRouteGuard from './components/routing/PortalRouteGuard';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/auth/Login';
import AdminRegister from './pages/auth/AdminRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSellers from './pages/admin/AdminSellers';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminKYC from './pages/admin/AdminKYC';
import AdminKycEntityTypes from './pages/admin/AdminKycEntityTypes';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReturns from './pages/admin/AdminReturns';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPremiumSellers from './pages/admin/AdminPremiumSellers';
import AdminPremiumSellerDashboard from './pages/admin/AdminPremiumSellerDashboard';
import AdminRoles from './pages/admin/AdminRoles';
import AdminEmailLogs from './pages/admin/AdminEmailLogs';
import AdminChat from './pages/admin/AdminChat';
import AdminWebsiteRequests from './pages/admin/AdminWebsiteRequests';
import AdminMenu from './pages/admin/AdminMenu';
import HeaderManagement from './pages/admin/homepage-management/HeaderManagement';
import AdminDataMigration from './pages/admin/AdminDataMigration';
import AdminRewards from './pages/admin/AdminRewards';
import AdminProfile from './pages/admin/AdminProfile';
import AdminFAQs from './pages/admin/AdminFAQs';
import AdminPolicies from './pages/admin/AdminPolicies';
import AdminFeaturedProducts from './pages/admin/AdminFeaturedProducts';

import FloatingChat from './components/chat/FloatingChat';

function AppRoutes() {
  return (
    <PortalRouteGuard>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-setup" element={<AdminRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        <Route element={<DashboardLayout variant="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
          <Route path="/admin/sellers" element={<AdminSellers />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/kyc" element={<AdminKYC />} />
          <Route path="/admin/kyc-entity-types" element={<AdminKycEntityTypes />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/returns" element={<AdminReturns />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/vouchers" element={<AdminVouchers />} />
          <Route path="/admin/premium-sellers" element={<AdminPremiumSellers />} />
          <Route path="/admin/premium-seller-dashboard" element={<AdminPremiumSellerDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/homepage-management" element={<HeaderManagement />} />
          <Route path="/admin/email-logs" element={<AdminEmailLogs />} />
          <Route path="/admin/chats" element={<AdminChat />} />
          <Route path="/admin/website-requests" element={<AdminWebsiteRequests />} />
          <Route path="/admin/data-migration" element={<AdminDataMigration />} />
          <Route path="/admin/rewards" element={<AdminRewards />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/faqs" element={<AdminFAQs />} />
          <Route path="/admin/policies" element={<AdminPolicies />} />
          <Route path="/admin/featured-products" element={<AdminFeaturedProducts />} />
        </Route>

        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </PortalRouteGuard>
  );
}

const App = () => {
  return (
    <Router>
      <AppRoutes />
      <FloatingChat />
    </Router>
  );
};

export default App;
