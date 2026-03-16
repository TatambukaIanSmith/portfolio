-- =====================================================
-- Ian Smith Portfolio Backend - MySQL Database Schema
-- =====================================================
-- This file contains the complete database structure for the backend API migration
-- Compatible with XAMPP MySQL setup

-- Create database (run this first in phpMyAdmin or MySQL command line)
-- CREATE DATABASE iansmith_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE iansmith_portfolio;

-- =====================================================
-- 1. USERS TABLE (Enhanced for Security & Authentication)
-- =====================================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY, -- Changed to UUID for security
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'super_admin', 'user', 'client', 'guest') DEFAULT 'user',
    status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'pending',
    
    -- Security fields
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255) NULL,
    backup_codes JSON NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Legacy compatibility
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_active (is_active),
    INDEX idx_users_last_login (last_login)
);

-- =====================================================
-- 2. LEADS TABLE (Contact Form & Project Inquiries)
-- =====================================================
CREATE TABLE leads (
    id VARCHAR(36) PRIMARY KEY, -- UUID format
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('contact', 'project') NOT NULL DEFAULT 'contact',
    
    -- Project-specific fields
    project_type VARCHAR(100) NULL,
    budget VARCHAR(50) NULL,
    
    -- Lead management
    status ENUM('new', 'contacted', 'qualified', 'converted', 'closed') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    source VARCHAR(100) DEFAULT 'website',
    
    -- AI Analysis (JSON stored as TEXT)
    ai_analysis JSON NULL,
    
    -- Timestamps
    timestamp BIGINT NOT NULL, -- Original timestamp from frontend
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_leads_email (email),
    INDEX idx_leads_type (type),
    INDEX idx_leads_status (status),
    INDEX idx_leads_priority (priority),
    INDEX idx_leads_created (created_at),
    INDEX idx_leads_timestamp (timestamp)
);

-- =====================================================
-- 3. PHONE_CALLS TABLE (Phone Call Requests)
-- =====================================================
CREATE TABLE phone_calls (
    id VARCHAR(36) PRIMARY KEY, -- UUID format
    caller_name VARCHAR(255) NULL,
    caller_email VARCHAR(255) NULL,
    caller_phone VARCHAR(50) NULL,
    call_type ENUM('direct', 'callback_request', 'instagram') DEFAULT 'direct',
    message TEXT NULL,
    status ENUM('requested', 'scheduled', 'completed', 'missed', 'cancelled') DEFAULT 'requested',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    source VARCHAR(100) DEFAULT 'website',
    
    -- Call scheduling
    preferred_time TIMESTAMP NULL,
    scheduled_time TIMESTAMP NULL,
    duration_minutes INT NULL,
    
    -- Metadata
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    referrer VARCHAR(500) NULL,
    
    -- Timestamps
    timestamp BIGINT NOT NULL, -- Unix timestamp for compatibility
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_phone_calls_email (caller_email),
    INDEX idx_phone_calls_status (status),
    INDEX idx_phone_calls_type (call_type),
    INDEX idx_phone_calls_priority (priority),
    INDEX idx_phone_calls_created (created_at),
    INDEX idx_phone_calls_timestamp (timestamp)
);

-- =====================================================
-- 4. ANALYTICS_EVENTS TABLE (User Interaction Tracking)
-- =====================================================
CREATE TABLE analytics_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'button_click', 'form_submit', etc.
    event_name VARCHAR(100) NOT NULL, -- Specific event name
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255) NULL,
    
    -- User identification
    session_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(36) NULL, -- If user is logged in
    ip_address VARCHAR(45) NOT NULL, -- IPv4 or IPv6
    user_agent TEXT NULL,
    
    -- Geographic data
    country VARCHAR(2) NULL, -- ISO country code
    city VARCHAR(100) NULL,
    
    -- Device/Browser info
    device_type ENUM('desktop', 'mobile', 'tablet') NULL,
    browser VARCHAR(50) NULL,
    os VARCHAR(50) NULL,
    
    -- Additional event data (JSON)
    event_data JSON NULL,
    
    -- Referrer information
    referrer VARCHAR(500) NULL,
    utm_source VARCHAR(100) NULL,
    utm_medium VARCHAR(100) NULL,
    utm_campaign VARCHAR(100) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for analytics queries
    INDEX idx_analytics_event_type (event_type),
    INDEX idx_analytics_session (session_id),
    INDEX idx_analytics_user (user_id),
    INDEX idx_analytics_created (created_at),
    INDEX idx_analytics_page (page_url(255)),
    INDEX idx_analytics_country (country),
    INDEX idx_analytics_device (device_type)
);

