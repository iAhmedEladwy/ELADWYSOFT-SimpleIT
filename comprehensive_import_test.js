#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'simpleit-emergency-2025'
};

let authCookie = '';

// Helper function to authenticate
async function authenticate() {
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(LOGIN_CREDENTIALS)
    });
    
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      authCookie = cookies.split(';')[0];
    }
    
    console.log('✓ Authentication successful');
    return response.ok;
  } catch (error) {
    console.error('✗ Authentication failed:', error.message);
    return false;
  }
}

// Helper function to upload and test import
async function testImport(entityType, csvFileName, testName) {
  console.log(`\n=== Testing ${testName} ===`);
  
  try {
    // Check if CSV file exists
    if (!fs.existsSync(csvFileName)) {
      console.error(`✗ CSV file not found: ${csvFileName}`);
      return false;
    }
    
    // Read CSV file
    const csvData = fs.readFileSync(csvFileName, 'utf8');
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    console.log(`📄 File: ${csvFileName}`);
    console.log(`📊 Headers: ${headers.join(', ')}`);
    console.log(`📈 Data rows: ${lines.length - 1}`);
    
    // Parse CSV data
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      data.push(row);
    }
    
    // Create sample field mapping based on entity type
    let mapping = {};
    
    switch (entityType) {
      case 'employees':
        mapping = {
          englishName: 'English Name',
          arabicName: 'Arabic Name',
          department: 'Department',
          email: 'Email',
          title: 'Title',
          employmentType: 'Employment Type',
          joiningDate: 'Joining Date',
          status: 'Status',
          personalMobile: 'Personal Mobile',
          personalEmail: 'Personal Email'
        };
        break;
        
      case 'assets':
        mapping = {
          type: 'Type',
          brand: 'Brand',
          modelNumber: 'Model Number',
          modelName: 'Model Name',
          serialNumber: 'Serial Number',
          specs: 'Specifications',
          cpu: 'CPU',
          ram: 'RAM',
          storage: 'Storage',
          status: 'Status',
          purchaseDate: 'Purchase Date',
          buyPrice: 'Buy Price',
          warrantyExpiryDate: 'Warranty Expiry Date',
          lifeSpan: 'Life Span',
          outOfBoxOs: 'Out of Box OS',
          assignedEmployeeId: 'Assigned Employee ID'
        };
        break;
        
      case 'tickets':
        mapping = {
          summary: 'Summary',
          description: 'Description',
          category: 'Category',
          requestType: 'Request Type',
          urgency: 'Urgency',
          impact: 'Impact',
          priority: 'Priority',
          status: 'Status'
        };
        break;
    }
    
    console.log(`🔗 Field mapping created with ${Object.keys(mapping).length} fields`);
    
    // Test the import process endpoint
    const importResponse = await fetch(`${BASE_URL}/api/import/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        entityType,
        data,
        mapping
      })
    });
    
    const result = await importResponse.json();
    
    if (importResponse.ok) {
      console.log('✓ Import successful!');
      console.log(`📊 Results: ${result.imported}/${result.total} imported successfully`);
      if (result.failed > 0) {
        console.log(`⚠️  Failed: ${result.failed}`);
        console.log('❌ Errors:', result.errors);
      }
      return true;
    } else {
      console.error('✗ Import failed:', result);
      return false;
    }
    
  } catch (error) {
    console.error(`✗ Test failed for ${testName}:`, error.message);
    return false;
  }
}

// Helper function to get current counts
async function getCounts() {
  try {
    const [employeesRes, assetsRes, ticketsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/employees`, { headers: { 'Cookie': authCookie } }),
      fetch(`${BASE_URL}/api/assets`, { headers: { 'Cookie': authCookie } }),
      fetch(`${BASE_URL}/api/tickets`, { headers: { 'Cookie': authCookie } })
    ]);
    
    const [employees, assets, tickets] = await Promise.all([
      employeesRes.json(),
      assetsRes.json(),
      ticketsRes.json()
    ]);
    
    return {
      employees: employees.length || 0,
      assets: assets.length || 0,
      tickets: tickets.length || 0
    };
  } catch (error) {
    console.error('Failed to get counts:', error.message);
    return { employees: 0, assets: 0, tickets: 0 };
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Comprehensive Import Test Suite');
  console.log('=' .repeat(50));
  
  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Get initial counts
  const initialCounts = await getCounts();
  console.log('\n📊 Initial Counts:');
  console.log(`   Employees: ${initialCounts.employees}`);
  console.log(`   Assets: ${initialCounts.assets}`);
  console.log(`   Tickets: ${initialCounts.tickets}`);
  
  // Test results
  const testResults = [];
  
  // Test 1: Employee Import
  const employeeTest = await testImport('employees', 'test_employees.csv', 'Employee Import');
  testResults.push({ name: 'Employee Import', success: employeeTest });
  
  // Test 2: Asset Import
  const assetTest = await testImport('assets', 'test_assets.csv', 'Asset Import');
  testResults.push({ name: 'Asset Import', success: assetTest });
  
  // Test 3: Ticket Import
  const ticketTest = await testImport('tickets', 'test_tickets.csv', 'Ticket Import');
  testResults.push({ name: 'Ticket Import', success: ticketTest });
  
  // Get final counts
  const finalCounts = await getCounts();
  console.log('\n📊 Final Counts:');
  console.log(`   Employees: ${finalCounts.employees} (+${finalCounts.employees - initialCounts.employees})`);
  console.log(`   Assets: ${finalCounts.assets} (+${finalCounts.assets - initialCounts.assets})`);
  console.log(`   Tickets: ${finalCounts.tickets} (+${finalCounts.tickets - initialCounts.tickets})`);
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const successCount = testResults.filter(t => t.success).length;
  const totalTests = testResults.length;
  
  testResults.forEach(test => {
    const status = test.success ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
  });
  
  console.log(`\n🏆 Overall: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All import modules working perfectly!');
    process.exit(0);
  } else {
    console.log('🔧 Some tests failed - check the logs above');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});