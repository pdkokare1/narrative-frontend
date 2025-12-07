// src/EmergencyResources.js
import React, { useState, useEffect, useMemo } from 'react';
import * as api from './services/api';
import './App.css';
import './EmergencyResources.css'; // We will create this next

function EmergencyResources() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [activeScope, setActiveScope] = useState('All'); // All, All India, Mumbai, Pune, etc.
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        // We fetch ALL contacts once and filter client-side for instant speed
        const { data } = await api.fetchEmergencyContacts();
        setContacts(data.contacts || []);
      } catch (err) {
        console.error("Failed to load contacts", err);
        setError("Could not load emergency resources.");
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  // --- Filter Logic ---
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // 1. Search Filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        contact.serviceName.toLowerCase().includes(searchLower) ||
        contact.category.toLowerCase().includes(searchLower) ||
        contact.number.includes(searchQuery);

      if (!matchesSearch) return false;

      // 2. Scope Filter
      if (activeScope === 'All') return true;
      if (activeScope === 'National') return contact.scope === 'All India' || contact.scope === 'Pan-India';
      if (activeScope === 'Local') return contact.scope !== 'All India' && contact.scope !== 'Pan-India';
      
      return contact.scope === activeScope;
    });
  }, [contacts, activeScope, searchQuery]);

  // --- Group by Category ---
  const groupedContacts = useMemo(() => {
    const groups = {};
    filteredContacts.forEach(contact => {
      if (!groups[contact.category]) groups[contact.category] = [];
      groups[contact.category].push(contact);
    });
    return groups;
  }, [filteredContacts]);

  // Extract unique scopes for the dropdown
  const uniqueScopes = useMemo(() => {
    const scopes = new Set(contacts.map(c => c.scope));
    return ['All', 'National', ...Array.from(scopes).filter(s => s !== 'All India' && s !== 'Pan-India').sort()];
  }, [contacts]);

  return (
    <div className="content">
      <div className="emergency-header-container">
        <div>
          <h1 className="emergency-page-title">Emergency Resources</h1>
          <p className="emergency-subtitle">Official helplines and support services.</p>
        </div>
        
        <div className="emergency-controls">
          <input 
            type="text" 
            placeholder="Search service..." 
            className="emergency-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="emergency-select"
            value={activeScope}
            onChange={(e) => setActiveScope(e.target.value)}
          >
            {uniqueScopes.map(scope => (
              <option key={scope} value={scope}>
                {scope === 'All' ? 'All Locations' : scope === 'National' ? 'National (All India)' : scope}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading directory...</p>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && Object.keys(groupedContacts).length === 0 && (
        <div className="no-results">
           <h3>No services found</h3>
           <p>Try adjusting your search or filters.</p>
        </div>
      )}

      <div className="emergency-grid">
        {Object.entries(groupedContacts).map(([category, items]) => (
          <div key={category} className="category-group">
            <h2 className="category-title">{category}</h2>
            <div className="card-list">
              {items.map(item => (
                <div key={item._id} className="emergency-card">
                  <div className="emergency-info">
                    <h3>{item.serviceName}</h3>
                    <p>{item.description}</p>
                    <div className="emergency-meta">
                      <span className="badge-scope">{item.scope}</span>
                      <span className="badge-hours">{item.hours}</span>
                    </div>
                  </div>
                  <a href={`tel:${item.number.split(',')[0].replace(/[^0-9]/g, '')}`} className="call-btn">
                    <span className="call-icon">📞</span>
                    <span className="call-number">{item.number}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmergencyResources;
