-- =====================================================
-- CHAT SYSTEM TABLES
-- =====================================================
-- Add these tables to your existing database structure

-- =====================================================
-- CHAT_SESSIONS TABLE (Chat Session Management)
-- =====================================================
CREATE TABLE chat_sessions (
    id VARCHAR(36) PRIMARY KEY, -- UUID format
    
    -- User identification
    user_id VARCHAR(36) NULL, -- If user is logged in
    session_token VARCHAR(255) NULL, -- Browser session identifier
    
    -- User information
    user_name VARCHAR(255) NULL,
    user_email VARCHAR(255) NULL,
    user_phone VARCHAR(50) NULL,
    
    -- Session metadata
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    page_url VARCHAR(500) NULL,
    referrer VARCHAR(500) NULL,
    
    -- Geographic data
    country VARCHAR(2) NULL,
    city VARCHAR(100) NULL,
    
    -- Session status
    status ENUM('active', 'ended', 'transferred', 'abandoned') DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Metrics
    message_count INT DEFAULT 0,
    response_time_avg_seconds INT NULL,
    satisfaction_rating TINYINT NULL, -- 1-5 rating
    
    -- Assignment
    assigned_admin_id VARCHAR(36) NULL,
    assigned_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_chat_sessions_status (status),
    INDEX idx_chat_sessions_is_active (is_active),
    INDEX idx_chat_sessions_started_at (started_at),
    INDEX idx_chat_sessions_last_activity (last_activity),
    INDEX idx_chat_sessions_assigned_admin (assigned_admin_id),
    INDEX idx_chat_sessions_user_id (user_id),
    INDEX idx_chat_sessions_ip (ip_address)
);

-- =====================================================
-- CHAT_MESSAGES TABLE (Individual Messages)
-- =====================================================
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY, -- UUID format
    session_id VARCHAR(36) NOT NULL,
    
    -- Message content
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    
    -- Sender information
    sender_type ENUM('user', 'admin', 'system', 'bot') NOT NULL,
    sender_id VARCHAR(36) NULL, -- Admin ID if sent by admin
    sender_name VARCHAR(255) NULL,
    
    -- Message metadata
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    
    -- System messages
    system_event VARCHAR(100) NULL, -- 'session_started', 'admin_joined', etc.
    
    -- File attachments (if applicable)
    attachment_url VARCHAR(500) NULL,
    attachment_type VARCHAR(50) NULL,
    attachment_size INT NULL,
    
    -- Message status
    status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
    
    -- Timestamps
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_chat_messages_session_id (session_id),
    INDEX idx_chat_messages_sender_type (sender_type),
    INDEX idx_chat_messages_sender_id (sender_id),
    INDEX idx_chat_messages_sent_at (sent_at),
    INDEX idx_chat_messages_is_read (is_read),
    INDEX idx_chat_messages_status (status)
);

-- =====================================================
-- CHAT_ANALYTICS TABLE (Chat Performance Metrics)
-- =====================================================
CREATE TABLE chat_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Time period
    date DATE NOT NULL,
    hour TINYINT NOT NULL, -- 0-23
    
    -- Session metrics
    sessions_started INT DEFAULT 0,
    sessions_ended INT DEFAULT 0,
    sessions_active INT DEFAULT 0,
    sessions_abandoned INT DEFAULT 0,
    
    -- Message metrics
    messages_sent INT DEFAULT 0,
    messages_from_users INT DEFAULT 0,
    messages_from_admins INT DEFAULT 0,
    
    -- Response metrics
    avg_first_response_time_seconds INT NULL,
    avg_response_time_seconds INT NULL,
    
    -- Satisfaction metrics
    satisfaction_ratings_count INT DEFAULT 0,
    satisfaction_avg_rating DECIMAL(3,2) NULL,
    
    -- Admin metrics
    active_admins INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE KEY unique_date_hour (date, hour),
    
    -- Indexes
    INDEX idx_chat_analytics_date (date),
    INDEX idx_chat_analytics_hour (hour)
);

