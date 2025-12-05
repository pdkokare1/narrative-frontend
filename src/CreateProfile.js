// In file: src/CreateProfile.js
import React, { useState } from 'react';
import * as api from './services/api'; // <--- Centralized API
import './Login.css'; 

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
      await api.createProfile({ username: username.trim() }); // <--- API Call

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
      <div className="login-container" style={{ maxWidth: '480px' }}>
        <div className="login-form-panel">
          <h1>Welcome to The Gamut</h1>
          <p>Please choose a username to complete your registration.</p>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input firebaseui-id-input firebaseui-input" 
              style={{ marginBottom: '15px' }}
            />

            {error && (
              <p style={{ color: 'red', fontSize: '12px', marginBottom: '15px' }}>{error}</p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="firebaseui-id-submit firebaseui-button" 
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