-- =====================================================
-- 5. BLOG_ARTICLES TABLE (Content Management)
-- =====================================================
CREATE TABLE blog_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT NULL,
    content LONGTEXT NOT NULL,
    
    -- SEO
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords VARCHAR(500) NULL,
    
    -- Media
    featured_image VARCHAR(500) NULL,
    featured_image_alt VARCHAR(255) NULL,
    
    -- Organization
    category VARCHAR(100) NULL,
    tags JSON NULL, -- Array of tags
    
    -- Publishing
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    
    -- Author (references users table)
    author_id INT NOT NULL,
    
    -- Analytics
    view_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_articles_slug (slug),
    INDEX idx_articles_status (status),
    INDEX idx_articles_published (published_at),
    INDEX idx_articles_category (category),
    INDEX idx_articles_author (author_id),
    INDEX idx_articles_created (created_at)
);

-- =====================================================
-- 6. PROJECTS TABLE (Portfolio Projects)
-- =====================================================
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY, -- UUID format
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    
    -- Technical details
    technologies JSON NOT NULL, -- Array of tech stack
    github_url VARCHAR(500) NULL,
    live_url VARCHAR(500) NULL,
    
    -- Media
    featured_image VARCHAR(500) NOT NULL,
    gallery_images JSON NULL, -- Array of image URLs
    
    -- Content
    detailed_description LONGTEXT NULL,
    challenges TEXT NULL,
    solutions TEXT NULL,
    
    -- Organization
    category VARCHAR(100) NULL,
    status ENUM('active', 'completed', 'archived') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    
    -- Metrics
    view_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_projects_slug (slug),
    INDEX idx_projects_status (status),
    INDEX idx_projects_featured (featured),
    INDEX idx_projects_category (category),
    INDEX idx_projects_created (created_at)
);

-- =====================================================
-- 7. SESSIONS TABLE (User Sessions)
-- =====================================================
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    payload LONGTEXT NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_activity (last_activity)
);

-- =====================================================
-- 8. SETTINGS TABLE (Application Configuration)
-- =====================================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    value LONGTEXT NULL,
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    is_public BOOLEAN DEFAULT FALSE, -- Whether setting can be accessed by frontend
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_settings_key (key_name),
    INDEX idx_settings_public (is_public)
);

-- =====================================================
-- 9. MEDIA_FILES TABLE (File Upload Management)
-- =====================================================
CREATE TABLE media_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- File info
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL, -- in bytes
    
    -- Storage
    storage_path VARCHAR(500) NOT NULL,
    storage_type ENUM('local', 's3', 'cloudinary') DEFAULT 'local',
    
    -- Image-specific (if applicable)
    width INT NULL,
    height INT NULL,
    
    -- Organization
    alt_text VARCHAR(255) NULL,
    caption TEXT NULL,
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    
    -- User who uploaded
    uploaded_by INT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_media_filename (filename),
    INDEX idx_media_type (mime_type),
    INDEX idx_media_uploader (uploaded_by),
    INDEX idx_media_created (created_at)
);

-- =====================================================
-- 9. API_LOGS TABLE (API Request Logging)
-- =====================================================
CREATE TABLE api_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Request details
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    
    -- User context
    user_id INT NULL,
    session_id VARCHAR(128) NULL,
    
    -- Request/Response
    request_body LONGTEXT NULL,
    response_status INT NOT NULL,
    response_time INT NOT NULL, -- in milliseconds
    
    -- Error details (if any)
    error_message TEXT NULL,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_api_logs_endpoint (endpoint(255)),
    INDEX idx_api_logs_status (response_status),
    INDEX idx_api_logs_user (user_id),
    INDEX idx_api_logs_created (created_at),
    INDEX idx_api_logs_ip (ip_address)
);

