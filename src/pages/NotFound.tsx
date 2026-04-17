import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => (
  <div className="notfound-container">
    <div className="notfound-content">
      <p className="notfound-code">404</p>
      <h1 className="notfound-title">Lost in the Circuit</h1>
      <p className="notfound-subtitle">This page doesn't exist or was moved. Let's get you back on track.</p>
      <Link to="/" className="notfound-btn">← Back to Home</Link>
    </div>
  </div>
);

export default NotFound;
