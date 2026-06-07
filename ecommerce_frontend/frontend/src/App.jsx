import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { isSellerPortal, isLocalHostname } from './utils/portalHost';
import PortalRouteGuard from './components/routing/PortalRouteGuard';
import SellerPortalHome from './components/routing/SellerPortalHome';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import SellerAuthLayout from './layouts/SellerAuthLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminRegister from './pages/auth/AdminRegister';

import Home from './pages/public/Home';
import Products from './pages/public/Products';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/public/Cart';
import Wishlist from './pages/public/Wishlist';
import Checkout from './pages/public/Checkout';
import OrderSuccess from './pages/public/OrderSuccess';
import CustomerProfile from './pages/public/CustomerProfile';
import OrderTracking from './pages/public/OrderTracking';
import PaymentFailed from './pages/public/PaymentFailed';
import Notifications from './pages/public/Notifications';
import Support from './pages/public/Support';
import FAQ from './pages/public/FAQ';
import TermsAndConditions from './pages/public/TermsAndConditions';
import PublicStorePage from './pages/public/PublicStorePage';

import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProfile from './pages/seller/SellerProfile';
import SellerProducts from './pages/seller/SellerProducts';
import SellerKYC from './pages/seller/SellerKYC';
import SellerSubscription from './pages/seller/SellerSubscription';
import SellerAnalytics from './pages/seller/SellerAnalytics';
import SellerOrdersEnquiries from './pages/seller/SellerOrdersEnquiries';
import SellerInvoices from './pages/seller/SellerInvoices';
import SellerRaiseFunds from './pages/seller/SellerRaiseFunds';
import SellerReferAndEarn from './pages/seller/SellerReferAndEarn';
import SellerAboutUs from './pages/seller/SellerAboutUs';
import SellerPremium from './pages/seller/SellerPremium';
import SellerChat from './pages/seller/SellerChat';
import SellerBuyProducts from './pages/seller/SellerBuyProducts';
import AdminChat from './pages/admin/AdminChat';
import FloatingChat from './components/chat/FloatingChat';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSellers from './pages/admin/AdminSellers';
import AdminKYC from './pages/admin/AdminKYC';
import AdminKycEntityTypes from './pages/admin/AdminKycEntityTypes';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReturns from './pages/admin/AdminReturns';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPremiumSellers from './pages/admin/AdminPremiumSellers';
import AdminPremiumSellerDashboard from './pages/admin/AdminPremiumSellerDashboard';
import AdminRoles from './pages/admin/AdminRoles';
import AdminEmailLogs from './pages/admin/AdminEmailLogs';

function SellerPortalRoutes() {
  return (
    <Routes>
      <Route element={<SellerAuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      <Route element={<DashboardLayout variant="seller" />}>
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/orders-enquiries" element={<SellerOrdersEnquiries />} />
        <Route path="/seller/analytics" element={<SellerAnalytics />} />
        <Route path="/seller/profile" element={<SellerProfile />} />
        <Route path="/seller/products" element={<SellerProducts />} />
        <Route path="/seller/kyc" element={<SellerKYC />} />
        <Route path="/seller/subscription" element={<SellerSubscription />} />
        <Route path="/seller/invoices" element={<SellerInvoices />} />
        <Route path="/seller/raise-funds" element={<SellerRaiseFunds />} />
        <Route path="/seller/premium" element={<SellerPremium />} />
        <Route path="/seller/refer-and-earn" element={<SellerReferAndEarn />} />
        <Route path="/seller/chat" element={<SellerChat />} />
        <Route path="/seller/about-us" element={<SellerAboutUs />} />
        <Route path="/seller/buy-products" element={<SellerBuyProducts />} />
        <Route path="/terms" element={<TermsAndConditions />} />
      </Route>

      <Route path="/" element={<SellerPortalHome />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function CustomerPortalRoutes() {
  return (
    <PortalRouteGuard>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products/category/:main/:sub/:type" element={<Products />} />
          <Route path="/products/category/:main/:sub" element={<Products />} />
          <Route path="/products/category/:main" element={<Products />} />
          <Route path="/products" element={<Products />} />
          <Route path="/store/:subdomain" element={<PublicStorePage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/track/:shipmentId" element={<OrderTracking />} />
          <Route path="/profile/*" element={<CustomerProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-setup" element={<AdminRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        <Route element={<DashboardLayout variant="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
          <Route path="/admin/sellers" element={<AdminSellers />} />
          <Route path="/admin/kyc" element={<AdminKYC />} />
          <Route path="/admin/kyc-entity-types" element={<AdminKycEntityTypes />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/returns" element={<AdminReturns />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/premium-sellers" element={<AdminPremiumSellers />} />
          <Route path="/admin/premium-seller-dashboard" element={<AdminPremiumSellerDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/email-logs" element={<AdminEmailLogs />} />
          <Route path="/admin/chats" element={<AdminChat />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PortalRouteGuard>
  );
}

function AppRoutes() {
  const { pathname, search } = useLocation();
  const host = window.location.hostname;
  const portalParam = new URLSearchParams(search).get('portal');
  const sellerMode =
    isSellerPortal(host, pathname) ||
    portalParam === 'seller' ||
    (isLocalHostname(host) && pathname.startsWith('/seller')) ||
    (host.endsWith('.vercel.app') && pathname.startsWith('/seller'));

  return sellerMode ? <SellerPortalRoutes /> : <CustomerPortalRoutes />;
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