-- =====================================================
-- 10. SECURITY & INFRASTRUCTURE TABLES
-- =====================================================

-- =====================================================
-- 10.1 ROLES TABLE (Role-Based Access Control)
-- =====================================================
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_roles_name (name),
    INDEX idx_roles_is_active (is_active)
);

-- =====================================================
-- 10.2 PERMISSIONS TABLE (Granular Permissions)
-- =====================================================
CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE KEY unique_resource_action (resource, action),
    
    -- Indexes
    INDEX idx_permissions_resource (resource),
    INDEX idx_permissions_action (action)
);

-- =====================================================
-- 10.3 ROLE_PERMISSIONS TABLE (Role-Permission Junction)
-- =====================================================
CREATE TABLE role_permissions (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    
    -- Conditions (JSON for complex access rules)
    conditions JSON NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    
    -- Indexes
    INDEX idx_role_permissions_role_id (role_id),
    INDEX idx_role_permissions_permission_id (permission_id)
);

-- =====================================================
-- 10.4 USER_ROLES TABLE (User-Role Junction)
-- =====================================================
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    
    -- Assignment metadata
    assigned_by VARCHAR(36) NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint
    UNIQUE KEY unique_user_role (user_id, role_id),
    
    -- Indexes
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role_id (role_id),
    INDEX idx_user_roles_is_active (is_active)
);

-- =====================================================
-- 10.5 USER_SESSIONS TABLE (Enhanced Session Management)
-- =====================================================
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NULL,
    
    -- Session metadata
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    device_fingerprint VARCHAR(255) NULL,
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Security
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    revoked_reason VARCHAR(255) NULL,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_token_hash (token_hash),
    INDEX idx_user_sessions_expires_at (expires_at),
    INDEX idx_user_sessions_is_active (is_active)
);

-- =====================================================
-- 10.6 RATE_LIMITS TABLE (API Rate Limiting)
-- =====================================================
CREATE TABLE rate_limits (
    id VARCHAR(36) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP, user_id, API key, etc.
    endpoint VARCHAR(255) NOT NULL,
    
    -- Rate limit data
    requests_count INT DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_size INT NOT NULL, -- in seconds
    max_requests INT NOT NULL,
    
    -- Status
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE KEY unique_identifier_endpoint (identifier, endpoint),
    
    -- Indexes
    INDEX idx_rate_limits_identifier (identifier),
    INDEX idx_rate_limits_endpoint (endpoint),
    INDEX idx_rate_limits_window_start (window_start),
    INDEX idx_rate_limits_is_blocked (is_blocked)
);

-- =====================================================
-- 10.7 SECURITY_EVENTS TABLE (Security Audit Log)
-- =====================================================
CREATE TABLE security_events (
    id VARCHAR(36) PRIMARY KEY,
    event_type ENUM('login', 'logout', 'login_failed', 'mfa_enabled', 'mfa_disabled', 'password_changed', 'account_locked', 'permission_granted', 'permission_revoked', 'suspicious_activity', 'rate_limit_exceeded', 'security_violation') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Actor information
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(36) NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    
    -- Event details
    resource VARCHAR(255) NULL,
    action VARCHAR(255) NULL,
    outcome ENUM('success', 'failure', 'error') NOT NULL,
    
    -- Additional data
    metadata JSON NULL,
    error_message TEXT NULL,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_security_events_event_type (event_type),
    INDEX idx_security_events_severity (severity),
    INDEX idx_security_events_user_id (user_id),
    INDEX idx_security_events_ip_address (ip_address),
    INDEX idx_security_events_created_at (created_at),
    INDEX idx_security_events_outcome (outcome)
);

