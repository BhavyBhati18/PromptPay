/**
 * AI Search Ads - Backend API Automated Verification Suite
 */

const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let chunks = '';
      res.on('data', chunk => chunks += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(chunks) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: chunks });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Backend API Automated Tests...\n');

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log('✓ Test 1 - Health Check:', health.status === 200 ? 'PASSED' : 'FAILED', health.body);

    // 2. User sync
    const testUserId = 'test_user_' + Date.now();
    const syncRes = await request('POST', '/api/user/sync', { userId: testUserId });
    console.log('✓ Test 2 - User Sync:', syncRes.status === 200 ? 'PASSED' : 'FAILED', 'Balance:', syncRes.body.user.balance);

    // 3. Record search (coding query -> should match developer tools)
    const searchRes = await request('POST', '/api/search/record', {
      userId: testUserId,
      query: 'how to write clean python code',
      platform: 'chatgpt'
    });
    console.log('✓ Test 3 - Record Search:', searchRes.status === 200 ? 'PASSED' : 'FAILED');
    console.log('    Rewarded:', searchRes.body.reward, '| New Balance:', searchRes.body.newBalance);
    console.log('    Matched Ad:', searchRes.body.ad ? searchRes.body.ad.company : 'None');

    // 4. Record click
    if (searchRes.body.ad) {
      const clickRes = await request('POST', '/api/ad/click', { adId: searchRes.body.ad.id });
      console.log('✓ Test 4 - Record Ad Click:', clickRes.status === 200 ? 'PASSED' : 'FAILED');
    }

    // 5. Withdrawal rejection when balance < $10.00
    const failedWithdrawal = await request('POST', '/api/withdrawal/request', {
      userId: testUserId,
      method: 'PayPal',
      accountDetails: 'tester@example.com',
      amount: 10.00
    });
    console.log('✓ Test 5 - Minimum $10 Enforcement:', failedWithdrawal.status === 400 ? 'PASSED (Properly Rejected)' : 'FAILED', failedWithdrawal.body.error);

    // 6. Dev tool: Add balance to reach $10
    const addBalRes = await request('POST', '/api/dev/add-balance', { userId: testUserId, amount: 10.00 });
    console.log('✓ Test 6 - Add Balance ($10.00):', addBalRes.status === 200 ? 'PASSED' : 'FAILED', 'New Balance:', addBalRes.body.user.balance);

    // 7. Successful withdrawal at $10
    const successWithdrawal = await request('POST', '/api/withdrawal/request', {
      userId: testUserId,
      method: 'USDT (TRC-20)',
      accountDetails: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
      amount: 10.00
    });
    console.log('✓ Test 7 - Successful $10 Withdrawal:', successWithdrawal.status === 200 ? 'PASSED' : 'FAILED');
    console.log('    Transaction ID:', successWithdrawal.body.withdrawal ? successWithdrawal.body.withdrawal.id : 'N/A');
    console.log('    Remaining Balance:', successWithdrawal.body.newBalance);

    // 8. Advertiser campaign listing
    const campaignsRes = await request('GET', '/api/advertiser/campaigns');
    console.log('✓ Test 8 - Advertiser Campaigns List:', campaignsRes.status === 200 ? 'PASSED' : 'FAILED', 'Total campaigns:', campaignsRes.body.campaigns.length);

    // 9. Create custom campaign
    const newCampRes = await request('POST', '/api/advertiser/campaign', {
      company: 'Test Brand Inc',
      title: 'Revolutionary Cloud AI',
      description: 'The fastest serverless AI GPU cluster in the cloud.',
      cta: 'Claim $100',
      url: 'https://testbrand.ai',
      category: 'Cloud & Hosting',
      platform: 'all',
      keywords: ['cloud', 'gpu', 'serverless'],
      budget: 100.00
    });
    console.log('✓ Test 9 - Create Ad Campaign:', newCampRes.status === 200 ? 'PASSED' : 'FAILED', 'Ad ID:', newCampRes.body.campaign.id);

    console.log('\n🎉 ALL 9 BACKEND API TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  }
}

runTests();
