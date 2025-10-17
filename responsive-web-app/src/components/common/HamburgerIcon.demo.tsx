import React, { useState } from 'react';
import { HamburgerIcon } from './HamburgerIcon';

/**
 * Demo component to test HamburgerIcon functionality
 * This can be temporarily added to a page to verify the component works
 */
export const HamburgerIconDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3>HamburgerIcon Demo</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleToggle}
          style={{
            width: '48px',
            height: '48px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <HamburgerIcon isOpen={isOpen} />
        </button>
        
        <span>State: {isOpen ? 'Open (X)' : 'Closed (Hamburger)'}</span>
      </div>

      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>Click the button to toggle between hamburger and X states.</p>
        <p>The animation should be smooth and accessible.</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HamburgerIcon isOpen={false} />
          <span>Closed state</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HamburgerIcon isOpen={true} />
          <span>Open state</span>
        </div>
      </div>
    </div>
  );
};