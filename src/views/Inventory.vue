<template>
  <div class="inventory-view">
    <!-- 标签页 -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</button>
      <button class="tab" :class="{ active: activeTab === 'equip' }" @click="activeTab = 'equip'">装备</button>
      <button class="tab" :class="{ active: activeTab === 'pill' }" @click="activeTab = 'pill'">丹药</button>
      <button class="tab" :class="{ active: activeTab === 'talisman' }" @click="activeTab = 'talisman'">符箓</button>
      <button class="tab" :class="{ active: activeTab === 'material' }" @click="activeTab = 'material'">材料</button>
    </div>

    <!-- 已装备 -->
    <div class="equipped-section">
      <h3 class="section-title">已装备</h3>
      <div class="equipped-grid">
        <div v-for="slot in equipSlots" :key="slot.id" class="equip-slot"
          @click="slot.item && unequip(slot.id)">
          <div class="slot-label">{{ slot.name }}</div>
          <div v-if="slot.item" class="slot-item" :style="{ borderColor: slot.item.color }">
            <span class="item-name" :style="{ color: slot.item.color }">{{ slot.item.name }}</span>
            <span class="item-stats">
              攻{{ slot.item.mainStats.atk }} 防{{ slot.item.mainStats.def }} 血{{ slot.item.mainStats.hp }}
            </span>
          </div>
          <div v-else class="slot-empty">空</div>
        </div>
      </div>
    </div>

    <!-- 背包 -->
    <div class="bag-section">
      <div class="bag-header">
        <h3 class="section-title">背包 ({{ player.inventoryCount }}/{{ player.maxInventory }})</h3>
        <button class="decompose-all-btn" @click="decomposeAll" v-if="hasDecomposable">
          🔨 一键分解
        </button>
      </div>
      <div class="bag-grid">
        <div v-for="(inv, i) in filteredItems" :key="i" class="bag-item"
          :class="{ equip: inv.type === 'equip' }"
          :style="inv.type === 'equip' ? { borderColor: inv.item.color } : {}"
          @click="selectItem(inv)">
          <div class="item-icon">{{ getItemIcon(inv) }}</div>
          <div class="item-name" :style="inv.type === 'equip' ? { color: inv.item.color } : {}">
            {{ inv.item.name }}
          </div>
          <div v-if="inv.quantity > 1" class="item-qty">x{{ inv.quantity }}</div>
        </div>
        <div v-if="filteredItems.length === 0" class="bag-empty">背包空空如也</div>
      </div>
    </div>

    <!-- 物品详情弹窗 -->
    <div v-if="selectedItem" class="item-detail-modal" @click.self="selectedItem = null">
      <div class="detail-content">
        <h4 :style="selectedItem.type === 'equip' ? { color: selectedItem.item.color } : {}">
          {{ selectedItem.item.name }}
        </h4>
        <div class="detail-type">{{ getTypeName(selectedItem.type) }}</div>
        
        <!-- 装备属性 -->
        <div v-if="selectedItem.type === 'equip'" class="equip-detail">
          <div class="main-stats">
            <div>攻击 +{{ selectedItem.item.mainStats.atk }}</div>
            <div>防御 +{{ selectedItem.item.mainStats.def }}</div>
            <div>气血 +{{ selectedItem.item.mainStats.hp }}</div>
          </div>
          <div class="sub-stats" v-if="selectedItem.item.subStats && selectedItem.item.subStats.length > 0">
            <div v-for="(s, i) in selectedItem.item.subStats" :key="i">
              {{ s.name }} +{{ s.isPercent ? (s.value * 100).toFixed(1) + '%' : s.value }}
            </div>
          </div>
          <div v-if="selectedItem.item.cultBonus" class="special-stat">
            修炼速度 +{{ (selectedItem.item.cultBonus * 100).toFixed(0) }}%
          </div>
        </div>

        <!-- 消耗品描述 -->
        <p v-else class="item-desc">{{ selectedItem.item.description }}</p>

        <div class="detail-actions">
          <button v-if="selectedItem.type === 'equip'" @click="equipSelected">装备</button>
          <button v-else-if="selectedItem.type === 'pill' || selectedItem.type === 'talisman'" @click="useSelected">使用</button>
          <button class="decompose" v-if="selectedItem.type === 'equip' || selectedItem.type === 'material'" @click="decomposeSelected">🔨 分解</button>
          <button class="sell" @click="sellSelected">出售 ({{ selectedItem.item.price || 10 }}💎)</button>
          <button class="close" @click="selectedItem = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { EQUIP_SLOTS } from '../plugins/items'

const player = usePlayerStore()
const activeTab = ref('all')
const selectedItem = ref(null)

const equipSlots = computed(() => {
  return EQUIP_SLOTS.map(s => ({
    ...s,
    item: player.equipped[s.id]
  }))
})

