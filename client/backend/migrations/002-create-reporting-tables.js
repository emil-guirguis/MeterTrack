/**
 * Database Migration: Create Reporting Module Tables
 * Creates Reports, Report_History, and Email_Logs tables with indexes
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

async function runMigration() {
  let wasAlreadyConnected = false;
  
  try {
    console.log('🔄 Starting reporting module migration...');
    
    // Check if database is already connected
    wasAlreadyConnected = db.isConnected;
    
    // Only connect if not already connected
    if (!wasAlreadyConnected) {
      console.log('🔄 Connecting to database...');
      await db.connect();
    } else {
      console.log('✅ Using existing database connection');
    }
    
    // Define all SQL statements to execute
    const statements = [
      // Create Reports table
      `CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        schedule VARCHAR(255) NOT NULL,
        recipients TEXT[] NOT NULL,
        config JSONB NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create Report_History table
      `CREATE TABLE IF NOT EXISTS report_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        executed_at TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create Report_Email_Logs table (renamed to avoid conflict with existing email_logs)
      `CREATE TABLE IF NOT EXISTS report_email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        history_id UUID NOT NULL REFERENCES report_history(id) ON DELETE CASCADE,
        recipient VARCHAR(255) NOT NULL,
        sent_at TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL,
        error_details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create indexes for report_history
      `CREATE INDEX IF NOT EXISTS idx_report_history_report_id ON report_history(report_id)`,
      `CREATE INDEX IF NOT EXISTS idx_report_history_executed_at ON report_history(executed_at)`,
      `CREATE INDEX IF NOT EXISTS idx_report_history_report_executed ON report_history(report_id, executed_at DESC)`,
      
      // Create indexes for report_email_logs
      `CREATE INDEX IF NOT EXISTS idx_report_email_logs_report_id ON report_email_logs(report_id)`,
      `CREATE INDEX IF NOT EXISTS idx_report_email_logs_history_id ON report_email_logs(history_id)`,
      `CREATE INDEX IF NOT EXISTS idx_report_email_logs_recipient ON report_email_logs(recipient)`,
      `CREATE INDEX IF NOT EXISTS idx_report_email_logs_sent_at ON report_email_logs(sent_at)`,
      `CREATE INDEX IF NOT EXISTS idx_report_email_logs_history_recipient ON report_email_logs(history_id, recipient)`
    ];
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementNum = i + 1;
      
      try {
        console.log(`\n📄 Executing statement ${statementNum}/${statements.length}...`);
        await db.query(statement);
        console.log(`✅ Statement ${statementNum} completed`);
      } catch (error) {
        console.error(`❌ Statement ${statementNum} failed`);
        console.error(`Error: ${error.message}`);
        throw error;
      }
    }
    
    console.log('\n✅ All reporting module tables and indexes created successfully');
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error.message);
    process.exit(1);
  } finally {
    // Only disconnect if we connected in this function
    if (!wasAlreadyConnected && db.isConnected) {
      console.log('🔄 Disconnecting from database...');
      await db.disconnect();
    } else if (wasAlreadyConnected) {
      console.log('✅ Keeping database connection open (called from server.js)');
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
