const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');
const { generateJWT, sessions } = require('./auth');

dotenv.config();

router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;
    const token = generateJWT();

    console.log('Looking for accounts with session_id:', session_id);
    console.log('Available sessions:', Object.keys(sessions));

    // Find the userId that has this session_id
    const userEntry = Object.entries(sessions).find(
      ([, val]) => val.session_id === session_id
    );

    if (userEntry && userEntry[1].accounts && userEntry[1].accounts.length > 0) {
      console.log('Found cached accounts:', userEntry[1].accounts.length);
      
      // Fetch fresh balances for each account
      const accountsWithBalances = await Promise.all(
        userEntry[1].accounts.map(async (account) => {
          try {
            const balanceRes = await axios.get(
              `${process.env.ENABLE_BANKING_API}/accounts/${account.uid}/balances`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const balances = balanceRes.data.balances || [];
            const best = balances.find(b => b.balance_type === 'AVAILABLE')
              || balances.find(b => b.balance_type === 'CLOSING_BOOKED')
              || balances[0];

            return {
              uid: account.uid,
              iban: account.account_id?.iban || 'N/A',
              name: account.name || 'Bank Account',
              currency: account.currency,
              balance: best?.balance_amount?.amount || '0.00',
              institution: 'Mock ASPSP',
            };
          } catch (err) {
            console.error('Balance error:', err.response?.data || err.message);
            return {
              uid: account.uid,
              iban: account.account_id?.iban || 'N/A',
              name: account.name || 'Bank Account',
              currency: account.currency,
              balance: '0.00',
              institution: 'Mock ASPSP',
            };
          }
        })
      );

      return res.json({ accounts: accountsWithBalances });
    }

    // Fallback: try fetching from Enable Banking directly
    console.log('No cached accounts, trying Enable Banking directly...');
    const accountsRes = await axios.get(
      `${process.env.ENABLE_BANKING_API}/accounts`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { session_id }
      }
    );

    res.json({ accounts: accountsRes.data.accounts || [] });

  } catch (error) {
    console.error('Accounts error:', JSON.stringify(error.response?.data) || error.message);
    res.status(500).json({
      error: 'Failed to fetch accounts',
      detail: error.response?.data || error.message
    });
  }
});

module.exports = router;