const db = require('./database');

console.log('===================================================');
console.log('        AI SEARCH & EARN — DATABASE VIEWER        ');
console.log('===================================================');

try {
  const users = db.db.prepare('SELECT id, name, email, phone, balance, search_count, lifetime_earnings, created_at FROM users').all();
  console.log(`\n👥 USERS REGISTERED (${users.length}):`);
  console.table(users.map(u => ({
    ID: u.id,
    Name: u.name,
    Email: u.email,
    Balance: `$${Number(u.balance).toFixed(4)}`,
    Searches: u.search_count,
    'Joined Date': u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'
  })));

  const searches = db.db.prepare('SELECT id, user_id, query, platform, reward, ad_shown, timestamp FROM searches ORDER BY timestamp DESC LIMIT 10').all();
  console.log(`\n🔍 RECENT PROMPT SEARCHES (Last ${searches.length}):`);
  console.table(searches.map(s => ({
    'User ID': s.user_id,
    Prompt: (s.query || '').slice(0, 30),
    Platform: s.platform,
    Reward: `+$${Number(s.reward).toFixed(4)}`,
    'Ad Shown': s.ad_shown,
    Time: s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : '-'
  })));

  const withdrawals = db.db.prepare('SELECT id, user_id, amount, method, status, requested_at, account_details FROM withdrawals ORDER BY requested_at DESC').all();
  console.log(`\n💳 PAYOUT REQUESTS (${withdrawals.length}):`);
  if (withdrawals.length === 0) {
    console.log('No payout requests yet.');
  } else {
    console.table(withdrawals.map(w => ({
      ID: w.id,
      'User ID': w.user_id,
      Amount: `$${Number(w.amount).toFixed(2)}`,
      Method: w.method,
      Status: w.status,
      Details: w.account_details,
      Date: w.requested_at ? new Date(w.requested_at).toLocaleDateString() : '-'
    })));
  }
} catch (err) {
  console.error('Error viewing database:', err.message);
}
console.log('\n===================================================');
