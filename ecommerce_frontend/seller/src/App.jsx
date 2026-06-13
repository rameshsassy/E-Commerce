import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SellerPortalHome from './components/routing/SellerPortalHome';

import DashboardLayout from './layouts/DashboardLayout';
import SellerAuthLayout from './layouts/SellerAuthLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

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
import SellerRequestWebsite from './pages/seller/SellerRequestWebsite';
import SellerVouchers from './pages/seller/SellerVouchers';

// Footer links displayed in dashboard layouts
import TermsAndConditions from './pages/public/TermsAndConditions';
import PrivacyPolicy from './pages/public/PrivacyInfo';
import AboutUs from './pages/public/AboutUs';
import RefundPolicy from './pages/public/RefundPolicy';
import ShippingPolicy from './pages/public/ShippingPolicy';
import ContactInformation from './pages/public/ContactInformation';
import ReturnPolicy from './pages/public/ReturnPolicy';
import ReplacementPolicy from './pages/public/ReplacementPolicy';
import SellerAgreement from './pages/public/SellerAgreement';

import FloatingChat from './components/chat/FloatingChat';

function AppRoutes() {
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
        <Route path="/seller/request-website" element={<SellerRequestWebsite />} />
        <Route path="/seller/vouchers" element={<SellerVouchers />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/replacement-policy" element={<ReplacementPolicy />} />
        <Route path="/seller-agreement" element={<SellerAgreement />} />
        <Route path="/contact-info" element={<ContactInformation />} />
      </Route>

      <Route path="/" element={<SellerPortalHome />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
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
