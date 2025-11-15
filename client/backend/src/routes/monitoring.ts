import express from 'express';
import modbusMonitoring from '../monitoring/modbusMonitoring.js';

const router = express.Router();

/**
 * Get Modbus system health status
 * GET /api/monitoring/health
 */
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const healthCheck = await modbusMonitoring.performHealthCheck();
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      ...healthCheck
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date()
    });
  }
});

/**
 * Get Modbus monitoring metrics
 * GET /api/monitoring/metrics
 */
router.get('/metrics', (req: express.Request, res: express.Response) => {
  try {
    const metrics = modbusMonitoring.getMetrics();
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metrics',
      timestamp: new Date()
    });
  }
});

/**
 * Get monitoring dashboard data
 * GET /api/monitoring/dashboard
 */
router.get('/dashboard', (req: express.Request, res: express.Response) => {
  try {
    const dashboardData = modbusMonitoring.getDashboardData();
    
    res.json({
      success: true,
      ...dashboardData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard data',
      timestamp: new Date()
    });
  }
});

/**
 * Reset monitoring metrics (admin only)
 * POST /api/monitoring/reset
 */
router.post('/reset', (req: express.Request, res: express.Response) => {
  try {
    // In a real implementation, you'd want authentication/authorization here
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    modbusMonitoring.resetMetrics();
    
    res.json({
      success: true,
      message: 'Monitoring metrics reset successfully',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to reset metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset metrics',
      timestamp: new Date()
    });
  }
});

export default router;