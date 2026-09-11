<template>
  <div class="app-container">
    <!-- 顶部状态栏 -->
    <header class="top-bar">
      <div class="player-info">
        <span class="player-name">{{ player.name }}</span>
        <span class="realm-badge">{{ player.realmInfo.name }}</span>
      </div>
      <div class="stats-bar">
        <div class="stat-item hp">
          <span class="stat-label">气血</span>
          <div class="stat-bar-wrap">
            <div class="stat-bar hp-bar" :style="{ width: hpPercent + '%' }"></div>
            <span class="stat-text">{{ player.hp }}/{{ player.maxHp }}</span>
          </div>
        </div>
        <div class="stat-item cult">
          <span class="stat-label">修为</span>
          <div class="stat-bar-wrap">
            <div class="stat-bar cult-bar" :style="{ width: player.cultProgress * 100 + '%' }"></div>
            <span class="stat-text">{{ formatNum(player.cultivation) }}/{{ formatNum(player.cultNeed) }}</span>
          </div>
        </div>
        <div class="stat-item stone">
          <span class="stat-icon">💎</span>
          <span>{{ formatNum(player.spiritStones) }}</span>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">主页</span>
      </router-link>
      <router-link to="/cultivation" class="nav-item" :class="{ active: $route.path === '/cultivation' }">
        <span class="nav-icon">🧘</span>
        <span class="nav-text">修炼</span>
      </router-link>
      <router-link to="/dungeon" class="nav-item" :class="{ active: $route.path === '/dungeon' || $route.path === '/battle' }">
        <span class="nav-icon">⚔️</span>
        <span class="nav-text">地牢</span>
      </router-link>
      <router-link to="/inventory" class="nav-item" :class="{ active: $route.path === '/inventory' }">
        <span class="nav-icon">🎒</span>
        <span class="nav-text">背包</span>
      </router-link>
      <router-link to="/blacksmith" class="nav-item" :class="{ active: $route.path === '/blacksmith' }">
        <span class="nav-icon">🔨</span>
        <span class="nav-text">工匠</span>
      </router-link>
      <router-link to="/technique" class="nav-item" :class="{ active: $route.path === '/technique' }">
        <span class="nav-icon">📜</span>
        <span class="nav-text">功法</span>
      </router-link>
      <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
        <span class="nav-icon">⚙️</span>
        <span class="nav-text">设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from './stores/player'

const player = usePlayerStore()

const hpPercent = computed(() => Math.max(0, (player.hp / player.maxHp) * 100))

function formatNum(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '兆'
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(2) + '万'
  return Math.floor(n).toString()
}

onMounted(() => {
  player.init()
})

onUnmounted(() => {
  player.destroy()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: linear-gradient(180deg, #0d0d1a 0%, #12121f 50%, #0d0d1a 100%);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.top-bar {
  padding: 6px 12px;
  padding-top: max(6px, env(safe-area-inset-top));
  background: rgba(20, 18, 35, 0.95);
  border-bottom: 1px solid #2a2540;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-size: 15px;
  font-weight: 600;
  color: #e8dcc8;
}

.realm-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #3d2f5f, #5a3f7a);
  border: 1px solid #7a5f9a;
  border-radius: 10px;
  color: #d4b8e8;
}

.stats-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.stat-item.hp, .stat-item.cult {
  flex: 1;
  min-width: 150px;
}

.stat-label {
  color: #8a8090;
  white-space: nowrap;
  width: 30px;
}

.stat-bar-wrap {
  flex: 1;
  height: 16px;
  background: #1a1628;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid #2a2540;
}

.stat-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.hp-bar {
  background: linear-gradient(90deg, #8b2020, #c93030, #e85050);
}

.cult-bar {
  background: linear-gradient(90deg, #2a5a8a, #3a7aba, #5a9aea);
}

.stat-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  white-space: nowrap;
}

.stat-item.stone {
  color: #7ac8e8;
  font-weight: 600;
}

.stat-icon {
  font-size: 14px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav {
  display: flex;
  background: rgba(15, 13, 28, 0.98);
  border-top: 1px solid #2a2540;
  padding: 4px 0;
  padding-bottom: max(4px, env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 2px;
  text-decoration: none;
  color: #6a6070;
  transition: all 0.2s;
  border-radius: 6px;
  min-height: 48px;
  justify-content: center;
}

.nav-item.active {
  color: #c8a8e8;
  background: rgba(100, 70, 140, 0.2);
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 10px;
  margin-top: 2px;
}
</style>
