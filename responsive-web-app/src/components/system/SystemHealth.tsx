import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: Date;
  responseTime?: number;
}

interface SystemMetrics {
  emailsSentToday: number;
  templatesActive: number;
  errorRate: number;
  avgResponseTime: number;
}

export const SystemHealth: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthStatus();
    const interval = setInterval(loadHealthStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    try {
      // Mock health data - in real implementation, this would call health check endpoints
      const mockHealth: HealthStatus[] = [
        {
          service: 'Template Service',
          status: 'healthy',
          message: 'All template operations working normally',
          lastCheck: new Date(),
          responseTime: 45
        },
        {
          service: 'Email Service',
          status: 'healthy',
          message: 'SMTP connection established',
          lastCheck: new Date(),
          responseTime: 120
        },
        {
          service: 'Database',
          status: 'healthy',
          message: 'Database connections stable',
          lastCheck: new Date(),
          responseTime: 25
        },
        {
          service: 'Notification Scheduler',
          status: 'warning',
          message: 'Some scheduled jobs delayed',
          lastCheck: new Date(),
          responseTime: 200
        }
      ];

      const mockMetrics: SystemMetrics = {
        emailsSentToday: 1247,
        templatesActive: 12,
        errorRate: 2.3,
        avgResponseTime: 98
      };

      setHealthStatus(mockHealth);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load health status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getOverallStatus = () => {
    const hasError = healthStatus.some(s => s.status === 'error');
    const hasWarning = healthStatus.some(s => s.status === 'warning');
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>System Health</Typography>
        <LinearProgress />
      </Box>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Health Monitor
      </Typography>

      {/* Overall Status */}
      <Alert 
        severity={overallStatus === 'healthy' ? 'success' : overallStatus === 'warning' ? 'warning' : 'error'}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6">
          System Status: {overallStatus.toUpperCase()}
        </Typography>
        <Typography variant="body2">
          {overallStatus === 'healthy' 
            ? 'All systems operating normally'
            : overallStatus === 'warning'
            ? 'Some services have warnings - monitoring required'
            : 'Critical issues detected - immediate attention required'
          }
        </Typography>
      </Alert>

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {metrics.emailsSentToday.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Emails Sent Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {metrics.templatesActive}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Templates
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color={metrics.errorRate > 5 ? "error.main" : "warning.main"}>
                  {metrics.errorRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {metrics.avgResponseTime}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Service Health Status */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Service Health Status
        </Typography>
        
        <Grid container spacing={2}>
          {healthStatus.map((service, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getStatusIcon(service.status)}
                    <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                      {service.service}
                    </Typography>
                    <Chip 
                      label={service.status.toUpperCase()} 
                      color={getStatusColor(service.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {service.message}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Last check: {service.lastCheck.toLocaleTimeString()}
                    </Typography>
                    {service.responseTime && (
                      <Typography variant="caption" color="text.secondary">
                        {service.responseTime}ms
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};