// src/components/ui/DashboardSkeleton.tsx
import React from 'react';
import '../../App.css'; 
import '../../MyDashboard.css'; 
import './DashboardSkeleton.css';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-content-wrapper">
        
        {/* --- LEFT COLUMN SKELETON --- */}
        <div className="dashboard-left-column">
            
            <div className="section-title-header skel-header">
              <div className="skeleton-pulse skel-w-120 skel-h-24"></div>
              <div className="skeleton-pulse skel-w-80p skel-h-28 skel-block"></div>
            </div>

            <div className="dashboard-card card-tight">
              <div className="stat-box-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="stat-box">
                    <div className="skeleton-pulse skel-w-60p skel-h-10 skel-mb-10 skel-center"></div>
                    <div className="skeleton-pulse skel-w-40p skel-h-24 skel-mb-8 skel-center"></div>
                    <div className="skeleton-pulse skel-w-80p skel-h-8 skel-center"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="skeleton-pulse skel-w-150 skel-h-20 skel-mb-15" style={{ marginTop: '20px' }}></div>
            <div className="dashboard-card">
                <div className="skel-legend-row">
                    <div className="skeleton-pulse skel-legend-item"></div>
                    <div className="skeleton-pulse skel-legend-item"></div>
                    <div className="skeleton-pulse skel-legend-item"></div>
                </div>
                <div className="skeleton-pulse skel-w-full skel-h-16 skel-mb-15 skel-block"></div>
                <div className="skeleton-pulse skel-w-80p skel-h-10 skel-mb-8"></div>
                <div className="skeleton-pulse skel-w-60p skel-h-10 skel-mb-8"></div>
                <div className="skeleton-pulse skel-w-40p skel-h-10"></div>
            </div>
        </div>

        {/* --- RIGHT COLUMN SKELETON --- */}
        <div className="dashboard-right-column">
          
          <div className="section-title-header skel-header">
              <div className="skeleton-pulse skel-w-150 skel-h-24"></div>
              <div className="skeleton-pulse skel-w-80p skel-h-24 skel-block"></div>
          </div>

          <div className="dashboard-card skel-flex-row">
             <div className="skel-flex-1">
                 <div className="skeleton-pulse skel-w-60p skel-h-20 skel-mb-15"></div>
                 <div className="skeleton-pulse skel-w-80p skel-h-12 skel-mb-8"></div>
                 <div className="skeleton-pulse skel-w-60p skel-h-12"></div>
             </div>
             <div className="skeleton-pulse skel-w-180 skel-h-100 skel-block skel-shrink-0"></div>
          </div>

          <div className="dashboard-card full-width-card">
              <div className="skeleton-pulse skel-w-180 skel-h-16 skel-mb-20"></div>
              <div className="skeleton-pulse skel-w-full skel-h-200 skel-block"></div>
          </div>

          <div className="dashboard-grid">
             {[...Array(4)].map((_, i) => (
                 <div key={i} className={`dashboard-card ${i === 0 ? 'full-width-card' : ''}`}>
                    <div className="skeleton-pulse skel-w-120 skel-h-16 skel-mb-20"></div>
                    <div className={`skeleton-pulse skel-w-full skel-block ${i === 0 ? 'skel-h-200' : 'skel-h-200 skel-circle-chart'}`}></div>
                 </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