-- =====================================================
-- CHAT_QUICK_REPLIES TABLE (Predefined Responses)
-- =====================================================
CREATE TABLE chat_quick_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Reply content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Categorization
    category VARCHAR(100) NULL,
    tags JSON NULL,
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    last_used TIMESTAMP NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Created by
    created_by VARCHAR(36) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_chat_quick_replies_category (category),
    INDEX idx_chat_quick_replies_is_active (is_active),
    INDEX idx_chat_quick_replies_usage_count (usage_count)
);

-- =====================================================
-- CHAT_SETTINGS TABLE (Chat Configuration)
-- =====================================================
CREATE TABLE chat_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Setting identification
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    
    -- Setting metadata
    description TEXT NULL,
    category VARCHAR(50) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_chat_settings_key (setting_key),
    INDEX idx_chat_settings_category (category)
);

-- =====================================================
-- INSERT DEFAULT CHAT SETTINGS
-- =====================================================
INSERT INTO chat_settings (setting_key, setting_value, setting_type, description, category) VALUES
('chat_enabled', 'true', 'boolean', 'Enable/disable chat widget', 'general'),
('auto_greeting', 'Hello! How can I help you today?', 'string', 'Automatic greeting message', 'messages'),
('office_hours_enabled', 'false', 'boolean', 'Enable office hours restrictions', 'availability'),
('office_hours_start', '09:00', 'string', 'Office hours start time (HH:MM)', 'availability'),
('office_hours_end', '17:00', 'string', 'Office hours end time (HH:MM)', 'availability'),
('offline_message', 'We are currently offline. Please leave a message and we will get back to you.', 'string', 'Message shown when offline', 'messages'),
('max_concurrent_chats', '5', 'number', 'Maximum concurrent chats per admin', 'limits'),
('session_timeout_minutes', '30', 'number', 'Session timeout in minutes', 'limits'),
('file_upload_enabled', 'true', 'boolean', 'Allow file uploads in chat', 'features'),
('max_file_size_mb', '10', 'number', 'Maximum file upload size in MB', 'limits');

-- =====================================================
-- INSERT DEFAULT QUICK REPLIES
-- =====================================================
INSERT INTO chat_quick_replies (title, message, category) VALUES
('Greeting', 'Hello! Thanks for reaching out. How can I help you today?', 'greetings'),
('Project Inquiry', 'I would be happy to discuss your project requirements. Could you tell me more about what you have in mind?', 'projects'),
('Pricing Question', 'I offer competitive pricing based on project scope and requirements. Let me know your budget range and I can provide a detailed quote.', 'pricing'),
('Timeline Question', 'Project timelines vary based on complexity. Most projects take 2-8 weeks. What is your target launch date?', 'timeline'),
('Technical Question', 'I specialize in Laravel, React, and modern web technologies. What specific technical requirements do you have?', 'technical'),
('Thank You', 'Thank you for your interest! I will get back to you within 24 hours with a detailed response.', 'closing'),
('Offline', 'I am currently offline but will respond to your message as soon as possible. Thanks for your patience!', 'availability');

-- =====================================================
-- USEFUL QUERIES FOR CHAT MANAGEMENT
-- =====================================================

-- Get active chat sessions with latest message
-- SELECT 
--     cs.id,
--     cs.user_name,
--     cs.user_email,
--     cs.started_at,
--     cs.last_activity,
--     cs.message_count,
--     cm.message as latest_message,
--     cm.sent_at as latest_message_time
-- FROM chat_sessions cs
-- LEFT JOIN chat_messages cm ON cs.id = cm.session_id
-- WHERE cs.is_active = TRUE
-- AND cm.sent_at = (
--     SELECT MAX(sent_at) 
--     FROM chat_messages 
--     WHERE session_id = cs.id
-- )
-- ORDER BY cs.last_activity DESC;

-- Get chat analytics for today
-- SELECT 
--     SUM(sessions_started) as sessions_today,
--     SUM(messages_sent) as messages_today,
--     AVG(avg_response_time_seconds) as avg_response_time,
--     AVG(satisfaction_avg_rating) as avg_satisfaction
-- FROM chat_analytics 
-- WHERE date = CURDATE();

-- Get busiest hours for chat
-- SELECT 
--     hour,
--     AVG(sessions_started) as avg_sessions,
--     AVG(messages_sent) as avg_messages
-- FROM chat_analytics 
-- WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
-- GROUP BY hour 
-- ORDER BY avg_sessions DESC;