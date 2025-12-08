import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageLoader from '../components/PageLoader/PageLoader';
import './EmergencyResources.css';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CommuteIcon from '@mui/icons-material/Commute';
import TrainIcon from '@mui/icons-material/Train';

const EmergencyResources = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

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
      const response = await api.get('/emergency/contacts');
      setContacts(response.data);
    } catch (err) {
      setError('Failed to load emergency contacts.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to split clubbed phone numbers (e.g., "12345 / 67890" or "12345, 67890")
  const getSeparateNumbers = (phoneString) => {
    if (!phoneString) return [];
    // Split by forward slash, comma, or multiple spaces, and clean up whitespace
    return phoneString.split(/[\/,]+\s*/).map(s => s.trim()).filter(s => s.length > 0);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="emergency-resources-page">
      <div className="emergency-header">
        <h1>Emergency Resource Directory</h1>
        <p>Find helplines and support services quickly.</p>
      </div>

      {/* Section for Critical Top-Level Contacts */}
      <div className="critical-helplines-section">
        <h2>National Critical Helplines</h2>
        <div className="critical-cards-grid">
          {criticalContacts.map((item, index) => (
            <div key={index} className="critical-card">
              <div className="critical-icon">{item.icon}</div>
              <div className="critical-info">
                <h3>{item.name}</h3>
                <a href={`tel:${item.number}`} className="critical-call-btn">
                  <PhoneIcon fontSize="small" /> Call {item.number}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="search-container">
        <SearchIcon className="search-icon" />
        <input
          type="text"
          placeholder="Search by agency name, city, state, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="contacts-grid">
        {filteredContacts.map(contact => {
          // Split phone numbers beforehand
          const phoneNumbers = getSeparateNumbers(contact.phone_number);

          return (
            <div key={contact._id} className="contact-card">
              <div className="contact-type-badge">{contact.category}</div>
              <h3>{contact.name}</h3>

              <div className="contact-details">
                {phoneNumbers.length > 0 ? (
                  <div className="phone-list">
                    {phoneNumbers.map((num, idx) => (
                      <a key={idx} href={`tel:${num}`} className="contact-link phone-link">
                        <PhoneIcon className="link-icon" />
                        {num}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="no-phone">Number not available</p>
                )}

                {(contact.city || contact.state) && (
                  <div className="location-info">
                    <LocationOnIcon className="link-icon" />
                    <span>
                      {contact.city && `${contact.city}, `}{contact.state}
                    </span>
                  </div>
                )}
              </div>

              {contact.description && (
                <p className="contact-description">{contact.description}</p>
              )}
            </div>
          );
        })}

        {!loading && filteredContacts.length === 0 && (
          <p className="no-results">No contacts found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default EmergencyResources;
