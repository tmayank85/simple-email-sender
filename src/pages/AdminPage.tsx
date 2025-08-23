import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import './AdminPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface User {
  _id: string;
  userName: string;
  email: string;
  password?: string; // Optional for editing - only sent when updating
  isActive: boolean;
  activeTill: string;
  newServerEmailCount: number;
  oldServerEmailCount: number;
  orcaServerUrl: string;
  oldServerDetail: string;
  newServerDetail: string;
  createdAt: string;
  updatedAt: string;
}

const AdminPage: React.FC = () => {
  const { userInfo, logout } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Registration form state
  const [newUser, setNewUser] = useState({
    userName: '',
    email: '',
    password: '',
    activeTill: '',
    isActive: true,
    orcaServerUrl: '',
    oldServerDetail: '',
    newServerDetail: '',
    oldServerEmailCount: 0,
    newServerEmailCount: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('No admin token found');
        return;
      }

      // Fetch users with pagination and search
      const usersResponse = await fetch(`${BACKEND_URL}/api/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data.users || []);
        setTotalPages(usersData.data.pagination?.totalPages || 1);
        setCurrentPage(usersData.data.pagination?.currentPage || 1);
      } else {
        setError('Failed to fetch admin data');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    fetchAdminData(newPage, searchTerm);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh data
        fetchAdminData();
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Error deleting user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('admin_token');
      
      // Prepare update data - only include password if it's not empty
      const updateData: Partial<User> & { password?: string } = {
        userName: editingUser.userName,
        email: editingUser.email,
        activeTill: editingUser.activeTill,
        isActive: editingUser.isActive,
        orcaServerUrl: editingUser.orcaServerUrl,
        oldServerDetail: editingUser.oldServerDetail,
        newServerDetail: editingUser.newServerDetail,
        oldServerEmailCount: editingUser.oldServerEmailCount,
        newServerEmailCount: editingUser.newServerEmailCount
      };

      // Only include password if user entered a new one
      if (editingUser.password && editingUser.password.trim() !== '') {
        updateData.password = editingUser.password;
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowEditForm(false);
        setEditingUser(null);
        fetchAdminData(currentPage, searchTerm);
      } else {
        alert(`Failed to update user: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Update user error:', err);
      alert('Network error occurred while updating user');
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationLoading(true);
    setRegistrationMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRegistrationMessage('✅ User registered successfully!');
        setNewUser({
          userName: '',
          email: '',
          password: '',
          activeTill: '',
          isActive: true,
          orcaServerUrl: '',
          oldServerDetail: '',
          newServerDetail: '',
          oldServerEmailCount: 0,
          newServerEmailCount: 0
        });
        // Refresh user list
        fetchAdminData(currentPage, searchTerm);
        // Hide form after successful registration
        setTimeout(() => setShowRegistrationForm(false), 2000);
      } else {
        setRegistrationMessage(`❌ ${data.message || 'Registration failed'}`);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationMessage('❌ Network error occurred');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-user-info">
          <button 
            className="admin-btn secondary header-add-user-btn" 
            onClick={() => setShowRegistrationForm(!showRegistrationForm)}
          >
            {showRegistrationForm ? 'Hide Form' : 'Add New User'}
          </button>
          <div className="admin-user-details">
            Welcome, {userInfo?.name || 'Admin'}<br />
            <small>Logged in: {userInfo?.loginTime ? new Date(userInfo.loginTime).toLocaleString() : 'N/A'}</small>
          </div>
          <button onClick={logout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-wrapper">
          {error && <div className="admin-error">{error}</div>}

          {/* User Registration Form */}
          {showRegistrationForm && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Register New User</h2>
              </div>
              <div className="admin-section-content">
                {registrationMessage && (
                  <div className={`admin-alert ${registrationMessage.includes('✅') ? 'success' : 'error'}`}>
                    {registrationMessage}
                  </div>
                )}
                
                <form onSubmit={handleRegisterUser} className="registration-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="userName">User Name *</label>
                      <input
                        type="text"
                        id="userName"
                        name="userName"
                        value={newUser.userName}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        required
                        disabled={registrationLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={newUser.email}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        required
                        disabled={registrationLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">Password *</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={newUser.password}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        required
                        disabled={registrationLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="activeTill">Active Till *</label>
                      <input
                        type="datetime-local"
                        id="activeTill"
                        name="activeTill"
                        value={newUser.activeTill}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        required
                        disabled={registrationLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="orcaServerUrl">Orca Server URL</label>
                      <input
                        type="url"
                        id="orcaServerUrl"
                        name="orcaServerUrl"
                        value={newUser.orcaServerUrl}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        placeholder="http://localhost:3000"
                        disabled={registrationLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={newUser.isActive}
                          onChange={handleInputChange}
                          disabled={registrationLoading}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Is Active
                      </label>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="oldServerDetail">Old Server Detail</label>
                      <textarea
                        id="oldServerDetail"
                        name="oldServerDetail"
                        value={newUser.oldServerDetail}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        rows={3}
                        disabled={registrationLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newServerDetail">New Server Detail</label>
                      <textarea
                        id="newServerDetail"
                        name="newServerDetail"
                        value={newUser.newServerDetail}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        rows={3}
                        disabled={registrationLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="oldServerEmailCount">Old Server Email Count</label>
                      <input
                        type="number"
                        id="oldServerEmailCount"
                        name="oldServerEmailCount"
                        value={newUser.oldServerEmailCount}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        min="0"
                        disabled={registrationLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newServerEmailCount">New Server Email Count</label>
                      <input
                        type="number"
                        id="newServerEmailCount"
                        name="newServerEmailCount"
                        value={newUser.newServerEmailCount}
                        onChange={handleInputChange}
                        className="admin-form-input"
                        min="0"
                        disabled={registrationLoading}
                      />
                    </div>
                  </div>

                  <div className="admin-actions">
                    <button 
                      type="submit" 
                      className="admin-btn primary"
                      disabled={registrationLoading}
                    >
                      {registrationLoading ? 'Registering...' : 'Register User'}
                    </button>
                    <button 
                      type="button" 
                      className="admin-btn secondary"
                      onClick={() => setShowRegistrationForm(false)}
                      disabled={registrationLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User Management */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">User Management</h2>
            </div>
            <div className="admin-section-content">
              {/* Search and Filters */}
              <div className="admin-search-section">
                <form onSubmit={handleSearch} className="admin-search-form">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                  />
                  <button type="submit" className="admin-btn primary">Search</button>
                  {searchTerm && (
                    <button 
                      type="button" 
                      className="admin-btn secondary"
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                        fetchAdminData(1, '');
                      }}
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {/* Users Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Active Till</th>
                      <th>Status</th>
                      <th>Server URL</th>
                      <th>Email Count</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.userName}</td>
                        <td>{user.email}</td>
                        <td>{formatDate(user.activeTill)}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{user.orcaServerUrl || 'N/A'}</td>
                        <td>
                          Old: {user.oldServerEmailCount || 0}, New: {user.newServerEmailCount || 0}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="admin-btn small primary"
                              onClick={() => {
                                setEditingUser(user);
                                setShowEditForm(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-btn small danger"
                              onClick={() => setDeleteConfirm(user._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="admin-pagination">
                  <button
                    className="admin-btn secondary"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="admin-btn secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Edit User Modal */}
          {showEditForm && editingUser && (
            <div className="admin-modal-overlay">
              <div className="admin-modal">
                <div className="admin-modal-header">
                  <h3>Edit User: {editingUser.userName}</h3>
                  <button 
                    className="admin-btn close"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingUser(null);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="admin-modal-content">
                  <form onSubmit={handleUpdateUser} className="edit-user-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-userName">User Name *</label>
                        <input
                          type="text"
                          id="edit-userName"
                          value={editingUser.userName}
                          onChange={(e) => setEditingUser({...editingUser, userName: e.target.value})}
                          className="admin-form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-email">Email *</label>
                        <input
                          type="email"
                          id="edit-email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                          className="admin-form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-password">New Password (leave blank to keep current)</label>
                        <input
                          type="password"
                          id="edit-password"
                          value={editingUser.password || ''}
                          onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                          className="admin-form-input"
                          placeholder="Enter new password to change"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-activeTill">Active Till *</label>
                        <input
                          type="datetime-local"
                          id="edit-activeTill"
                          value={editingUser.activeTill ? new Date(editingUser.activeTill).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setEditingUser({...editingUser, activeTill: e.target.value})}
                          className="admin-form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-orcaServerUrl">Orca Server URL</label>
                        <input
                          type="url"
                          id="edit-orcaServerUrl"
                          value={editingUser.orcaServerUrl || ''}
                          onChange={(e) => setEditingUser({...editingUser, orcaServerUrl: e.target.value})}
                          className="admin-form-input"
                          placeholder="http://localhost:3000"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={editingUser.isActive}
                            onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})}
                            style={{ marginRight: '0.5rem' }}
                          />
                          Is Active
                        </label>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-oldServerDetail">Old Server Detail</label>
                        <textarea
                          id="edit-oldServerDetail"
                          value={editingUser.oldServerDetail || ''}
                          onChange={(e) => setEditingUser({...editingUser, oldServerDetail: e.target.value})}
                          className="admin-form-input"
                          rows={3}
                          placeholder="Details about the old server configuration"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-newServerDetail">New Server Detail</label>
                        <textarea
                          id="edit-newServerDetail"
                          value={editingUser.newServerDetail || ''}
                          onChange={(e) => setEditingUser({...editingUser, newServerDetail: e.target.value})}
                          className="admin-form-input"
                          rows={3}
                          placeholder="Details about the new server configuration"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-oldServerEmailCount">Old Server Email Count</label>
                        <input
                          type="number"
                          id="edit-oldServerEmailCount"
                          value={editingUser.oldServerEmailCount || 0}
                          onChange={(e) => setEditingUser({...editingUser, oldServerEmailCount: parseInt(e.target.value) || 0})}
                          className="admin-form-input"
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-newServerEmailCount">New Server Email Count</label>
                        <input
                          type="number"
                          id="edit-newServerEmailCount"
                          value={editingUser.newServerEmailCount || 0}
                          onChange={(e) => setEditingUser({...editingUser, newServerEmailCount: parseInt(e.target.value) || 0})}
                          className="admin-form-input"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="admin-actions">
                      <button type="submit" className="admin-btn primary">
                        Update User
                      </button>
                      <button 
                        type="button" 
                        className="admin-btn secondary"
                        onClick={() => {
                          setShowEditForm(false);
                          setEditingUser(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="admin-modal-overlay">
              <div className="admin-modal small">
                <div className="admin-modal-header">
                  <h3>Confirm Delete</h3>
                </div>
                <div className="admin-modal-content">
                  <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                  <div className="admin-actions">
                    <button 
                      className="admin-btn danger"
                      onClick={() => handleDeleteUser(deleteConfirm)}
                    >
                      Delete User
                    </button>
                    <button 
                      className="admin-btn secondary"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
