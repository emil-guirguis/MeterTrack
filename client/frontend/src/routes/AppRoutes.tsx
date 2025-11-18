import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute, AuthGuard } from '../components/auth';
import { AppLayout } from '../components/layout';
import LoginPage from '../pages/LoginPage';
import { Dashboard } from '../pages/Dashboard';
import { MeterReadingsPage } from '../pages/MeterReadingsPage';
import { UserManagementPage } from '../features/users';
import { LocationManagementPage } from '../features/locations';
import { ContactManagementPage } from '../features/contacts';
import { DeviceManagementPage } from '../features/devices';
import { Permission, UserRole } from '../types/auth';
import { SettingsPage, MetersPage, TemplatesPage } from '../pages';
import ManagementForm from '../components/management/ManagementForm';

// Dashboard Page with Layout
const DashboardPage = () => (
  <AppLayout title="Dashboard">
    <Dashboard />
  </AppLayout>
);


const UnauthorizedPage = () => (
  <AppLayout title="Unauthorized">
    <div className="unauthorized-page">
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

        {/* Location Management Routes */}
        <Route
          path="/location"
          element={
            <AuthGuard requiredPermissions={[Permission.LOCATION_READ]}>
              <LocationManagementPage />
            </AuthGuard>
          }
        />

        {/* Device Management Routes */}
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <DeviceManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Permission-based Routes */}

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
              requireAll={false}
            >
              <AppLayout title="Settings">
                <SettingsPage />
              </AppLayout>
            </AuthGuard>
          }
        />

        {/* Contact Management Route */}
        <Route
          path="/contacts"
          element={
            <AuthGuard requiredPermissions={[Permission.CONTACT_READ]}>
              <ContactManagementPage />
            </AuthGuard>
          }
        />

        {/* Meters Module Placeholder */}
        <Route
          path="/meters"
          element={
            <AuthGuard requiredPermissions={[Permission.METER_READ]}>
              <AppLayout title="Meters">
                <MetersPage />
              </AppLayout>
            </AuthGuard>
          }
        />

        {/* Email Templates Module Placeholder */}
        <Route
          path="/templates"
          element={
            <AuthGuard requiredPermissions={[Permission.TEMPLATE_READ]}>
              <TemplatesPage />
            </AuthGuard>
          }
        />

        {/* Management Route */}
        <Route
          path="/management"
          element={
            <AuthGuard requiredPermissions={[Permission.TEMPLATE_READ]}>
              <AppLayout title="Management">
                <ManagementForm />
              </AppLayout>
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