import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import './AdminPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface Server {
  serverId: string;
  serverName: string;
  serverUrl: string;
  serverIp: string;
  emailCount: number;
  uptime: number;
  lastSeen: string;
  isActive: boolean;
  serverDetail: string;
}

interface User {
  _id: string;
  userName: string;
  email: string;
  password?: string; // Optional for editing - only sent when updating
  isActive: boolean;
  activeTill: string;
  // Multi-server support
  servers: Server[];
  defaultServerId: string;
  createdAt?: string;
  updatedAt?: string;
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

  // Server management state
  const [showServerForm, setShowServerForm] = useState(false);
  const [newServer, setNewServer] = useState({
    serverName: '',
    serverUrl: '',
    serverIp: '',
    emailCount: 0,
    uptime: 0,
    lastSeen: new Date().toISOString(),
    isActive: true,
    serverDetail: ''
  });

  // Registration form state
  const [newUser, setNewUser] = useState({
    userName: '',
    email: '',
    password: '',
    activeTill: '',
    isActive: true,
    // Multi-server support
    servers: [] as Server[],
    defaultServerId: ''
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
      
      // Prepare update data - only basic user fields, not servers array
      const updateData: Partial<User> & { password?: string } = {
        userName: editingUser.userName,
        email: editingUser.email,
        activeTill: editingUser.activeTill,
        isActive: editingUser.isActive,
        defaultServerId: editingUser.defaultServerId || ''
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
        alert('✅ User updated successfully!');
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
      // Send complete user object with all fields including servers array
      const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser), // Includes servers[] and defaultServerId
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
          // Multi-server support
          servers: [] as Server[],
          defaultServerId: ''
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

  // Server management functions
  const addServerToUser = async () => {
    if (!editingUser) return;

    // Validate required fields
    if (!newServer.serverName || !newServer.serverUrl) {
      alert('❌ Please fill in both Server Name and Server URL');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addServer: {
            serverName: newServer.serverName,
            serverUrl: newServer.serverUrl,
            serverIp: newServer.serverIp,
            serverDetail: newServer.serverDetail
          }
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state with the response
        setEditingUser(data.data);
        // Reset server form
        setNewServer({
          serverName: '',
          serverUrl: '',
          serverIp: '',
          emailCount: 0,
          uptime: 0,
          lastSeen: new Date().toISOString(),
          isActive: true,
          serverDetail: ''
        });
        setShowServerForm(false);
        alert('✅ Server added successfully!');
      } else {
        alert(`❌ Failed to add server: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Add server error:', err);
      alert('❌ Network error occurred while adding server');
    }
  };

  const removeServerFromUser = async (serverId: string) => {
    if (!editingUser) return;

    if (!confirm('Are you sure you want to remove this server?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removeServerId: serverId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state with the response
        setEditingUser(data.data);
        alert('✅ Server removed successfully!');
      } else {
        alert(`❌ Failed to remove server: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Remove server error:', err);
      alert('❌ Network error occurred while removing server');
    }
  };

  // const updateServerForUser = async (serverId: string, updatedServerData: Partial<Server>) => {
  //   if (!editingUser) return;

  //   try {
  //     const token = localStorage.getItem('admin_token');
      
  //     const response = await fetch(`${BACKEND_URL}/api/admin/users/${editingUser._id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         updateServer: {
  //           serverId,
  //           ...updatedServerData
  //         }
  //       }),
  //     });

  //     const data = await response.json();

  //     if (response.ok && data.success) {
  //       // Update local state with the response
  //       setEditingUser(data.data);
  //       alert('✅ Server updated successfully!');
  //     } else {
  //       alert(`❌ Failed to update server: ${data.message || 'Unknown error'}`);
  //     }
  //   } catch (err) {
  //     console.error('Update server error:', err);
  //     alert('❌ Network error occurred while updating server');
  //   }
  // };

  const handleServerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewServer(prev => ({
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
                      <th>Servers</th>
                      <th>Default Server</th>
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
                        <td>
                          {user.servers && user.servers.length > 0 ? (
                            <div style={{ fontSize: '0.8rem' }}>
                              {user.servers.map(server => (
                                <div key={server.serverId} style={{ marginBottom: '2px' }}>
                                  <strong>{server.serverName}</strong>
                                  <br />
                                  <span style={{ color: server.isActive ? 'green' : 'red' }}>
                                    {server.isActive ? '🟢' : '🔴'} {server.serverUrl}
                                  </span>
                                  <br />
                                  <small>Emails: {server.emailCount || 0}</small>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#888' }}>No servers</span>
                          )}
                        </td>
                        <td>
                          {user.defaultServerId ? (
                            <span style={{ fontSize: '0.8rem' }}>
                              {user.servers?.find(s => s.serverId === user.defaultServerId)?.serverName || user.defaultServerId}
                            </span>
                          ) : (
                            <span style={{ color: '#888' }}>None</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem' }}>
                            <div>Total: {(user.servers || []).reduce((sum, s) => sum + (s.emailCount || 0), 0)}</div>
                          </div>
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
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
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

                    {/* Server Management Section */}
                    <div className="form-section">
                      <div className="form-section-header">
                        <h4>Server Management</h4>
                        <button
                          type="button"
                          className="admin-btn small primary"
                          onClick={() => setShowServerForm(!showServerForm)}
                        >
                          {showServerForm ? 'Cancel' : 'Add Server'}
                        </button>
                      </div>

                      {/* Default Server Selection */}
                      <div className="form-group">
                        <label htmlFor="edit-defaultServerId">Default Server</label>
                        <select
                          id="edit-defaultServerId"
                          value={editingUser.defaultServerId || ''}
                          onChange={(e) => setEditingUser({...editingUser, defaultServerId: e.target.value})}
                          className="admin-form-input"
                        >
                          <option value="">No default server</option>
                          {(editingUser.servers || []).map(server => (
                            <option key={server.serverId} value={server.serverId}>
                              {server.serverName} ({server.serverUrl})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Add New Server Form */}
                      {showServerForm && (
                        <div className="form-subsection">
                          <h5>Add New Server (Server ID will be auto-generated)</h5>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="new-serverName">Server Name *</label>
                              <input
                                type="text"
                                id="new-serverName"
                                name="serverName"
                                value={newServer.serverName}
                                onChange={handleServerInputChange}
                                className="admin-form-input"
                                placeholder="Production Server"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="new-serverUrl">Server URL *</label>
                              <input
                                type="url"
                                id="new-serverUrl"
                                name="serverUrl"
                                value={newServer.serverUrl}
                                onChange={handleServerInputChange}
                                className="admin-form-input"
                                placeholder="https://server.example.com:4000"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="new-serverIp">Server IP</label>
                              <input
                                type="text"
                                id="new-serverIp"
                                name="serverIp"
                                value={newServer.serverIp}
                                onChange={handleServerInputChange}
                                className="admin-form-input"
                                placeholder="192.168.1.100"
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="new-serverDetail">Server Detail</label>
                              <input
                                type="text"
                                id="new-serverDetail"
                                name="serverDetail"
                                value={newServer.serverDetail}
                                onChange={handleServerInputChange}
                                className="admin-form-input"
                                placeholder="hostname;ip;startTime"
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="new-emailCount">Email Count</label>
                              <input
                                type="number"
                                id="new-emailCount"
                                name="emailCount"
                                value={newServer.emailCount}
                                onChange={handleServerInputChange}
                                className="admin-form-input"
                                min="0"
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                name="isActive"
                                checked={newServer.isActive}
                                onChange={handleServerInputChange}
                              />
                              Server is Active
                            </label>
                          </div>

                          <button
                            type="button"
                            className="admin-btn small success"
                            onClick={addServerToUser}
                          >
                            Add Server
                          </button>
                        </div>
                      )}

                      {/* Existing Servers List */}
                      {(editingUser.servers || []).length > 0 && (
                        <div className="servers-list">
                          <h5>Current Servers ({(editingUser.servers || []).length})</h5>
                          {(editingUser.servers || []).map(server => (
                            <div key={server.serverId} className="server-item">
                              <div className="server-info">
                                <div className="server-header">
                                  <strong>{server.serverName}</strong>
                                  <span className={`status-badge ${server.isActive ? 'active' : 'inactive'}`}>
                                    {server.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <button
                                    type="button"
                                    className="admin-btn small danger"
                                    onClick={() => removeServerFromUser(server.serverId)}
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="server-details">
                                  <div><strong>ID:</strong> {server.serverId}</div>
                                  <div><strong>URL:</strong> {server.serverUrl}</div>
                                  <div><strong>IP:</strong> {server.serverIp || 'N/A'}</div>
                                  <div><strong>Email Count:</strong> {server.emailCount || 0}</div>
                                  <div><strong>Last Seen:</strong> {new Date(server.lastSeen).toLocaleString()}</div>
                                  {server.serverDetail && (
                                    <div><strong>Details:</strong> {server.serverDetail}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
