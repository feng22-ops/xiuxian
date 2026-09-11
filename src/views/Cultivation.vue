<template>
  <div class="cultivation-view">
    <div class="panel">
      <h3 class="panel-title">闭关修炼</h3>
      
      <div class="cult-main">
        <div class="cult-circle">
          <div class="circle-inner">
            <div class="cult-percent">{{ (player.cultProgress * 100).toFixed(1) }}%</div>
            <div class="cult-realm">{{ player.realmInfo.name }}</div>
          </div>
          <svg class="circle-svg" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#2a2540" stroke-width="8" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#cultGrad)" stroke-width="8"
              :stroke-dasharray="circumference" :stroke-dashoffset="circumference * (1 - player.cultProgress)"
              stroke-linecap="round" transform="rotate(-90 100 100)" />
            <defs>
              <linearGradient id="cultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#5a9aea" />
                <stop offset="100%" stop-color="#a87ae8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="cult-info">
          <div class="info-row">
            <span>当前修为</span>
            <span class="info-val">{{ formatNum(player.cultivation) }}</span>
          </div>
          <div class="info-row">
            <span>突破所需</span>
            <span class="info-val">{{ formatNum(player.cultNeed) }}</span>
          </div>
          <div class="info-row">
            <span>修炼速率</span>
            <span class="info-val highlight">{{ player.effectiveCultRate.toFixed(2) }}x</span>
          </div>
          <div class="info-row" v-if="player.nextRealmInfo">
            <span>下一境界</span>
            <span class="info-val realm">{{ player.nextRealmInfo.name }}</span>
          </div>
        </div>
      </div>

      <!-- 突破按钮 -->
      <div class="breakthrough-section">
        <button class="btn-breakthrough" :disabled="!player.canBreakthrough" @click="doBreakthrough">
          {{ player.canBreakthrough ? '尝试突破' : '修为不足' }}
        </button>
        <div class="breakthrough-rate" v-if="player.canBreakthrough">
          成功率：{{ (breakthroughRate * 100).toFixed(0) }}%
          <label class="use-pill">
            <input type="checkbox" v-model="useBreakthroughPill" :disabled="!hasPolingPill" />
            使用破障丹(+20%)
          </label>
        </div>
      </div>
    </div>

    <!-- 修炼加成来源 -->
    <div class="panel">
      <h3 class="panel-title">修炼加成</h3>
      <div class="bonus-list">
        <div class="bonus-item">
          <span>基础速率</span>
          <span>1.00x</span>
        </div>
        <div class="bonus-item">
          <span>功法：{{ technique.name }}</span>
          <span class="bonus-val">{{ technique.cultBonus.toFixed(2) }}x</span>
        </div>
        <div class="bonus-item" v-for="(e, i) in equippedList" :key="'e'+i">
          <span>装备：{{ e.name }}</span>
          <span class="bonus-val">+{{ ((e.cultBonus || 0) * 100).toFixed(0) }}%</span>
        </div>
        <div class="bonus-item" v-for="(b, i) in cultBuffs" :key="'b'+i">
          <span>增益：{{ b.name }}</span>
          <span class="bonus-val">+{{ (b.value * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { getTechniqueById } from '../plugins/techniques'
import { getNextRealm, getBreakthroughRate } from '../plugins/realm'

const player = usePlayerStore()
const router = useRouter()
const useBreakthroughPill = ref(false)

const technique = computed(() => getTechniqueById(player.activeTechnique))
const equippedList = computed(() => Object.values(player.equipped).filter(e => e && e.cultBonus))
const cultBuffs = computed(() => player.activeBuffs.filter(b => b.type === 'cultRate'))

const circumference = 2 * Math.PI * 90

const breakthroughRate = computed(() => {
  const next = getNextRealm(player.realmId, player.subId)
  if (!next) return 0
  let rate = getBreakthroughRate(player.realmId, player.subId, next.isBreakthrough, player.luck)
  if (useBreakthroughPill.value && hasPolingPill.value) rate += 0.2
  return Math.min(0.95, rate)
})

const hasPolingPill = computed(() => {
  return player.inventory.some(i => i.item.id === 'poling' && i.quantity > 0)
})

function formatNum(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(2) + '万'
  return Math.floor(n).toString()
}

function doBreakthrough() {
  const result = player.attemptBreakthrough(useBreakthroughPill.value)
  if (result.success) {
    useBreakthroughPill.value = false
  }
}
</script>

<style scoped>
.cultivation-view {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel {
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 10px;
  padding: 16px;
}

.panel-title {
  font-size: 14px;
  color: #c8b8e0;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2a2540;
}

.cult-main {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
}

.cult-circle {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.circle-svg {
  width: 100%;
  height: 100%;
}

.circle-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.cult-percent {
  font-size: 24px;
  font-weight: 700;
  color: #7ac8e8;
}

.cult-realm {
  font-size: 12px;
  color: #a898b8;
  margin-top: 4px;
}

.cult-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-row span:first-child {
  color: #8a8090;
}

.info-val {
  color: #e0d8c8;
  font-weight: 500;
}

.info-val.highlight {
  color: #7ac8e8;
}

.info-val.realm {
  color: #c8a8e8;
}

.breakthrough-section {
  text-align: center;
  padding-top: 16px;
  border-top: 1px dashed #2a2540;
}

.btn-breakthrough {
  padding: 12px 40px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #5a3f7a, #8a5faa);
  border: 1px solid #aa7fca;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-breakthrough:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(138, 95, 170, 0.4);
}

.btn-breakthrough:disabled {
  background: #2a2540;
  border-color: #3a3550;
  color: #5a5060;
  cursor: not-allowed;
}

.breakthrough-rate {
  margin-top: 10px;
  font-size: 13px;
  color: #a898b8;
}

.use-pill {
  margin-left: 12px;
  font-size: 12px;
  cursor: pointer;
}

.use-pill input {
  margin-right: 4px;
}

.bonus-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bonus-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 10px;
  background: rgba(30, 26, 48, 0.5);
  border-radius: 6px;
}

.bonus-item span:first-child {
  color: #a098a8;
}

.bonus-val {
  color: #7ac8e8;
  font-weight: 500;
}
</style>
