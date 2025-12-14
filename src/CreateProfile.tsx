// src/CreateProfile.tsx
import React, { useState } from 'react';
import * as api from './services/api'; 
import './Login.css'; 
import Card from './components/ui/Card';
import Input from './components/ui/Input';
import Button from './components/ui/Button';

const CreateProfile: React.FC = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    setLoading(true);

    try {
      await api.createProfile({ username: username.trim() }); 
      window.location.href = '/'; 

    } catch (err: any) {
      console.error("Profile Creation Error:", err);
      
      if (err.message) {
        setError(err.message);
      } else if (err.original && err.original.response && err.original.response.data) {
        setError(err.original.response.data.message || err.original.response.data.error || 'Server error occurred.');
      } else {
        setError('Failed to create profile. Please check your connection.');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <Card variant="glass" padding="lg">
          <div className="login-form-panel" style={{ padding: 0 }}>
            <h1>Welcome to The Gamut</h1>
            <p>Please choose a username to complete your registration.</p>

            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label="Username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
              />

              {error && (
                <div style={{ 
                  color: '#CF5C5C', 
                  fontSize: '12px', 
                  background: 'rgba(207, 92, 92, 0.1)', 
                  padding: '10px', 
                  borderRadius: '4px',
                  textAlign: 'left'
                }}>
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                variant="primary"
                isLoading={loading}
                className="btn-full-width"
              >
                Save Profile
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateProfile;
