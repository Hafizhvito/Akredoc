import { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";

// Import Layout
import Layout from "./components/layout/Layout";

// Import pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Ppepp from "./pages/Ppepp";
import ManajemenDokumen from "./pages/ManajemenDokumen";
import LogAktivitas from "./pages/LogAktivitas";
import Statistics from './pages/Statistics';

// Define public and protected paths
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];
const DEFAULT_PROTECTED_REDIRECT = '/dashboard';
const DEFAULT_PUBLIC_REDIRECT = '/login';

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isInitialized, setIsInitialized] = useState(false);

  const handleLogin = useCallback((newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        await axios.post("https://akredoc.my.id/api/logout", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setIsInitialized(true);
  }, [token]);

  // Authentication check component
  const AuthCheck = ({ children, requireAuth }) => {
    const location = useLocation();
    const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

    if (!isInitialized) {
      return null; // or a loading spinner
    }

    if (requireAuth) {
      // Protected route logic
      if (!token) {
        return <Navigate to={DEFAULT_PUBLIC_REDIRECT} state={{ from: location }} replace />;
      }
      return <Layout onLogout={handleLogout}>{children}</Layout>;
    } else {
      // Public route logic
      if (token && isPublicPath) {
        return <Navigate to={DEFAULT_PROTECTED_REDIRECT} replace />;
      }
      return children;
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <AuthCheck requireAuth>
              <Dashboard />
            </AuthCheck>
          } />
          <Route path="/ppepp" element={
            <AuthCheck requireAuth>
              <Ppepp />
            </AuthCheck>
          } />
          <Route path="/manajemen-dokumen" element={
            <AuthCheck requireAuth>
              <ManajemenDokumen />
            </AuthCheck>
          } />
          <Route path="/log-aktivitas" element={
            <AuthCheck requireAuth>
              <LogAktivitas />
            </AuthCheck>
          } />
          <Route path="/profile" element={
            <AuthCheck requireAuth>
              <Profile />
            </AuthCheck>
          } />
          <Route path="/statistics" element={
            <AuthCheck requireAuth>
              <Statistics />
            </AuthCheck>
          } />

          {/* Public Routes */}
          <Route path="/login" element={
            <AuthCheck requireAuth={false}>
              <Login onLogin={handleLogin} />
            </AuthCheck>
          } />
          <Route path="/forgot-password" element={
            <AuthCheck requireAuth={false}>
              <ForgotPassword />
            </AuthCheck>
          } />
          <Route path="/reset-password" element={
            <AuthCheck requireAuth={false}>
              <ResetPassword />
            </AuthCheck>
          } />

          {/* Default Route */}
          <Route path="/" element={
            <Navigate to={token ? DEFAULT_PROTECTED_REDIRECT : DEFAULT_PUBLIC_REDIRECT} replace />
          } />

          {/* Catch all route - redirect to login or dashboard */}
          <Route path="*" element={
            <Navigate to={token ? DEFAULT_PROTECTED_REDIRECT : DEFAULT_PUBLIC_REDIRECT} replace />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;