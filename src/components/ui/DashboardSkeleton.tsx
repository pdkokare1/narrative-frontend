// src/components/ui/DashboardSkeleton.tsx
import React from 'react';
import '../../App.css'; 
import '../../MyDashboard.css'; 

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-content-wrapper">
        
        {/* --- LEFT COLUMN SKELETON --- */}
        <div className="dashboard-left-column">
            
            <div className="section-title-header" style={{ borderBottom: 'none', marginBottom: '20px' }}>
              <div className="skeleton-pulse" style={{ width: '120px', height: '24px' }}></div>
              <div className="skeleton-pulse" style={{ width: '80px', height: '28px', borderRadius: '6px' }}></div>
            </div>

            <div className="dashboard-card card-tight">
              <div className="stat-box-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="stat-box">
                    <div className="skeleton-pulse" style={{ width: '60%', height: '10px', marginBottom: '10px', margin: '0 auto' }}></div>
                    <div className="skeleton-pulse" style={{ width: '40%', height: '24px', marginBottom: '8px', margin: '0 auto' }}></div>
                    <div className="skeleton-pulse" style={{ width: '80%', height: '8px', margin: '0 auto' }}></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="skeleton-pulse" style={{ width: '100px', height: '20px', marginTop: '20px', marginBottom: '15px' }}></div>
            <div className="dashboard-card">
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '15px' }}>
                    <div className="skeleton-pulse" style={{ width: '40px', height: '10px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '40px', height: '10px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '40px', height: '10px' }}></div>
                </div>
                <div className="skeleton-pulse" style={{ width: '100%', height: '16px', borderRadius: '8px', marginBottom: '15px' }}></div>
                <div className="skeleton-pulse" style={{ width: '80%', height: '10px', marginBottom: '8px' }}></div>
                <div className="skeleton-pulse" style={{ width: '70%', height: '10px', marginBottom: '8px' }}></div>
                <div className="skeleton-pulse" style={{ width: '75%', height: '10px' }}></div>
            </div>
        </div>

        {/* --- RIGHT COLUMN SKELETON --- */}
        <div className="dashboard-right-column">
          
          <div className="section-title-header" style={{ borderBottom: 'none', marginBottom: '20px' }}>
              <div className="skeleton-pulse" style={{ width: '150px', height: '24px' }}></div>
              <div className="skeleton-pulse" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
          </div>

          <div className="dashboard-card" style={{ height: '140px', display: 'flex', gap: '20px', alignItems: 'center' }}>
             <div style={{ flex: 1 }}>
                 <div className="skeleton-pulse" style={{ width: '60%', height: '20px', marginBottom: '15px' }}></div>
                 <div className="skeleton-pulse" style={{ width: '90%', height: '12px', marginBottom: '8px' }}></div>
                 <div className="skeleton-pulse" style={{ width: '80%', height: '12px' }}></div>
             </div>
             <div className="skeleton-pulse" style={{ width: '280px', height: '100px', borderRadius: '8px', flexShrink: 0 }}></div>
          </div>

          <div className="dashboard-card full-width-card">
              <div className="skeleton-pulse" style={{ width: '180px', height: '16px', marginBottom: '20px' }}></div>
              <div className="skeleton-pulse" style={{ width: '100%', height: '200px', borderRadius: '4px' }}></div>
          </div>

          <div className="dashboard-grid">
             {[...Array(4)].map((_, i) => (
                 <div key={i} className={`dashboard-card ${i === 0 ? 'full-width-card' : ''}`}>
                    <div className="skeleton-pulse" style={{ width: '120px', height: '16px', marginBottom: '20px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '100%', height: i === 0 ? '280px' : '200px', borderRadius: '100%' }}></div>
                 </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
