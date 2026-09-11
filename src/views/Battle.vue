<template>
  <div class="battle-view">
    <div v-if="!player.inBattle" class="battle-empty">
      <p>当前没有战斗</p>
      <button @click="$router.push('/dungeon')">返回地牢</button>
    </div>

    <div v-else class="battle-arena">
      <!-- 怪物信息 -->
      <div class="monster-section">
        <div class="monster-info">
          <span class="monster-name">{{ player.currentMonster.name }}</span>
          <span class="monster-tag" v-if="player.currentMonster.isBoss">BOSS</span>
          <span class="monster-tag elite" v-else-if="player.currentMonster.isElite">精英</span>
        </div>
        <div class="hp-bar-wrap">
          <div class="hp-bar monster-hp" :style="{ width: monsterHpPercent + '%' }"></div>
          <span class="hp-text">{{ player.currentMonster.hp }}/{{ player.currentMonster.maxHp }}</span>
        </div>
        <div class="monster-stats">
          <span>攻击 {{ player.currentMonster.atk }}</span>
          <span>防御 {{ player.currentMonster.def }}</span>
          <span>速度 {{ player.currentMonster.speed }}</span>
        </div>
        <div class="monster-skills" v-if="player.currentMonster.skills && player.currentMonster.skills.length > 0">
          <span v-for="s in player.currentMonster.skills" :key="s" class="skill-tag">{{ getSkillName(s) }}</span>
        </div>
      </div>

      <!-- VS -->
      <div class="vs-divider">⚔️</div>

      <!-- 玩家信息 -->
      <div class="player-section">
        <div class="player-info">
          <span class="player-name">{{ player.name }}</span>
          <span class="player-realm">{{ player.realmInfo.name }}</span>
        </div>
        <div class="hp-bar-wrap">
          <div class="hp-bar player-hp" :style="{ width: playerHpPercent + '%' }"></div>
          <span class="hp-text">{{ player.hp }}/{{ player.maxHp }}</span>
        </div>
        <div class="player-stats">
          <span>攻击 {{ player.atk }}</span>
          <span>防御 {{ player.def }}</span>
          <span>速度 {{ player.speed }}</span>
        </div>
        <div class="player-buffs" v-if="player.statusEffects.length > 0 || player.shield > 0">
          <span v-if="player.shield > 0" class="buff-tag shield">护盾 {{ player.shield }}</span>
          <span v-for="(e, i) in player.statusEffects" :key="i" class="debuff-tag">{{ getEffectName(e.type) }}</span>
        </div>
      </div>

      <!-- 战斗日志 -->
      <div class="battle-log">
        <div v-for="(log, i) in player.battleLog.slice(-8)" :key="i" class="battle-log-line"
          :class="{ crit: log.includes('暴击'), heal: log.includes('恢复') || log.includes('吸取'), dmg: log.includes('伤害') }">
          {{ log }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="battle-actions">
        <button class="action-btn attack" @click="playerAttack">攻击</button>
        <button class="action-btn defend" @click="playerDefend">防御</button>
        <button class="action-btn item" @click="showItems = !showItems">道具</button>
        <button class="action-btn flee" @click="tryFlee">逃跑</button>
      </div>

      <!-- 道具面板 -->
      <div v-if="showItems" class="item-panel">
        <h4>可用道具</h4>
        <div class="item-list">
          <div v-for="(inv, i) in usableItems" :key="i" class="item-row">
            <span class="item-name">{{ inv.item.name }} x{{ inv.quantity }}</span>
            <span class="item-desc">{{ inv.item.description }}</span>
            <button @click="useItem(inv.item.id)">使用</button>
          </div>
          <div v-if="usableItems.length === 0" class="no-items">没有可用道具</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { MONSTER_SKILLS } from '../plugins/monsters'

const player = usePlayerStore()
const router = useRouter()
const showItems = ref(false)

const monsterHpPercent = computed(() => {
  if (!player.currentMonster) return 0
  return Math.max(0, (player.currentMonster.hp / player.currentMonster.maxHp) * 100)
})

const playerHpPercent = computed(() => Math.max(0, (player.hp / player.maxHp) * 100))

const usableItems = computed(() => {
  return player.inventory.filter(i => i.type === 'pill' || (i.type === 'talisman' && i.item.effect?.type !== 'escape'))
})

// 战斗结束后跳转
watch(() => player.inBattle, (inBattle) => {
  if (!inBattle) {
    setTimeout(() => {
      if (player.inDungeon) {
        router.push('/dungeon')
      } else {
        router.push('/')
      }
    }, 1500)
  }
})

function playerAttack() {
  player.playerAttack()
}

function playerDefend() {
  player.playerDefend()
}

function useItem(itemId) {
  const result = player.playerUseItem(itemId)
  if (result.success) {
    showItems.value = false
  }
}

function tryFlee() {
  const success = player.tryFlee()
  if (success) {
    setTimeout(() => router.push('/dungeon'), 800)
  }
}

function getSkillName(skillId) {
  return MONSTER_SKILLS[skillId]?.name || skillId
}

function getEffectName(type) {
  const names = { poison: '中毒', burn: '灼烧', stun: '眩晕', slow: '减速' }
  return names[type] || type
}
</script>

<style scoped>
.battle-view {
  max-width: 600px;
  margin: 0 auto;
}

.battle-empty {
  text-align: center;
  padding: 60px 20px;
  color: #7a7080;
}

.battle-empty button {
  margin-top: 16px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #5a3f7a, #8a5faa);
  border: 1px solid #aa7fca;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.battle-arena {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.monster-section, .player-section {
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 10px;
  padding: 14px;
}

.monster-info, .player-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.monster-name {
  font-size: 16px;
  font-weight: 600;
  color: #e8a0a0;
}

.player-name {
  font-size: 16px;
  font-weight: 600;
  color: #a0c8e8;
}

.monster-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #8a2f2f, #aa4f4f);
  border-radius: 4px;
  color: #fff;
}

