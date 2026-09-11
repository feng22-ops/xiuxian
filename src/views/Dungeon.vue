<template>
  <div class="dungeon-view">
    <!-- 不在地牢中：选择地牢 -->
    <div v-if="!player.inDungeon" class="dungeon-select">
      <h3 class="section-title">选择地牢</h3>
      <div class="dungeon-list">
        <div v-for="dungeon in dungeons" :key="dungeon.id" class="dungeon-card"
          :class="{ locked: player.realmId < dungeon.minRealm }">
          <div class="dungeon-header">
            <span class="dungeon-name">{{ dungeon.name }}</span>
            <span class="dungeon-depth">{{ dungeon.maxDepth }}层</span>
          </div>
          <p class="dungeon-desc">{{ dungeon.desc }}</p>
          <div class="dungeon-meta">
            <span>需求境界：{{ REALMS[dungeon.minRealm].name }}+</span>
            <span>奖励倍率：x{{ dungeon.rewardMult }}</span>
          </div>
          <button class="btn-enter" :disabled="player.realmId < dungeon.minRealm"
            @click="enterDungeon(dungeon.id)">
            {{ player.realmId < dungeon.minRealm ? '境界不足' : '进入' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 在地牢中 -->
    <div v-else class="dungeon-inside">
      <div class="dungeon-status">
        <div class="status-left">
          <span class="dungeon-title">{{ player.currentDungeon.name }}</span>
          <span class="depth-badge">第 {{ player.dungeonDepth }} 层</span>
        </div>
        <button class="btn-exit" @click="exitDungeon">离开地牢</button>
      </div>

      <!-- 地牢日志 -->
      <div class="dungeon-log" v-if="player.dungeonLog.length > 0">
        <div v-for="(log, i) in player.dungeonLog.slice(-5)" :key="i" class="log-line">{{ log }}</div>
      </div>

      <!-- 房间选择 -->
      <div class="floor-rooms" v-if="player.currentFloor && !player.inBattle">
        <h4 class="floor-title">{{ player.currentFloor.isBossFloor ? '⚡ BOSS层' : '选择前进路线' }}</h4>
        <div class="rooms-grid">
          <div v-for="(room, idx) in player.currentFloor.rooms" :key="room.id"
            class="room-card" :class="{ cleared: room.cleared }"
            @click="enterRoom(idx)">
            <div class="room-icon">{{ room.icon }}</div>
            <div class="room-name">{{ room.name }}</div>
            <div class="room-desc">{{ room.desc }}</div>
            <div v-if="room.cleared" class="room-cleared">已通过</div>
          </div>
        </div>

        <!-- 下一层按钮 -->
        <div class="next-floor" v-if="player.canGoNextFloor()">
          <button class="btn-next" @click="player.nextFloor()">
            {{ player.currentFloor.isBossFloor ? '前往下一层 →' : '深入下一层 →' }}
          </button>
        </div>
      </div>

      <!-- 奇遇事件弹窗 -->
      <div v-if="currentEvent" class="event-modal">
        <div class="event-content">
          <h4>{{ currentEvent.name }}</h4>
          <p>{{ currentEvent.desc }}</p>
          <div class="event-choices">
            <button v-for="(choice, i) in currentEvent.choices" :key="i"
              class="choice-btn" @click="resolveEvent(i)">
              {{ choice.text }}
            </button>
          </div>
          <div v-if="eventResult" class="event-result">{{ eventResult }}</div>
        </div>
      </div>

      <!-- 商店弹窗 -->
      <div v-if="shopItems" class="shop-modal">
        <div class="shop-content">
          <h4>🏪 神秘商人</h4>
          <p class="shop-tip">灵石：{{ player.spiritStones }}</p>
          <div class="shop-list">
            <div v-for="(item, i) in shopItems" :key="i" class="shop-item" :class="{ sold: item.sold }">
              <span class="item-name">{{ getItemName(item.id) }}</span>
              <span class="item-price">{{ getPrice(item.id) }} 💎</span>
              <button :disabled="item.sold || player.spiritStones < getPrice(item.id)"
                @click="buyItem(item, i)">购买</button>
            </div>
          </div>
          <button class="btn-close" @click="closeShop">离开</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { DUNGEON_CONFIGS } from '../plugins/dungeon'
import { REALMS } from '../plugins/realm'
import { getItemById, PILLS, TALISMANS } from '../plugins/items'

const player = usePlayerStore()
const router = useRouter()
const dungeons = DUNGEON_CONFIGS

const currentEvent = ref(null)
const eventResult = ref(null)
const shopItems = ref(null)

// 监听战斗状态，进入战斗时跳转
watch(() => player.inBattle, (inBattle) => {
  if (inBattle) {
    router.push('/battle')
  }
})

function enterDungeon(id) {
  const result = player.enterDungeon(id)
  if (!result.success) {
    alert(result.reason)
  }
}

function enterRoom(idx) {
  const result = player.enterRoom(idx)
  if (result.battle) {
    router.push('/battle')
  } else if (result.event) {
    currentEvent.value = result.event
    eventResult.value = null
  } else if (result.shop) {
    shopItems.value = result.shop
  }
}

function resolveEvent(choiceIdx) {
  const result = player.resolveEventChoice(currentEvent.value, choiceIdx)
  eventResult.value = result.text
  if (result.battle) {
    setTimeout(() => {
      currentEvent.value = null
      router.push('/battle')
    }, 1000)
  } else if (result.shop) {
    // 商店逻辑
  } else {
    setTimeout(() => {
      currentEvent.value = null
      eventResult.value = null
    }, 1500)
  }
}

function buyItem(item, idx) {
  const price = getPrice(item.id)
  const result = player.buyShopItem(item.id, price)
  if (result.success) {
    shopItems.value[idx].sold = true
  }
}

function closeShop() {
  shopItems.value = null
  // 标记商店房间已通过
  if (player.currentFloor) {
    const shopRoom = player.currentFloor.rooms.find(r => r.type === 'shop')
    if (shopRoom) shopRoom.cleared = true
    player.checkFloorCleared()
  }
}

function exitDungeon() {
  if (confirm('确定要离开地牢吗？当前进度将丢失。')) {
    player.exitDungeon(false)
  }
}

function getItemName(id) {
  const item = getItemById(id)
  return item ? item.name : id
}

function getPrice(id) {
  const item = getItemById(id)
  return item ? item.price : 0
}
</script>

<style scoped>
.dungeon-view {
  max-width: 700px;
  margin: 0 auto;
}

.section-title {
  font-size: 16px;
  color: #c8b8e0;
  margin-bottom: 16px;
  text-align: center;
}

.dungeon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dungeon-card {
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 10px;
  padding: 14px;
  transition: all 0.2s;
}

.dungeon-card:hover:not(.locked) {
  border-color: #5a4a7a;
  transform: translateY(-2px);
}

.dungeon-card.locked {
  opacity: 0.5;
}

.dungeon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dungeon-name {
  font-size: 16px;
  font-weight: 600;
  color: #e0d0f0;
}

.dungeon-depth {
  font-size: 12px;
  color: #8a8090;
}

.dungeon-desc {
  font-size: 12px;
  color: #a098a8;
  margin-bottom: 10px;
  line-height: 1.5;
}

.dungeon-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #7a7080;
  margin-bottom: 12px;
}

.btn-enter {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #5a3f7a, #8a5faa);
  border: 1px solid #aa7fca;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.btn-enter:disabled {
  background: #2a2540;
  border-color: #3a3550;
  color: #5a5060;
  cursor: not-allowed;
}

.dungeon-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(22, 19, 38, 0.9);
  border: 1px solid #2a2540;
  border-radius: 8px;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dungeon-title {
  font-size: 15px;
  font-weight: 600;
  color: #e0d0f0;
}

.depth-badge {
  font-size: 12px;
  padding: 2px 10px;
  background: linear-gradient(135deg, #8a3f3f, #aa5f5f);
  border-radius: 10px;
  color: #f0d0d0;
}

.btn-exit {
  padding: 6px 14px;
  font-size: 12px;
  background: #2a2540;
  border: 1px solid #4a4060;
  border-radius: 6px;
  color: #a098a8;
  cursor: pointer;
}

.dungeon-log {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(15, 13, 28, 0.8);
  border-radius: 8px;
  border-left: 3px solid #5a4a7a;
}

.log-line {
  font-size: 12px;
  color: #b0a8b8;
  padding: 2px 0;
}

.floor-title {
  font-size: 14px;
  color: #c8b8e0;
  margin-bottom: 12px;
  text-align: center;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.room-card {
  position: relative;
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 10px;
  padding: 16px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  touch-action: manipulation;
}

.room-card:active:not(.cleared) {
  transform: scale(0.97);
  background: rgba(50, 40, 70, 0.8);
}

.room-card:hover:not(.cleared) {
  border-color: #7a5f9a;
  background: rgba(40, 32, 60, 0.8);
  transform: translateY(-2px);
}

.room-card.cleared {
  opacity: 0.4;
  cursor: default;
}

.room-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.room-name {
  font-size: 14px;
  font-weight: 600;
  color: #e0d0f0;
  margin-bottom: 4px;
}

.room-desc {
  font-size: 11px;
  color: #7a7080;
}

.room-cleared {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: #5aaa7a;
  font-weight: 600;
}

.next-floor {
  text-align: center;
}

.btn-next {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #3a5a7a, #5a7aaa);
  border: 1px solid #7a9aca;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.event-modal, .shop-modal {
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

.event-content, .shop-content {
  background: #1a1628;
  border: 1px solid #4a3f60;
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
  width: 100%;
}

.event-content h4, .shop-content h4 {
  font-size: 16px;
  color: #e0d0f0;
  margin-bottom: 10px;
}

.event-content p {
  font-size: 13px;
  color: #b0a8b8;
  line-height: 1.6;
  margin-bottom: 16px;
}

.event-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-btn {
  padding: 10px 14px;
  font-size: 13px;
  text-align: left;
  background: rgba(40, 32, 60, 0.8);
  border: 1px solid #3a3050;
  border-radius: 8px;
  color: #d0c8d8;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-btn:hover {
  background: rgba(60, 48, 80, 0.8);
  border-color: #5a4a7a;
}

.event-result {
  margin-top: 12px;
  padding: 10px;
  background: rgba(60, 80, 60, 0.3);
  border-radius: 6px;
  font-size: 13px;
  color: #a0d8a0;
}

.shop-tip {
  font-size: 13px;
  color: #7ac8e8;
  margin-bottom: 12px;
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(30, 26, 48, 0.6);
  border-radius: 6px;
}

.shop-item.sold {
  opacity: 0.4;
}

.item-name {
  flex: 1;
  font-size: 13px;
  color: #d0c8d8;
}

.item-price {
  font-size: 13px;
  color: #f0d060;
}

.shop-item button {
  padding: 4px 12px;
  font-size: 12px;
  background: linear-gradient(135deg, #3a5a3a, #5a7a5a);
  border: 1px solid #7a9a7a;
  border-radius: 6px;
  color: #d0f0d0;
  cursor: pointer;
}

.shop-item button:disabled {
  background: #2a2540;
  border-color: #3a3550;
  color: #5a5060;
  cursor: not-allowed;
}

.btn-close {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  background: #2a2540;
  border: 1px solid #4a4060;
  border-radius: 8px;
  color: #a098a8;
  cursor: pointer;
}
</style>
