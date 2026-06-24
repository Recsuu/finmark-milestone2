import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { NotificationProvider } from '../context/Notifications'; 
import LoginPage from '../pages/LoginPage';       
import RegisterPage from '../pages/RegisterPage'; 
import DashboardPage from '../pages/DashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';

// Single Source of Truth for Route Traffic Direction
const RootRedirectHandler = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizedRole = user.role ? String(user.role).trim().toLowerCase() : '';

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={normalizedRole === 'admin' ? "/admin" : "/dashboard"} replace />;
};

// Guard for authenticated dashboard spaces
const ProtectedRoutes = ({ allowAdmin }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizedRole = user.role ? String(user.role).trim().toLowerCase() : '';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowAdmin && normalizedRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!allowAdmin && normalizedRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

// Guard to block authenticated users from auth forms
const PublicRoutes = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizedRole = user.role ? String(user.role).trim().toLowerCase() : '';

  if (token) {
    return <Navigate to={normalizedRole === 'admin' ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

function AppRoutes() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          
          {/* Base Root Route Handling */}
          <Route path="/" element={<RootRedirectHandler />} />

          {/* Public Authentication Forms Block */}
          <Route element={<PublicRoutes />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          
          {/* Protected Client Dashboard Path Container */}
          <Route element={<ProtectedRoutes allowAdmin={false} />}>
            <Route path="/dashboard" element={<DashboardPage />} /> 
          </Route>
          
          {/* Protected Admin Dashboard Path Container */}
          <Route element={<ProtectedRoutes allowAdmin={true} />}>
            <Route path="/admin" element={<AdminDashboardPage />} /> 
          </Route>
          
          {/* Catch-all Fallback Redirect Engine */}
          <Route path="*" element={<RootRedirectHandler />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default AppRoutes;