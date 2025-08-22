import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminUsersPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateAdminId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ADMIN${timestamp}${random}`;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      const adminId = generateAdminId();
      const userData = {
        ...formData,
        admin_id: adminId
      };

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateForm(false);
        setFormData({ username: '', password: '' });
        fetchUsers();
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingUser(null);
        setFormData({ username: '', password: '' });
        fetchUsers();
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: ''
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '' });
  };

  if (loading) {
    return (
      <div className="admin-users-container">
        <SiteHeader navVariant="admin" />
        <main className="admin-users-main">
          <div className="loading">Loading admin users...</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <SiteHeader navVariant="admin" />
      
      <main className="admin-users-main">
        <div className="admin-users-content">
          <div className="admin-users-header">
            <h1>Admin Users Management</h1>
            <div className="header-actions">
              <button 
                className="create-user-btn"
                onClick={() => setShowCreateForm(true)}
              >
                + Create New Admin
              </button>
              <button 
                className="back-btn"
                onClick={() => navigate('/event-details')}
              >
                Back to Admin Panel
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          {/* Create User Form */}
          {showCreateForm && (
            <div className="user-form-container">
              <h2>Create New Admin User</h2>
              <form onSubmit={handleCreateUser} className="user-form">
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-info">
                  <p><strong>Note:</strong> Admin ID will be auto-generated when you create the user.</p>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn">Create User</button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ username: '', password: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit User Form */}
          {editingUser && (
            <div className="user-form-container">
              <h2>Edit Admin User</h2>
              <form onSubmit={handleUpdateUser} className="user-form">
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Password: (leave blank to keep current)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password or leave blank"
                  />
                </div>
                
                <div className="form-info">
                  <p><strong>Admin ID:</strong> {editingUser.admin_id} (cannot be changed)</p>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn">Update User</button>
                  <button type="button" className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="users-list">
            <h2>Admin Users ({users.length})</h2>
            
            {users.length === 0 ? (
              <p className="no-users">No admin users found.</p>
            ) : (
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Admin ID</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.admin_id || '-'}</td>
                        <td>
                          <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>{user.created_by_name || 'System'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="edit-btn"
                              onClick={() => startEdit(user)}
                            >
                              Edit
                            </button>
                            {user.id !== 1 && (
                              <button 
                                className="delete-btn"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
};

export default AdminUsersPage;
