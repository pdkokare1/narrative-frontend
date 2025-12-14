// src/EmergencyResources.tsx
import React, { useState, useEffect } from 'react';
import * as api from './services/api';
import PageLoader from './components/PageLoader';
import './EmergencyResources.css';

// We import icons purely as standard React components
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CommuteIcon from '@mui/icons-material/Commute';
import TrainIcon from '@mui/icons-material/Train';

interface EmergencyContact {
  _id: string;
  category: string;
  serviceName: string;
  description?: string;
  number: string;
  scope: string;
  hours: string;
  country: string;
  city?: string;
  state?: string;
}

const EmergencyResources: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Hardcoded critical numbers for the top section
  const criticalContacts = [
    { name: 'Police Control Room', number: '100', icon: <LocalPoliceIcon /> },
    { name: 'Ambulance / Medical', number: '101', icon: <MedicalServicesIcon /> },
    { name: 'Women Helpline', number: '1091', icon: <SupportAgentIcon /> },
    { name: 'Child Helpline', number: '1098', icon: <SupportAgentIcon /> },
    { name: 'National Highway Helpline', number: '1033', icon: <CommuteIcon /> },
    { name: 'RPF (Railway Police)', number: '139', icon: <TrainIcon /> },
  ];

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data } = await api.fetchEmergencyContacts({});
      setContacts(data.contacts || []);
    } catch (err) {
      setError('Failed to load emergency contacts.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to split clubbed phone numbers (e.g., "12345 / 67890" or "12345, 67890")
  const getSeparateNumbers = (phoneString: string) => {
    if (!phoneString) return [];
    return phoneString.split(/[\/,]+\s*/).map(s => s.trim()).filter(s => s.length > 0);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.state && contact.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.city && contact.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <PageLoader />;

  return (
    <div className="content">
      <div className="emergency-header-container">
        <div>
            <h1 className="emergency-page-title">Emergency Resource Directory</h1>
            <p className="emergency-subtitle">Find helplines and support services quickly.</p>
        </div>
      </div>

      {/* Section for Critical Top-Level Contacts */}
      <div className="critical-section">
        <h2 className="category-title" style={{ border: 'none', paddingLeft: 0 }}>National Critical Helplines</h2>
        <div className="critical-grid">
          {criticalContacts.map((item, index) => (
            <a key={index} href={`tel:${item.number}`} className="critical-card-btn">
              <div style={{ color: '#dc2626', marginBottom: '5px' }}>{item.icon}</div>
              <span className="critical-name">{item.name}</span>
              <span className="critical-number">{item.number}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="emergency-controls" style={{ marginBottom: '30px' }}>
        <input
          type="text"
          className="emergency-search"
          placeholder="Search by agency name, city, state, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="settings-card" style={{borderColor: '#E57373', color: '#E57373', padding: '15px'}}>{error}</div>}

      <div className="card-list">
        {filteredContacts.map(contact => {
          // Split phone numbers beforehand
          const phoneNumbers = getSeparateNumbers(contact.number);

          return (
            <div key={contact._id} className="emergency-card">
              <div className="emergency-info">
                <h3>{contact.serviceName}</h3>
                <p>{contact.description}</p>
                
                <div className="emergency-meta">
                    <span className="badge-scope">{contact.scope}</span>
                    <span className="badge-hours">{contact.hours}</span>
                    <span className="contact-type-badge" style={{ fontSize: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {contact.category}
                    </span>
                </div>

                {(contact.city || contact.state) && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <LocationOnIcon style={{ fontSize: '14px', marginRight: '4px' }} />
                    <span>
                      {contact.city && `${contact.city}, `}{contact.state}
                    </span>
                  </div>
                )}
              </div>

              {/* Call Actions */}
              <div className="call-actions-col">
                {phoneNumbers.length > 0 ? (
                    phoneNumbers.map((num, idx) => (
                      <a key={idx} href={`tel:${num}`} className="call-btn-small">
                        <PhoneIcon style={{ fontSize: '12px', marginRight: '5px' }} />
                        {num}
                      </a>
                    ))
                ) : (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Number not available</p>
                )}
              </div>
            </div>
          );
        })}

        {!loading && filteredContacts.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '20px' }}>No contacts found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default EmergencyResources;
