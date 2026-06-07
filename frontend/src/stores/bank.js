import { defineStore } from "pinia"
import axios from "axios"

const API = "http://localhost:3000"

export const useBankStore = defineStore("bank", {
  state: () => ({
    userId: localStorage.getItem("userId") || null,
    sessionId: localStorage.getItem("sessionId") || null,
    accounts: [],
    transactions: [],
    summary: null,
    banks: [],
    loading: false,
    error: null,
  }),
  getters: {
    isConnected: (state) => !!state.sessionId,
    totalBalance: (state) => state.accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0),
    totalCO2: (state) => state.summary ? state.summary.total_co2_kg : 0,
    byCategory: (state) => state.summary ? state.summary.by_category : {},
  },
  actions: {
    async fetchBanks() {
      this.loading = true
      try {
        const res = await axios.get(API + "/auth/banks")
        this.banks = res.data.aspsps || []
      } catch (e) {
        this.error = "Failed to load banks"
        console.error("fetchBanks:", e.message)
      } finally {
        this.loading = false
      }
    },
    async connectBank(aspspId, aspspCountry) {
      try {
        const res = await axios.get(API + "/auth/connect", { params: { aspsp_id: aspspId, aspsp_country: aspspCountry } })
        window.location.href = res.data.auth_url
      } catch (e) {
        this.error = "Failed to connect bank"
        console.error("connectBank:", e.message)
      }
    },
    setSession(userId, sessionId) {
      this.userId = userId
      this.sessionId = sessionId
      localStorage.setItem("userId", userId)
      localStorage.setItem("sessionId", sessionId)
      console.log("Session saved:", userId, sessionId)
    },
    async fetchAccounts() {
      if (!this.sessionId) { console.error("No sessionId"); return }
      this.loading = true
      console.log("Fetching accounts:", this.sessionId)
      try {
        const res = await axios.get(API + "/accounts/" + this.sessionId)
        this.accounts = res.data.accounts || []
        console.log("Accounts loaded:", this.accounts.length)
      } catch (e) {
        this.error = "Failed to load accounts"
        console.error("fetchAccounts:", e.response ? e.response.data : e.message)
      } finally {
        this.loading = false
      }
    },
    async fetchTransactions(accountUid, dateFrom, dateTo) {
      this.loading = true
      try {
        const res = await axios.get(API + "/transactions/" + accountUid, { params: { date_from: dateFrom, date_to: dateTo } })
        this.transactions = res.data.transactions || []
        this.summary = res.data.summary
      } catch (e) {
        this.error = "Failed to load transactions"
        console.error("fetchTransactions:", e.response ? e.response.data : e.message)
      } finally {
        this.loading = false
      }
    },
    disconnect() {
      this.userId = null
      this.sessionId = null
      this.accounts = []
      this.transactions = []
      this.summary = null
      localStorage.removeItem("userId")
      localStorage.removeItem("sessionId")
    }
  }
})