const filteredItems = computed(() => {
  if (activeTab.value === 'all') return player.inventory
  return player.inventory.filter(i => i.type === activeTab.value)
})

function getItemIcon(inv) {
  const icons = { equip: '⚔️', pill: '💊', talisman: '📜', material: '🔮' }
  return icons[inv.type] || '📦'
}

function getTypeName(type) {
  const names = { equip: '装备', pill: '丹药', talisman: '符箓', material: '材料' }
  return names[type] || type
}

function selectItem(inv) {
  selectedItem.value = inv
}

function equipSelected() {
  if (selectedItem.value) {
    player.equipItem(selectedItem.value.item)
    selectedItem.value = null
  }
}

function useSelected() {
  if (selectedItem.value) {
    player.useItem(selectedItem.value.item.id)
    selectedItem.value = null
  }
}

function sellSelected() {
  if (selectedItem.value) {
    player.sellItem(selectedItem.value.item.id)
    selectedItem.value = null
  }
}

function unequip(slotId) {
  player.unequipItem(slotId)
}

const hasDecomposable = computed(() => {
  return player.inventory.some(i => i.type === 'equip' && i.item.quality === 'common' || i.type === 'equip' && i.item.quality === 'fine')
})

function decomposeSelected() {
  if (selectedItem.value) {
    const result = player.decomposeItem(selectedItem.value.item.id)
    if (result.success) {
      selectedItem.value = null
    }
  }
}

function decomposeAll() {
  if (confirm('确定要分解所有凡品和良品装备吗？')) {
    player.decomposeAll(true)
  }
}
</script>

<style scoped>
.inventory-view {
  max-width: 700px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: rgba(22, 19, 38, 0.6);
  padding: 4px;
  border-radius: 8px;
}

.tab {
  flex: 1;
  padding: 8px 4px;
  font-size: 13px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #8a8090;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: linear-gradient(135deg, #3d2f5f, #5a3f7a);
  color: #e0d0f0;
}

.section-title {
  font-size: 14px;
  color: #c8b8e0;
  margin-bottom: 10px;
}

.equipped-section {
  margin-bottom: 16px;
}

.equipped-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.equip-slot {
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  min-height: 70px;
}

.slot-label {
  font-size: 11px;
  color: #6a6070;
  margin-bottom: 4px;
}

.slot-item {
  border-left: 3px solid;
  padding-left: 6px;
}

.slot-item .item-name {
  font-size: 12px;
  font-weight: 600;
  display: block;
}

.slot-item .item-stats {
  font-size: 10px;
  color: #8a8090;
}

.slot-empty {
  font-size: 14px;
  color: #3a3550;
  text-align: center;
  line-height: 40px;
}

.bag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}

.bag-item {
  position: relative;
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 8px;
  padding: 10px 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  touch-action: manipulation;
}

.bag-item:active {
  transform: scale(0.95);
  border-color: #7a6a9a;
}

.bag-item:hover {
  transform: translateY(-2px);
  border-color: #5a4a7a;
}

.bag-item.equip {
  border-width: 2px;
}

.item-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.bag-item .item-name {
  font-size: 11px;
  color: #c0b8c8;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-qty {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 11px;
  color: #f0d060;
  font-weight: 600;
}

.bag-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #5a5060;
  padding: 40px;
  font-size: 13px;
}

.item-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.detail-content {
  background: #1a1628;
  border: 1px solid #4a3f60;
  border-radius: 12px;
  padding: 20px;
  max-width: 350px;
  width: 100%;
}

.detail-content h4 {
  font-size: 16px;
  margin-bottom: 4px;
}

.detail-type {
  font-size: 12px;
  color: #7a7080;
  margin-bottom: 12px;
}

.main-stats, .sub-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.main-stats div, .sub-stats div {
  font-size: 13px;
  color: #b0a8b8;
}

.sub-stats div {
  color: #7ac8e8;
}

.special-stat {
  font-size: 13px;
  color: #f0d060;
  margin-bottom: 10px;
}

.item-desc {
  font-size: 13px;
  color: #b0a8b8;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-actions button {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid;
}

.detail-actions button:not(.sell):not(.close) {
  background: linear-gradient(135deg, #3a5a3a, #5a7a5a);
  border-color: #7a9a7a;
  color: #d0f0d0;
}

.detail-actions .sell {
  background: linear-gradient(135deg, #5a5a3a, #7a7a5a);
  border-color: #9a9a7a;
  color: #f0f0d0;
}

.detail-actions .close {
  background: #2a2540;
  border-color: #4a4060;
  color: #a098a8;
}

.detail-actions .decompose {
  background: linear-gradient(135deg, #4a3a2a, #6a5a4a);
  border-color: #8a7a6a;
  color: #f0e0d0;
}

.decompose-all-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid #8a7a6a;
  background: linear-gradient(135deg, #4a3a2a, #6a5a4a);
  color: #f0e0d0;
  cursor: pointer;
}
</style>
