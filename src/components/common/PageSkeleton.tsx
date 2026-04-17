import React from 'react';
import Skeleton from './Skeleton';

const PageSkeleton: React.FC = () => {
  return (
    <div className="content" style={{ padding: '80px 20px', minHeight: '100vh', opacity: 0.7 }}>
      <div className="skeleton-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '60px' }}>
          <Skeleton variant="text" width={100} height={20} className="section-label" />
          <Skeleton variant="text" width={400} height={60} style={{ marginTop: '1rem' }} />
          <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
          <Skeleton variant="text" width="60%" height={24} />
        </div>

        {/* Grid Skeleton */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '30px',
          marginTop: '40px' 
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: '20px', 
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Skeleton variant="rect" width="100%" height={200} style={{ borderRadius: '12px' }} />
              <div style={{ marginTop: '20px' }}>
                <Skeleton variant="text" width="80%" height={28} />
                <Skeleton variant="text" width="60%" height={20} style={{ marginTop: '10px' }} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <Skeleton variant="rect" width={100} height={36} />
                  <Skeleton variant="rect" width={100} height={36} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
