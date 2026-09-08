import React from 'react';

export default function SkeletonLoader({ rows = 6 }) {
  return (
    <div className="table-section-container" style={{ padding: '20px' }}>
      {/* Skeleton Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div className="skeleton-box" style={{ width: '220px', height: '24px' }} />
        <div className="skeleton-box" style={{ width: '100px', height: '24px' }} />
      </div>

      {/* Skeleton Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div className="skeleton-box" style={{ width: '140px', height: '18px' }} />
            <div className="skeleton-box" style={{ width: '80px', height: '18px' }} />
            <div className="skeleton-box" style={{ width: '110px', height: '18px' }} />
            <div className="skeleton-box" style={{ width: '100px', height: '18px' }} />
            <div className="skeleton-box" style={{ flex: 1, height: '18px' }} />
            <div className="skeleton-box" style={{ width: '90px', height: '22px', borderRadius: '9999px' }} />
            <div className="skeleton-box" style={{ width: '85px', height: '28px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
