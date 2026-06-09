const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

dotenv.config();

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');

// Import the SHARED sessions object and generateJWT from auth.js
const { generateJWT, sessions } = require('./routes/auth');

const app = express();

app.use(cors());

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);

// Callback at root level to match registered redirect URL
app.get('/callback', async (req, res) => {
  console.log('=== CALLBACK HIT ===', req.query);
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/callback?error=no_code`);
    }

    const token = generateJWT();

    const response = await axios.post(
      `${process.env.ENABLE_BANKING_API}/sessions`,
      { code },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Session response:', JSON.stringify(response.data));

    const sessionId = response.data.session_id;
    const accounts = response.data.accounts || [];
    const userId = uuidv4();

    // Store in the SHARED sessions object from auth.js
    sessions[userId] = {
      session_id: sessionId,
      accounts: accounts,
      created: Date.now(),
    };

    console.log('Stored session:', userId, '-> session_id:', sessionId, '| accounts:', accounts.length);

    res.redirect(
      `${process.env.FRONTEND_URL}/callback?userId=${userId}&session_id=${sessionId}`
    );

  } catch (error) {
    console.error('Callback error:', JSON.stringify(error.response?.data) || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/callback?error=auth_failed`);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'OB Finance Dashboard API running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

