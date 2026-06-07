# OB Finance Dashboard

A full-stack Open Banking personal finance dashboard built with **Vue.js** and **Node.js**, integrating the **Enable Banking PSD2 API** to aggregate multi-bank account data, transaction history, and carbon footprint analytics.

## Features
- PSD2 OAuth2 authentication flow with real bank redirect
- Multi-bank account aggregation via Enable Banking API
- Real-time transaction fetching with date range filters
- Automatic spending categorisation (food, transport, entertainment etc.)
- CO2 footprint calculation per transaction and category
- Interactive doughnut and bar charts (Chart.js)
- Responsive Vue.js frontend with Pinia state management

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, Vite, Vue Router, Pinia, Chart.js |
| Backend | Node.js, Express.js |
| API | Enable Banking PSD2 / Open Banking API |
| Auth | RS256 JWT signing with RSA private key |

## Getting Started

### Prerequisites
- Node.js 18+
- Enable Banking sandbox account at enablebanking.com
- RSA private key from Enable Banking app registration

### Installation

Clone the repo and install dependencies:

cd backend && npm install
cd ../frontend && npm install

### Configuration

Create backend/.env:

APP_ID=your-enable-banking-app-id
REDIRECT_URI=http://localhost:3000/callback
ENABLE_BANKING_API=https://api.enablebanking.com
PORT=3000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-secret-here

Place your RSA private key at backend/keys/private.pem

### Running the app

Terminal 1 - Backend:
cd backend && npm run dev

Terminal 2 - Frontend:
cd frontend && npm run dev

Open http://localhost:5173

## How it works

1. User selects a bank from the home screen
2. Backend generates a signed JWT and calls Enable Banking /auth endpoint
3. User is redirected to the bank PSD2 consent page
4. After authorization, Enable Banking redirects back with an auth code
5. Backend exchanges the code for a session via POST /sessions
6. Frontend fetches accounts and transactions using the session ID
7. Transactions are categorised and enriched with CO2 estimates

## Project Structure

ob-finance-dashboard/
- backend/
  - server.js           Express entry point + callback handler
  - routes/
    - auth.js           JWT generation + PSD2 auth flow
    - accounts.js       Account + balance fetching
    - transactions.js   Transaction fetching + categorisation
  - keys/               RSA private key (gitignored)
- frontend/
  - src/
    - views/
      - Home.vue        Bank selection
      - Dashboard.vue   Charts + transactions
      - Callback.vue    OAuth callback handler
    - stores/
      - bank.js         Pinia store

## Author
Chukwuemeka Obanya
LinkedIn: https://linkedin.com/in/chukwuemeka-obanya-319048137
GitHub: https://github.com/Emeka007
