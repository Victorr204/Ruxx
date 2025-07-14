const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5002;

// Mock user accounts (like wallet IDs)
const validAccounts = {
  'bet9ja': {
    '123456': { username: 'johnbet9ja', fullName: 'John Doe' },
    '789012': { username: 'janebet', fullName: 'Jane Smith' },
  },
  'nairabet': {
    '555555': { username: 'bigwinner', fullName: 'Mark Rich' },
  },
};

// Validate account
app.post('/api/verify-bet-account', (req, res) => {
  const { userId, provider } = req.body;
  const users = validAccounts[provider.toLowerCase()] || {};
  const user = users[userId];

  if (user) {
    return res.json({ success: true, ...user });
  } else {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
});

// Simulate payment
app.post('/api/pay-bet', (req, res) => {
  const { userId, amount, provider } = req.body;

  if (!userId || !amount || isNaN(amount) || !provider) {
    return res.status(400).json({ success: false, message: 'Invalid payment data.' });
  }

  return res.json({
    success: true,
    message: `₦${amount} sent to ${userId} on ${provider}`,
    transactionId: 'BET-' + Math.floor(Math.random() * 1000000),
  });
});

app.listen(PORT, () => {
  console.log(`✅ Mock Betting API running at http://localhost:${PORT}`);
});
