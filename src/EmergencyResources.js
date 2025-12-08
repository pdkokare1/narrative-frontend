// src/EmergencyResources.js
import React, { useState, useEffect, useMemo } from 'react';
import * as api from './services/api';
import './App.css';
import './EmergencyResources.css';

function EmergencyResources() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [activeScope, setActiveScope] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  // --- HARDCODED CRITICAL CONTACTS ---
  const criticalContacts = [
    { name: 'Police', number: '100' },
    { name: 'Ambulance', number: '108' },
    { name: 'Women In Distress', number: '1091' },
    { name: 'Child Helpline', number: '1098' },
    { name: 'Highway Helpline', number: '1033' },
    { name: 'Railway Police (RPF)', number: '139' },
    { name: 'Cyber Crime', number: '1930' },
    { name: 'Fire', number: '101' }
  ];

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
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

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        contact.serviceName.toLowerCase().includes(searchLower) ||
        contact.category.toLowerCase().includes(searchLower) ||
        contact.number.includes(searchQuery);

      if (!matchesSearch) return false;
      if (activeScope === 'All') return true;
      if (activeScope === 'National') return contact.scope === 'All India' || contact.scope === 'Pan-India';
      if (activeScope === 'Local') return contact.scope !== 'All India' && contact.scope !== 'Pan-India';
      return contact.scope === activeScope;
    });
  }, [contacts, activeScope, searchQuery]);

  const groupedContacts = useMemo(() => {
    const groups = {};
    filteredContacts.forEach(contact => {
      if (!groups[contact.category]) groups[contact.category] = [];
      groups[contact.category].push(contact);
    });
    return groups;
  }, [filteredContacts]);

  const uniqueScopes = useMemo(() => {
    const scopes = new Set(contacts.map(c => c.scope));
    return ['All', 'National', ...Array.from(scopes).filter(s => s !== 'All India' && s !== 'Pan-India').sort()];
  }, [contacts]);

  // --- HELPER TO SPLIT NUMBERS ---
  // Splits by comma, 'or', forward slash, or 'and'
  const splitPhoneNumbers = (phoneString) => {
    if (!phoneString) return [];
    // Regex splits by: "," OR "/" OR " or " (case insensitive)
    const rawNumbers = phoneString.split(/,|\/|\bor\b/i);
    return rawNumbers.map(n => n.trim()).filter(n => n.length > 2); // Filter out tiny/empty strings
  };

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

      {/* --- NEW: Critical Numbers Section --- */}
      <div className="critical-section">
        <h2 className="section-title-header" style={{ marginBottom: '15px' }}>Critical Helplines</h2>
        <div className="critical-grid">
            {criticalContacts.map((item, index) => (
                <a key={index} href={`tel:${item.number}`} className="critical-card-btn">
                    <span className="critical-name">{item.name}</span>
                    <span className="critical-number">📞 {item.number}</span>
                </a>
            ))}
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
              {items.map(item => {
                const numbers = splitPhoneNumbers(item.number);
                return (
                  <div key={item._id} className="emergency-card">
                    <div className="emergency-info">
                      <h3>{item.serviceName}</h3>
                      <p>{item.description}</p>
                      <div className="emergency-meta">
                        <span className="badge-scope">{item.scope}</span>
                        <span className="badge-hours">{item.hours}</span>
                      </div>
                    </div>
                    
                    {/* Updated: Render split buttons for numbers */}
                    <div className="call-actions-col">
                        {numbers.map((num, idx) => (
                            <a key={idx} href={`tel:${num.replace(/[^0-9]/g, '')}`} className="call-btn-small">
                                <span className="call-icon">📞</span>
                                <span className="call-number">{num}</span>
                            </a>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmergencyResources;
