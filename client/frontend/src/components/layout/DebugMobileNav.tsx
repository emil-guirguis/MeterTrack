import React from 'react';
import { useUI } from '../../store/slices/uiSlice';
import { useResponsive } from '../../hooks/useResponsive';

const DebugMobileNav: React.FC = () => {
  const { mobileNavOpen, setMobileNavOpen, sidebarCollapsed } = useUI();
  const responsive = useResponsive();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div><strong>Debug Info:</strong></div>
      <div>Mobile Nav Open: {mobileNavOpen ? 'YES' : 'NO'}</div>
      <div>Sidebar Collapsed: {sidebarCollapsed ? 'YES' : 'NO'}</div>
      <div>Is Mobile: {responsive.isMobile ? 'YES' : 'NO'}</div>
      <div>Is Tablet: {responsive.isTablet ? 'YES' : 'NO'}</div>
      <div>Is Desktop: {responsive.isDesktop ? 'YES' : 'NO'}</div>
      <div>Show Sidebar In Header: {responsive.showSidebarInHeader ? 'YES' : 'NO'}</div>
      <div>Window Width: {window.innerWidth}px</div>
      <div>Breakpoint: {responsive.breakpoint}</div>
      <button 
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        style={{ marginTop: '5px', padding: '2px 5px' }}
      >
        Toggle Mobile Nav
      </button>
    </div>
  );
};

export default DebugMobileNav;