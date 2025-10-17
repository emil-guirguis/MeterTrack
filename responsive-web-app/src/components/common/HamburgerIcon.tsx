import React from 'react';
import './HamburgerIcon.css';

interface HamburgerIconProps {
  isOpen: boolean;
  className?: string;
  'aria-label'?: string;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({ 
  isOpen, 
  className = '',
  'aria-label': ariaLabel
}) => {
  return (
    <div 
      className={`hamburger-icon ${isOpen ? 'open' : ''} ${className}`}
      aria-hidden="true"
    >
      <span className="hamburger-line hamburger-line--top" />
      <span className="hamburger-line hamburger-line--middle" />
      <span className="hamburger-line hamburger-line--bottom" />
    </div>
  );
};