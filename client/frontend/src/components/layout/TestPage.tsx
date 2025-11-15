import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

const TestPage: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <div style={{ padding: '20px' }}>
          <h1>Test Page</h1>
          <p>This is a test page to verify the responsive hamburger menu functionality.</p>
          
          <div style={{ marginTop: '20px' }}>
            <h2>Instructions:</h2>
            <ol>
              <li>Resize your browser window to tablet size (768px - 1023px) or mobile size (&lt; 768px)</li>
              <li>You should see the hamburger menu icon in the header</li>
              <li>Click the hamburger menu to open the mobile navigation</li>
              <li>The debug panel in the top-right shows the current state</li>
            </ol>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h2>Expected Behavior:</h2>
            <ul>
              <li><strong>Desktop (≥ 1024px):</strong> Traditional sidebar, no hamburger in header</li>
              <li><strong>Tablet (768px - 1023px):</strong> Hamburger menu in header, opens mobile nav</li>
              <li><strong>Mobile (&lt; 768px):</strong> Hamburger menu in header, opens mobile nav</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
            <h3>Current Window Size: {window.innerWidth}px</h3>
            <p>Resize the window to test different breakpoints.</p>
          </div>
        </div>
      </AppLayout>
    </BrowserRouter>
  );
};

export default TestPage;