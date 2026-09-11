<template>
  <div class="technique-view">
    <div class="panel">
      <h3 class="panel-title">功法修炼</h3>
      <p class="panel-desc">功法影响修炼速度和战斗属性，可通过地牢奇遇获得更高阶功法。</p>
      
      <div class="technique-list">
        <div v-for="tech in allTechniques" :key="tech.id"
          class="technique-card"
          :class="{ active: player.activeTechnique === tech.id, learned: isLearned(tech.id), locked: !isLearned(tech.id) }">
          <div class="tech-header">
            <span class="tech-name">{{ tech.name }}</span>
            <span class="tech-grade" :class="tech.grade">{{ tech.grade }}</span>
          </div>
          <p class="tech-desc">{{ tech.description }}</p>
          <div class="tech-bonus">
            <span>修炼速度 x{{ tech.cultBonus }}</span>
            <span v-if="tech.combatBonus.atk">攻击 +{{ (tech.combatBonus.atk * 100).toFixed(0) }}%</span>
            <span v-if="tech.combatBonus.def">防御 +{{ (tech.combatBonus.def * 100).toFixed(0) }}%</span>
            <span v-if="tech.combatBonus.hp">气血 +{{ (tech.combatBonus.hp * 100).toFixed(0) }}%</span>
            <span v-if="tech.combatBonus.speed">速度 +{{ (tech.combatBonus.speed * 100).toFixed(0) }}%</span>
            <span v-if="tech.combatBonus.critRate">暴击 +{{ (tech.combatBonus.critRate * 100).toFixed(0) }}%</span>
            <span v-if="tech.combatBonus.vampireRate">吸血 +{{ (tech.combatBonus.vampireRate * 100).toFixed(0) }}%</span>
          </div>
          <div class="tech-action">
            <span v-if="player.activeTechnique === tech.id" class="active-tag">修炼中</span>
            <button v-else-if="isLearned(tech.id)" @click="switchTech(tech.id)">切换</button>
            <span v-else class="locked-tag">未习得</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 功法获取提示 -->
    <div class="panel tip-panel">
      <h4>如何获得功法？</h4>
      <ul>
        <li>探索地牢，在奇遇事件中有几率获得功法残页</li>
        <li>击败精英怪和BOSS有几率掉落功法</li>
        <li>地牢深度越深，获得高阶功法的概率越高</li>
        <li>幸运值会影响功法掉落概率</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/player'
import { TECHNIQUES } from '../plugins/techniques'

const player = usePlayerStore()
const allTechniques = computed(() => TECHNIQUES)

function isLearned(techId) {
  return player.learnedTechniques.includes(techId)
}

function switchTech(techId) {
  player.switchTechnique(techId)
}
</script>

<style scoped>
.technique-view {
  max-width: 650px;
  margin: 0 auto;
}

.panel {
  background: rgba(22, 19, 38, 0.8);
  border: 1px solid #2a2540;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 15px;
  color: #c8b8e0;
  margin-bottom: 6px;
}

.panel-desc {
  font-size: 12px;
  color: #8a8090;
  margin-bottom: 16px;
}

.technique-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.technique-card {
  background: rgba(30, 26, 48, 0.6);
  border: 1px solid #2a2540;
  border-radius: 8px;
  padding: 12px 14px;
  transition: all 0.2s;
}

.technique-card.active {
  border-color: #7a5faa;
  background: rgba(60, 40, 90, 0.3);
}

.technique-card.locked {
  opacity: 0.5;
}

.tech-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.tech-name {
  font-size: 15px;
  font-weight: 600;
  color: #e0d0f0;
}

.tech-grade {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.tech-grade.凡级 { background: #3a3a3a; color: #aaa; }
.tech-grade.黄级 { background: #5a5a3a; color: #d0c060; }
.tech-grade.玄级 { background: #3a4a5a; color: #60a0d0; }
.tech-grade.地级 { background: #4a3a5a; color: #a060d0; }
.tech-grade.天级 { background: #5a3a3a; color: #f0a060; }

.tech-desc {
  font-size: 12px;
  color: #a098a8;
  margin-bottom: 8px;
  line-height: 1.5;
}

.tech-bonus {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 11px;
  color: #7ac8e8;
  margin-bottom: 10px;
}

.tech-action {
  text-align: right;
}

.active-tag {
  font-size: 12px;
  color: #a0e8a0;
  font-weight: 600;
}

.locked-tag {
  font-size: 12px;
  color: #6a6070;
}

.tech-action button {
  padding: 4px 16px;
  font-size: 12px;
  background: linear-gradient(135deg, #3d2f5f, #5a3f7a);
  border: 1px solid #7a5f9a;
  border-radius: 6px;
  color: #e0d0f0;
  cursor: pointer;
}

.tip-panel h4 {
  font-size: 14px;
  color: #c8b8e0;
  margin-bottom: 10px;
}

.tip-panel ul {
  list-style: none;
  padding: 0;
}

.tip-panel li {
  font-size: 12px;
  color: #a098a8;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.tip-panel li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #7a5faa;
}
</style>
