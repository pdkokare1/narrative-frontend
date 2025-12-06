// In file: src/CreateProfile.js
import React, { useState } from 'react';
import * as api from './services/api'; 
import './Login.css'; 
// Note: We rely on App.css (loaded globally) for the .btn-primary class

function CreateProfile() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Send the new username to our backend
      await api.createProfile({ username: username.trim() }); 

      // Success! Reload to trigger AuthContext update
      window.location.href = '/'; 

    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error); 
      } else {
        setError('Failed to create profile. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-form-panel">
          <h1>Welcome to The Gamut</h1>
          <p>Please choose a username to complete your registration.</p>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input" 
              required
            />

            {error && (
              <div style={{ 
                color: '#E57373', 
                fontSize: '13px', 
                marginBottom: '15px', 
                background: 'rgba(229, 115, 115, 0.1)', 
                padding: '8px', 
                borderRadius: '4px' 
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px' }}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default CreateProfile;
