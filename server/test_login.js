// Test login for all seeded admins and proctors
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testUsers = [
    { userID: 'SUPER001', password: 'SuperPass2026!', role: 'SuperAdmin' },
    { userID: 'ADMIN004', password: '4KAdminPass2026!', role: 'CampusAdmin' },
    { userID: '4kPROCTOR001', password: '4ProctorPass12026!', role: 'Proctor' },
    { userID: 'PROCTOR001', password: 'ProctorPass2026!', role: 'Proctor' },
    { userID: 'ADMIN001', password: 'AdminPass2026!', role: 'CampusAdmin' }
];

async function testLogin(userID, password, expectedRole) {
    try {
        console.log(`\n🔐 Testing login for: ${userID}`);
        const response = await axios.post(`${API_URL}/auth/login`, {
            userId: userID,
            password: password
        });

        if (response.data.success) {
            console.log(`✅ SUCCESS - ${userID}`);
            console.log(`   Role: ${response.data.role}`);
            console.log(`   Name: ${response.data.name}`);
            console.log(`   Campus: ${response.data.user?.campus || 'N/A'}`);
            if (response.data.proctor) {
                console.log(`   Building: ${response.data.proctor.assignedBuilding?.name || 'N/A'}`);
            }
            return true;
        } else {
            console.log(`❌ FAILED - ${userID}: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ERROR - ${userID}:`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
        } else {
            console.log(`   ${error.message}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('TESTING PROCTOR AND ADMIN LOGIN');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    for (const user of testUsers) {
        const result = await testLogin(user.userID, user.password, user.role);
        if (result) passed++;
        else failed++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(60));
}

runTests();
