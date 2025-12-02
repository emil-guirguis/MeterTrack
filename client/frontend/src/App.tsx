import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { prefetchAppSchemas } from './utils/schemaPrefetch';
import { invalidateExpiredCache } from '@framework/forms/utils/schemaLoader';
import { useAuth } from './hooks/useAuth';
import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Prefetch schemas after user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      prefetchAppSchemas();
    }
  }, [isAuthenticated, isLoading]);

  // Periodically clean up expired cache entries (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const removed = invalidateExpiredCache();
      if (removed > 0) {
        console.log(`[Schema Cache] Cleaned up ${removed} expired cache entries`);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
