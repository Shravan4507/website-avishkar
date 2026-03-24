import React from 'react';
import './Loader.css';

interface LoaderProps {
  fullscreen?: boolean; // fills the whole viewport
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const Loader: React.FC<LoaderProps> = ({
  fullscreen = false,
  size = 'md',
  label,
}) => {
  const content = (
    <div className={`loader-inner loader-inner--${size}`}>
      <div className="loader-ring">
        <div />
        <div />
        <div />
        <div />
      </div>
      {label && <p className="loader-label">{label}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="loader-fullscreen">
        {content}
      </div>
    );
  }

  return <div className="loader-inline">{content}</div>;
};

export default Loader;
