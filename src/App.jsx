import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/StudentDashboard';
import { WeeklyMenu } from './pages/WeeklyMenu';
import { GiveFeedback } from './pages/GiveFeedback';
import { MyFeedback } from './pages/MyFeedback';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManageMenu } from './pages/ManageMenu';
import { ViewFeedback } from './pages/ViewFeedback';
import { isSupabaseConfigured } from './supabaseClient';

const ConfigurationNotice = () => (
  <main style={{ maxWidth: '680px', margin: '0 auto', padding: '4rem 1.5rem', fontFamily: 'system-ui, sans-serif' }}>
    <h1>Supabase setup required</h1>
    <p>
      Add your Supabase project URL and anonymous key to a local <code>.env</code> file,
      then restart the Vite server.
    </p>
    <pre style={{ padding: '1rem', background: '#f3f4f6', overflowX: 'auto' }}>
      VITE_SUPABASE_URL=https://your-project.supabase.co{`\n`}VITE_SUPABASE_ANON_KEY=your-anon-key
    </pre>
  </main>
);

// Route guard for authenticated users with role validation
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but profile not loaded yet -> show loading
  if (!profile) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading user profile...</p>
      </div>
    );
  }

  // Role not allowed -> redirect to default dashboard landing
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  );
};

// Root redirect handler based on user role
const RootRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Redirecting...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Redirect to correct dashboard based on role
  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/student" replace />;
};

function App() {
  if (!isSupabaseConfigured) {
    return <ConfigurationNotice />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Protected Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/menu"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <WeeklyMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/give-feedback"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <GiveFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-feedback"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyFeedback />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ViewFeedback />
              </ProtectedRoute>
            }
          />

          {/* Root and Fallbacks */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
