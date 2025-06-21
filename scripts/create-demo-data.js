#!/usr/bin/env node

/**
 * SimpleIT Demo Data Generator
 * Creates comprehensive test data for all system entities
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

class DemoDataGenerator {
  constructor(options = {}) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/simpleit'
    });
    
    this.options = {
      size: options.size || 'medium', // small, medium, large
      verbose: options.verbose || true,
      ...options
    };

    // Data configuration based on size
    this.config = {
      small: { users: 5, employees: 15, assets: 25, tickets: 20, maintenance: 10 },
      medium: { users: 10, employees: 35, assets: 60, tickets: 45, maintenance: 25 },
      large: { users: 20, employees: 75, assets: 150, tickets: 100, maintenance: 50 }
    }[this.options.size];
  }

  log(message) {
    if (this.options.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }

  async createDemoData() {
    try {
      this.log('Starting demo data generation...');
      
      await this.createUsers();
      await this.createEmployees();
      await this.createRequestTypes();
      await this.createAssetData();
      await this.createAssets();
      await this.createTickets();
      await this.createAssetMaintenance();
      await this.createAssetTransactions();
      await this.createActivityLogs();
      
      this.log('Demo data generation completed successfully!');
    } catch (error) {
      console.error('Error generating demo data:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  async createUsers() {
    this.log(`Creating ${this.config.users} demo users...`);
    
    const userTemplates = [
      { username: 'john.doe', email: 'john.doe@eladwysoft.com', role: 'manager', firstName: 'John', lastName: 'Doe' },
      { username: 'jane.smith', email: 'jane.smith@eladwysoft.com', role: 'agent', firstName: 'Jane', lastName: 'Smith' },
      { username: 'mike.wilson', email: 'mike.wilson@eladwysoft.com', role: 'agent', firstName: 'Mike', lastName: 'Wilson' },
      { username: 'sarah.johnson', email: 'sarah.johnson@eladwysoft.com', role: 'employee', firstName: 'Sarah', lastName: 'Johnson' },
      { username: 'david.brown', email: 'david.brown@eladwysoft.com', role: 'employee', firstName: 'David', lastName: 'Brown' },
      { username: 'lisa.davis', email: 'lisa.davis@eladwysoft.com', role: 'manager', firstName: 'Lisa', lastName: 'Davis' },
      { username: 'tom.anderson', email: 'tom.anderson@eladwysoft.com', role: 'agent', firstName: 'Tom', lastName: 'Anderson' },
      { username: 'emma.taylor', email: 'emma.taylor@eladwysoft.com', role: 'employee', firstName: 'Emma', lastName: 'Taylor' },
      { username: 'james.white', email: 'james.white@eladwysoft.com', role: 'employee', firstName: 'James', lastName: 'White' },
      { username: 'anna.clark', email: 'anna.clark@eladwysoft.com', role: 'agent', firstName: 'Anna', lastName: 'Clark' }
    ];

    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    for (let i = 0; i < this.config.users; i++) {
      const template = userTemplates[i % userTemplates.length];
      const userSuffix = i > userTemplates.length - 1 ? `${Math.floor(i / userTemplates.length) + 1}` : '';
      
      await this.pool.query(`
        INSERT INTO users (username, password, email, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (username) DO NOTHING
      `, [
        template.username + userSuffix,
        hashedPassword,
        template.email.replace('@', userSuffix + '@'),
        template.firstName,
        template.lastName,
        template.role,
        true
      ]);
    }
  }

  async createEmployees() {
    this.log(`Creating ${this.config.employees} demo employees...`);
    
    const departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales', 'Support'];
    const positions = [
      'Software Developer', 'System Administrator', 'Network Engineer', 'IT Manager',
      'HR Specialist', 'Accountant', 'Operations Manager', 'Marketing Coordinator',
      'Sales Representative', 'Customer Support', 'Project Manager', 'Business Analyst'
    ];
    
    const employeeNames = [
      'Ahmed Hassan', 'Fatima Ali', 'Omar Mahmoud', 'Aisha Ibrahim', 'Khaled Mohamed',
      'Nour Abdel Rahman', 'Yasmin Farouk', 'Tarek Salim', 'Layla Zaki', 'Hossam Nabil',
      'Rana Mostafa', 'Amr Adel', 'Menna Said', 'Karim Fathy', 'Dina Youssef',
      'Mohamed Ashraf', 'Habiba Wael', 'Yousef Magdy', 'Salma Hany', 'Mahmoud Reda'
    ];

    for (let i = 0; i < this.config.employees; i++) {
      const name = employeeNames[i % employeeNames.length];
      const nameParts = name.split(' ');
      const department = departments[Math.floor(Math.random() * departments.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const employeeId = `EMP${String(i + 1).padStart(5, '0')}`;
      const email = `${name.toLowerCase().replace(' ', '.')}@eladwysoft.com`;
      
      await this.pool.query(`
        INSERT INTO employees (employee_id, name, email, phone, department, position, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (employee_id) DO NOTHING
      `, [
        employeeId,
        name,
        email,
        `+20${Math.floor(Math.random() * 900000000) + 100000000}`,
        department,
        position,
        Math.random() > 0.1 // 90% active
      ]);
    }
  }

  async createRequestTypes() {
    this.log('Creating request types...');
    
    const requestTypes = [
      { name: 'Hardware Issue', description: 'Hardware malfunctions and repair requests' },
      { name: 'Software Installation', description: 'Software installation and configuration requests' },
      { name: 'Network Problem', description: 'Network connectivity and infrastructure issues' },
      { name: 'Access Request', description: 'User access and permission requests' },
      { name: 'Security Incident', description: 'Security incidents and compliance issues' },
      { name: 'Asset Request', description: 'New asset procurement and assignment requests' },
      { name: 'Maintenance', description: 'Scheduled maintenance and preventive care' },
      { name: 'Training Request', description: 'Training and documentation requests' }
    ];

    for (const type of requestTypes) {
      await this.pool.query(`
        INSERT INTO custom_request_types (name, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [type.name, type.description, true]);
    }
  }

  async createAssetData() {
    this.log('Creating asset types, brands, and statuses...');
    
    const assetTypes = [
      { name: 'Laptop', description: 'Portable computers' },
      { name: 'Desktop', description: 'Desktop computers' },
      { name: 'Monitor', description: 'Display monitors' },
      { name: 'Printer', description: 'Printing devices' },
      { name: 'Phone', description: 'IP phones and mobile devices' },
      { name: 'Server', description: 'Server hardware' },
      { name: 'Network Equipment', description: 'Routers, switches, and network devices' }
    ];

    const assetBrands = [
      { name: 'Dell', description: 'Dell Technologies' },
      { name: 'HP', description: 'Hewlett-Packard' },
      { name: 'Lenovo', description: 'Lenovo Group' },
      { name: 'Apple', description: 'Apple Inc.' },
      { name: 'Samsung', description: 'Samsung Electronics' },
      { name: 'Cisco', description: 'Cisco Systems' },
      { name: 'Microsoft', description: 'Microsoft Corporation' }
    ];

    const assetStatuses = [
      { name: 'Available', description: 'Ready for assignment' },
      { name: 'In Use', description: 'Currently assigned and active' },
      { name: 'Under Maintenance', description: 'Being serviced or repaired' },
      { name: 'Retired', description: 'End of life, no longer in use' },
      { name: 'Lost', description: 'Cannot be located' },
      { name: 'Damaged', description: 'Requires repair or replacement' }
    ];

    for (const type of assetTypes) {
      await this.pool.query(`
        INSERT INTO custom_asset_types (name, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [type.name, type.description, true]);
    }

    for (const brand of assetBrands) {
      await this.pool.query(`
        INSERT INTO custom_asset_brands (name, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [brand.name, brand.description, true]);
    }

    for (const status of assetStatuses) {
      await this.pool.query(`
        INSERT INTO custom_asset_statuses (name, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [status.name, status.description, true]);
    }
  }

  async createAssets() {
    this.log(`Creating ${this.config.assets} demo assets...`);
    
    // Get employee IDs for assignment
    const employeesResult = await this.pool.query('SELECT id FROM employees LIMIT 20');
    const employeeIds = employeesResult.rows.map(row => row.id);

    for (let i = 0; i < this.config.assets; i++) {
      const assetId = `SIT-${String(i + 1).padStart(6, '0')}`;
      const types = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Phone'];
      const brands = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung'];
      const statuses = ['Available', 'In Use', 'Under Maintenance'];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const assignedEmployeeId = status === 'In Use' && employeeIds.length > 0 
        ? employeeIds[Math.floor(Math.random() * employeeIds.length)]
        : null;

      await this.pool.query(`
        INSERT INTO assets (
          asset_id, type, brand, model_name, model_number, serial_number, 
          status, specs, purchase_date, buy_price, warranty_end_date, 
          assigned_employee_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (asset_id) DO NOTHING
      `, [
        assetId,
        type,
        brand,
        `${brand} ${type} Model ${i + 1}`,
        `${brand.substring(0, 3).toUpperCase()}${String(i + 1).padStart(4, '0')}`,
        `SN${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
        status,
        this.generateSpecs(type),
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random past date
        Math.floor(Math.random() * 2000) + 500, // $500-$2500
        new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000), // Random future date
        assignedEmployeeId
      ]);
    }
  }

  generateSpecs(type) {
    const specs = {
      'Laptop': ['Intel i5, 8GB RAM, 256GB SSD', 'Intel i7, 16GB RAM, 512GB SSD', 'AMD Ryzen 5, 8GB RAM, 512GB SSD'],
      'Desktop': ['Intel i7, 16GB RAM, 1TB HDD', 'Intel i5, 8GB RAM, 512GB SSD', 'AMD Ryzen 7, 32GB RAM, 1TB SSD'],
      'Monitor': ['24" 1920x1080 LED', '27" 2560x1440 IPS', '32" 4K UHD'],
      'Printer': ['Laser B/W, 30ppm', 'Inkjet Color, 15ppm', 'Multifunction Laser'],
      'Phone': ['VoIP Desk Phone', 'Conference Phone', 'Wireless Headset']
    };
    
    const typeSpecs = specs[type] || ['Standard configuration'];
    return typeSpecs[Math.floor(Math.random() * typeSpecs.length)];
  }

  async createTickets() {
    this.log(`Creating ${this.config.tickets} demo tickets...`);
    
    // Get user and employee IDs
    const usersResult = await this.pool.query('SELECT id FROM users LIMIT 10');
    const employeesResult = await this.pool.query('SELECT id FROM employees LIMIT 10');
    const userIds = usersResult.rows.map(row => row.id);
    const employeeIds = employeesResult.rows.map(row => row.id);

    const ticketTemplates = [
      { summary: 'Computer not starting', description: 'Employee computer fails to boot after power outage', category: 'Hardware', urgency: 'High', impact: 'Medium' },
      { summary: 'Email not working', description: 'Cannot send or receive emails through Outlook', category: 'Software', urgency: 'Medium', impact: 'High' },
      { summary: 'Printer offline', description: 'Office printer showing offline status', category: 'Hardware', urgency: 'Low', impact: 'Low' },
      { summary: 'New employee setup', description: 'Setup workstation for new team member', category: 'Access Request', urgency: 'Medium', impact: 'Medium' },
      { summary: 'WiFi connectivity issues', description: 'Intermittent wireless connection problems', category: 'Network', urgency: 'Medium', impact: 'Medium' },
      { summary: 'Software installation request', description: 'Need Adobe Creative Suite installed', category: 'Software', urgency: 'Low', impact: 'Low' }
    ];

    for (let i = 0; i < this.config.tickets; i++) {
      const template = ticketTemplates[i % ticketTemplates.length];
      const submittedById = userIds[Math.floor(Math.random() * userIds.length)];
      const assignedToId = Math.random() > 0.3 ? userIds[Math.floor(Math.random() * userIds.length)] : null;
      const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      
      await this.pool.query(`
        INSERT INTO tickets (
          summary, description, category, request_type, urgency, impact, priority,
          status, submitted_by_id, assigned_to_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        `${template.summary} #${i + 1}`,
        template.description,
        template.category,
        'Incident',
        template.urgency,
        template.impact,
        priorities[Math.floor(Math.random() * priorities.length)],
        statuses[Math.floor(Math.random() * statuses.length)],
        submittedById,
        assignedToId
      ]);
    }
  }

  async createAssetMaintenance() {
    this.log(`Creating ${this.config.maintenance} maintenance records...`);
    
    const assetsResult = await this.pool.query('SELECT id FROM assets LIMIT 20');
    const assetIds = assetsResult.rows.map(row => row.id);

    for (let i = 0; i < this.config.maintenance && i < assetIds.length; i++) {
      const assetId = assetIds[i];
      const types = ['Preventive', 'Corrective', 'Emergency'];
      const statuses = ['Scheduled', 'In Progress', 'Completed'];
      
      await this.pool.query(`
        INSERT INTO asset_maintenance (
          asset_id, maintenance_type, description, scheduled_date, 
          status, cost, performed_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        assetId,
        types[Math.floor(Math.random() * types.length)],
        `Routine maintenance for asset #${assetId}`,
        new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Next 30 days
        statuses[Math.floor(Math.random() * statuses.length)],
        Math.floor(Math.random() * 500) + 50, // $50-$550
        'IT Maintenance Team'
      ]);
    }
  }

  async createAssetTransactions() {
    this.log('Creating asset transaction records...');
    
    const assetsResult = await this.pool.query('SELECT id FROM assets LIMIT 15');
    const assetIds = assetsResult.rows.map(row => row.id);

    for (let i = 0; i < Math.min(10, assetIds.length); i++) {
      const assetId = assetIds[i];
      const types = ['Purchase', 'Transfer', 'Assignment', 'Return'];
      
      await this.pool.query(`
        INSERT INTO asset_transactions (
          asset_id, transaction_type, description, transaction_date,
          amount, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        assetId,
        types[Math.floor(Math.random() * types.length)],
        `Asset ${types[Math.floor(Math.random() * types.length)].toLowerCase()} transaction`,
        new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
        Math.floor(Math.random() * 1000) + 100 // $100-$1100
      ]);
    }
  }

  async createActivityLogs() {
    this.log('Creating activity log entries...');
    
    const usersResult = await this.pool.query('SELECT id FROM users LIMIT 5');
    const userIds = usersResult.rows.map(row => row.id);

    const activities = [
      { action: 'CREATE', entityType: 'ASSET', details: { action: 'Created new asset' } },
      { action: 'UPDATE', entityType: 'EMPLOYEE', details: { action: 'Updated employee information' } },
      { action: 'DELETE', entityType: 'TICKET', details: { action: 'Resolved and closed ticket' } },
      { action: 'LOGIN', entityType: 'USER', details: { action: 'User login' } },
      { action: 'CONFIG_CHANGE', entityType: 'SYSTEM_CONFIG', details: { action: 'Updated system configuration' } }
    ];

    for (let i = 0; i < 25; i++) {
      const activity = activities[i % activities.length];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      
      await this.pool.query(`
        INSERT INTO activity_log (
          user_id, action, entity_type, entity_id, details, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        userId,
        activity.action,
        activity.entityType,
        Math.floor(Math.random() * 100) + 1,
        JSON.stringify(activity.details)
      ]);
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const size = args.includes('--large') ? 'large' : args.includes('--small') ? 'small' : 'medium';
  const verbose = !args.includes('--quiet');

  console.log(`SimpleIT Demo Data Generator`);
  console.log(`Size: ${size}, Verbose: ${verbose}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Using default localhost'}`);
  console.log(`---`);

  const generator = new DemoDataGenerator({ size, verbose });
  
  try {
    await generator.createDemoData();
    console.log('\n✅ Demo data generation completed successfully!');
    console.log('\nGenerated data:');
    console.log(`- ${generator.config.users} users`);
    console.log(`- ${generator.config.employees} employees`);
    console.log(`- ${generator.config.assets} assets`);
    console.log(`- ${generator.config.tickets} tickets`);
    console.log(`- ${generator.config.maintenance} maintenance records`);
    console.log('\nLogin with any demo user using password: demo123');
  } catch (error) {
    console.error('\n❌ Demo data generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DemoDataGenerator };