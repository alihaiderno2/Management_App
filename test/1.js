// Native fetch is available in Node.js 18+. Run with: node advanced-api-test.js

const BASE_URL = 'http://localhost:3001'; // Default from EndpointsForTeamColabPlatform collection variables

const ENDPOINTS = {
    register: `${BASE_URL}/auth/register`,
    login: `${BASE_URL}/auth/login`,
    refresh: `${BASE_URL}/auth/refresh`,
    profile: `${BASE_URL}/user/me`
};

// Generates a random email to prevent real "user already exists" interference during basic structural runs
const generateRandomEmail = () => `test-${Math.floor(Math.random() * 100000)}@example.com`;

async function runAllTests() {
    console.log("🚀 Starting Comprehensive API Stress, Security, and Scenario Testing...\n");

    const testEmail = generateRandomEmail();
    const testPassword = "securePassword123";

    // 1. Scenario-Based Functional & Security Test Cases
    await testAuthenticationFlows(testEmail, testPassword);

    // 2. Non-Functional & Stress Testing
    await testRateLimiting();
    await testLoadTesting();
    await testDuplicateRegistrations();
    await testSecurityHeaders();
}

/**
 * ============================================================================
 * SCENARIO & SECURITY TEST CASES
 * ============================================================================
 */
async function testAuthenticationFlows(email, password) {
    console.log("--- 1. Running Scenario & Security Test Cases ---");

    // Test Case A: Register a new user
    console.log(`[Test A] Attempting user registration with email: ${email}...`);
    const regRes = await fetch(ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: "QA Tester" })
    });
    console.log(`-> Status: ${regRes.status} (${regRes.status === 201 ? '✅ Registered' : '❌ Failed'})`);
    
    // Test Case B: Login with an invalid password
    console.log(`[Test B] Attempting login with WRONG password...`);
    const wrongLoginRes = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: "incorrect_password_abc" })
    });
    if (wrongLoginRes.status === 400 || wrongLoginRes.status === 401) {
        console.log(`✅ Success: Server rejected bad password with status ${wrongLoginRes.status}.`);
    } else {
        console.log(`❌ Fail: Server responded with unexpected status ${wrongLoginRes.status} for a bad password.`);
    }

    // Test Case C: Login with valid credentials
    console.log(`[Test C] Attempting login with CORRECT credentials (Email: ${email} / Pass: ${password})...`);
    const loginRes = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // Ensure these match Test A exactly!
    });
    
    const loginData = await loginRes.json().catch(() => ({}));
    
    if (loginRes.status === 200 && loginData.accessToken) {
        console.log(`✅ Success: Logged in! Received Access Token.`);
        
        // [Test D & E naturally follow here if token exists...]
        
    } else {
        console.log(`❌ Fail: Could not log in. Status: ${loginRes.status}`);
        console.log("💡 Server Login Error Response Payload:", JSON.stringify(loginData, null, 2));
    }

    // Test Case F: Accessing protected profile WITHOUT token
    console.log(`[Test F] Accessing protected route /user/me WITHOUT authorization headers...`);
    const unprotectedRes = await fetch(ENDPOINTS.profile, { method: 'GET' });
    if (unprotectedRes.status === 401 || unprotectedRes.status === 403) {
        console.log(`✅ Success: Request properly rejected with status ${unprotectedRes.status}.`);
    } else {
        console.log(`❌ Security Risk: Endpoint accessed without credentials! Status: ${unprotectedRes.status}`);
    }
    console.log("\n");
}

/**
 * ============================================================================
 * STRESS, LOAD & NON-FUNCTIONAL TESTING
 * ============================================================================
 */

/**
 * 2. RATE LIMITING TEST
 * Floods the server to identify whether it correctly deploys 429 Too Many Requests protections.
 */
