import React from 'react';
import './PageTransition.css';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wrap any page in <PageTransition> to get a smooth fade+slide-up on mount.
 * Usage: wrap the element in the Route, or wrap the page's root div internally.
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => (
  <div className="page-transition">
    {children}
  </div>
);

export default PageTransition;
