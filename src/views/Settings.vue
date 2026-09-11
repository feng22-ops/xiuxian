<template>
  <div class="settings-view">
    <div class="panel">
      <h3 class="panel-title">游戏设置</h3>
      
      <div class="setting-list">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">自动保存</span>
            <span class="setting-desc">每10秒自动保存游戏进度</span>
          </div>
          <button class="toggle" :class="{ on: player.settings.autoSave }"
            @click="player.settings.autoSave = !player.settings.autoSave">
            {{ player.settings.autoSave ? '开启' : '关闭' }}
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">离线收益</span>
            <span class="setting-desc">关闭游戏后继续获得修为（50%效率，最多8小时）</span>
          </div>
          <button class="toggle" :class="{ on: player.settings.offlineEarnings }"
            @click="player.settings.offlineEarnings = !player.settings.offlineEarnings">
            {{ player.settings.offlineEarnings ? '开启' : '关闭' }}
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">道号</span>
            <span class="setting-desc">你的修士名号</span>
          </div>
          <div class="name-input">
            <input v-model="newName" maxlength="12" placeholder="输入道号" />
            <button @click="changeName">修改</button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3 class="panel-title">存档管理</h3>
      <div class="save-actions">
        <button class="action-btn save" @click="manualSave">手动保存</button>
        <button class="action-btn export" @click="exportSave">导出存档</button>
        <button class="action-btn import" @click="triggerImport">导入存档</button>
        <button class="action-btn reset" @click="resetGame">重置游戏</button>
      </div>
      <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importSave" />
      <p class="save-tip">存档保存在浏览器本地，清除浏览器数据会丢失存档，建议定期导出备份。</p>
    </div>

    <div class="panel">
      <h3 class="panel-title">游戏说明</h3>
      <div class="help-content">
        <h4>核心玩法</h4>
        <ul>
          <li><strong>挂机修炼</strong>：修为自动增长，满后可突破境界</li>
          <li><strong>地牢探索</strong>：Roguelike地牢，每层随机房间，战斗/宝箱/奇遇/商店</li>
          <li><strong>硬核生存</strong>：地牢中死亡损失修为和灵石，可能丢失物品</li>
          <li><strong>装备养成</strong>：击败怪物掉落装备，多品质多属性</li>
          <li><strong>功法系统</strong>：不同功法影响修炼速度和战斗属性</li>
        </ul>
        <h4>小贴士</h4>
        <ul>
          <li>上班时挂着修炼，有空就下地牢刷装备</li>
          <li>地牢中注意保留气血，篝火点可以恢复</li>
          <li>大境界突破成功率较低，建议使用破障丹</li>
          <li>每5层是BOSS层，击败后才能继续深入</li>
          <li>幸运值影响掉落和突破成功率</li>
        </ul>
      </div>
    </div>

    <div class="version-info">
      玄府地牢 v0.1.0 | 放置修仙 + 地牢肉鸽
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePlayerStore } from '../stores/player'

const player = usePlayerStore()
const newName = ref('')
const fileInput = ref(null)

function changeName() {
  if (newName.value.trim()) {
    player.name = newName.value.trim()
    newName.value = ''
    player.addLog(`道号改为：${player.name}`)
  }
}

function manualSave() {
  if (player.saveGame()) {
    alert('保存成功！')
  } else {
    alert('保存失败！')
  }
}

function exportSave() {
  const data = localStorage.getItem('xianxia_dungeon_save_v1')
  if (!data) {
    alert('没有存档可导出')
    return
  }
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `玄府地牢存档_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInput.value?.click()
}

function importSave(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      JSON.parse(ev.target.result)
      localStorage.setItem('xianxia_dungeon_save_v1', ev.target.result)
      alert('导入成功！页面即将刷新')
      setTimeout(() => location.reload(), 1000)
    } catch {
      alert('存档文件格式错误')
    }
  }
  reader.readAsText(file)
}

function resetGame() {
  if (confirm('确定要重置游戏吗？所有进度将丢失，此操作不可恢复！')) {
    if (confirm('再次确认：真的要删除所有存档吗？')) {
      player.resetGame()
    }
  }
}
</script>

<style scoped>
.settings-view {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 20px;
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
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2a2540;
}

.setting-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #2a2540;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-name {
  font-size: 14px;
  color: #e0d8c8;
  display: block;
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 11px;
  color: #7a7080;
}

.toggle {
  padding: 6px 16px;
  font-size: 12px;
  border-radius: 14px;
  border: 1px solid #4a4060;
  background: #2a2540;
  color: #8a8090;
  cursor: pointer;
}

.toggle.on {
  background: linear-gradient(135deg, #2a6a4a, #3a8a5a);
  border-color: #5aaa7a;
  color: #a0e8c0;
}

.name-input {
  display: flex;
  gap: 6px;
}

.name-input input {
  padding: 6px 10px;
  font-size: 13px;
  background: #1a1628;
  border: 1px solid #3a3550;
  border-radius: 6px;
  color: #e0d8c8;
  width: 120px;
}

.name-input button {
  padding: 6px 14px;
  font-size: 12px;
  background: linear-gradient(135deg, #3d2f5f, #5a3f7a);
  border: 1px solid #7a5f9a;
  border-radius: 6px;
  color: #e0d0f0;
  cursor: pointer;
}

.save-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.action-btn {
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid;
}

.action-btn.save {
  background: linear-gradient(135deg, #3a5a3a, #5a7a5a);
  border-color: #7a9a7a;
  color: #d0f0d0;
}

.action-btn.export {
  background: linear-gradient(135deg, #3a4a6a, #5a6a8a);
  border-color: #7a8aaa;
  color: #d0e0f0;
}

.action-btn.import {
  background: linear-gradient(135deg, #5a4a3a, #7a6a5a);
  border-color: #9a8a7a;
  color: #f0e0d0;
}

.action-btn.reset {
  background: linear-gradient(135deg, #6a3a3a, #8a5a5a);
  border-color: #aa7a7a;
  color: #f0d0d0;
}

.save-tip {
  font-size: 11px;
  color: #6a6070;
  line-height: 1.5;
}

.help-content h4 {
  font-size: 13px;
  color: #a898b8;
  margin: 12px 0 6px;
}

.help-content h4:first-child {
  margin-top: 0;
}

.help-content ul {
  list-style: none;
  padding: 0;
}

.help-content li {
  font-size: 12px;
  color: #a098a8;
  padding: 3px 0;
  padding-left: 14px;
  position: relative;
  line-height: 1.5;
}

.help-content li::before {
  content: '◦';
  position: absolute;
  left: 0;
  color: #7a5faa;
}

.help-content strong {
  color: #c8b8e0;
}

.version-info {
  text-align: center;
  font-size: 11px;
  color: #4a4050;
  padding: 10px;
}
</style>