.monster-tag.elite {
  background: linear-gradient(135deg, #7a5a2f, #9a7a4f);
}

.player-realm {
  font-size: 12px;
  color: #c8a8e8;
}

.hp-bar-wrap {
  position: relative;
  height: 20px;
  background: #1a1628;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #2a2540;
  margin-bottom: 8px;
}

.hp-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.monster-hp {
  background: linear-gradient(90deg, #8b2020, #c93030, #e85050);
}

.player-hp {
  background: linear-gradient(90deg, #2a6a4a, #3a8a5a, #5aaa7a);
}

.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

.monster-stats, .player-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8a8090;
}

.monster-skills, .player-buffs {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.skill-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(138, 47, 47, 0.3);
  border: 1px solid #6a3030;
  border-radius: 4px;
  color: #e8a0a0;
}

.buff-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(90, 140, 200, 0.3);
  border: 1px solid #4070a0;
  border-radius: 4px;
  color: #a0c8e8;
}

.buff-tag.shield {
  background: rgba(90, 200, 180, 0.3);
  border-color: #40a090;
  color: #a0e8d8;
}

.debuff-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(138, 47, 47, 0.3);
  border: 1px solid #6a3030;
  border-radius: 4px;
  color: #e8a0a0;
}

.vs-divider {
  text-align: center;
  font-size: 20px;
  color: #7a6a8a;
}

.battle-log {
  background: rgba(15, 13, 28, 0.9);
  border: 1px solid #2a2540;
  border-radius: 8px;
  padding: 10px 14px;
  max-height: 160px;
  overflow-y: auto;
}

.battle-log-line {
  font-size: 12px;
  color: #b0a8b8;
  padding: 2px 0;
}

.battle-log-line.crit { color: #f0a060; }
.battle-log-line.heal { color: #60c880; }
.battle-log-line.dmg { color: #e88080; }

.battle-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.action-btn {
  padding: 14px 4px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid;
  min-height: 52px;
  touch-action: manipulation;
}

.action-btn:active {
  transform: scale(0.95);
  filter: brightness(0.9);
}

.action-btn.attack {
  background: linear-gradient(135deg, #8a3f3f, #aa5f5f);
  border-color: #ca7f7f;
  color: #fff;
}

.action-btn.defend {
  background: linear-gradient(135deg, #3f5a8a, #5f7aaa);
  border-color: #7f9aca;
  color: #fff;
}

.action-btn.item {
  background: linear-gradient(135deg, #5a8a3f, #7aaa5f);
  border-color: #9aca7f;
  color: #fff;
}

.action-btn.flee {
  background: linear-gradient(135deg, #5a5a3f, #7a7a5f);
  border-color: #9a9a7f;
  color: #fff;
}

.action-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.item-panel {
  background: rgba(22, 19, 38, 0.95);
  border: 1px solid #4a3f60;
  border-radius: 10px;
  padding: 14px;
}

.item-panel h4 {
  font-size: 14px;
  color: #c8b8e0;
  margin-bottom: 10px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(30, 26, 48, 0.6);
  border-radius: 6px;
}

.item-row .item-name {
  font-size: 13px;
  color: #e0d8c8;
  min-width: 100px;
}

.item-row .item-desc {
  flex: 1;
  font-size: 11px;
  color: #7a7080;
}

.item-row button {
  padding: 4px 12px;
  font-size: 12px;
  background: linear-gradient(135deg, #5a8a3f, #7aaa5f);
  border: 1px solid #9aca7f;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.no-items {
  text-align: center;
  color: #5a5060;
  padding: 20px;
  font-size: 12px;
}
</style>
