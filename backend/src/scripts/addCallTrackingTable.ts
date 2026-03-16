/**
 * Add Call Tracking Table to Existing Database
 * This script adds the call_tracking table and related settings to the existing database
 */

import { connectDatabase, getPool } from '../database/connection';
import { logger } from '../utils/logger';

async function addCallTrackingTable() {
  try {
    // Initialize database connection
    await connectDatabase();
    const pool = getPool();
    
    logger.info('🔧 Adding call_tracking table to database...');

    // Create call_tracking table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS call_tracking (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        
        -- Call details
        phone_number VARCHAR(20) NOT NULL,
        call_type ENUM('direct', 'instagram', 'whatsapp') DEFAULT 'direct',
        call_source VARCHAR(100) NOT NULL,
        
        -- User identification
        session_id VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT NULL,
        
        -- Geographic data
        country VARCHAR(2) NULL,
        city VARCHAR(100) NULL,
        
        -- Device info
        device_type ENUM('desktop', 'mobile', 'tablet') NULL,
        browser VARCHAR(50) NULL,
        os VARCHAR(50) NULL,
        
        -- Referrer information
        page_url VARCHAR(500) NOT NULL,
        referrer VARCHAR(500) NULL,
        
        -- Additional data
        call_data JSON NULL,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        INDEX idx_call_tracking_phone (phone_number),
        INDEX idx_call_tracking_type (call_type),
        INDEX idx_call_tracking_source (call_source),
        INDEX idx_call_tracking_session (session_id),
        INDEX idx_call_tracking_created (created_at),
        INDEX idx_call_tracking_ip (ip_address),
        INDEX idx_call_tracking_device (device_type)
      )
    `);

    logger.info('✅ call_tracking table created successfully');

    // Add call tracking settings if they don't exist
    await pool.execute(`
      INSERT IGNORE INTO settings (key_name, value, type, description, is_public) VALUES 
      ('call_tracking_enabled', 'true', 'boolean', 'Enable call tracking analytics', false),
      ('primary_phone', '+256748550372', 'string', 'Primary phone number for tracking', true)
    `);

    logger.info('✅ Call tracking settings added successfully');

    // Verify table exists
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'call_tracking'
    `);

    const tableExists = (rows as any[])[0].count > 0;
    
    if (tableExists) {
      logger.info('✅ Call tracking table verification successful');
      
      // Show table structure
      const [structure] = await pool.execute('DESCRIBE call_tracking');
      logger.info('📋 Call tracking table structure:', structure);
      
    } else {
      throw new Error('Call tracking table was not created properly');
    }

    logger.info('🎉 Call tracking system setup completed successfully!');

  } catch (error) {
    logger.error('❌ Failed to add call tracking table:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addCallTrackingTable()
    .then(() => {
      logger.info('✅ Call tracking migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Call tracking migration failed:', error);
      process.exit(1);
    });
}

export { addCallTrackingTable };