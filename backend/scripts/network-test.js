#!/usr/bin/env node

/**
 * Network connectivity test for Modbus meter
 */

const net = require('net');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testNetworkConnectivity(ip = '10.10.10.11', port = 502) {
  console.log('🔍 Network Connectivity Diagnostics');
  console.log('=====================================\n');
  
  console.log(`Target: ${ip}:${port}\n`);

  // 1. Test ping
  console.log('1. Testing ping connectivity...');
  try {
    const { stdout } = await execAsync(`ping -n 1 ${ip}`);
    if (stdout.includes('Reply from')) {
      console.log('   ✅ Ping successful - Host is reachable');
    } else {
      console.log('   ❌ Ping failed - Host unreachable');
    }
  } catch (error) {
    console.log('   ❌ Ping failed:', error.message);
  }

  // 2. Test TCP connection
  console.log('\n2. Testing TCP connection...');
  const tcpResult = await testTcpConnection(ip, port);
  
  // 3. Test different ports
  console.log('\n3. Testing common Modbus ports...');
  const ports = [502, 503, 1502];
  for (const testPort of ports) {
    const result = await testTcpConnection(ip, testPort, 2000);
    console.log(`   Port ${testPort}: ${result ? '✅ Open' : '❌ Closed/Filtered'}`);
  }

  // 4. Network interface info
  console.log('\n4. Local network information...');
  try {
    const { stdout } = await execAsync('ipconfig');
    const lines = stdout.split('\n');
    const relevantLines = lines.filter(line => 
      line.includes('IPv4') || 
      line.includes('Subnet') || 
      line.includes('Default Gateway')
    );
    relevantLines.forEach(line => {
      if (line.trim()) {
        console.log(`   ${line.trim()}`);
      }
    });
  } catch (error) {
    console.log('   ❌ Could not get network info');
  }

  // 5. Suggestions
  console.log('\n5. Troubleshooting suggestions:');
  console.log('   • Check if you\'re on the same network as the meter');
  console.log('   • Verify the meter IP address is correct');
  console.log('   • Check Windows Firewall settings');
  console.log('   • Try connecting from the same machine as your other software');
  console.log('   • Verify the meter\'s Modbus TCP port configuration');
}

function testTcpConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);

    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

// Run diagnostics
testNetworkConnectivity().catch(console.error);