-- =====================================================
-- 10.8 THREAT_DETECTIONS TABLE (Threat Detection)
-- =====================================================
CREATE TABLE threat_detections (
    id VARCHAR(36) PRIMARY KEY,
    threat_type ENUM('sql_injection', 'xss', 'csrf', 'brute_force', 'ddos', 'suspicious_behavior', 'malicious_ip', 'anomalous_activity') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    
    -- Source information
    source_ip VARCHAR(45) NOT NULL,
    source_country VARCHAR(2) NULL,
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(36) NULL,
    
    -- Threat details
    endpoint VARCHAR(255) NULL,
    payload TEXT NULL,
    indicators JSON NULL,
    
    -- Response
    status ENUM('detected', 'investigating', 'confirmed', 'false_positive', 'mitigated') DEFAULT 'detected',
    action_taken ENUM('none', 'blocked', 'rate_limited', 'challenged', 'monitored') DEFAULT 'none',
    
    -- Timestamps
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_threat_detections_threat_type (threat_type),
    INDEX idx_threat_detections_severity (severity),
    INDEX idx_threat_detections_source_ip (source_ip),
    INDEX idx_threat_detections_status (status),
    INDEX idx_threat_detections_detected_at (detected_at)
);

-- =====================================================
-- 10.9 IP_REPUTATION TABLE (IP Reputation Management)
-- =====================================================
CREATE TABLE ip_reputation (
    id VARCHAR(36) PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL,
    reputation_score INT NOT NULL, -- -100 to 100
    
    -- Classification
    classification ENUM('trusted', 'neutral', 'suspicious', 'malicious', 'blocked') NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'internal', 'threat_feed', 'manual'
    
    -- Metadata
    country VARCHAR(2) NULL,
    asn VARCHAR(20) NULL,
    organization VARCHAR(255) NULL,
    
    -- Threat indicators
    threat_types JSON NULL,
    last_seen_threat TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_ip_reputation_ip_address (ip_address),
    INDEX idx_ip_reputation_classification (classification),
    INDEX idx_ip_reputation_reputation_score (reputation_score),
    INDEX idx_ip_reputation_country (country)
);

-- =====================================================
-- 10.10 SYSTEM_METRICS TABLE (Infrastructure Monitoring)
-- =====================================================
CREATE TABLE system_metrics (
    id VARCHAR(36) PRIMARY KEY,
    metric_type ENUM('cpu', 'memory', 'disk', 'network', 'application', 'database') NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    
    -- Metric values
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    
    -- Context
    hostname VARCHAR(255) NOT NULL,
    service_name VARCHAR(100) NULL,
    
    -- Additional data
    metadata JSON NULL,
    
    -- Timestamp
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_system_metrics_type (metric_type),
    INDEX idx_system_metrics_name (metric_name),
    INDEX idx_system_metrics_hostname (hostname),
    INDEX idx_system_metrics_recorded_at (recorded_at)
);

-- =====================================================
-- 10.11 ALERTS TABLE (System Alerts)
-- =====================================================
CREATE TABLE alerts (
    id VARCHAR(36) PRIMARY KEY,
    alert_type ENUM('security', 'performance', 'availability', 'capacity', 'compliance') NOT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    
    -- Status
    status ENUM('active', 'acknowledged', 'resolved', 'suppressed') DEFAULT 'active',
    acknowledged_by VARCHAR(36) NULL,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    
    -- Conditions
    condition_data JSON NULL,
    threshold_value DECIMAL(15,4) NULL,
    current_value DECIMAL(15,4) NULL,
    
    -- Notifications
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels JSON NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_alerts_alert_type (alert_type),
    INDEX idx_alerts_severity (severity),
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_created_at (created_at)
);

-- =====================================================
-- 10.12 SSL_CERTIFICATES TABLE (SSL Certificate Management)
-- =====================================================
CREATE TABLE ssl_certificates (
    id VARCHAR(36) PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    subject_alternative_names JSON NULL,
    
    -- Certificate details
    issuer VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    
    -- Validity
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    days_until_expiry INT GENERATED ALWAYS AS (DATEDIFF(valid_to, NOW())) STORED,
    
    -- Status
    status ENUM('active', 'expired', 'revoked', 'pending', 'failed') DEFAULT 'pending',
    auto_renewal BOOLEAN DEFAULT TRUE,
    
    -- Security details
    key_size INT NOT NULL,
    signature_algorithm VARCHAR(100) NOT NULL,
    public_key_algorithm VARCHAR(100) NOT NULL,
    
    -- Certificate data
    certificate_pem TEXT NOT NULL,
    private_key_pem TEXT NULL, -- Encrypted
    certificate_chain_pem TEXT NULL,
    
    -- Renewal tracking
    renewal_attempts INT DEFAULT 0,
    last_renewal_attempt TIMESTAMP NULL,
    next_renewal_date TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_ssl_certificates_domain (domain),
    INDEX idx_ssl_certificates_status (status),
    INDEX idx_ssl_certificates_valid_to (valid_to),
    INDEX idx_ssl_certificates_days_until_expiry (days_until_expiry),
    INDEX idx_ssl_certificates_auto_renewal (auto_renewal)
);

