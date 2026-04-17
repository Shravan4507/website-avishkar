import React from 'react';
import Skeleton from './Skeleton';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="user-dashboard-page" style={{ opacity: 0.7 }}>
      <header className="user-dashboard-header">
        <div className="user-dashboard-profile">
          <Skeleton variant="circle" width={90} height={90} />
          <div className="user-dashboard-info" style={{ marginLeft: '1.5rem' }}>
            <Skeleton variant="text" width={250} height={32} />
            <div className="user-dashboard-badges" style={{ marginTop: '0.5rem', display: 'flex', gap: '10px' }}>
              <Skeleton variant="rect" width={120} height={24} />
              <Skeleton variant="rect" width={80} height={24} />
            </div>
          </div>
        </div>
        <div className="user-dashboard-header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <Skeleton variant="rect" width={40} height={40} />
          <Skeleton variant="rect" width={100} height={40} />
          <Skeleton variant="rect" width={100} height={40} />
        </div>
      </header>

      <div className="user-dashboard-grid" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="user-dashboard-section">
            <Skeleton variant="text" width={150} height={24} />
            <div className="user-action-buttons" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton variant="rect" width="100%" height={50} />
              <Skeleton variant="rect" width="100%" height={50} />
            </div>
          </div>
        </div>

        <div className="user-dashboard-main">
          <div className="user-dashboard-section">
            <div className="user-section-header">
              <Skeleton variant="text" width={200} height={28} />
            </div>
            <div className="registrations-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} variant="rect" width="100%" height={180} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
