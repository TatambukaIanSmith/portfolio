-- =====================================================
-- CALL TRACKING TABLE - Phone Call Analytics
-- =====================================================
-- Add this to your existing database

CREATE TABLE call_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Call details
    phone_number VARCHAR(20) NOT NULL, -- The number being called
    call_type ENUM('direct', 'instagram', 'whatsapp') DEFAULT 'direct',
    call_source VARCHAR(100) NOT NULL, -- 'floating_menu', 'contact_section', 'business_card', etc.
    
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
);

-- Insert initial data for testing
INSERT INTO settings (key_name, value, type, description, is_public) VALUES 
('call_tracking_enabled', 'true', 'boolean', 'Enable call tracking analytics', false),
('primary_phone', '+256748550372', 'string', 'Primary phone number for tracking', true);