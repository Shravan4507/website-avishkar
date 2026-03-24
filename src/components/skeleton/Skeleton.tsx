import React from 'react';
import './Skeleton.css';

// ── Base Skeleton primitive ───────────────────────────────────────────────────
interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  radius = '8px',
  className = '',
}) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  />
);

// ── Text block (multiple lines) ───────────────────────────────────────────────
interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
}) => (
  <div className="skeleton-text-block">
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        height="0.9rem"
        width={i === lines - 1 ? lastLineWidth : '100%'}
        radius="6px"
      />
    ))}
  </div>
);

// ── Avatar circle ─────────────────────────────────────────────────────────────
interface SkeletonAvatarProps {
  size?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = '64px' }) => (
  <Skeleton width={size} height={size} radius="50%" />
);

// ── Dashboard overview card ───────────────────────────────────────────────────
export const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <Skeleton width="50%" height="0.75rem" radius="6px" className="sk-label" />
    <Skeleton width="40%" height="2.5rem" radius="8px" className="sk-value" />
    <SkeletonText lines={2} lastLineWidth="70%" />
  </div>
);

// ── Dashboard header (avatar + name + badge) ──────────────────────────────────
export const SkeletonDashboardHeader: React.FC = () => (
  <div className="skeleton-dash-header">
    <SkeletonAvatar size="72px" />
    <div className="skeleton-dash-header-text">
      <Skeleton width="220px" height="3.5rem" radius="8px" />
      <Skeleton width="140px" height="1.4rem" radius="100px" className="sk-badge" />
    </div>
  </div>
);

// ── Full dashboard layout skeleton ────────────────────────────────────────────
export const SkeletonDashboard: React.FC = () => (
  <div className="skeleton-dashboard">
    <SkeletonDashboardHeader />
    <div className="skeleton-grid">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

// ── Sponsor / team card ───────────────────────────────────────────────────────
export const SkeletonSponsorCard: React.FC = () => (
  <div className="skeleton-card skeleton-card--center">
    <SkeletonAvatar size="80px" />
    <Skeleton width="70%" height="1rem" radius="6px" />
    <Skeleton width="45%" height="0.75rem" radius="6px" />
  </div>
);

// ── List item (schedule, events) ──────────────────────────────────────────────
export const SkeletonListItem: React.FC = () => (
  <div className="skeleton-list-item">
    <Skeleton width="80px" height="0.8rem" radius="6px" />
    <Skeleton width="12px" height="12px" radius="50%" className="sk-dot" />
    <div className="skeleton-list-content">
      <Skeleton width="55%" height="1rem" radius="6px" />
      <Skeleton width="35%" height="0.75rem" radius="6px" />
    </div>
  </div>
);

// ── Full schedule skeleton ────────────────────────────────────────────────────
export const SkeletonSchedule: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="skeleton-schedule">
    {Array.from({ length: rows }, (_, i) => <SkeletonListItem key={i} />)}
  </div>
);
