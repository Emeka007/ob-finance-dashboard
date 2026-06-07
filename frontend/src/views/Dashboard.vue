<template>
  <div class="dashboard">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Balance</div>
        <div class="stat-value">€{{ store.totalBalance.toFixed(2) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Accounts Connected</div>
        <div class="stat-value">{{ store.accounts.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Spent</div>
        <div class="stat-value">€{{ store.summary?.total_spent?.toFixed(2) || "0.00" }}</div>
      </div>
      <div class="stat-card co2">
        <div class="stat-label">CO₂ Footprint</div>
        <div class="stat-value">{{ store.totalCO2.toFixed(2) }} kg</div>
      </div>
    </div>

    <div class="section">
      <h2>Your Accounts</h2>
      <div v-if="store.loading" class="loading">Loading...</div>
      <div class="accounts-grid">
        <div
          v-for="account in store.accounts"
          :key="account.uid"
          class="account-card"
          :class="{ active: selectedAccount?.uid === account.uid }"
          @click="selectAccount(account)"
        >
          <div class="account-top">
            <div class="account-bank">{{ account.institution }}</div>
            <div class="account-balance">€{{ parseFloat(account.balance).toFixed(2) }}</div>
          </div>
          <div class="account-iban">{{ account.iban }}</div>
          <div class="account-name">{{ account.name }} · {{ account.currency }}</div>
        </div>
      </div>
    </div>

    <div class="section" v-if="selectedAccount">
      <div class="section-header">
        <h2>Transactions — {{ selectedAccount.name }}</h2>
        <div class="date-filters">
          <input type="date" v-model="dateFrom" />
          <span>to</span>
          <input type="date" v-model="dateTo" />
          <button @click="loadTransactions" class="btn-load">Load</button>
        </div>
      </div>

      <div class="charts-grid" v-if="store.summary && store.transactions.length > 0">
        <div class="chart-card">
          <h3>Spending by Category</h3>
          <canvas ref="pieCanvas"></canvas>
        </div>
        <div class="chart-card">
          <h3>CO₂ by Category (kg)</h3>
          <canvas ref="co2Canvas"></canvas>
        </div>
      </div>

      <div class="tx-list">
        <div v-if="store.loading" class="loading">Loading transactions...</div>
        <div
          v-for="tx in store.transactions"
          :key="tx.id"
          class="tx-row"
          :class="tx.type"
        >
          <div class="tx-left">
            <div class="tx-cat-badge" :class="tx.category">{{ tx.category }}</div>
            <div class="tx-desc">{{ tx.description }}</div>
            <div class="tx-date">{{ tx.date }}</div>
          </div>
          <div class="tx-right">
            <div class="tx-amount" :class="tx.type">
              {{ tx.type === "credit" ? "+" : "-" }}€{{ Math.abs(tx.amount).toFixed(2) }}
            </div>
            <div class="tx-co2">🌱 {{ tx.co2_kg }} kg CO₂</div>
          </div>
        </div>
        <div v-if="!store.loading && store.transactions.length === 0" class="empty">
          No transactions found. Try adjusting the date range.
        </div>
      </div>
    </div>

    <div class="section hint" v-else>
      <p>👆 Click an account above to view transactions and charts</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"
import { useRouter } from "vue-router"
import { useBankStore } from "../stores/bank"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

const store = useBankStore()
const router = useRouter()

const selectedAccount = ref(null)
const dateFrom = ref("2026-06-01")
const dateTo = ref("2026-06-30")
const pieCanvas = ref(null)
const co2Canvas = ref(null)
let pieChart = null
let co2Chart = null

onMounted(async () => {
  if (!store.isConnected) {
    router.push("/")
    return
  }
  if (store.accounts.length === 0) {
    await store.fetchAccounts()
  }
})

async function selectAccount(account) {
  selectedAccount.value = account
  await loadTransactions()
}

async function loadTransactions() {
  if (!selectedAccount.value) return
  await store.fetchTransactions(selectedAccount.value.uid, dateFrom.value, dateTo.value)
  await nextTick()
  renderCharts()
}

function renderCharts() {
  if (!store.summary || store.transactions.length === 0) return

  const categories = Object.keys(store.summary.by_category)
  const amounts = Object.values(store.summary.by_category)

  const colors = [
    "#1b3a6b","#0e7c7b","#3182ce","#38a169","#d69e2e",
    "#e53e3e","#805ad5","#dd6b20","#319795","#2b6cb0"
  ]

  if (pieChart) pieChart.destroy()
  if (pieCanvas.value) {
    pieChart = new Chart(pieCanvas.value, {
      type: "doughnut",
      data: {
        labels: categories,
        datasets: [{ data: amounts, backgroundColor: colors, borderWidth: 2 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    })
  }

  const co2Factors = {
    food: 0.005, transport: 0.021, shopping: 0.008,
    utilities: 0.003, health: 0.002, travel: 0.035,
    entertainment: 0.001, income: 0, other: 0.004
  }

  const co2Data = categories.map(cat =>
    parseFloat((store.summary.by_category[cat] * (co2Factors[cat] || 0.004)).toFixed(3))
  )

  if (co2Chart) co2Chart.destroy()
  if (co2Canvas.value) {
    co2Chart = new Chart(co2Canvas.value, {
      type: "bar",
      data: {
        labels: categories,
        datasets: [{
          label: "CO₂ (kg)",
          data: co2Data,
          backgroundColor: "#38a169",
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })
  }
}
</script>

<style scoped>
.dashboard { }
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}
.stat-card.co2 { border-left: 4px solid #38a169; }
.stat-label { font-size: 0.8rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
.stat-value { font-size: 1.8rem; font-weight: 700; color: #1b3a6b; }
.section { margin-bottom: 2rem; }
.section h2 { font-size: 1.2rem; color: #1b3a6b; margin-bottom: 1rem; }
.section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
.date-filters { display: flex; align-items: center; gap: 8px; }
.date-filters input { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; }
.btn-load { background: #1b3a6b; color: white; border: none; padding: 7px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.btn-load:hover { background: #0e7c7b; }
.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.account-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}
.account-card:hover, .account-card.active {
  border-color: #0e7c7b;
  box-shadow: 0 4px 12px rgba(14,124,123,0.15);
}
.account-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.account-bank { font-size: 0.8rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; }
.account-balance { font-size: 1.4rem; font-weight: 700; color: #1b3a6b; }
.account-iban { font-size: 0.85rem; color: #4a5568; font-family: monospace; margin-bottom: 4px; }
.account-name { font-size: 0.8rem; color: #718096; }
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}
.chart-card h3 { font-size: 0.95rem; color: #1b3a6b; margin-bottom: 1rem; }
.tx-list { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
.tx-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f0f4f8;
  transition: background 0.15s;
}
.tx-row:hover { background: #f7fafc; }
.tx-row:last-child { border-bottom: none; }
.tx-cat-badge {
  display: inline-block;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 20px;
  background: #e2e8f0;
  color: #4a5568;
  margin-bottom: 4px;
  text-transform: capitalize;
}
.tx-cat-badge.food { background: #fef3c7; color: #92400e; }
.tx-cat-badge.transport { background: #dbeafe; color: #1e40af; }
.tx-cat-badge.shopping { background: #fce7f3; color: #9d174d; }
.tx-cat-badge.travel { background: #d1fae5; color: #065f46; }
.tx-cat-badge.income { background: #dcfce7; color: #166534; }
.tx-cat-badge.entertainment { background: #e9d8fd; color: #553c9a; }
.tx-desc { font-size: 0.9rem; color: #1a202c; }
.tx-date { font-size: 0.75rem; color: #a0aec0; margin-top: 2px; }
.tx-right { text-align: right; }
.tx-amount { font-size: 1rem; font-weight: 600; }
.tx-amount.credit { color: #38a169; }
.tx-amount.debit { color: #e53e3e; }
.tx-co2 { font-size: 0.75rem; color: #68d391; margin-top: 2px; }
.hint { text-align: center; padding: 2rem; color: #718096; background: white; border-radius: 12px; }
.loading { text-align: center; padding: 2rem; color: #718096; }
.empty { text-align: center; padding: 2rem; color: #a0aec0; }
</style>