async function testRateLimiting() {
    console.log("--- 2. Testing Rate Limiting ---");
    const totalRequests = 100; 
    console.log(`Sending ${totalRequests} rapid bursts to ${ENDPOINTS.login}...`);

    const promises = Array.from({ length: totalRequests }).map(() => 
        fetch(ENDPOINTS.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "rate-limit@test.com", password: "123" })
        })
    );
    const responses = await Promise.all(promises);

    const statusCounts = {};
    responses.forEach(res => { statusCounts[res.status] = (statusCounts[res.status] || 0) + 1; });

    console.log("Results Summary:", statusCounts);
    if (statusCounts[429]) {
        console.log(`✅ Success: Rate limiting is actively defending the server. Blocked ${statusCounts[429]} requests.\n`);
    } else {
        console.log(`⚠️ Warning: No 429 status codes returned. The auth endpoints might be vulnerable to brute force attempts.\n`);
    }
}

/**
 * 3. LOAD TESTING
 * Measures server degradation and response velocities under traffic loads.
 */
async function testLoadTesting() {
    console.log("--- 3. Testing Load / Concurrency ---");
    const concurrentUsers = 40;
    console.log(`Simulating ${concurrentUsers} simultaneous users hitting registration initialization logic...`);

    const startTime = Date.now();
    const promises = Array.from({ length: concurrentUsers }).map(() => 
        fetch(ENDPOINTS.register, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: generateRandomEmail(), password: "pass", name: "Load User" })
        })
    );
    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`Finished processing all concurrent users in: ${duration}ms`);
    console.log(`Average request execution turnaround: ${(duration / concurrentUsers).toFixed(2)}ms\n`);
}

/**
 * 4. DUPLICATE REQUESTS (Race Conditions)
 * Ensures that hitting a registration loop rapidly with the exact same details won't 
 * bypass unique SQL/NoSQL indexes or result in concurrent record duplication.
 */
async function testDuplicateRegistrations() {
    console.log("--- 4. Testing Duplicate Requests (Race Conditions) ---");
    const staticEmail = `race-condition-${Math.floor(Math.random() * 100000)}@test.com`;
    console.log(`Firing identical registration payloads simultaneously for: ${staticEmail}`);

    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staticEmail, password: "password123", name: "Twin User" })
    };

    const promises = Array.from({ length: 5 }).map(() => fetch(ENDPOINTS.register, payload));
    const responses = await Promise.all(promises);
    const statuses = responses.map(res => res.status);

    console.log("Received Status Codes:", statuses);
    const successCount = statuses.filter(s => s === 201 || s === 200).length;
    
    if (successCount === 1) {
        console.log(`✅ Success: Transaction integrity maintained. Only 1 account was created, others rejected or caught.\n`);
    } else if (successCount > 1) {
        console.log(`❌ Fail: Critical race condition vulnerability. Created ${successCount} accounts with the exact same email.\n`);
    } else {
        console.log(`ℹ️ Info: Requests finished without distinct creation confirmation statuses (${statuses.join(', ')}).\n`);
    }
}

/**
 * 5. SECURITY HEADERS CHECK
 */
async function testSecurityHeaders() {
    console.log("--- 5. Checking Security Headers ---");
    try {
        const response = await fetch(ENDPOINTS.login, { method: 'POST' });
        const headers = response.headers;

        const structuralHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'strict-transport-security',
            'content-security-policy'
        ];

        structuralHeaders.forEach(header => {
            if (headers.has(header)) {
                console.log(`✅ Found: ${header} -> ${headers.get(header)}`);
            } else {
                console.log(`❌ Missing: ${header}`);
            }
        });

        if (headers.has('x-powered-by')) {
            console.log(`⚠️ Risk: 'x-powered-by' header is leaking info (${headers.get('x-powered-by')}).`);
        } else {
            console.log(`✅ Success: Stack signature header 'x-powered-by' hidden.`);
        }
    } catch (err) {
        console.error("Could not complete header examination:", err.message);
    }
}

// Execute the automation suite
runAllTests();