import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import BusinessIcon from '@mui/icons-material/Business';
import LoginIcon from '@mui/icons-material/Login';
import { AxiosError } from 'axios';
import { useAppStore } from '../stores/useAppStore';
import { tenantApi } from '../api/services';
import { authApi } from '../api/auth';
import { TenantInfo } from '../types';

/**
 * Helper function to extract user-friendly error messages from various error types
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.code === 'ECONNABORTED') {
      return 'Request timeout: Unable to connect to the server. Please check your connection.';
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
      return 'Connection error: Unable to reach the server. Please ensure the sync service is running.';
    }
    if (err.response?.status === 404) {
      return 'Tenant information not found on the server.';
    }
    if (err.response?.status === 500) {
      return 'Server error: Unable to retrieve tenant information. Please try again later.';
    }
    if (err.response?.status === 503) {
      return 'Service unavailable: The sync service is temporarily unavailable.';
    }
    if (err.message === 'Network Error') {
      return 'Network error: Unable to connect to the server.';
    }
    return err.message || 'Failed to fetch tenant information';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Failed to fetch tenant information';
}

/**
 * Helper function to validate tenant data
 */
function isValidTenantInfo(data: unknown): data is TenantInfo {
  if (!data || typeof data !== 'object') {
    console.log('❌ [Validation] Data is not an object:', data);
    return false;
  }
  const obj = data as Record<string, unknown>;
  
  console.log('🔍 [Validation] Checking tenant data:', {
    id: { value: obj.id, type: typeof obj.id },
    name: { value: obj.name, type: typeof obj.name },
  });
  
  const isValid = (
    (typeof obj.id === 'number' || typeof obj.id === 'string') &&
    typeof obj.name === 'string' &&
    obj.name.trim().length > 0
  );
  
  console.log(`${isValid ? '✅' : '❌'} [Validation] Result: ${isValid}`);
  return isValid;
}

/**
 * Handle login and sync tenant data from remote to local database
 */
