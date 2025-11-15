import React, { useState } from 'react';
import MobileNav from './MobileNav';

const TestMobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { id: 'users', label: 'Users', icon: 'users', path: '/users' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mobile Nav Test</h1>
      <p>Current state: {isOpen ? 'OPEN' : 'CLOSED'}</p>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        {isOpen ? 'Close' : 'Open'} Mobile Nav
      </button>

      <MobileNav
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        menuItems={menuItems}
      />
    </div>
  );
};

export default TestMobileNav;