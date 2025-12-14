// src/EmergencyResources.tsx
import React, { useState, useEffect } from 'react';
import * as api from './services/api';
import PageLoader from './components/PageLoader';
import './EmergencyResources.css';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CommuteIcon from '@mui/icons-material/Commute';
import TrainIcon from '@mui/icons-material/Train';

// --- NEW IMPORTS ---
import Card from './components/ui/Card';
import Input from './components/ui/Input';
import SectionHeader from './components/ui/SectionHeader';
import Button from './components/ui/Button';

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
      
      {/* 1. Header */}
      <SectionHeader 
        title="Emergency Resources" 
        subtitle="National and Local Helplines" 
      />

      {/* 2. Critical Section (Cards) */}
      <div className="critical-section" style={{ border: 'none', background: 'transparent', padding: 0 }}>
        <h3 className="category-title" style={{ paddingLeft: 0, border: 'none', marginBottom: '15px' }}>National Critical Helplines</h3>
        <div className="critical-grid">
          {criticalContacts.map((item, index) => (
            <a key={index} href={`tel:${item.number}`} style={{ textDecoration: 'none' }}>
                <Card variant="glass" className="critical-card-btn" padding="sm">
                    <div style={{ color: '#CF5C5C', marginBottom: '5px' }}>{item.icon}</div>
                    <span className="critical-name">{item.name}</span>
                    <span className="critical-number">{item.number}</span>
                </Card>
            </a>
          ))}
        </div>
      </div>

      {/* 3. Search Bar (New Input) */}
      <div style={{ marginBottom: '30px', maxWidth: '500px' }}>
        <Input 
            icon={<SearchIcon style={{ fontSize: '18px' }} />}
            placeholder="Search by agency, city, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
        />
      </div>

      {error && <div style={{ color: 'var(--color-error)' }}>{error}</div>}

      {/* 4. List */}
      <div className="card-list">
        {filteredContacts.map(contact => {
          const phoneNumbers = getSeparateNumbers(contact.number);

          return (
            <Card key={contact._id} variant="glass" padding="md" className="emergency-card">
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
                    <span>{contact.city && `${contact.city}, `}{contact.state}</span>
                  </div>
                )}
              </div>

              {/* Call Buttons */}
              <div className="call-actions-col">
                {phoneNumbers.length > 0 ? (
                    phoneNumbers.map((num, idx) => (
                      <a key={idx} href={`tel:${num}`} style={{ textDecoration: 'none' }}>
                          <Button variant="primary" className="call-btn-small" style={{ width: '100%', fontSize: '10px', padding: '6px 12px' }}>
                            <PhoneIcon style={{ fontSize: '12px', marginRight: '5px' }} />
                            {num}
                          </Button>
                      </a>
                    ))
                ) : (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Number not available</p>
                )}
              </div>
            </Card>
          );
        })}

        {!loading && filteredContacts.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '20px' }}>No contacts found.</p>
        )}
      </div>
    </div>
  );
};

export default EmergencyResources;
