<template>
  <div class="blacksmith-view">
    <div class="blacksmith-header">
      <h2>🔨 铁匠铺</h2>
      <p class="subtitle">用锻造材料升级装备，提升属性</p>
    </div>

    <!-- 材料库存 -->
    <div class="materials-section">
      <h3 class="section-title">锻造材料</h3>
      <div class="materials-grid">
        <div v-for="mat in forgeMaterials" :key="mat.id" class="material-item">
          <span class="mat-icon">🔮</span>
          <span class="mat-name">{{ mat.name }}</span>
          <span class="mat-qty">x{{ getMaterialCount(mat.id) }}</span>
        </div>
      </div>
    </div>

    <!-- 装备列表 -->
    <div class="equip-section">
      <h3 class="section-title">可锻造装备</h3>
      <div class="equip-list">
        <!-- 已装备 -->
        <div v-for="(equip, slot) in player.equipped" :key="'eq-'+slot" v-if="equip"
          class="equip-card" :class="{ selected: selectedEquip?.id === equip.id }"
          :style="{ borderColor: equip.color }"
          @click="selectEquip(equip)">
          <div class="equip-header">
            <span class="equip-name" :style="{ color: equip.color }">{{ equip.name }}</span>
            <span class="equip-level" v-if="equip.level > 0">+{{ equip.level }}</span>
          </div>
          <div class="equip-slot">{{ getSlotName(slot) }}（已装备）</div>
          <div class="equip-stats">
            攻{{ equip.mainStats.atk }} 防{{ equip.mainStats.def }} 血{{ equip.mainStats.hp }}
          </div>
        </div>
        <!-- 背包中的装备 -->
        <div v-for="inv in inventoryEquips" :key="inv.item.id"
          class="equip-card" :class="{ selected: selectedEquip?.id === inv.item.id }"
          :style="{ borderColor: inv.item.color }"
          @click="selectEquip(inv.item)">
          <div class="equip-header">
            <span class="equip-name" :style="{ color: inv.item.color }">{{ inv.item.name }}</span>
            <span class="equip-level" v-if="inv.item.level > 0">+{{ inv.item.level }}</span>
          </div>
          <div class="equip-slot">{{ getSlotName(inv.item.slot) }}</div>
          <div class="equip-stats">
            攻{{ inv.item.mainStats.atk }} 防{{ inv.item.mainStats.def }} 血{{ inv.item.mainStats.hp }}
          </div>
        </div>
        <div v-if="allEquips.length === 0" class="no-equip">没有可锻造的装备</div>
      </div>
    </div>

    <!-- 锻造面板 -->
    <div v-if="selectedEquip" class="forge-panel">
      <h3 class="section-title">锻造 {{ selectedEquip.name }} <span v-if="selectedEquip.level > 0">+{{ selectedEquip.level }}</span></h3>
      
      <div class="forge-info">
        <div class="forge-row">
          <span>当前等级</span>
          <span class="value">+{{ selectedEquip.level || 0 }}</span>
        </div>
        <div class="forge-row">
          <span>升级后</span>
          <span class="value success">+{{ (selectedEquip.level || 0) + 1 }}（属性+10%）</span>
        </div>
        <div class="forge-row" v-if="forgeCost">
          <span>消耗材料</span>
          <span class="value" :class="{ insufficient: getMaterialCount(forgeCost.material) < forgeCost.amount }">
            {{ forgeCost.materialName }} x{{ forgeCost.amount }}（拥有{{ getMaterialCount(forgeCost.material) }}）
          </span>
        </div>
        <div class="forge-row" v-if="forgeCost">
          <span>消耗灵石</span>
          <span class="value" :class="{ insufficient: player.spiritStones < forgeCost.stone }">
            💎 {{ forgeCost.stone }}（拥有{{ player.spiritStones }}）
          </span>
        </div>
        <div class="forge-row" v-if="forgeCost">
          <span>成功率</span>
          <span class="value">{{ Math.floor(forgeCost.successRate * 100) }}%</span>
        </div>
      </div>

      <button class="forge-btn" :disabled="!canForge" @click="doForge">
        🔨 开始锻造
      </button>
      <p v-if="forgeMessage" class="forge-message" :class="{ success: forgeSuccess, fail: !forgeSuccess }">
        {{ forgeMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { MATERIALS, EQUIP_SLOTS } from '../plugins/items'

const player = usePlayerStore()
const selectedEquip = ref(null)
const forgeMessage = ref('')
const forgeSuccess = ref(false)

const forgeMaterials = computed(() => {
  return MATERIALS.filter(m => m.category === 'forge')
})

const inventoryEquips = computed(() => {
  return player.inventory.filter(i => i.type === 'equip')
})

const allEquips = computed(() => {
  const equipped = Object.entries(player.equipped).filter(([_, e]) => e).map(([slot, e]) => ({ ...e, _slot: slot }))
  const inv = inventoryEquips.value.map(i => ({ ...i.item, _inv: true }))
  return [...equipped, ...inv]
})

function getMaterialCount(id) {
  const inv = player.inventory.find(i => i.type === 'material' && i.item.id === id)
  return inv ? inv.quantity : 0
}

function getSlotName(slotId) {
  const slot = EQUIP_SLOTS.find(s => s.id === slotId)
  return slot ? slot.name : slotId
}

function selectEquip(equip) {
  selectedEquip.value = equip
  forgeMessage.value = ''
}

const forgeCost = computed(() => {
  if (!selectedEquip.value) return null
  return player.getForgeCost(selectedEquip.value)
})

const canForge = computed(() => {
  if (!forgeCost.value) return false
  return getMaterialCount(forgeCost.value.material) >= forgeCost.value.amount &&
         player.spiritStones >= forgeCost.value.stone
})

function doForge() {
  if (!selectedEquip.value || !canForge.value) return
  const result = player.forgeEquip(selectedEquip.value.id)
  if (result.success) {
    forgeMessage.value = `锻造成功！${result.equip.name} 升至 +${result.level}`
    forgeSuccess.value = true
  } else {
    forgeMessage.value = result.reason || '锻造失败'
    forgeSuccess.value = false
  }
}
</script>

<style scoped>
.blacksmith-view {
  max-width: 700px;
  margin: 0 auto;
}

.blacksmith-header {
  text-align: center;
  margin-bottom: 20px;
}
.blacksmith-header h2 {
  font-size: 24px;
  color: #f0e0d0;
  margin: 0 0 4px;
}
.subtitle {
  font-size: 13px;
  color: #8a8098;
  margin: 0;
}

.section-title {
  font-size: 16px;
  color: #c0b8d0;
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(120, 100, 160, 0.3);
}

.materials-section {
  background: rgba(22, 19, 38, 0.6);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.materials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.material-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: rgba(40, 35, 60, 0.6);
  border-radius: 8px;
  font-size: 12px;
}
.mat-icon { font-size: 16px; }
.mat-name { color: #c0b8d0; flex: 1; }
.mat-qty { color: #f0e0d0; font-weight: 600; }

.equip-section {
  background: rgba(22, 19, 38, 0.6);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.equip-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.equip-card {
  padding: 12px;
  background: rgba(40, 35, 60, 0.6);
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.equip-card:hover {
  background: rgba(60, 50, 80, 0.8);
}
.equip-card.selected {
  background: rgba(80, 60, 100, 0.8);
  box-shadow: 0 0 12px rgba(160, 120, 200, 0.4);
}
.equip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.equip-name {
  font-size: 13px;
  font-weight: 600;
}
.equip-level {
  font-size: 12px;
  color: #f0a060;
  font-weight: 700;
}
.equip-slot {
  font-size: 11px;
  color: #8a8098;
  margin-bottom: 4px;
}
.equip-stats {
  font-size: 11px;
  color: #a098a8;
}
.no-equip {
  grid-column: 1 / -1;
  text-align: center;
  color: #6a6078;
  padding: 20px;
}

.forge-panel {
  background: rgba(22, 19, 38, 0.6);
  border-radius: 12px;
  padding: 16px;
}
.forge-info {
  margin-bottom: 16px;
}
.forge-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(120, 100, 160, 0.15);
  font-size: 13px;
}
.forge-row .value {
  color: #e0d8e8;
  font-weight: 500;
}
.forge-row .value.success { color: #60c880; }
.forge-row .value.insufficient { color: #e88080; }

.forge-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 10px;
  border: 2px solid #8a7a6a;
  background: linear-gradient(135deg, #4a3a2a, #6a5a4a);
  color: #f0e0d0;
  cursor: pointer;
}
.forge-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.forge-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #5a4a3a, #7a6a5a);
}

.forge-message {
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
}
.forge-message.success { color: #60c880; }
.forge-message.fail { color: #e88080; }
</style>
