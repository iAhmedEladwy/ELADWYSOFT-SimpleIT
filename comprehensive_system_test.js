#!/usr/bin/env node

/**
 * Comprehensive SimpleIT System Test Suite
 * Tests all modules and functionality including CRUD operations, imports, exports, and data integrity
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_COOKIE_FILE = 'test_cookies.txt';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class SystemTester {
  constructor() {
    this.testResults = [];
    this.cookies = '';
    this.authenticated = false;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    
    let curlCommand = `curl -s -X ${method} "${url}"`;
    
    if (this.cookies) {
      curlCommand += ` -b "${TEST_COOKIE_FILE}"`;
    }
    
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        curlCommand += ` -H "${key}: ${value}"`;
      });
    }
    
    if (options.body) {
      curlCommand += ` -d '${JSON.stringify(options.body)}'`;
    }
    
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          // If not JSON, return raw text
          resolve(stdout);
        }
      });
    });
  }

  recordTest(testName, success, details = '') {
    this.testResults.push({
      name: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = success ? '✓' : '✗';
    const color = success ? 'green' : 'red';
    this.log(`${status} ${testName} ${details}`, color);
  }

  async authenticate() {
    try {
      this.log('🔐 Authenticating as admin...', 'cyan');
      const result = await this.makeRequest('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { username: 'admin', password: 'admin123' }
      });
      
      if (result.message && result.message.includes('successful')) {
        this.authenticated = true;
        this.cookies = TEST_COOKIE_FILE;
        this.recordTest('Authentication', true, 'Admin login successful');
        return true;
      } else {
        this.recordTest('Authentication', false, 'Login failed');
        return false;
      }
    } catch (error) {
      this.recordTest('Authentication', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testSystemStatus() {
    this.log('\n📊 Testing System Status...', 'magenta');
    
    try {
      const status = await this.makeRequest('/api/system-status');
      this.recordTest('System Status Check', 
        status.initialized && status.config, 
        `Initialized: ${status.initialized}, Config: ${status.config}`);
      
      const config = await this.makeRequest('/api/system-config');
      this.recordTest('System Configuration', 
        config.id !== undefined, 
        `Language: ${config.language}, Asset Prefix: ${config.assetIdPrefix}`);
      
      const dashboard = await this.makeRequest('/api/dashboard/summary');
      this.recordTest('Dashboard Summary', 
        dashboard.counts !== undefined,
        `Employees: ${dashboard.counts?.employees}, Assets: ${dashboard.counts?.assets}, Tickets: ${dashboard.counts?.activeTickets}`);
        
    } catch (error) {
      this.recordTest('System Status Check', false, `Error: ${error.message}`);
    }
  }

  async testEmployeeOperations() {
    this.log('\n👥 Testing Employee Operations...', 'magenta');
    
    try {
      // Test GET all employees
      const employees = await this.makeRequest('/api/employees');
      this.recordTest('Employee List Retrieval', 
        Array.isArray(employees) && employees.length > 0,
        `Found ${employees.length} employees`);
      
      if (employees.length > 0) {
        const employee = employees[0];
        
        // Test GET single employee
        const singleEmployee = await this.makeRequest(`/api/employees/${employee.id}`);
        this.recordTest('Single Employee Retrieval',
          singleEmployee.id === employee.id,
          `Retrieved employee: ${singleEmployee.englishName || singleEmployee.name}`);
        
        // Test UPDATE employee
        const updateData = {
          englishName: `${employee.englishName || employee.name} - Test Updated`,
          department: employee.department
        };
        
        const updated = await this.makeRequest(`/api/employees/${employee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: updateData
        });
        
        this.recordTest('Employee Update', 
          updated.englishName && updated.englishName.includes('Test Updated'),
          `Updated name to: ${updated.englishName}`);
      }
      
      // Test CREATE new employee
      const newEmployee = {
        englishName: 'Test Employee',
        department: 'IT',
        title: 'Test Position',
        employmentType: 'Full-time',
        status: 'Active',
        idNumber: `TEST${Date.now()}`,
        joiningDate: new Date().toISOString().split('T')[0]
      };
      
      const created = await this.makeRequest('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: newEmployee
      });
      
      this.recordTest('Employee Creation',
        created.id !== undefined,
        `Created employee with ID: ${created.empId || created.id}`);
      
    } catch (error) {
      this.recordTest('Employee Operations', false, `Error: ${error.message}`);
    }
  }

  async testAssetOperations() {
    this.log('\n💻 Testing Asset Operations...', 'magenta');
    
    try {
      // Test GET all assets
      const assets = await this.makeRequest('/api/assets');
      this.recordTest('Asset List Retrieval',
        Array.isArray(assets) && assets.length > 0,
        `Found ${assets.length} assets`);
      
      if (assets.length > 0) {
        const asset = assets[0];
        
        // Test GET single asset
        const singleAsset = await this.makeRequest(`/api/assets/${asset.id}`);
        this.recordTest('Single Asset Retrieval',
          singleAsset.id === asset.id,
          `Retrieved asset: ${singleAsset.assetId} - ${singleAsset.type}`);
        
        // Test UPDATE asset
        const updateData = {
          type: asset.type,
          brand: asset.brand,
          serialNumber: asset.serialNumber,
          status: 'Maintenance' // Change status for testing
        };
        
        const updated = await this.makeRequest(`/api/assets/${asset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: updateData
        });
        
        this.recordTest('Asset Update',
          updated.status === 'Maintenance',
          `Updated status to: ${updated.status}`);
      }
      
      // Test CREATE new asset
      const newAsset = {
        type: 'Desktop',
        brand: 'Test Brand',
        serialNumber: `TEST${Date.now()}`,
        status: 'Available'
      };
      
      const created = await this.makeRequest('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: newAsset
      });
      
      this.recordTest('Asset Creation',
        created.id !== undefined,
        `Created asset with ID: ${created.assetId || created.id}`);
      
    } catch (error) {
      this.recordTest('Asset Operations', false, `Error: ${error.message}`);
    }
  }

  async testTicketOperations() {
    this.log('\n🎫 Testing Ticket Operations...', 'magenta');
    
    try {
      // Test GET all tickets
      const tickets = await this.makeRequest('/api/tickets');
      this.recordTest('Ticket List Retrieval',
        Array.isArray(tickets) && tickets.length >= 0,
        `Found ${tickets.length} tickets`);
      
      // Get employees for ticket creation
      const employees = await this.makeRequest('/api/employees');
      
      if (employees.length > 0) {
        const employee = employees[0];
        
        // Test CREATE new ticket
        const newTicket = {
          summary: 'Test Ticket - System Testing',
          description: 'This is a test ticket created during system testing',
          requestType: 'Hardware',
          priority: 'Medium',
          status: 'Open',
          submittedById: employee.id,
          category: 'Incident'
        };
        
        const created = await this.makeRequest('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: newTicket
        });
        
        this.recordTest('Ticket Creation',
          created.id !== undefined,
          `Created ticket with ID: ${created.ticketId || created.id}`);
        
        if (created.id) {
          // Test UPDATE ticket
          const updateData = {
            summary: created.summary,
            description: created.description,
            priority: 'High', // Change priority for testing
            status: 'In Progress'
          };
          
          const updated = await this.makeRequest(`/api/tickets/${created.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: updateData
          });
          
          this.recordTest('Ticket Update',
            updated.priority === 'High',
            `Updated priority to: ${updated.priority}`);
        }
      }
      
    } catch (error) {
      this.recordTest('Ticket Operations', false, `Error: ${error.message}`);
    }
  }

  async testTemplateDownloads() {
    this.log('\n📄 Testing Template Downloads...', 'magenta');
    
    const entities = ['employees', 'assets', 'tickets'];
    
    for (const entity of entities) {
      try {
        const { exec } = require('child_process');
        const command = `curl -s -b ${TEST_COOKIE_FILE} "${BASE_URL}/api/${entity}/template" | head -2`;
        
        const result = await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(stdout);
          });
        });
        
        const hasValidCSV = result.includes('*') && result.includes(',') && !result.includes('<html>');
        this.recordTest(`${entity.charAt(0).toUpperCase() + entity.slice(1)} Template Download`,
          hasValidCSV,
          hasValidCSV ? 'CSV template downloaded successfully' : 'Invalid template format');
        
      } catch (error) {
        this.recordTest(`${entity} Template Download`, false, `Error: ${error.message}`);
      }
    }
  }

  async testDataExports() {
    this.log('\n📤 Testing Data Exports...', 'magenta');
    
    const entities = ['employees', 'assets', 'tickets'];
    
    for (const entity of entities) {
      try {
        const { exec } = require('child_process');
        const command = `curl -s -b ${TEST_COOKIE_FILE} "${BASE_URL}/api/${entity}/export" | head -2`;
        
        const result = await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(stdout);
          });
        });
        
        const hasValidCSV = result.includes(',') && !result.includes('<html>') && !result.includes('message');
        this.recordTest(`${entity.charAt(0).toUpperCase() + entity.slice(1)} Data Export`,
          hasValidCSV,
          hasValidCSV ? 'Data export completed successfully' : 'Export failed or returned invalid format');
        
      } catch (error) {
        this.recordTest(`${entity} Data Export`, false, `Error: ${error.message}`);
      }
    }
  }

  async testUserManagement() {
    this.log('\n👤 Testing User Management...', 'magenta');
    
    try {
      // Test GET current user
      const currentUser = await this.makeRequest('/api/me');
      this.recordTest('Current User Info',
        currentUser.id !== undefined,
        `Current user: ${currentUser.username} (${currentUser.role})`);
      
      // Test GET all users
      const users = await this.makeRequest('/api/users');
      this.recordTest('User List Retrieval',
        Array.isArray(users) && users.length > 0,
        `Found ${users.length} users`);
      
    } catch (error) {
      this.recordTest('User Management', false, `Error: ${error.message}`);
    }
  }

  async testSearchAndFiltering() {
    this.log('\n🔍 Testing Search and Filtering...', 'magenta');
    
    try {
      // Test employee search
      const employees = await this.makeRequest('/api/employees?search=test');
      this.recordTest('Employee Search',
        Array.isArray(employees),
        `Search returned ${employees.length} results`);
      
      // Test asset filtering
      const assets = await this.makeRequest('/api/assets?status=Available');
      this.recordTest('Asset Filtering',
        Array.isArray(assets),
        `Filter returned ${assets.length} available assets`);
      
      // Test ticket filtering
      const tickets = await this.makeRequest('/api/tickets?status=Open');
      this.recordTest('Ticket Filtering',
        Array.isArray(tickets),
        `Filter returned ${tickets.length} open tickets`);
      
    } catch (error) {
      this.recordTest('Search and Filtering', false, `Error: ${error.message}`);
    }
  }

  generateReport() {
    this.log('\n📋 Test Results Summary', 'cyan');
    this.log('=' .repeat(60), 'cyan');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.success).length;
    const failedTests = totalTests - passedTests;
    
    this.log(`Total Tests: ${totalTests}`, 'blue');
    this.log(`Passed: ${passedTests}`, 'green');
    this.log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
      failedTests === 0 ? 'green' : 'yellow');
    
    this.log('\n📝 Detailed Results:', 'cyan');
    this.testResults.forEach((test, index) => {
      const status = test.success ? '✓' : '✗';
      const color = test.success ? 'green' : 'red';
      this.log(`${index + 1}. ${status} ${test.name} - ${test.details}`, color);
    });
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: ((passedTests / totalTests) * 100).toFixed(1)
      },
      tests: this.testResults
    };
    
    fs.writeFileSync('comprehensive_test_results.json', JSON.stringify(report, null, 2));
    this.log('\n💾 Detailed results saved to comprehensive_test_results.json', 'cyan');
    
    return failedTests === 0;
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive SimpleIT System Test Suite', 'cyan');
    this.log('=' .repeat(60), 'cyan');
    
    // Authentication is required for all tests
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      this.log('❌ Authentication failed. Cannot proceed with tests.', 'red');
      return false;
    }
    
    // Run all test suites
    await this.testSystemStatus();
    await this.testEmployeeOperations();
    await this.testAssetOperations();
    await this.testTicketOperations();
    await this.testTemplateDownloads();
    await this.testDataExports();
    await this.testUserManagement();
    await this.testSearchAndFiltering();
    
    // Generate final report
    const allTestsPassed = this.generateReport();
    
    if (allTestsPassed) {
      this.log('\n🎉 All tests passed! SimpleIT system is functioning correctly.', 'green');
    } else {
      this.log('\n⚠️  Some tests failed. Please review the results above.', 'yellow');
    }
    
    return allTestsPassed;
  }
}

// Run the tests
const tester = new SystemTester();
tester.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});