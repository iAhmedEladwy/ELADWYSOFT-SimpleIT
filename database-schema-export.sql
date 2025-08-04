-- COMPLETE DATABASE SCHEMA EXPORT FROM REPLIT POSTGRESQL
-- Generated: $(date)
-- Total Tables: 25

-- =====================================================
-- ENUMS AND CUSTOM TYPES
-- =====================================================

-- Create custom enum types
CREATE TYPE maintenance_type AS ENUM ('Preventive', 'Corrective', 'Emergency');
CREATE TYPE asset_status AS ENUM ('Available', 'Assigned', 'Under Maintenance', 'Disposed', 'Lost', 'Retired');
CREATE TYPE employee_status AS ENUM ('Active', 'Inactive', 'Terminated');
CREATE TYPE employment_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Temporary');
CREATE TYPE upgrade_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE upgrade_risk AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE upgrade_status AS ENUM ('Planned', 'In Progress', 'Completed', 'Cancelled', 'Failed');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_image_url VARCHAR(500),
    employee_id INTEGER,
    manager_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- System Configuration
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    language VARCHAR(10) NOT NULL DEFAULT 'English',
    asset_id_prefix VARCHAR(10) NOT NULL DEFAULT 'SIT-',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    emp_id_prefix VARCHAR(10) NOT NULL DEFAULT 'EMP-',
    ticket_id_prefix VARCHAR(10) NOT NULL DEFAULT 'TKT-',
    departments TEXT[],
    email_host VARCHAR(100),
    email_port INTEGER,
    email_user VARCHAR(100),
    email_password VARCHAR(100),
    email_from_address VARCHAR(100),
    email_from_name VARCHAR(100),
    email_secure BOOLEAN DEFAULT true,
    employee_id_prefix VARCHAR(10) DEFAULT 'EMP',
    company_name VARCHAR(255) DEFAULT 'ELADWYSOFT',
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(100),
    company_website VARCHAR(255),
    default_currency VARCHAR(10) DEFAULT 'USD',
    enable_audit_logs BOOLEAN DEFAULT true,
    audit_log_retention_days INTEGER DEFAULT 365
);

-- Employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(20) NOT NULL DEFAULT concat('EMP-', lpad((nextval('employees_id_seq'::regclass))::text, 5, '0'::text)),
    english_name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(100),
    department VARCHAR(100) NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    direct_manager INTEGER REFERENCES employees(id),
    employment_type employment_type NOT NULL,
    joining_date DATE NOT NULL,
    exit_date DATE,
    status employee_status NOT NULL DEFAULT 'Active',
    personal_mobile VARCHAR(20),
    work_mobile VARCHAR(20),
    personal_email VARCHAR(100),
    corporate_email VARCHAR(100),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    position VARCHAR(100),
    UNIQUE(emp_id)
);

-- Assets table
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(20) NOT NULL DEFAULT concat('AST-', lpad((nextval('assets_id_seq'::regclass))::text, 5, '0'::text)),
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model_number VARCHAR(100),
    model_name VARCHAR(100),
    serial_number VARCHAR(100) NOT NULL,
    specs TEXT,
    status asset_status NOT NULL DEFAULT 'Available',
    purchase_date DATE,
    buy_price NUMERIC(10,2),
    warranty_expiry_date DATE,
    life_span INTEGER,
    out_of_box_os VARCHAR(100),
    assigned_employee_id INTEGER REFERENCES employees(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    cpu VARCHAR(200),
    ram VARCHAR(100),
    storage VARCHAR(200),
    UNIQUE(asset_id)
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(20) NOT NULL DEFAULT concat('TKT-', lpad((nextval('tickets_id_seq'::regclass))::text, 5, '0'::text)),
    summary VARCHAR(255) NOT NULL,
    description TEXT,
    request_type VARCHAR(100) NOT NULL DEFAULT 'Hardware',
    category VARCHAR(50),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    submitted_by_id INTEGER NOT NULL REFERENCES employees(id),
    related_asset_id INTEGER REFERENCES assets(id),
    assigned_to_id INTEGER REFERENCES users(id),
    urgency VARCHAR(20),
    impact VARCHAR(20),
    resolution_notes TEXT,
    time_spent INTEGER DEFAULT 0,
    attachments TEXT[],
    due_date TIMESTAMP WITHOUT TIME ZONE,
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    closed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    merged_into_id INTEGER REFERENCES tickets(id),
    UNIQUE(ticket_id)
);

-- =====================================================
-- SUPPORTING TABLES
-- =====================================================

-- Custom Asset Types
CREATE TABLE custom_asset_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(name)
);

-- Custom Asset Brands
CREATE TABLE custom_asset_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(name)
);

-- Custom Asset Statuses
CREATE TABLE custom_asset_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    color VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(name)
);

-- Custom Request Types
CREATE TABLE custom_request_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    priority VARCHAR(20) DEFAULT 'Medium',
    sla_hours INTEGER DEFAULT 24,
    UNIQUE(name)
);

-- Service Providers
CREATE TABLE service_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(255),
    service_type VARCHAR(100),
    contract_start_date TIMESTAMP WITHOUT TIME ZONE,
    contract_end_date TIMESTAMP WITHOUT TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(name)
);

-- =====================================================
-- TRANSACTION AND MAINTENANCE TABLES
-- =====================================================

-- Asset Maintenance
CREATE TABLE asset_maintenance (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(10,2) DEFAULT 0,
    provider_type VARCHAR(50) NOT NULL,
    provider_name VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    type maintenance_type NOT NULL DEFAULT 'Preventive'
);

