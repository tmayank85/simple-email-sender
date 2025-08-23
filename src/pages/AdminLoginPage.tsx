import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import './AdminLoginPage.css';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;

    setIsLoading(true);
    setMessage('');

    try {
      const result = await login(email, password);
      setMessage(result.message);
      
      if (result.success) {
        // Navigation will be handled by the router when authentication state changes
      }
    } catch {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Admin Panel</h1>
          <p>Enter your admin credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          {message && (
            <div className={`admin-alert ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="admin-form-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="admin-form-input"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="admin-login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div className="back-to-main">
          <Link to="/">← Back to Main Application</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
