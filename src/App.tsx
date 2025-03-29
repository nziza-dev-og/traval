import  { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { PendingApproval } from './pages/auth/PendingApproval';
import { Unauthorized } from './pages/auth/Unauthorized';
import { AdminDashboard } from './pages/admin/Dashboard';
import { StudentsManagement } from './pages/admin/StudentsManagement';
import { UsersManagement } from './pages/admin/UsersManagement';
import { RoutesManagement } from './pages/admin/RoutesManagement';
import { BusesManagement } from './pages/admin/BusesManagement';
import { WeatherDashboard } from './pages/admin/WeatherDashboard';
import { DriverDashboard } from './pages/driver/Dashboard';
import { ParentDashboard } from './pages/parent/Dashboard';
import { MapView } from './pages/MapView';
import { NetworkStatus } from './pages/NetworkStatus';
import { UserRole } from './types';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NetworkStatus />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/track-bus/:studentId" element={<MapView />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <AuthGuard allowedRoles={[UserRole.ADMIN, UserRole.DRIVER, UserRole.PARENT]}>
              <DashboardLayout />
            </AuthGuard>
          }>
            {/* Admin Routes */}
            <Route path="" element={
              <AuthGuard allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </AuthGuard>
            } />
            <Route path="students" element={
              <AuthGuard allowedRoles={[UserRole.ADMIN]}>
                <StudentsManagement />
              </AuthGuard>
            } />
            <Route path="users" element={
              <AuthGuard allowedRoles={[UserRole.ADMIN]}>
                <UsersManagement />
              </AuthGuard>
            } />
            <Route path="routes" element={
              <AuthGuard allowedRoles={[UserRole.ADMIN]}>
                <RoutesManagement />
              </AuthGuard>
            } />
            <Route path="buses" element={
              <AuthGuard allowedRoles={[UserRole.ADMIN]}>
                <BusesManagement />
              </AuthGuard>
            } />
            <Route path="weather" element={
              <AuthGuard allowedRoles={[UserRole.ADMIN, UserRole.DRIVER, UserRole.PARENT]}>
                <WeatherDashboard />
              </AuthGuard>
            } />

            {/* Driver Routes */}
            <Route path="" element={
              <AuthGuard allowedRoles={[UserRole.DRIVER]}>
                <DriverDashboard />
              </AuthGuard>
            } />

            {/* Parent Routes */}
            <Route path="" element={
              <AuthGuard allowedRoles={[UserRole.PARENT]}>
                <ParentDashboard />
              </AuthGuard>
            } />

            {/* Default route redirects to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
 