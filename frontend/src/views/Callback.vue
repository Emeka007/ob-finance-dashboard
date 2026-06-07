<template>
  <div class="callback">
    <div class="card">
      <div v-if="error" class="error-state">
        <div class="icon">✗</div>
        <h2>Connection Failed</h2>
        <p>{{ error }}</p>
        <router-link to="/" class="btn-primary">Try Again</router-link>
      </div>
      <div v-else class="success-state">
        <div class="icon spin">⬡</div>
        <h2>Connecting your bank...</h2>
        <p>Please wait while we fetch your accounts.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBankStore } from '../stores/bank'

const route = useRoute()
const router = useRouter()
const store = useBankStore()
const error = ref(null)

onMounted(async () => {
  const { userId, session_id, error: err } = route.query

  console.log('Callback received:', { userId, session_id, err })

  if (err || !userId || !session_id) {
    error.value = 'Bank authentication failed. Please try again.'
    return
  }

  store.setSession(userId, session_id)

  await new Promise(resolve => setTimeout(resolve, 500))

  console.log('Fetching accounts for session:', store.sessionId)
  await store.fetchAccounts()
  console.log('Accounts loaded:', store.accounts)

  router.push('/dashboard')
})
</script>

<style scoped>
.callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
.card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  min-width: 320px;
}
.icon { font-size: 3rem; margin-bottom: 1rem; }
.spin { display: inline-block; animation: spin 2s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
h2 { color: #1b3a6b; margin-bottom: 0.5rem; }
p { color: #718096; margin-bottom: 1.5rem; }
.error-state .icon { color: #e53e3e; }
.btn-primary {
  background: #1b3a6b;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.95rem;
}
</style>