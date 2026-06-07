<template>
  <div class="home">
    <div class="hero">
      <h1>Open Banking<br><span class="accent">Finance Dashboard</span></h1>
      <p>Connect your bank accounts and get real-time insights into your spending, balances, and carbon footprint — powered by Enable Banking PSD2 API.</p>
    </div>

    <div class="bank-section">
      <h2>Connect a Bank</h2>
      <p class="section-sub">Select a sandbox bank to get started</p>

      <div v-if="store.loading" class="loading">Loading banks...</div>
      <div v-if="store.error" class="error">{{ store.error }}</div>

      <div class="bank-grid" v-if="!store.loading">
        <div
          v-for="bank in store.banks"
          :key="bank.name"
          class="bank-card"
          @click="connect(bank)"
        >
          <img
            v-if="bank.logo"
            :src="bank.logo"
            :alt="bank.name"
            class="bank-logo"
            @error="e => e.target.style.display='none'"
          />
          <div class="bank-info">
            <div class="bank-name">{{ bank.name }}</div>
            <div class="bank-country">{{ bank.country }}</div>
          </div>
          <span class="bank-arrow">→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useBankStore } from '../stores/bank'
import { useRouter } from 'vue-router'

const store = useBankStore()
const router = useRouter()

onMounted(() => {
  store.fetchBanks()
  if (store.isConnected) router.push('/dashboard')
})

async function connect(bank) {
  await store.connectBank(bank.name, bank.country)
}
</script>

<style scoped>
.home { max-width: 900px; margin: 0 auto; }

.hero {
  text-align: center;
  padding: 3rem 0 2rem;
}
.hero h1 {
  font-size: 2.8rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: #1b3a6b;
}
.accent { color: #0e7c7b; }
.hero p {
  font-size: 1.1rem;
  color: #4a5568;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

.bank-section { margin-top: 2rem; }
.bank-section h2 { font-size: 1.4rem; color: #1b3a6b; margin-bottom: 0.3rem; }
.section-sub { color: #718096; font-size: 0.9rem; margin-bottom: 1.5rem; }

.bank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.bank-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.bank-card:hover {
  border-color: #0e7c7b;
  box-shadow: 0 4px 12px rgba(14,124,123,0.15);
  transform: translateY(-2px);
}

.bank-logo { width: 40px; height: 40px; object-fit: contain; border-radius: 8px; }
.bank-info { flex: 1; }
.bank-name { font-weight: 600; font-size: 0.95rem; color: #1a202c; }
.bank-country { font-size: 0.8rem; color: #718096; margin-top: 2px; }
.bank-arrow { color: #0e7c7b; font-size: 1.1rem; }

.loading { text-align: center; padding: 3rem; color: #718096; }
.error { background: #fff5f5; color: #c53030; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
</style>