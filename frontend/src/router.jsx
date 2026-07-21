import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.jsx';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { ProtectedRoute } from './components/routing/ProtectedRoute.jsx';
import { DrivePage } from './pages/drive/DrivePage.jsx';
import { HelpCenterPage } from './pages/help/HelpCenterPage.jsx';
import { StarredPage } from './pages/starred/StarredPage.jsx';
import { TrashManagerPage } from './pages/trash/TrashManagerPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { LandingPage } from './pages/landing/LandingPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { OAuthCallbackPage } from './pages/auth/OAuthCallbackPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { BillingPage } from './pages/billing/BillingPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { BillingResultPage } from './pages/billing/BillingResultPage.jsx';
import { SharePage } from './pages/share/SharePage.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/pricing', element: <BillingPage /> },
  { path: '/billing/success', element: <BillingResultPage status="success" /> },
  { path: '/billing/cancel', element: <BillingResultPage status="cancel" /> },
  { path: '/share/:token', element: <SharePage /> },
  { path: '/oauth/callback', element: <OAuthCallbackPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> }
    ]
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DrivePage /> },
      { path: 'starred', element: <StarredPage /> },
      { path: 'trash', element: <TrashManagerPage /> },
      { path: 'help', element: <HelpCenterPage /> },
      { path: 'billing', element: <LegacyBillingRedirect /> }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);

function LegacyBillingRedirect() {
  const location = useLocation();
  return <Navigate to={`/pricing${location.search}`} replace />;
}
