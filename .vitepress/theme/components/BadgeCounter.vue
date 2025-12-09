<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface BadgeStats {
  Snake: number
  Moth: number
  Rabbit: number
}

const stats = ref<BadgeStats>({ Snake: 0, Moth: 0, Rabbit: 0 })
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/badge_stats.json')
    if (res.ok) {
      stats.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to load badge stats', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="badge-counter">
    <div class="header">
      <span class="line">---</span>
      <span class="title">Badges</span>
      <span class="line">---</span>
    </div>
    
    <div class="stats-grid">
      <div class="stat-row snake">
        <span class="label">Snake:</span>
        <span class="value">{{ stats.Snake }}</span>
      </div>
      <div class="stat-row moth">
        <span class="label">Moth:</span>
        <span class="value">{{ stats.Moth }}</span>
      </div>
      <div class="stat-row rabbit">
        <span class="label">Rabbit:</span>
        <span class="value">{{ stats.Rabbit }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge-counter {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #333;
  margin: 1rem 0;
  font-family: var(--vp-font-family-mono);
  max-width: 300px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  color: #888;
  font-weight: bold;
}

.title {
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: bold;
}

.snake { color: #4ade80; }
.moth { color: #facc15; }
.rabbit { color: #f87171; }

.value {
  font-variant-numeric: tabular-nums;
}
</style>