-- =====================================================
-- 11. TESTIMONIALS TABLE (Client Reviews & Feedback)
-- =====================================================
CREATE TABLE testimonials (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Client information
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NULL,
    client_company VARCHAR(255) NULL,
    client_position VARCHAR(255) NULL,
    client_avatar VARCHAR(500) NULL,
    
    -- Testimonial content
    content TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    project_title VARCHAR(255) NULL,
    project_category VARCHAR(100) NULL,
    
    -- Display settings
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    
    -- Metadata
    source VARCHAR(100) DEFAULT 'direct', -- 'direct', 'google', 'linkedin', etc.
    project_id VARCHAR(36) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_testimonials_featured (is_featured),
    INDEX idx_testimonials_approved (is_approved),
    INDEX idx_testimonials_rating (rating),
    INDEX idx_testimonials_company (client_company),
    INDEX idx_testimonials_created (created_at),
    INDEX idx_testimonials_display_order (display_order)
);

-- =====================================================
-- 12. CALL_TRACKING TABLE (Phone Call Analytics)
-- =====================================================
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

-- =====================================================
-- INITIAL DATA INSERTS
-- =====================================================

-- Insert default admin user (password: 'admin123' - CHANGE THIS!)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES 
('admin@iansmith.dev', '$2b$10$rQZ8kHWKQYXHZQXHZQXHZOeJ8kHWKQYXHZQXHZQXHZOeJ8kHWKQYXH', 'Ian', 'Smith', 'super_admin');

-- Insert default settings
INSERT INTO settings (key_name, value, type, description, is_public) VALUES 
('site_name', 'Ian Smith - Elite Engineer', 'string', 'Website name', true),
('site_description', 'Full-stack developer specializing in Laravel and modern web technologies', 'string', 'Site description for SEO', true),
('contact_email', 'leemeeya851@gmail.com', 'string', 'Primary contact email', true),
('phone_number', '+256748550372', 'string', 'Contact phone number', true),
('analytics_enabled', 'true', 'boolean', 'Enable analytics tracking', false),
('maintenance_mode', 'false', 'boolean', 'Site maintenance mode', false),
('call_tracking_enabled', 'true', 'boolean', 'Enable call tracking analytics', false),
('primary_phone', '+256748550372', 'string', 'Primary phone number for tracking', true);

-- =====================================================
-- USEFUL QUERIES FOR DEVELOPMENT
-- =====================================================

-- View all leads with AI analysis
-- SELECT id, name, email, type, status, priority, 
--        JSON_EXTRACT(ai_analysis, '$.summary') as ai_summary,
--        created_at 
-- FROM leads 
-- ORDER BY created_at DESC;

-- Analytics summary by day
-- SELECT DATE(created_at) as date, 
--        COUNT(*) as total_events,
--        COUNT(DISTINCT session_id) as unique_sessions
-- FROM analytics_events 
-- WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- Most popular pages
-- SELECT page_url, COUNT(*) as views
-- FROM analytics_events 
-- WHERE event_type = 'page_view'
-- GROUP BY page_url 
-- ORDER BY views DESC 
-- LIMIT 10;

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Clean old analytics data (older than 1 year)
-- DELETE FROM analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Clean old API logs (older than 3 months)
-- DELETE FROM api_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);

-- Clean old sessions (older than 30 days)
-- DELETE FROM sessions WHERE last_activity < DATE_SUB(NOW(), INTERVAL 30 DAY);