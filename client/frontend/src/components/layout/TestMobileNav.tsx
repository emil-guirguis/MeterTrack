import React, { useState } from 'react';
import './TestMobileNav.css';

const TestMobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { id: 'users', label: 'Users', icon: 'users', path: '/users' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
  ];

  return (
    <div className="test-mobile-nav">
      <h1>Mobile Nav Test</h1>
      <p>Current state: {isOpen ? 'OPEN' : 'CLOSED'}</p>
      
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="test-mobile-nav__button"
      >
        {isOpen ? 'Close' : 'Open'} Mobile Nav
      </button>

      <div className="test-mobile-nav__menu">
        {menuItems.map(item => (
          <a key={item.id} href={item.path} className="test-mobile-nav__item">
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default TestMobileNav;