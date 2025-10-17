import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useUI } from '../../store/slices/uiSlice';

const DebugPanel: React.FC = () => {
  const responsive = useResponsive();
  const ui = useUI();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace',
      minWidth: '250px'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#00ff00' }}>
        🐛 Debug Panel
      </div>
      
      <div><strong>Window:</strong> {window.innerWidth}px × {window.innerHeight}px</div>
      <div><strong>Breakpoint:</strong> {responsive.breakpoint}</div>
      <div><strong>Is Mobile:</strong> {responsive.isMobile ? '✅' : '❌'}</div>
      <div><strong>Is Tablet:</strong> {responsive.isTablet ? '✅' : '❌'}</div>
      <div><strong>Is Desktop:</strong> {responsive.isDesktop ? '✅' : '❌'}</div>
      <div><strong>Show Sidebar In Header:</strong> {responsive.showSidebarInHeader ? '✅' : '❌'}</div>
      
      <hr style={{ margin: '10px 0', border: '1px solid #333' }} />
      
      <div><strong>Mobile Nav Open:</strong> {ui.mobileNavOpen ? '✅' : '❌'}</div>
      <div><strong>Sidebar Collapsed:</strong> {ui.sidebarCollapsed ? '✅' : '❌'}</div>
      
      <hr style={{ margin: '10px 0', border: '1px solid #333' }} />
      
      <button 
        onClick={() => ui.setMobileNavOpen(!ui.mobileNavOpen)}
        style={{ 
          padding: '5px 10px', 
          marginTop: '5px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Toggle Mobile Nav
      </button>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#888' }}>
        Resize window to test breakpoints
      </div>
    </div>
  );
};

export default DebugPanel;