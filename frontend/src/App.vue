<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <span class="nav-logo">⬡</span>
        <span class="nav-title">OB Finance</span>
      </div>
      <div class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/dashboard" v-if="store.isConnected">Dashboard</router-link>
        <button v-if="store.isConnected" @click="store.disconnect()" class="btn-disconnect">
          Disconnect
        </button>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useBankStore } from './stores/bank'
const store = useBankStore()
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f0f4f8;
  color: #1a202c;
}

.navbar {
  background: #1b3a6b;
  color: white;
  padding: 0 2rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.nav-brand { display: flex; align-items: center; gap: 10px; }
.nav-logo { font-size: 1.5rem; }
.nav-title { font-size: 1.1rem; font-weight: 600; letter-spacing: 0.5px; }

.nav-links { display: flex; align-items: center; gap: 1.5rem; }
.nav-links a {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.nav-links a:hover, .nav-links a.router-link-active { color: white; }

.btn-disconnect {
  background: rgba(255,255,255,0.15);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.btn-disconnect:hover { background: rgba(255,255,255,0.25); }

main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
</style>