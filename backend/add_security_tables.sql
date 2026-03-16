-- =====================================================
-- Add Missing Security Tables to Ian Smith Portfolio Database
-- =====================================================

USE iansmith_portfolio;

-- =====================================================
-- 1. USER_ROLES TABLE (User-Role Junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT(11) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    
    -- Assignment metadata
    assigned_by INT(11) NULL,
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
-- 2. USER_SESSIONS TABLE (Enhanced Session Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT(11) NOT NULL,
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
-- 3. SECURITY_EVENTS TABLE (Security Audit Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(36) PRIMARY KEY,
    event_type ENUM('login', 'logout', 'login_failed', 'mfa_enabled', 'mfa_disabled', 'password_changed', 'account_locked', 'permission_granted', 'permission_revoked', 'suspicious_activity', 'rate_limit_exceeded', 'security_violation') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    
    -- Actor information
    user_id INT(11) NULL,
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
-- 4. THREAT_DETECTIONS TABLE (Threat Detection)
-- =====================================================
CREATE TABLE IF NOT EXISTS threat_detections (
    id VARCHAR(36) PRIMARY KEY,
    threat_type ENUM('sql_injection', 'xss', 'csrf', 'brute_force', 'ddos', 'suspicious_behavior', 'malicious_ip', 'anomalous_activity') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    
    -- Source information
    source_ip VARCHAR(45) NOT NULL,
    source_country VARCHAR(2) NULL,
    user_id INT(11) NULL,
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
-- 5. ALERTS TABLE (System Alerts)
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    alert_type ENUM('security', 'performance', 'availability', 'capacity', 'compliance') NOT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    
    -- Status
    status ENUM('active', 'acknowledged', 'resolved', 'suppressed') DEFAULT 'active',
    acknowledged_by INT(11) NULL,
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
-- 6. SSL_CERTIFICATES TABLE (SSL Certificate Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS ssl_certificates (
    id VARCHAR(36) PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    subject_alternative_names JSON NULL,
    
    -- Certificate details
    issuer VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    
    -- Validity
    valid_from DATETIME NOT NULL,
    valid_to DATETIME NOT NULL,
    days_until_expiry INT NULL,
    
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
    last_renewal_attempt DATETIME NULL,
    next_renewal_date DATETIME NULL,
    
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
-- INSERT DEFAULT SECURITY DATA
-- =====================================================

-- Insert default roles if they don't exist
INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES 
(UUID(), 'super_admin', 'Super Administrator with full system access', TRUE),
(UUID(), 'admin', 'Administrator with management access', TRUE),
(UUID(), 'user', 'Regular user with basic access', TRUE),
(UUID(), 'client', 'Client with project access', TRUE),
(UUID(), 'guest', 'Guest with read-only access', TRUE);

-- Insert default permissions if they don't exist
INSERT IGNORE INTO permissions (id, resource, action, description) VALUES 
(UUID(), 'users', 'create', 'Create new users'),
(UUID(), 'users', 'read', 'View user information'),
(UUID(), 'users', 'update', 'Update user information'),
(UUID(), 'users', 'delete', 'Delete users'),
(UUID(), 'leads', 'create', 'Create new leads'),
(UUID(), 'leads', 'read', 'View leads'),
(UUID(), 'leads', 'update', 'Update leads'),
(UUID(), 'leads', 'delete', 'Delete leads'),
(UUID(), 'projects', 'create', 'Create new projects'),
(UUID(), 'projects', 'read', 'View projects'),
(UUID(), 'projects', 'update', 'Update projects'),
(UUID(), 'projects', 'delete', 'Delete projects'),
(UUID(), 'analytics', 'read', 'View analytics data'),
(UUID(), 'settings', 'read', 'View system settings'),
(UUID(), 'settings', 'update', 'Update system settings'),
(UUID(), 'security', 'manage', 'Manage security settings');

-- Grant super_admin all permissions
INSERT IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin';

-- Grant admin basic management permissions
INSERT IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
AND p.resource IN ('leads', 'projects', 'analytics', 'settings')
AND p.action != 'delete';

-- Grant user basic read permissions
INSERT IGNORE INTO role_permissions (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user' 
AND p.resource IN ('projects')
AND p.action = 'read';

COMMIT;