-- Asset Transactions
CREATE TABLE asset_transactions (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    type VARCHAR(50) NOT NULL,
    employee_id INTEGER REFERENCES employees(id),
    transaction_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    expected_return_date TIMESTAMP WITHOUT TIME ZONE,
    actual_return_date TIMESTAMP WITHOUT TIME ZONE,
    condition_notes TEXT,
    handled_by_id INTEGER REFERENCES users(id),
    attachments TEXT[],
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    device_specs JSONB
);

-- Asset Service Providers (Junction table)
CREATE TABLE asset_service_providers (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    service_provider_id INTEGER NOT NULL REFERENCES service_providers(id),
    start_date TIMESTAMP WITHOUT TIME ZONE,
    end_date TIMESTAMP WITHOUT TIME ZONE,
    contract_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Asset Sales
CREATE TABLE asset_sales (
    id SERIAL PRIMARY KEY,
    buyer VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Asset Sale Items
CREATE TABLE asset_sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES asset_sales(id),
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- UPGRADE AND CHANGE MANAGEMENT
-- =====================================================

-- Asset Upgrades
CREATE TABLE asset_upgrades (
    id SERIAL PRIMARY KEY,
    upgrade_id VARCHAR(20) NOT NULL,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    requested_by_id INTEGER NOT NULL REFERENCES users(id),
    approved_by_id INTEGER REFERENCES users(id),
    implemented_by_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    business_justification TEXT NOT NULL,
    upgrade_type VARCHAR(100) NOT NULL,
    priority upgrade_priority NOT NULL DEFAULT 'Medium',
    risk upgrade_risk NOT NULL DEFAULT 'Medium',
    status upgrade_status NOT NULL DEFAULT 'Planned',
    current_configuration JSONB,
    new_configuration JSONB,
    planned_start_date TIMESTAMP WITHOUT TIME ZONE,
    planned_end_date TIMESTAMP WITHOUT TIME ZONE,
    actual_start_date TIMESTAMP WITHOUT TIME ZONE,
    actual_end_date TIMESTAMP WITHOUT TIME ZONE,
    implementation_notes TEXT,
    testing_required BOOLEAN DEFAULT true,
    testing_notes TEXT,
    backout_plan TEXT NOT NULL,
    estimated_cost NUMERIC(10,2) DEFAULT 0,
    actual_cost NUMERIC(10,2) DEFAULT 0,
    cost_justification TEXT,
    impact_assessment TEXT NOT NULL,
    dependent_assets TEXT[],
    affected_users TEXT[],
    downtime_required BOOLEAN DEFAULT false,
    estimated_downtime INTEGER,
    requires_approval BOOLEAN DEFAULT true,
    approval_date TIMESTAMP WITHOUT TIME ZONE,
    approval_notes TEXT,
    success_criteria TEXT NOT NULL,
    verification_steps TEXT[],
    post_upgrade_validation TEXT,
    rollback_required BOOLEAN DEFAULT false,
    rollback_date TIMESTAMP WITHOUT TIME ZONE,
    rollback_reason TEXT,
    rollback_notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    UNIQUE(upgrade_id)
);

-- Upgrade History
CREATE TABLE upgrade_history (
    id SERIAL PRIMARY KEY,
    upgrade_id INTEGER NOT NULL REFERENCES asset_upgrades(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    "timestamp" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

-- Changes Log
CREATE TABLE changes_log (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    technical_details TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    author VARCHAR(100) NOT NULL DEFAULT 'System Administrator',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TICKET MANAGEMENT
-- =====================================================

-- Ticket Comments
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Ticket History
CREATE TABLE ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- AUDIT AND NOTIFICATIONS
-- =====================================================

-- Activity Log
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSON,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    entity_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =====================================================
-- AUTHENTICATION AND SECURITY
-- =====================================================

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    used BOOLEAN DEFAULT false,
    UNIQUE(token)
);

-- Security Questions
CREATE TABLE security_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Sessions (for express-session)
CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Asset Upgrades indexes
CREATE INDEX idx_asset_upgrades_asset_id ON asset_upgrades(asset_id);
CREATE INDEX idx_asset_upgrades_requested_by ON asset_upgrades(requested_by_id);
CREATE INDEX idx_asset_upgrades_status ON asset_upgrades(status);

-- Upgrade History indexes
CREATE INDEX idx_upgrade_history_upgrade_id ON upgrade_history(upgrade_id);
CREATE INDEX idx_upgrade_history_timestamp ON upgrade_history("timestamp");

-- Sessions indexes
CREATE INDEX idx_session_expire ON sessions(expire);
CREATE INDEX "IDX_session_expire" ON sessions(expire);

-- =====================================================
-- INITIAL DATA SEEDING (Optional)
-- =====================================================

-- Insert default system configuration
INSERT INTO system_config (language, asset_id_prefix, emp_id_prefix, ticket_id_prefix, company_name) 
VALUES ('English', 'AST-', 'EMP-', 'TKT-', 'ELADWYSOFT')
ON CONFLICT (id) DO NOTHING;

-- Insert default custom request types
INSERT INTO custom_request_types (name, description, color, priority) VALUES
('Hardware', 'Hardware related requests', '#DC2626', 'Medium'),
('Software', 'Software related requests', '#2563EB', 'Medium'),
('Network', 'Network related requests', '#7C3AED', 'High'),
('Security', 'Security related requests', '#DC2626', 'High'),
('Access', 'Access and permissions requests', '#059669', 'Medium')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total Tables: 25
-- - Core tables: users, employees, assets, tickets
-- - Configuration: system_config, custom_* tables  
-- - Transactions: asset_maintenance, asset_transactions, asset_sales
-- - Upgrades: asset_upgrades, upgrade_history
-- - Tickets: ticket_comments, ticket_history
-- - Audit: activity_log, notifications
-- - Security: password_reset_tokens, security_questions, sessions
-- - Changes: changes_log
-- - Service providers: service_providers, asset_service_providers