import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { useAdminAuth } from './hooks/useAdminAuth';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import './App.css';

// Regular app content (protected route)
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainPage /> : <LoginPage />;
};

// Admin routes component
const AdminRoutes: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();
  
  return (
    <Routes>
      <Route 
        path="/admin" 
        element={isAuthenticated ? <AdminPage /> : <AdminLoginPage />} 
      />
      <Route 
        path="/admin/login" 
        element={!isAuthenticated ? <AdminLoginPage /> : <Navigate to="/admin" replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Regular app routes */}
            <Route path="/" element={<AppContent />} />
            <Route path="/login" element={<AppContent />} />
            
            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
