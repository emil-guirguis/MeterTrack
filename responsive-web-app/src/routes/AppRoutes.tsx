import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute, AuthGuard } from '../components/auth';
import { AppLayout } from '../components/layout';
import LoginPage from '../pages/LoginPage';
import { Dashboard } from '../pages/Dashboard';
import { MeterReadingsPage } from '../pages/MeterReadingsPage';
import { UserManagementPage } from '../pages/users';
import { BuildingManagementPage } from '../pages/buildings';
import { Permission, UserRole } from '../types/auth';

// Dashboard Page with Layout
const DashboardPage = () => (
  <AppLayout title="Dashboard">
    <Dashboard />
  </AppLayout>
);



const EquipmentPage = () => (
  <AppLayout title="Equipment">
    <div style={{ padding: '2rem' }}>
      <h2>Equipment Management</h2>
      <p>Track and manage equipment across all your buildings.</p>
    </div>
  </AppLayout>
);

const SettingsPage = () => (
  <AppLayout title="Settings">
    <div style={{ padding: '2rem' }}>
      <h2>System Settings</h2>
      <p>Configure your application settings and preferences.</p>
    </div>
  </AppLayout>
);

const UnauthorizedPage = () => (
  <AppLayout title="Unauthorized">
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
    </div>
  </AppLayout>
);

const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes - Require Authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* User Management Routes */}
        <Route
          path="/users"
          element={
            <AuthGuard requiredPermissions={[Permission.USER_READ]}>
              <UserManagementPage />
            </AuthGuard>
          }
        />

        {/* Manager and Above Routes */}
        <Route
          path="/buildings"
          element={
            <AuthGuard
              requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}
              requireAll={false}
            >
              <BuildingManagementPage />
            </AuthGuard>
          }
        />

        {/* Permission-based Routes */}
        <Route
          path="/equipment"
          element={
            <AuthGuard requiredPermissions={[Permission.EQUIPMENT_READ]}>
              <EquipmentPage />
            </AuthGuard>
          }
        />

        {/* Meter Readings Route */}
        <Route
          path="/meter-readings"
          element={
            <ProtectedRoute>
              <MeterReadingsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings - Multiple Permission Requirements */}
        <Route
          path="/settings"
          element={
            <AuthGuard
              requiredPermissions={[Permission.SETTINGS_READ, Permission.SETTINGS_UPDATE]}
              requireAll={false} // User needs ANY of these permissions
            >
              <SettingsPage />
            </AuthGuard>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AppRoutes;