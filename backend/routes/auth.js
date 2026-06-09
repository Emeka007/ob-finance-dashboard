
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const privateKey = process.env.PRIVATE_KEY
  ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
  : fs.readFileSync(path.join(__dirname, '../keys/private.pem'), 'utf8');

const sessions = {};

function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: process.env.APP_ID,
    aud: 'api.enablebanking.com',
    iat: now,
    exp: now + 3600,
    jti: uuidv4(),
  };
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: process.env.APP_ID,
  });
}

router.get('/banks', async (req, res) => {
  try {
    const token = generateJWT();
    const response = await axios.get(
      `${process.env.ENABLE_BANKING_API}/aspsps`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { country: 'FI' }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching banks:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch banks' });
  }
});

router.get('/connect', async (req, res) => {
  try {
    const { aspsp_id, aspsp_country } = req.query;
    if (!aspsp_id || !aspsp_country) {
      return res.status(400).json({ error: 'aspsp_id and aspsp_country are required' });
    }
    const token = generateJWT();
    const state = uuidv4();
    sessions[state] = { aspsp_id, aspsp_country, created: Date.now() };
    const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const body = {
      access: {
        valid_until: validUntil,
        balances: true,
        transactions: true,
      },
      aspsp: {
        name: aspsp_id,
        country: aspsp_country,
      },
      state: state,
      redirect_url: process.env.REDIRECT_URI,
      psu_type: 'personal',
    };
    const response = await axios.post(
      `${process.env.ENABLE_BANKING_API}/auth`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({
      auth_url: response.data.url,
      session_id: response.data.session_id,
      state,
    });
  } catch (error) {
    console.error('Error starting auth:', JSON.stringify(error.response?.data) || error.message);
    res.status(500).json({
      error: 'Failed to start bank authentication',
      detail: error.response?.data || error.message
    });
  }
});

router.get('/session/:userId', (req, res) => {
  const session = sessions[req.params.userId];
  if (!session) {
    return res.status(404).json({ valid: false });
  }
  res.json({ valid: true, session_id: session.session_id });
});

module.exports = router;
module.exports.generateJWT = generateJWT;
module.exports.sessions = sessions;
