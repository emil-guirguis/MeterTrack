const express = require('express');
const ModbusRTU = require("modbus-serial");
const router = express.Router();

/**
 * Direct meter read endpoint - connects directly to meter like MCP agent
 * POST /api/direct-meter-read
 */
router.post('/direct-meter-read', async (req, res) => {
  const { ip, port, slaveId, registers } = req.body;
  
  console.log(`🔌 Direct meter read: ${ip}:${port} slave ${slaveId}`);
  
  const client = new ModbusRTU();
  
  try {
    // Connect directly to meter
    await client.connectTCP(ip, { port });
    client.setID(slaveId);
    client.setTimeout(5000);
    
    console.log('✅ Connected to meter, reading registers...');
    
    const readings = {};
    
    // Read each register as specified
    for (const reg of registers) {
      try {
        const result = await client.readHoldingRegisters(reg.address, reg.count);
        const rawValue = result.data[0];
        const scaledValue = rawValue / reg.scale;
        
        readings[reg.name] = scaledValue;
        
        console.log(`📊 Register ${reg.address}: ${rawValue} -> ${scaledValue} (${reg.name})`);
      } catch (regError) {
        console.warn(`⚠️  Failed to read register ${reg.address}:`, regError.message);
        readings[reg.name] = 0;
      }
    }
    
    client.close();
    
    console.log('✅ Direct meter read complete:', readings);
    
    res.json({
      success: true,
      readings,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        ip,
        port,
        slaveId
      }
    });
    
  } catch (error) {
    console.error('❌ Direct meter read failed:', error.message);
    
    if (client.isOpen) {
      client.close();
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      deviceInfo: {
        ip,
        port,
        slaveId
      }
    });
  }
});

module.exports = router;