async function handleLogin(
  loginData: { email: string; password: string },
  setTenantInfo: (info: TenantInfo | null) => void,
  setLoginError: (error: string | null) => void,
  setShowLoginModal: (show: boolean) => void,
  setLoginData: (data: { email: string; password: string }) => void
): Promise<boolean> {
  try {
    console.log('🔐 [CompanyInfoCard] Attempting login...');
    const response = await authApi.login(loginData);

    if (!response.success) {
      setLoginError(response.error || 'Login failed');
      console.error('❌ [CompanyInfoCard] Login failed:', response.error);
      return false;
    }

    // After successful login, trigger tenant sync from remote to local database
    if (response.token && response.tenant) {
      try {
        console.log('🔄 [CompanyInfoCard] Triggering tenant sync from remote to local database...');
        const syncedTenantInfo = await tenantApi.syncTenantFromRemote(response.tenant.tenant_id);
        
        if (syncedTenantInfo) {
          console.log('✅ [CompanyInfoCard] Tenant synced successfully:', syncedTenantInfo);
          setTenantInfo(syncedTenantInfo);
          
          // Close modal and clear login data
          setShowLoginModal(false);
          setLoginData({ email: '', password: '' });
          
          // Refresh page to load all company info automatically
          console.log('🔄 [CompanyInfoCard] Refreshing page to load company info...');
          setTimeout(() => {
            window.location.reload();
          }, 500);
          
          return true;
        } else {
          console.warn('⚠️ [CompanyInfoCard] No tenant data returned from sync');
          // Fall back to response tenant if sync didn't return data
          if (response.tenant) {
            const tenantInfo: TenantInfo = {
              tenant_id: response.tenant.tenant_id,
              name: response.tenant.name,
              url: response.tenant.url,
              street: response.tenant.street,
              street2: response.tenant.street2,
              city: response.tenant.city,
              state: response.tenant.state,
              zip: response.tenant.zip,
              country: response.tenant.country,
              active: response.tenant.active,
            };
            setTenantInfo(tenantInfo);
          }
        }
      } catch (syncErr) {
        console.error('⚠️ [CompanyInfoCard] Failed to sync tenant from remote:', syncErr);
        // Don't fail the login if sync fails, just log the error
        // Fall back to response tenant
        if (response.tenant) {
          const tenantInfo: TenantInfo = {
            tenant_id: response.tenant.tenant_id,
            name: response.tenant.name,
            url: response.tenant.url,
            street: response.tenant.street,
            street2: response.tenant.street2,
            city: response.tenant.city,
            state: response.tenant.state,
            zip: response.tenant.zip,
            country: response.tenant.country,
            active: response.tenant.active,
          };
          setTenantInfo(tenantInfo);
        }
      }

      setShowLoginModal(false);
      setLoginData({ email: '', password: '' });
      return true;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed';
    setLoginError(errorMessage);
    console.error('❌ [CompanyInfoCard] Login error:', err);
    return false;
  }
  return false;
}

export default function CompanyInfoCard() {
  const { tenantInfo, setTenantInfo } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [syncConnected, setSyncConnected] = useState<boolean | null>(null);
  const [remoteConnected, setRemoteConnected] = useState<boolean | null>(null);
  const [remoteApiConnected, setRemoteApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await tenantApi.getTenantInfo();
        
        // Validate the returned data
        if (data !== null && !isValidTenantInfo(data)) {
          const errorMsg = 'Invalid tenant data received from server';
          setError(errorMsg);
          console.error(errorMsg, { 
            receivedData: data,
            receivedDataJSON: JSON.stringify(data, null, 2),
            receivedDataKeys: Object.keys(data as Record<string, unknown>),
          });
          return;
        }
        
        setTenantInfo(data);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error fetching tenant info:', {
          error: err,
          errorMessage,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantInfo();
  }, [setTenantInfo]);

  // Check connection status periodically
  useEffect(() => {
    const checkConnections = async () => {
      try {
        // Check local sync database connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const localResponse = await fetch('/api/health/sync-db', { 
            method: 'GET',
            signal: controller.signal 
          });
          const syncStatus = localResponse.ok;
          setSyncConnected(syncStatus);
          console.log('[CompanyInfoCard] Sync DB connection:', syncStatus);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        setSyncConnected(false);
        console.error('[CompanyInfoCard] Sync DB connection error:', err);
      }

      try {
        // Check remote database connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const remoteResponse = await fetch('/api/health/remote-db', { 
            method: 'GET',
            signal: controller.signal 
          });
          const remoteStatus = remoteResponse.ok;
          setRemoteConnected(remoteStatus);
          console.log('[CompanyInfoCard] Remote DB connection:', remoteStatus);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        setRemoteConnected(false);
        console.error('[CompanyInfoCard] Remote DB connection error:', err);
      }

      try {
        // Check remote Client System API connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const apiResponse = await fetch('/api/local/sync-status', { 
            method: 'GET',
            signal: controller.signal 
          });
          const apiStatus = apiResponse.ok;
          setRemoteApiConnected(apiStatus);
          console.log('[CompanyInfoCard] Remote API connection:', apiStatus);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        setRemoteApiConnected(false);
        console.error('[CompanyInfoCard] Remote API connection error:', err);
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="120px">
            <CircularProgress size={40} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <ErrorIcon color="error" fontSize="large" />
              <Box flex={1}>
                <Typography variant="h6">Company Info</Typography>
                <Chip
                  label="Error"
                  color="error"
                  size="small"
                />
              </Box>
            </Box>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={() => setShowLoginModal(true)}
              fullWidth
            >
              Connect Account
            </Button>
          </CardContent>
        </Card>

        {/* Login Modal */}
        <Dialog open={showLoginModal} onClose={() => setShowLoginModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Connect to Your Account</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              margin="normal"
              placeholder="Enter your email"
              disabled={isLoggingIn}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              margin="normal"
              placeholder="Enter your password"
              disabled={isLoggingIn}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowLoginModal(false);
              setLoginError(null);
            }} disabled={isLoggingIn}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                setIsLoggingIn(true);
                setLoginError(null);
                await handleLogin(loginData, setTenantInfo, setLoginError, setShowLoginModal, setLoginData);
                setIsLoggingIn(false);
              }}
              disabled={isLoggingIn || !loginData.email || !loginData.password}
            >
              {isLoggingIn ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  if (!tenantInfo) {
    return (
      <>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <BusinessIcon color="warning" fontSize="large" />
              <Box flex={1}>
                <Typography variant="h6">Company Info</Typography>
                <Chip
                  label="Not Connected"
                  color="warning"
                  size="small"
                />
              </Box>
            </Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              No tenant information available. Please connect to your account.
            </Alert>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={() => setShowLoginModal(true)}
              fullWidth
            >
              Connect Account
            </Button>
          </CardContent>
        </Card>

        {/* Login Modal */}
        <Dialog open={showLoginModal} onClose={() => setShowLoginModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Connect to Your Account</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              margin="normal"
              placeholder="Enter your email"
              disabled={isLoggingIn}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              margin="normal"
              placeholder="Enter your password"
              disabled={isLoggingIn}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowLoginModal(false);
              setLoginError(null);
            }} disabled={isLoggingIn}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                setIsLoggingIn(true);
                setLoginError(null);
                await handleLogin(loginData, setTenantInfo, setLoginError, setShowLoginModal, setLoginData);
                setIsLoggingIn(false);
              }}
              disabled={isLoggingIn || !loginData.email || !loginData.password}
            >
              {isLoggingIn ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Determine overall connectivity status
  const remoteSystemConnected = remoteConnected === true && remoteApiConnected === true;
  const overallStatus = syncConnected && remoteSystemConnected ? 'success' : 'error';
  const statusLabel = syncConnected && remoteSystemConnected ? 'All Systems Connected' : 'Connection Issues';

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <BusinessIcon color="primary" fontSize="large" />
          <Box flex={1}>
            <Typography variant="h6">Company Info & System Status</Typography>
            <Chip
              icon={overallStatus === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
              label={statusLabel}
              color={overallStatus}
              size="small"
            />
          </Box>
        </Box>

        {/* Connection Status Bubbles */}
        <Box mt={3} mb={3} display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          {/* Local Sync Database Connection Bubble */}
          <Box
            sx={{
              width: 120,
              height: 60,
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: syncConnected === null ? '#cccccc' : syncConnected ? '#4caf50' : '#f44336',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            title={syncConnected === null ? 'Checking...' : syncConnected ? 'Local sync database is connected' : 'Local sync database is disconnected'}
          >
            <Typography
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                textAlign: 'center',
              }}
            >
              {syncConnected === null ? 'Checking...' : syncConnected ? 'Local Sync\nConnected' : 'Local Sync\nError'}
            </Typography>
          </Box>

          {/* Remote Client Database Connection Bubble */}
          <Box
            sx={{
              width: 120,
              height: 60,
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: remoteConnected === null ? '#cccccc' : remoteConnected ? '#4caf50' : '#f44336',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            title={remoteConnected === null ? 'Checking...' : remoteConnected ? 'Remote client database is connected' : 'Remote client database is disconnected'}
          >
            <Typography
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                textAlign: 'center',
              }}
            >
              {remoteConnected === null ? 'Checking...' : remoteConnected ? 'Remote DB\nConnected' : 'Remote DB\nError'}
            </Typography>
          </Box>

          {/* Remote Client API Connection Bubble */}
          <Box
            sx={{
              width: 120,
              height: 60,
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: remoteApiConnected === null ? '#cccccc' : remoteApiConnected ? '#4caf50' : '#f44336',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            title={remoteApiConnected === null ? 'Checking...' : remoteApiConnected ? 'Remote Client API is connected' : 'Remote Client API is disconnected'}
          >
            <Typography
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                textAlign: 'center',
              }}
            >
              {remoteApiConnected === null ? 'Checking...' : remoteApiConnected ? 'Remote API\nConnected' : 'Remote API\nError'}
            </Typography>
          </Box>
        </Box>

        {/* Warning Alert for Remote System Issues */}
        {!remoteSystemConnected && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Unable to reach Client System. Readings are being queued locally.
          </Alert>
        )}

        <Box mt={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Company Name
          </Typography>
          <Typography variant="body1" gutterBottom>
            {tenantInfo.name}
          </Typography>
        </Box>

        {tenantInfo.street && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Address
            </Typography>
            <Typography variant="body1" gutterBottom>
              {tenantInfo.street  }
              {tenantInfo.street2 && `, ${tenantInfo.street2}`}
            </Typography>
          </Box>
        )}

        {(tenantInfo.city || tenantInfo.state || tenantInfo.zip) && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Location
            </Typography>
            <Typography variant="body1" gutterBottom>
              {[tenantInfo.city, tenantInfo.state, tenantInfo.zip].filter(Boolean).join(', ')}
              {tenantInfo.country && ` ${tenantInfo.country}`}
            </Typography>
          </Box>
        )}

        {tenantInfo.url && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Website
            </Typography>
            <Typography variant="body1" gutterBottom>
              <a href={tenantInfo.url} target="_blank" rel="noopener noreferrer">
                {tenantInfo.url}
              </a>
            </Typography>
          </Box>
        )}

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Created: {}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
