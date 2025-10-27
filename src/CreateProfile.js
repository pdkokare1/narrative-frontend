// In file: src/CreateProfile.js
import React, { useState } from 'react';
import { auth } from './firebaseConfig'; // Import auth
import axios from 'axios';
import './Login.css'; // We can re-use the login page styles

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
      // Get the current user's token
      const user = auth.currentUser;
      if (!user) {
        setError('You are not logged in.');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();

      // Send the new username to our backend
      await axios.post(
        `${API_URL}/profile`, 
        { username: username.trim() }, // The data we are sending
        {
          headers: {
            Authorization: `Bearer ${token}` // The proof of who we are
          }
        }
      );

      // Success! Reload the app.
      // This will re-trigger the check in App.js, which will
      // now find the profile and load the main app.
      window.location.href = '/'; // Go to homepage

    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error); // Show error from backend
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
              className="firebaseui-id-input firebaseui-input" // Re-use style
              style={{ marginBottom: '15px' }}
            />

            {error && (
              <p style={{ color: 'red', fontSize: '12px', marginBottom: '15px' }}>
                {error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="firebaseui-id-submit firebaseui-button" // Re-use style
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
