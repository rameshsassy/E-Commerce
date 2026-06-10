import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PortalRouteGuard from './components/routing/PortalRouteGuard';

import PublicLayout from './layouts/PublicLayout';

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
import AboutUs from './pages/public/AboutUs';
import PrivacyPolicy from './pages/public/PrivacyInfo';
import RefundPolicy from './pages/public/RefundPolicy';
import ShippingPolicy from './pages/public/ShippingPolicy';
import ContactInformation from './pages/public/ContactInformation';
import PublicStorePage from './pages/public/PublicStorePage';

import FloatingChat from './components/chat/FloatingChat';

function AppRoutes() {
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
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/contact-info" element={<ContactInformation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-setup" element={<AdminRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
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
