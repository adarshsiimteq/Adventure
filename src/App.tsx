import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import GuestDashboard from './components/Guest/GuestDashboard';
import HostDashboard from './components/Host/HostDashboard';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import SuccessPage from './components/Stripe/SuccessPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const getDashboardComponent = () => {
    switch (user.role) {
      case 'guest':
        return <GuestDashboard />;
      case 'host':
        return <HostDashboard />;
      case 'superadmin':
        return <SuperAdminDashboard />;
      default:
        return <AuthForm />;
    }
  };

  return (
    <Routes>
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/*" element={getDashboardComponent()} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}