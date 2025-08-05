#!/usr/bin/env node

/**
 * Comprehensive Import System Test
 * Tests all three modules: Assets, Employees, Tickets
 * Validates field mappings, data processing, and error handling
 */

const http = require('http');
const querystring = require('querystring');

// Test data for each module
const testData = {
  assets: {
    data: [
      {
        "Type*": "Laptop",
        "Brand*": "Dell",
        "Serial Number*": "TEST-ASSET-001",
        "Status": "Available",
        "Model Number": "Latitude 5520",
        "CPU": "Intel i7",
        "RAM": "16GB",
        "Storage": "512GB SSD"
      }
    ],
    mapping: {
      "Type*": "type",
      "Brand*": "brand", 
      "Serial Number*": "serialNumber",
      "Status": "status",
      "Model Number": "modelNumber",
      "CPU": "cpu",
      "RAM": "ram",
      "Storage": "storage"
    }
  },
  employees: {
    data: [
      {
        "English Name*": "Test Import Employee",
        "Department*": "IT",
        "ID Number*": "TEST-EMP-999",
        "Title*": "Test Developer",
        "Joining Date*": "2024-01-01",
        "Status": "Active"
      }
    ],
    mapping: {
      "English Name*": "englishName",
      "Department*": "department",
      "ID Number*": "idNumber", 
      "Title*": "title",
      "Joining Date*": "joiningDate",
      "Status": "status"
    }
  },
  tickets: {
    data: [
      {
        "Summary*": "Test Import Ticket",
        "Description*": "This ticket was created via import test",
        "Submitted By ID*": "1082",
        "Status": "Open",
        "Priority": "Medium"
      }
    ],
    mapping: {
      "Summary*": "summary",
      "Description*": "description", 
      "Submitted By ID*": "submittedById",
      "Status": "status",
      "Priority": "priority"
    }
  }
};

// Test results storage
const results = {
  assets: { success: false, error: null },
  employees: { success: false, error: null },
  tickets: { success: false, error: null }
};

console.log("🧪 Starting Comprehensive Import System Test");
console.log("=" .repeat(50));

// Test function for each module  
async function testImport(module, testPayload) {
  return new Promise((resolve) => {
    console.log(`\n📋 Testing ${module} import...`);
    
    const formData = querystring.stringify({
      entityType: module,
      data: JSON.stringify(testPayload.data),
      mapping: JSON.stringify(testPayload.mapping)
    });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/import/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData),
        'Cookie': 'connect.sid=test-session'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log(`✅ ${module} import successful:`, response);
            results[module].success = true;
          } else {
            console.log(`❌ ${module} import failed:`, response);
            results[module].error = response.message || 'Unknown error';
          }
        } catch (e) {
          console.log(`❌ ${module} response parse error:`, data);
          results[module].error = 'Invalid response format';
        }
        
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${module} request error:`, err.message);
      results[module].error = err.message;
      resolve();
    });
    
    req.write(formData);
    req.end();
  });
}

// Run all tests
async function runAllTests() {
  // Wait for server to be ready
  console.log("⏳ Waiting for server to initialize...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test each module
  for (const [module, payload] of Object.entries(testData)) {
    await testImport(module, payload);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print final results
  console.log("\n" + "=".repeat(50));
  console.log("📊 FINAL TEST RESULTS");
  console.log("=".repeat(50));
  
  let allPassed = true;
  for (const [module, result] of Object.entries(results)) {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${module.toUpperCase()}: ${status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (!result.success) allPassed = false;
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(allPassed ? "🎉 ALL TESTS PASSED!" : "⚠️  SOME TESTS FAILED");
  console.log("=".repeat(50));
  
  process.exit(allPassed ? 0 : 1);
}

// Start testing
runAllTests().catch(console.error);