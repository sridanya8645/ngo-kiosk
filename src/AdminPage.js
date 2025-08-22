import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './AdminPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import loginLottie from './login-lottie.json';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'users'
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('login'); // 'login' | 'email-mfa' | 'totp-mfa' | 'totp-enroll'
  const [userId, setUserId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [enrollSecret, setEnrollSecret] = useState('');
  const [enrollLabel, setEnrollLabel] = useState('');
  
  // Admin users management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    admin_id: ''
  });

  // Admin users management functions
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
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
      setUsersLoading(false);
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateForm(false);
        setUserFormData({ username: '', password: '', admin_id: '' });
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
        body: JSON.stringify(userFormData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingUser(null);
        setUserFormData({ username: '', password: '', admin_id: '' });
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
    setUserFormData({
      username: user.username,
      password: '',
      admin_id: user.admin_id || ''
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setUserFormData({ username: '', password: '', admin_id: '' });
  };

  // Fetch users when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username.trim(), password: formData.password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      if (data.mfa === 'totp') {
        setUserId(data.userId);
        try { localStorage.setItem('adminUserId', String(data.userId)); } catch(_) {}
        setStage('totp-mfa');
      } else if (data.mfa === 'totp-enroll') {
        setUserId(data.userId);
        try { localStorage.setItem('adminUserId', String(data.userId)); } catch(_) {}
        setEnrollSecret(data.manualSecret || '');
                 setEnrollLabel(data.label || 'NGO Kiosk:Indoamericanexpo@gmail.com');
        setStage('totp-enroll');
      } else if (data.mfa === 'email') {
        setUserId(data.userId);
        try { localStorage.setItem('adminUserId', String(data.userId)); } catch(_) {}
        setStage('email-mfa');
      } else {
        // Fallback: require MFA anyway
        setError('Unexpected response. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailMfa = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setError('Enter the code from your email'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/verify-mfa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: mfaCode.trim() })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Invalid or expired code');
      }
      navigate('/event-details');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setError('Enter the 6-digit code from your Authenticator app'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/mfa/totp/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: mfaCode.trim() })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Invalid code');
      }
      navigate('/event-details');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTotpEnroll = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setError('Enter the 6-digit code from your Authenticator app'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/mfa/totp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: mfaCode.trim() })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Invalid code');
      }
      // Enrollment complete, now prompt for normal TOTP login
      setMfaCode('');
      setStage('totp-mfa');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <SiteHeader navVariant="home-only" />



      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">
          <h1 className="admin-title">Admin Panel</h1>
          
          {/* Tab Navigation */}
          <div className="admin-tabs">
            <button 
              className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button 
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </button>
          </div>

          {/* Login Tab */}
          {activeTab === 'login' && (
            <div className="admin-login-container">
              <div className="admin-lottie-container">
                <Lottie 
                  animationData={loginLottie} 
                  loop={true}
                  className="admin-lottie"
                />
              </div>
          
          {stage === 'login' && (
            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          )}

          {stage !== 'login' && stage !== 'totp-enroll' && (
            <form onSubmit={stage === 'totp-mfa' ? handleVerifyTotp : handleVerifyEmailMfa} className="admin-login-form">
              <div className="form-group">
                <label className="form-label">{stage === 'totp-mfa' ? 'Enter 6-digit authenticator code' : 'Enter 6-digit authenticator code'}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="form-input"
                  placeholder={stage === 'totp-mfa' ? '123456' : 'Enter code'}
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => { setStage('login'); setMfaCode(''); setError(''); }}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {stage === 'totp-enroll' && (
            <form onSubmit={handleVerifyTotpEnroll} className="admin-login-form">
              <div className="form-group">
                <label className="form-label">Add this account to your Authenticator app</label>
                <div className="info-box" style={{ wordBreak: 'break-all' }}>
                  <div><strong>Account:</strong> {enrollLabel || 'NGO Kiosk:admin'}</div>
                  <div><strong>Manual Secret:</strong> {enrollSecret}</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Enter 6-digit authenticator code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="form-input"
                  placeholder="123456"
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => { setStage('login'); setMfaCode(''); setError(''); setEnrollSecret(''); setEnrollLabel(''); }}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="admin-users-container">
              <div className="admin-users-header">
                <h2>Admin Users Management</h2>
                <button 
                  className="create-user-btn"
                  onClick={() => setShowCreateForm(true)}
                >
                  + Create New Admin
                </button>
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
                  <h3>Create New Admin User</h3>
                  <form onSubmit={handleCreateUser} className="user-form">
                    <div className="form-group">
                      <label>Username:</label>
                      <input
                        type="text"
                        name="username"
                        value={userFormData.username}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Password:</label>
                      <input
                        type="password"
                        name="password"
                        value={userFormData.password}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Admin ID:</label>
                      <input
                        type="text"
                        name="admin_id"
                        value={userFormData.admin_id}
                        onChange={handleUserInputChange}
                        placeholder="e.g., ADMIN001"
                        required
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="submit-btn">Create User</button>
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => {
                          setShowCreateForm(false);
                          setUserFormData({ username: '', password: '', admin_id: '' });
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
                  <h3>Edit Admin User</h3>
                  <form onSubmit={handleUpdateUser} className="user-form">
                    <div className="form-group">
                      <label>Username:</label>
                      <input
                        type="text"
                        name="username"
                        value={userFormData.username}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Password: (leave blank to keep current)</label>
                      <input
                        type="password"
                        name="password"
                        value={userFormData.password}
                        onChange={handleUserInputChange}
                        placeholder="Enter new password or leave blank"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Admin ID:</label>
                      <input
                        type="text"
                        name="admin_id"
                        value={userFormData.admin_id}
                        onChange={handleUserInputChange}
                        required
                      />
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
                <h3>Admin Users ({users.length})</h3>
                
                {usersLoading ? (
                  <div className="loading">Loading admin users...</div>
                ) : users.length === 0 ? (
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
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default AdminPage; 