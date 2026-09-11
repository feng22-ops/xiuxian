<template>
  <div class="home-view">
    <!-- 角色面板 -->
    <div class="panel character-panel">
      <h3 class="panel-title">角色信息</h3>
      <div class="char-grid">
        <div class="char-row">
          <span class="char-label">境界</span>
          <span class="char-value realm">{{ player.realmInfo.name }}</span>
        </div>
        <div class="char-row">
          <span class="char-label">攻击</span>
          <span class="char-value atk">{{ player.atk }}</span>
        </div>
        <div class="char-row">
          <span class="char-label">防御</span>
          <span class="char-value def">{{ player.def }}</span>
        </div>
        <div class="char-row">
          <span class="char-label">速度</span>
          <span class="char-value">{{ player.speed }}</span>
        </div>
        <div class="char-row">
          <span class="char-label">暴击</span>
          <span class="char-value">{{ (player.critRate * 100).toFixed(1) }}%</span>
        </div>
        <div class="char-row">
          <span class="char-label">闪避</span>
          <span class="char-value">{{ (player.dodgeRate * 100).toFixed(1) }}%</span>
        </div>
        <div class="char-row">
          <span class="char-label">吸血</span>
          <span class="char-value">{{ (player.vampireRate * 100).toFixed(1) }}%</span>
        </div>
        <div class="char-row">
          <span class="char-label">幸运</span>
          <span class="char-value luck">{{ player.luck.toFixed(1) }}</span>
        </div>
      </div>
      <div class="attr-points" v-if="player.attributePoints > 0">
        <span class="attr-tip">可分配属性点：{{ player.attributePoints }}</span>
        <div class="attr-buttons">
          <button @click="player.allocateAttr('atk')">攻击+</button>
          <button @click="player.allocateAttr('def')">防御+</button>
          <button @click="player.allocateAttr('hp')">气血+</button>
          <button @click="player.allocateAttr('speed')">速度+</button>
          <button @click="player.allocateAttr('luck')">幸运+</button>
        </div>
      </div>
    </div>

    <!-- 修炼状态 -->
    <div class="panel cult-panel">
      <h3 class="panel-title">修炼状态</h3>
      <div class="cult-status">
        <div class="cult-toggle">
          <span>自动修炼</span>
          <button class="toggle-btn" :class="{ on: player.isCultivating }" @click="player.isCultivating = !player.isCultivating">
            {{ player.isCultivating ? '开启' : '关闭' }}
          </button>
        </div>
        <div class="cult-rate">
          <span>修炼速率：</span>
          <span class="rate-value">{{ player.effectiveCultRate.toFixed(2) }}x</span>
        </div>
        <div class="cult-next" v-if="player.nextRealmInfo">
          <span>下一境界：</span>
          <span class="next-realm">{{ player.nextRealmInfo.name }}</span>
        </div>
      </div>
      <div class="active-buffs" v-if="player.activeBuffs.length > 0">
        <h4>生效增益</h4>
        <div class="buff-list">
          <span v-for="(buff, i) in player.activeBuffs" :key="i" class="buff-tag">
            {{ buff.name }} ({{ buff.duration }}s)
          </span>
        </div>
      </div>
    </div>

    <!-- 游戏日志 -->
    <div class="panel log-panel">
      <h3 class="panel-title">事件日志</h3>
      <div class="log-list">
        <div v-for="(log, i) in player.gameLog.slice(0, 30)" :key="i" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
        <div v-if="player.gameLog.length === 0" class="log-empty">暂无日志</div>
      </div>
    </div>

    <!-- 统计 -->
    <div class="panel stats-panel">
      <h3 class="panel-title">历练统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-num">{{ player.stats.totalKills }}</span>
          <span class="stat-name">击杀数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ player.stats.dungeonRuns }}</span>
          <span class="stat-name">地牢次数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ player.stats.highestDepth }}</span>
          <span class="stat-name">最深层数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ player.stats.totalDeaths }}</span>
          <span class="stat-name">死亡次数</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePlayerStore } from '../stores/player'
const player = usePlayerStore()
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 700px;
  margin: 0 auto;
}

.panel {
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 10px;
  padding: 14px;
}

.panel-title {
  font-size: 14px;
  color: #c8b8e0;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #2a2540;
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.char-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.char-label {
  font-size: 11px;
  color: #7a7080;
}

.char-value {
  font-size: 14px;
  font-weight: 600;
  color: #e0d8c8;
}

.char-value.realm { color: #c8a8e8; }
.char-value.atk { color: #e8a080; }
.char-value.def { color: #80c8e8; }
.char-value.luck { color: #f0d060; }

.attr-points {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #2a2540;
}

.attr-tip {
  font-size: 12px;
  color: #f0c060;
  display: block;
  margin-bottom: 6px;
}

.attr-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.attr-buttons button {
  padding: 4px 10px;
  font-size: 12px;
  background: linear-gradient(135deg, #3d2f5f, #5a3f7a);
  border: 1px solid #7a5f9a;
  border-radius: 6px;
  color: #e0d0f0;
  cursor: pointer;
}

.attr-buttons button:hover {
  background: linear-gradient(135deg, #4d3f6f, #6a4f8a);
}

.cult-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cult-toggle, .cult-rate, .cult-next {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.toggle-btn {
  padding: 3px 12px;
  border-radius: 12px;
  border: 1px solid #4a4060;
  background: #2a2540;
  color: #8a8090;
  font-size: 12px;
  cursor: pointer;
}

.toggle-btn.on {
  background: linear-gradient(135deg, #2a6a4a, #3a8a5a);
  border-color: #5aaa7a;
  color: #a0e8c0;
}

.rate-value {
  color: #7ac8e8;
  font-weight: 600;
}

.next-realm {
  color: #c8a8e8;
}

.active-buffs {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #2a2540;
}

.active-buffs h4 {
  font-size: 12px;
  color: #8a8090;
  margin-bottom: 6px;
}

.buff-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.buff-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(90, 140, 90, 0.2);
  border: 1px solid #5a8a5a;
  border-radius: 8px;
  color: #a0d8a0;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(42, 37, 64, 0.5);
}

.log-time {
  color: #5a5060;
  flex-shrink: 0;
}

.log-msg {
  color: #b0a8b8;
}

.log-empty {
  text-align: center;
  color: #5a5060;
  padding: 20px;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: rgba(30, 26, 48, 0.6);
  border-radius: 8px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #e0d0f0;
}

.stat-name {
  font-size: 11px;
  color: #7a7080;
  margin-top: 2px;
}
</style>
