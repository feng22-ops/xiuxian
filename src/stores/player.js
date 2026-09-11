import { defineStore } from 'pinia'
import { getRealmInfo, getNextRealm, getBreakthroughRate, REALMS } from '../plugins/realm.js'
import { getTechniqueById, TECHNIQUES } from '../plugins/techniques.js'
import { generateEquip, getItemById, PILLS, TALISMANS, rollLootTable, EQUIP_SLOTS, DECOMPOSE_REWARDS, FORGE_MATERIALS_BY_LEVEL, MATERIALS } from '../plugins/items.js'
import { generateMonster } from '../plugins/monsters.js'
import { executeBattleTurn } from '../plugins/combat.js'
import { generateDungeonFloor, DUNGEON_CONFIGS, DUNGEON_EVENTS } from '../plugins/dungeon.js'

const SAVE_KEY = 'xianxia_dungeon_save_v1'
const AUTO_SAVE_INTERVAL = 10000

export const usePlayerStore = defineStore('player', {
  state: () => ({
    // 基础信息
    name: '无名修士',
    realmId: 0,
    subId: 0,
    cultivation: 0,
    // 属性点
    attributePoints: 0,
    allocatedAttrs: { atk: 0, def: 0, hp: 0, speed: 0, luck: 0 },
    // 资源
    spiritStones: 50,
    // 背包
    inventory: [], // {id, type, item, quantity}
    maxInventory: 50,
    // 装备
    equipped: { weapon: null, armor: null, accessory: null },
    // 功法
    activeTechnique: 'basic',
    learnedTechniques: ['basic'],
    // 修炼状态
    isCultivating: true,
    cultivationRate: 1,
    lastUpdateTime: Date.now(),
    // 战斗属性（运行时）
    hp: 100,
    maxHp: 100,
    atk: 10,
    def: 5,
    speed: 10,
    critRate: 0.05,
    critDamageBoost: 0.5,
    comboRate: 0,
    dodgeRate: 0.05,
    vampireRate: 0,
    stunRate: 0,
    finalDamageBoost: 0,
    finalDamageReduce: 0,
    combatBoost: 0,
    luck: 1,
    // 状态效果
    statusEffects: [],
    shield: 0,
    shieldDuration: 0,
    defending: false,
    // 地牢状态
    inDungeon: false,
    currentDungeon: null,
    dungeonDepth: 0,
    currentFloor: null,
    dungeonLog: [],
    // 战斗状态
    inBattle: false,
    currentMonster: null,
    battleLog: [],
    // 自动战斗
    autoBattle: false,
    autoBattleConfig: {
      autoUsePill: true, // 自动使用回血丹
      autoNextRoom: true, // 自动进入下一个房间
      autoNextFloor: true, // 自动下一层
      lowHpThreshold: 0.3, // 血量低于30%时自动吃药
      fleeOnLowHp: false // 血量过低时自动逃跑
    },
    _autoBattleTimer: null,
    // 增益效果
    activeBuffs: [], // {type, value, duration, name}
    // 统计
    stats: {
      totalKills: 0,
      dungeonRuns: 0,
      highestDepth: 0,
      totalDeaths: 0,
      breakthroughSuccess: 0,
      breakthroughFail: 0,
      playTime: 0
    },
    // 日志
    gameLog: [],
    // 设置
    settings: {
      autoSave: true,
      offlineEarnings: true,
      soundEnabled: false
    },
    // 新玩家引导
    isNewPlayer: true,
    // 计时器
    _cultTimer: null,
    _saveTimer: null,
    _battleRoom: null
  }),

  getters: {
    realmInfo(state) {
      return getRealmInfo(state.realmId, state.subId)
    },
    cultNeed(state) {
      const info = getRealmInfo(state.realmId, state.subId)
      return info ? info.cultNeed : 100
    },
    cultProgress(state) {
      const need = this.cultNeed
      return need > 0 ? Math.min(1, state.cultivation / need) : 0
    },
    canBreakthrough(state) {
      return state.cultivation >= this.cultNeed
    },
    nextRealmInfo(state) {
      const next = getNextRealm(state.realmId, state.subId)
      if (!next) return null
      return getRealmInfo(next.realmId, next.subId)
    },
    effectiveCultRate(state) {
      let rate = state.cultivationRate
      const tech = getTechniqueById(state.activeTechnique)
      rate *= tech.cultBonus
      // 装备加成
      Object.values(state.equipped).forEach(e => {
        if (e && e.cultBonus) rate *= (1 + e.cultBonus)
      })
      // buff
      state.activeBuffs.forEach(b => {
        if (b.type === 'cultRate') rate *= (1 + b.value)
      })
      return rate
    },
    inventoryCount(state) {
      return state.inventory.reduce((sum, i) => sum + i.quantity, 0)
    }
  },

  actions: {
    // ========== 初始化 ==========
    init() {
      this.loadGame()
      this.recalcStats()
      if (this.hp <= 0) this.hp = this.maxHp
      this.startCultivationLoop()
      this.startAutoSave()
    },

    // ========== 修炼循环 ==========
    startCultivationLoop() {
      if (this._cultTimer) clearInterval(this._cultTimer)
      this._cultTimer = setInterval(() => {
        if (this.isCultivating && !this.inBattle) {
          const gain = this.effectiveCultRate * 1 // 每秒基础1点修为
          this.cultivation += gain
          this.stats.playTime += 1
          // 自动突破小境界（大境界需要手动）
          if (this.cultivation >= this.cultNeed) {
            const next = getNextRealm(this.realmId, this.subId)
            if (next && !next.isBreakthrough) {
              this.autoBreakthrough()
            }
          }
        }
        // buff倒计时
        this.tickBuffs()
      }, 1000)
    },

    tickBuffs() {
      this.activeBuffs = this.activeBuffs.filter(b => {
        b.duration--
        return b.duration > 0
      })
    },

    // ========== 属性计算 ==========
    recalcStats() {
      const info = this.realmInfo
      if (!info) return
      
      // 基础属性
      let baseHp = info.baseHp
      let baseAtk = info.baseAtk
      let baseDef = info.baseDef
      let baseSpeed = 10 + this.realmId * 2
      
      // 功法加成
      const tech = getTechniqueById(this.activeTechnique)
      if (tech.combatBonus) {
        baseAtk *= (1 + (tech.combatBonus.atk || 0))
        baseDef *= (1 + (tech.combatBonus.def || 0))
        baseHp *= (1 + (tech.combatBonus.hp || 0))
        baseSpeed *= (1 + (tech.combatBonus.speed || 0))
      }
      
      // 属性点
      baseAtk += this.allocatedAttrs.atk * 2
      baseDef += this.allocatedAttrs.def * 1.5
      baseHp += this.allocatedAttrs.hp * 15
      baseSpeed += this.allocatedAttrs.speed * 0.5
      this.luck = 1 + this.allocatedAttrs.luck
      
      // 装备加成
      let equipAtk = 0, equipDef = 0, equipHp = 0, equipSpeed = 0
      let critRate = 0.05, comboRate = 0, dodgeRate = 0.05, vampireRate = 0, stunRate = 0
      let critDamageBoost = 0.5, finalDamageBoost = 0, finalDamageReduce = 0
      
      Object.values(this.equipped).forEach(e => {
        if (!e) return
        equipAtk += e.mainStats.atk || 0
        equipDef += e.mainStats.def || 0
        equipHp += e.mainStats.hp || 0
        if (e.subStats) {
          e.subStats.forEach(s => {
            if (s.id === 'atk') equipAtk += s.value
            else if (s.id === 'def') equipDef += s.value
            else if (s.id === 'hp') equipHp += s.value
            else if (s.id === 'speed') equipSpeed += s.value
            else if (s.id === 'critRate') critRate += s.value
            else if (s.id === 'dodgeRate') dodgeRate += s.value
            else if (s.id === 'vampireRate') vampireRate += s.value
            else if (s.id === 'comboRate') comboRate += s.value
            else if (s.id === 'stunRate') stunRate += s.value
            else if (s.id === 'critDamage') critDamageBoost += s.value
          })
        }
        if (e.dodgeBonus) dodgeRate += e.dodgeBonus
      })
      
      // 功法战斗属性
      if (tech.combatBonus) {
        critRate += tech.combatBonus.critRate || 0
        dodgeRate += tech.combatBonus.dodgeRate || 0
        vampireRate += tech.combatBonus.vampireRate || 0
        comboRate += tech.combatBonus.comboRate || 0
        critDamageBoost += tech.combatBonus.critDamageBoost || 0
      }
      
      const oldMaxHp = this.maxHp
      this.maxHp = Math.floor(baseHp + equipHp)
      this.atk = Math.floor(baseAtk + equipAtk)
      this.def = Math.floor(baseDef + equipDef)
      this.speed = Math.floor(baseSpeed + equipSpeed)
      this.critRate = critRate
      this.critDamageBoost = critDamageBoost
      this.comboRate = comboRate
      this.dodgeRate = dodgeRate
      this.vampireRate = vampireRate
      this.stunRate = stunRate
      this.finalDamageBoost = finalDamageBoost
      this.finalDamageReduce = finalDamageReduce
      
      // 如果最大血量增加，按比例恢复
      if (oldMaxHp > 0 && this.maxHp > oldMaxHp) {
        const ratio = this.hp / oldMaxHp
        this.hp = Math.floor(this.maxHp * Math.min(1, ratio))
      }
      if (this.hp > this.maxHp) this.hp = this.maxHp
    },

    // ========== 突破 ==========
    autoBreakthrough() {
      const next = getNextRealm(this.realmId, this.subId)
      if (!next || next.isBreakthrough) return false
      this.cultivation -= this.cultNeed
      this.realmId = next.realmId
      this.subId = next.subId
      this.attributePoints += 3
      this.recalcStats()
      this.hp = this.maxHp
      this.addLog(`突破成功！当前境界：${this.realmInfo.name}`)
      this.stats.breakthroughSuccess++
      return true
    },

    attemptBreakthrough(usePill = false) {
      if (!this.canBreakthrough) return { success: false, reason: '修为不足' }
      const next = getNextRealm(this.realmId, this.subId)
      if (!next) return { success: false, reason: '已达巅峰' }
      
      let rate = getBreakthroughRate(this.realmId, this.subId, next.isBreakthrough, this.luck)
      
      // 破障丹
      if (usePill) {
        const pillIdx = this.inventory.findIndex(i => i.item.id === 'poling' && i.quantity > 0)
        if (pillIdx >= 0) {
          rate += 0.2
          this.inventory[pillIdx].quantity--
          if (this.inventory[pillIdx].quantity <= 0) this.inventory.splice(pillIdx, 1)
          this.addLog('服用破障丹，突破成功率提升20%')
        }
      }
      
      this.cultivation -= this.cultNeed
      
      if (Math.random() < rate) {
        this.realmId = next.realmId
        this.subId = next.subId
        this.attributePoints += next.isBreakthrough ? 10 : 3
        this.recalcStats()
        this.hp = this.maxHp
        this.stats.breakthroughSuccess++
        this.addLog(`突破成功！当前境界：${this.realmInfo.name}${next.isBreakthrough ? '（大境界突破！）' : ''}`)
        return { success: true, rate }
      } else {
        // 失败惩罚：损失部分修为
        const loss = Math.floor(this.cultivation * 0.3)
        this.cultivation = Math.max(0, this.cultivation - loss)
        this.stats.breakthroughFail++
        this.addLog(`突破失败！损失 ${loss} 点修为`)
        return { success: false, rate, loss }
      }
    },

    // ========== 属性点分配 ==========
    allocateAttr(attr) {
      if (this.attributePoints <= 0) return false
      if (!['atk', 'def', 'hp', 'speed', 'luck'].includes(attr)) return false
      this.allocatedAttrs[attr]++
      this.attributePoints--
      this.recalcStats()
      return true
    },

    // ========== 背包操作 ==========
    addItem(item, type, quantity = 1) {
      const existing = this.inventory.find(i => i.item.id === item.id && i.type === type)
      if (existing) {
        existing.quantity += quantity
      } else {
        if (this.inventory.length >= this.maxInventory) {
          this.addLog('背包已满！')
          return false
        }
        this.inventory.push({ item: { ...item }, type, quantity })
      }
      return true
    },

    removeItem(itemId, quantity = 1) {
      const idx = this.inventory.findIndex(i => i.item.id === itemId)
      if (idx < 0) return false
      this.inventory[idx].quantity -= quantity
      if (this.inventory[idx].quantity <= 0) this.inventory.splice(idx, 1)
      return true
    },

    useItem(itemId) {
      const idx = this.inventory.findIndex(i => i.item.id === itemId)
      if (idx < 0) return { success: false, reason: '物品不存在' }
      const invItem = this.inventory[idx]
      const item = invItem.item
      
      if (invItem.type === 'pill') {
        return this.usePill(item, idx)
      } else if (invItem.type === 'talisman') {
        if (!this.inBattle) return { success: false, reason: '符箓只能在战斗中使用' }
        return this.useTalisman(item, idx)
      } else if (invItem.type === 'material') {
        return { success: false, reason: '材料无法直接使用' }
      } else if (invItem.type === 'equip') {
        return this.equipItem(item)
      }
      return { success: false, reason: '未知物品类型' }
    },

    usePill(item, idx) {
      const effect = item.effect
      if (effect.type === 'heal') {
        const heal = Math.floor(this.maxHp * effect.value)
        this.hp = Math.min(this.maxHp, this.hp + heal)
        this.addLog(`服用${item.name}，恢复 ${heal} 点气血`)
        if (effect.buff) {
          this.activeBuffs.push({ type: 'def', value: effect.buff.def, duration: effect.buff.duration, name: item.name })
        }
      } else if (effect.type === 'cleanse') {
        this.statusEffects = []
        const heal = Math.floor(this.maxHp * effect.heal)
        this.hp = Math.min(this.maxHp, this.hp + heal)
        this.addLog(`服用${item.name}，清除负面状态并恢复 ${heal} 气血`)
      } else if (effect.type === 'cultBuff') {
        this.activeBuffs.push({ type: 'cultRate', value: effect.value, duration: effect.duration, name: item.name })
        this.addLog(`服用${item.name}，修炼速度提升${effect.value * 100}%，持续${effect.duration}秒`)
      } else if (effect.type === 'reset') {
        const total = Object.values(this.allocatedAttrs).reduce((a, b) => a + b, 0)
        this.attributePoints += total
        this.allocatedAttrs = { atk: 0, def: 0, hp: 0, speed: 0, luck: 0 }
        this.recalcStats()
        this.addLog(`服用${item.name}，重置 ${total} 点属性点`)
      } else {
        return { success: false, reason: '该丹药需在特定时机使用' }
      }
      this.inventory[idx].quantity--
      if (this.inventory[idx].quantity <= 0) this.inventory.splice(idx, 1)
      return { success: true }
    },

    useTalisman(item, idx) {
      const effect = item.effect
      if (effect.type === 'damage') {
        const dmg = Math.floor(this.atk * effect.mult)
        this.currentMonster.hp -= dmg
        this.battleLog.push(`你使用${item.name}，造成 ${dmg} 点伤害！`)
        if (effect.stun) {
          this.currentMonster.statusEffects = this.currentMonster.statusEffects || []
          this.currentMonster.statusEffects.push({ type: 'stun', turns: effect.stun })
          this.battleLog.push(`${this.currentMonster.name}被冻结了！`)
        }
      } else if (effect.type === 'shield') {
        this.shield = Math.floor(this.maxHp * effect.value)
        this.shieldDuration = effect.duration
        this.battleLog.push(`你使用${item.name}，获得 ${this.shield} 点护盾`)
      } else if (effect.type === 'escape') {
        this.battleLog.push(`你使用${item.name}，成功逃离战斗！`)
        this.inBattle = false
        this.currentMonster = null
        this.inventory[idx].quantity--
        if (this.inventory[idx].quantity <= 0) this.inventory.splice(idx, 1)
        return { success: true, escaped: true }
      } else if (effect.type === 'summon') {
        this.activeBuffs.push({ type: 'summon', value: effect.mult, duration: effect.duration, name: item.name })
        this.battleLog.push(`你使用${item.name}，召唤傀儡助战！`)
      }
      this.inventory[idx].quantity--
      if (this.inventory[idx].quantity <= 0) this.inventory.splice(idx, 1)
      return { success: true }
    },

    // ========== 装备 ==========
    equipItem(equip) {
      const slot = equip.slot
      const oldEquip = this.equipped[slot]
      this.equipped[slot] = equip
      // 从背包移除
      const idx = this.inventory.findIndex(i => i.item.id === equip.id && i.type === 'equip')
      if (idx >= 0) {
        this.inventory.splice(idx, 1)
      }
      // 旧装备放回背包
      if (oldEquip) {
        this.addItem(oldEquip, 'equip', 1)
      }
      this.recalcStats()
      this.addLog(`装备了 ${equip.name}`)
      return { success: true }
    },

    unequipItem(slot) {
      const equip = this.equipped[slot]
      if (!equip) return false
      this.equipped[slot] = null
      this.addItem(equip, 'equip', 1)
      this.recalcStats()
      return true
    },

    sellItem(itemId) {
      const idx = this.inventory.findIndex(i => i.item.id === itemId)
      if (idx < 0) return false
      const item = this.inventory[idx].item
      const price = item.price || 10
      this.spiritStones += price
      this.inventory[idx].quantity--
      if (this.inventory[idx].quantity <= 0) this.inventory.splice(idx, 1)
      this.addLog(`出售了 ${item.name}，获得 ${price} 灵石`)
      return true
    },

    // ========== 地牢系统 ==========
    enterDungeon(configId) {
      const config = DUNGEON_CONFIGS.find(c => c.id === configId)
      if (!config) return { success: false, reason: '地牢不存在' }
      if (this.realmId < config.minRealm) return { success: false, reason: `需要${REALMS[config.minRealm].name}以上境界` }
      if (this.inDungeon) return { success: false, reason: '已在地牢中' }
      if (this.hp < this.maxHp * 0.1) return { success: false, reason: '气血过低，无法进入' }
      
      this.inDungeon = true
      this.currentDungeon = config
      this.dungeonDepth = 1
      this.dungeonLog = []
      this.stats.dungeonRuns++
      this.currentFloor = generateDungeonFloor(1, config)
      this.addLog(`进入了 ${config.name} 第1层`)
      return { success: true }
    },

    enterRoom(roomIndex) {
      if (!this.currentFloor) return { success: false }
      const room = this.currentFloor.rooms[roomIndex]
      if (!room || room.cleared) return { success: false }
      
      switch (room.type) {
        case 'battle':
        case 'elite':
        case 'boss':
          return this.startBattle(room)
        case 'treasure':
          return this.openTreasure(room)
        case 'shop':
          return { success: true, shop: room.data.items }
        case 'rest':
          return this.restAtCampfire(room)
        case 'event':
          return { success: true, event: room.data.event }
        case 'trap':
          return this.triggerTrap(room)
        default:
          return { success: false }
      }
    },

    startBattle(room) {
      const isElite = room.type === 'elite'
      const isBoss = room.type === 'boss'
      const monster = generateMonster(this.realmId, this.dungeonDepth, isElite, isBoss)
      this.currentMonster = monster
      this.inBattle = true
      this.battleLog = [`遭遇了 ${monster.name}${isBoss ? '（BOSS）' : isElite ? '（精英）' : ''}！`]
      room.data.monster = monster
      this._battleRoom = room
      return { success: true, battle: true }
    },

    playerAttack() {
      if (!this.inBattle || !this.currentMonster) return null
      const result = executeBattleTurn(this, this.currentMonster, 'attack')
      this.battleLog.push(...result.log)
      
      // 召唤物攻击
      const summon = this.activeBuffs.find(b => b.type === 'summon')
      if (summon && this.currentMonster.hp > 0) {
        const summonDmg = Math.floor(this.atk * summon.value)
        this.currentMonster.hp -= summonDmg
        this.battleLog.push(`傀儡对${this.currentMonster.name}造成 ${summonDmg} 点伤害`)
      }
      
      if (result.victory === true) {
        this.onBattleVictory()
      } else if (result.victory === false) {
        this.onBattleDefeat()
      }
      return result
    },

    playerDefend() {
      if (!this.inBattle || !this.currentMonster) return null
      const result = executeBattleTurn(this, this.currentMonster, 'defend')
      this.battleLog.push(...result.log)
      if (result.victory === false) this.onBattleDefeat()
      return result
    },

    playerUseItem(itemId) {
      return this.useItem(itemId)
    },

    tryFlee() {
      if (!this.inBattle) return false
      const fleeChance = 0.4 + this.speed * 0.005 - (this.currentMonster.isBoss ? 0.3 : 0)
      if (Math.random() < fleeChance) {
        this.battleLog.push('你成功逃离了战斗！')
        this.inBattle = false
        this.currentMonster = null
        return true
      } else {
        // 逃跑失败，怪物攻击
        const result = executeBattleTurn(this, this.currentMonster, 'flee')
        this.battleLog.push('逃跑失败！')
        this.battleLog.push(...result.log)
        if (result.victory === false) this.onBattleDefeat()
        return false
      }
    },

    onBattleVictory() {
      const monster = this.currentMonster
      this.battleLog.push(`你击败了 ${monster.name}！`)
      this.stats.totalKills++
      
      // 奖励
      this.spiritStones += monster.stoneReward
      this.cultivation += monster.expReward
      this.battleLog.push(`获得 ${monster.stoneReward} 灵石，${monster.expReward} 修为`)
      
      // 普通怪：高概率掉材料
      if (!monster.isElite && !monster.isBoss) {
        // 锻造材料掉落（60%概率）
        if (Math.random() < 0.6) {
          const forgeMats = MATERIALS.filter(m => m.category === 'forge')
          // 根据深度决定材料等级
          const maxTier = Math.min(forgeMats.length, 1 + Math.floor(this.dungeonDepth / 3))
          const mat = forgeMats[Math.floor(Math.random() * maxTier)]
          const qty = 1 + Math.floor(Math.random() * 2)
          this.addItem(mat, 'material', qty)
          this.battleLog.push(`获得了 ${mat.name} x${qty}`)
        }
        // 普通材料掉落（40%概率）
        if (Math.random() < 0.4) {
          const normalMats = MATERIALS.filter(m => m.category !== 'forge')
          const mat = normalMats[Math.floor(Math.random() * normalMats.length)]
          if (Math.random() < mat.dropRate * 2) {
            const qty = 1 + Math.floor(Math.random() * 3)
            this.addItem(mat, 'material', qty)
            this.battleLog.push(`获得了 ${mat.name} x${qty}`)
          }
        }
        // 丹药/符箓掉落
        const loot = rollLootTable(this.dungeonDepth, this.realmId, this.luck)
        loot.items.forEach(i => {
          this.addItem(i.item || i, i.type, i.quantity)
          this.battleLog.push(`获得了 ${i.item ? i.item.name : i.name} x${i.quantity}`)
        })
      }
      
      // 精英怪：必掉装备 + 材料
      if (monster.isElite) {
        // 必掉装备
        const slots = ['weapon', 'armor', 'accessory']
        const slot = slots[Math.floor(Math.random() * slots.length)]
        const equip = generateEquip(slot, this.realmId, this.dungeonDepth, this.luck)
        // 精英保底良品以上
        if (equip.quality === 'common') {
          equip.quality = 'fine'
          equip.qualityName = '良品'
          equip.color = '#22c55e'
        }
        this.addItem(equip, 'equip', 1)
        this.battleLog.push(`获得装备：${equip.name}！`)
        
        // 额外材料
        const forgeMats = MATERIALS.filter(m => m.category === 'forge')
        const maxTier = Math.min(forgeMats.length, 2 + Math.floor(this.dungeonDepth / 3))
        const mat = forgeMats[Math.floor(Math.random() * maxTier)]
        const qty = 2 + Math.floor(Math.random() * 3)
        this.addItem(mat, 'material', qty)
        this.battleLog.push(`获得了 ${mat.name} x${qty}`)
      }
      
      // BOSS：必掉强力装备 + 大量材料
      if (monster.isBoss) {
        // 必掉武器（BOSS专属）
        const equip = generateEquip('weapon', this.realmId, this.dungeonDepth, this.luck + 5)
        // BOSS保底上品以上
        const qualityOrder = ['common', 'fine', 'rare', 'epic', 'legendary']
        const qualityNames = { common: '凡品', fine: '良品', rare: '上品', epic: '极品', legendary: '仙品' }
        const qualityColors = { common: '#9ca3af', fine: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' }
        const currentIdx = qualityOrder.indexOf(equip.quality)
        if (currentIdx < 2) {
          equip.quality = 'rare'
          equip.qualityName = qualityNames['rare']
          equip.color = qualityColors['rare']
        }
        // BOSS有30%概率掉极品，10%概率掉仙品
        const bossRoll = Math.random()
        if (bossRoll < 0.1) {
          equip.quality = 'legendary'
          equip.qualityName = qualityNames['legendary']
          equip.color = qualityColors['legendary']
        } else if (bossRoll < 0.4) {
          equip.quality = 'epic'
          equip.qualityName = qualityNames['epic']
          equip.color = qualityColors['epic']
        }
        // BOSS装备属性加成
        equip.mainStats.atk = Math.floor(equip.mainStats.atk * 1.3)
        equip.mainStats.def = Math.floor(equip.mainStats.def * 1.2)
        equip.mainStats.hp = Math.floor(equip.mainStats.hp * 1.2)
        equip.name = `【BOSS掉落】${equip.name}`
        this.addItem(equip, 'equip', 1)
        this.battleLog.push(`🎉 BOSS掉落强力装备：${equip.name}！`)
        
        // 大量锻造材料
        const forgeMats = MATERIALS.filter(m => m.category === 'forge')
        const maxTier = Math.min(forgeMats.length, 3 + Math.floor(this.dungeonDepth / 2))
        for (let i = 0; i < 2; i++) {
          const mat = forgeMats[Math.floor(Math.random() * maxTier)]
          const qty = 3 + Math.floor(Math.random() * 5)
          this.addItem(mat, 'material', qty)
          this.battleLog.push(`获得了 ${mat.name} x${qty}`)
        }
        
        // 额外灵石奖励
        const bonusStone = monster.stoneReward * 2
        this.spiritStones += bonusStone
        this.battleLog.push(`BOSS额外奖励：${bonusStone} 灵石`)
      }
      
      // 普通怪低概率掉装备（15%）
      if (!monster.isElite && !monster.isBoss && Math.random() < 0.15) {
        const slots = ['weapon', 'armor', 'accessory']
        const slot = slots[Math.floor(Math.random() * slots.length)]
        const equip = generateEquip(slot, this.realmId, this.dungeonDepth, this.luck)
        this.addItem(equip, 'equip', 1)
        this.battleLog.push(`获得装备：${equip.name}！`)
      }
      
      // 标记房间已清理
      if (this._battleRoom) {
        this._battleRoom.cleared = true
        this._battleRoom = null
      }
      
      this.inBattle = false
      this.currentMonster = null
      this.checkFloorCleared()
    },

    onBattleDefeat() {
      this.battleLog.push('你被击败了...')
      this.stats.totalDeaths++
      
      // 硬核死亡惩罚
      const cultLoss = Math.floor(this.cultivation * 0.2)
      this.cultivation = Math.max(0, this.cultivation - cultLoss)
      const stoneLoss = Math.floor(this.spiritStones * 0.1)
      this.spiritStones -= stoneLoss
      
      // 随机丢失一件背包物品
      if (this.inventory.length > 0 && Math.random() < 0.3) {
        const idx = Math.floor(Math.random() * this.inventory.length)
        const lost = this.inventory[idx]
        this.battleLog.push(`遗失了 ${lost.item.name} x${lost.quantity}`)
        this.inventory.splice(idx, 1)
      }
      
      this.battleLog.push(`死亡惩罚：损失 ${cultLoss} 修为，${stoneLoss} 灵石`)
      
      this.hp = Math.floor(this.maxHp * 0.3)
      this.inBattle = false
      this.currentMonster = null
      this.inDungeon = false
      this.currentDungeon = null
      this.currentFloor = null
      this.statusEffects = []
      this.autoBattle = false
      this.stopAutoBattleLoop()
      this.addLog('你从地牢中被传送回了安全区域...')
    },

    // ========== 自动战斗 ==========
    toggleAutoBattle() {
      this.autoBattle = !this.autoBattle
      if (this.autoBattle) {
        this.startAutoBattleLoop()
        this.addLog('自动战斗已开启')
      } else {
        this.stopAutoBattleLoop()
        this.addLog('自动战斗已关闭')
      }
    },

    startAutoBattleLoop() {
      if (this._autoBattleTimer) clearInterval(this._autoBattleTimer)
      this._autoBattleTimer = setInterval(() => {
        this.autoBattleTick()
      }, 800)
    },

    stopAutoBattleLoop() {
      if (this._autoBattleTimer) {
        clearInterval(this._autoBattleTimer)
        this._autoBattleTimer = null
      }
    },

    autoBattleTick() {
      if (!this.autoBattle) return
      
      // 战斗中：自动攻击
      if (this.inBattle && this.currentMonster) {
        // 血量低时自动吃药
        if (this.autoBattleConfig.autoUsePill && this.hp / this.maxHp < this.autoBattleConfig.lowHpThreshold) {
          const healPill = this.inventory.find(i => i.type === 'pill' && i.item.effect?.type === 'heal')
          if (healPill) {
            this.useItem(healPill.item.id)
            return
          }
        }
        // 血量过低时自动逃跑
        if (this.autoBattleConfig.fleeOnLowHp && this.hp / this.maxHp < 0.15) {
          this.tryFlee()
          return
        }
        this.playerAttack()
        return
      }
      
      // 在地牢中但不在战斗：自动进入下一个房间
      if (this.inDungeon && this.currentFloor && this.autoBattleConfig.autoNextRoom) {
        // 检查是否可以下一层
        if (this.canGoNextFloor() && this.autoBattleConfig.autoNextFloor) {
          this.nextFloor()
          return
        }
        // 找一个未清理的房间进入
        const nextRoom = this.currentFloor.rooms.find(r => !r.cleared)
        if (nextRoom) {
          const idx = this.currentFloor.rooms.indexOf(nextRoom)
          // 优先打战斗房间，跳过商店/休息（除非需要）
          if (nextRoom.type === 'battle' || nextRoom.type === 'elite' || nextRoom.type === 'boss') {
            this.enterRoom(idx)
          } else if (nextRoom.type === 'rest' && this.hp / this.maxHp < 0.5) {
            this.enterRoom(idx)
          } else if (nextRoom.type === 'treasure' || nextRoom.type === 'event') {
            this.enterRoom(idx)
          } else {
            // 跳过不需要的房间，标记为已清理
            nextRoom.cleared = true
            this.checkFloorCleared()
          }
        }
      }
    },

    // ========== 装备分解 ==========
    decomposeItem(itemId) {
      const idx = this.inventory.findIndex(i => i.item.id === itemId)
      if (idx < 0) return { success: false, reason: '物品不存在' }
      
      const invItem = this.inventory[idx]
      let rewards = {}
      
      if (invItem.type === 'equip') {
        rewards = { ...DECOMPOSE_REWARDS[invItem.item.quality] }
        // 装备等级越高，分解获得更多材料
        const levelBonus = invItem.item.level || 0
        Object.keys(rewards).forEach(k => {
          if (k !== 'stone') rewards[k] = Math.floor(rewards[k] * (1 + levelBonus * 0.1))
        })
      } else if (invItem.type === 'material') {
        // 材料分解成灵石
        rewards = { stone: invItem.item.price || 10 }
      } else {
        return { success: false, reason: '该物品无法分解' }
      }
      
      // 发放奖励
      Object.entries(rewards).forEach(([key, value]) => {
        if (key === 'stone') {
          this.spiritStones += value
        } else {
          const mat = MATERIALS.find(m => m.id === key)
          if (mat) this.addItem(mat, 'material', value)
        }
      })
      
      // 移除物品
      this.inventory.splice(idx, 1)
      
      const rewardText = Object.entries(rewards).map(([k, v]) => {
        if (k === 'stone') return `${v}灵石`
        const mat = MATERIALS.find(m => m.id === k)
        return `${v}${mat?.name || k}`
      }).join('，')
      
      this.addLog(`分解了 ${invItem.item.name}，获得 ${rewardText}`)
      return { success: true, rewards }
    },

    decomposeAll(onlyLowQuality = true) {
      const toDecompose = []
      this.inventory.forEach((inv, idx) => {
        if (inv.type === 'equip') {
          // 只分解凡品和良品，或者所有未装备的
          if (!onlyLowQuality || inv.item.quality === 'common' || inv.item.quality === 'fine') {
            // 检查是否已装备
            const isEquipped = Object.values(this.equipped).some(e => e && e.id === inv.item.id)
            if (!isEquipped) toDecompose.push(inv.item.id)
          }
        }
      })
      
      if (toDecompose.length === 0) {
        return { success: false, reason: '没有可分解的装备' }
      }
      
      let totalRewards = {}
      toDecompose.forEach(id => {
        const result = this.decomposeItem(id)
        if (result.success) {
          Object.entries(result.rewards).forEach(([k, v]) => {
            totalRewards[k] = (totalRewards[k] || 0) + v
          })
        }
      })
      
      this.addLog(`一键分解了 ${toDecompose.length} 件装备`)
      return { success: true, count: toDecompose.length, rewards: totalRewards }
    },

    // ========== 工匠锻造 ==========
    getForgeCost(equip) {
      if (!equip) return null
      const level = equip.level || 0
      const qualityMult = { common: 1, fine: 1.5, rare: 2, epic: 3, legendary: 5 }[equip.quality] || 1
      
      const matConfig = FORGE_MATERIALS_BY_LEVEL.find(m => level < m.maxLevel) || FORGE_MATERIALS_BY_LEVEL[FORGE_MATERIALS_BY_LEVEL.length - 1]
      const amount = Math.ceil(matConfig.amount * qualityMult * (1 + level * 0.05))
      const stoneCost = Math.floor((equip.price || 100) * 0.1 * (1 + level * 0.1))
      
      return {
        material: matConfig.material,
        materialName: MATERIALS.find(m => m.id === matConfig.material)?.name || matConfig.material,
        amount,
        stone: stoneCost,
        successRate: Math.max(0.3, 1 - level * 0.02)
      }
    },

    forgeEquip(equipId) {
      // 找到装备（背包或已装备）
      let equip = null
      let equipSource = null
      
      // 先检查已装备
      for (const [slot, e] of Object.entries(this.equipped)) {
        if (e && e.id === equipId) {
          equip = e
          equipSource = { type: 'equipped', slot }
          break
        }
      }
      
      // 再检查背包
      if (!equip) {
        const inv = this.inventory.find(i => i.type === 'equip' && i.item.id === equipId)
        if (inv) {
          equip = inv.item
          equipSource = { type: 'inventory' }
        }
      }
      
      if (!equip) return { success: false, reason: '装备不存在' }
      
      const cost = this.getForgeCost(equip)
      if (!cost) return { success: false, reason: '无法锻造' }
      
      // 检查材料
      const matInv = this.inventory.find(i => i.type === 'material' && i.item.id === cost.material)
      if (!matInv || matInv.quantity < cost.amount) {
        return { success: false, reason: `${cost.materialName}不足，需要${cost.amount}个` }
      }
      if (this.spiritStones < cost.stone) {
        return { success: false, reason: `灵石不足，需要${cost.stone}` }
      }
      
      // 消耗材料
      this.removeItem(cost.material, cost.amount)
      this.spiritStones -= cost.stone
      
      // 判定成功率
      if (Math.random() < cost.successRate) {
        // 成功：升级装备
        equip.level = (equip.level || 0) + 1
        const levelBonus = 1 + 0.1 // 每级+10%属性
        equip.mainStats.atk = Math.floor(equip.mainStats.atk * levelBonus)
        equip.mainStats.def = Math.floor(equip.mainStats.def * levelBonus)
        equip.mainStats.hp = Math.floor(equip.mainStats.hp * levelBonus)
        
        // 副属性也提升
        if (equip.subStats) {
          equip.subStats.forEach(s => {
            if (s.isPercent) {
              s.value = +(s.value * 1.05).toFixed(3)
            } else {
              s.value = Math.floor(s.value * levelBonus)
            }
          })
        }
        
        this.recalcStats()
        this.addLog(`锻造成功！${equip.name} 升至 +${equip.level}`)
        return { success: true, equip, level: equip.level }
      } else {
        // 失败：装备等级不变，材料消失
        this.addLog(`锻造失败！${equip.name} 保持 +${equip.level || 0}`)
        return { success: false, reason: '锻造失败', equip }
      }
    },

    checkFloorCleared() {
      if (!this.currentFloor) return
      const allCleared = this.currentFloor.rooms.every(r => r.cleared)
      // 不需要全部清理，只要清理了BOSS房或至少一个房间就可以下一层
      const bossRoom = this.currentFloor.rooms.find(r => r.type === 'boss')
      if (this.currentFloor.isBossFloor && bossRoom && bossRoom.cleared) {
        this.nextFloor()
      }
    },

    nextFloor() {
      this.dungeonDepth++
      if (this.dungeonDepth > this.currentDungeon.maxDepth) {
        this.exitDungeon(true)
        return
      }
      this.stats.highestDepth = Math.max(this.stats.highestDepth, this.dungeonDepth)
      this.currentFloor = generateDungeonFloor(this.dungeonDepth, this.currentDungeon)
      this.addLog(`进入了 ${this.currentDungeon.name} 第${this.dungeonDepth}层`)
    },

    canGoNextFloor() {
      if (!this.currentFloor) return false
      // 非BOSS层：清理至少一个房间即可
      if (!this.currentFloor.isBossFloor) {
        return this.currentFloor.rooms.some(r => r.cleared)
      }
      // BOSS层：必须清理BOSS
      const bossRoom = this.currentFloor.rooms.find(r => r.type === 'boss')
      return bossRoom && bossRoom.cleared
    },

    exitDungeon(completed = false) {
      this.inDungeon = false
      this.currentDungeon = null
      this.currentFloor = null
      this.statusEffects = []
      if (completed) {
        this.addLog(`恭喜！你通关了地牢，最高到达第${this.dungeonDepth}层`)
      } else {
        this.addLog('你离开了地牢')
      }
      this.dungeonDepth = 0
    },

    openTreasure(room) {
      if (room.data.opened) return { success: false }
      room.data.opened = true
      room.cleared = true
      
      const quality = room.data.quality
      let loot = { stone: 0, items: [] }
      
      if (quality === 'epic') {
        loot.stone = Math.floor(100 * (1 + this.dungeonDepth * 0.2))
        const slots = ['weapon', 'armor', 'accessory']
        const equip = generateEquip(slots[Math.floor(Math.random() * slots.length)], this.realmId, this.dungeonDepth + 2, this.luck)
        this.addItem(equip, 'equip', 1)
        this.dungeonLog.push(`打开宝箱，获得 ${equip.name} 和 ${loot.stone} 灵石！`)
      } else if (quality === 'rare') {
        loot.stone = Math.floor(50 * (1 + this.dungeonDepth * 0.15))
        // 随机丹药或符箓
        const pool = [...PILLS.slice(0, 5), ...TALISMANS.slice(0, 4)]
        const item = pool[Math.floor(Math.random() * pool.length)]
        this.addItem(item, item.effect ? 'pill' : 'talisman', 1)
        this.dungeonLog.push(`打开宝箱，获得 ${item.name} 和 ${loot.stone} 灵石！`)
      } else {
        loot.stone = Math.floor(20 * (1 + this.dungeonDepth * 0.1))
        this.dungeonLog.push(`打开宝箱，获得 ${loot.stone} 灵石`)
      }
      this.spiritStones += loot.stone
      this.checkFloorCleared()
      return { success: true, loot }
    },

    restAtCampfire(room) {
      if (room.data.used) return { success: false }
      room.data.used = true
      room.cleared = true
      const heal = Math.floor(this.maxHp * room.data.healAmount)
      this.hp = Math.min(this.maxHp, this.hp + heal)
      this.statusEffects = []
      this.dungeonLog.push(`在篝火旁休息，恢复 ${heal} 点气血，负面状态已清除`)
      this.checkFloorCleared()
      return { success: true, heal }
    },

    triggerTrap(room) {
      if (room.data.disarmed) return { success: false }
      room.cleared = true
      
      if (room.data.detected && Math.random() < 0.5 + this.speed * 0.005) {
        room.data.disarmed = true
        this.dungeonLog.push('你发现了陷阱并成功躲避！')
        this.checkFloorCleared()
        return { success: true, avoided: true }
      }
      
      const dmg = Math.floor(this.maxHp * room.data.damage)
      this.hp -= dmg
      this.dungeonLog.push(`触发陷阱！受到 ${dmg} 点伤害`)
      
      if (this.hp <= 0) {
        this.onBattleDefeat()
        return { success: true, died: true }
      }
      this.checkFloorCleared()
      return { success: true, dmg }
    },

    resolveEventChoice(event, choiceIndex) {
      const choice = event.choices[choiceIndex]
      const room = this.currentFloor?.rooms.find(r => r.type === 'event' && r.data.event === event)
      if (room) room.cleared = true
      
      let result = { text: '' }
      
      switch (choice.effect) {
        case 'random_buff': {
          if (Math.random() < (choice.risk || 0)) {
            const dmg = Math.floor(this.maxHp * 0.15)
            this.hp -= dmg
            result.text = `老者突然发难！你受到 ${dmg} 点伤害`
          } else {
            const buffs = ['atk', 'def', 'hp', 'speed']
            const buff = buffs[Math.floor(Math.random() * buffs.length)]
            this.activeBuffs.push({ type: buff, value: 0.15, duration: 300, name: '老者指点' })
            result.text = `老者指点了你一番，${buff === 'atk' ? '攻击' : buff === 'def' ? '防御' : buff === 'hp' ? '气血' : '速度'}提升15%，持续5分钟`
          }
          break
        }
        case 'donate': {
          const cost = Math.floor(this.spiritStones * (choice.cost || 0.1))
          if (this.spiritStones >= cost) {
            this.spiritStones -= cost
            this.cultivation += Math.floor(cost * 5)
            result.text = `老者收下 ${cost} 灵石，为你灌顶，获得 ${cost * 5} 修为`
          } else {
            result.text = '你的灵石不够'
          }
          break
        }
        case 'heal_or_poison': {
          if (Math.random() < (choice.risk || 0.15)) {
            this.statusEffects.push({ type: 'poison', turns: 5, value: 0.05 })
            result.text = '泉水有毒！你中毒了'
          } else {
            const heal = Math.floor(this.maxHp * 0.5)
            this.hp = Math.min(this.maxHp, this.hp + heal)
            result.text = `灵泉清凉，恢复 ${heal} 点气血`
          }
          break
        }
        case 'cult_exp': {
          if (Math.random() < (choice.risk || 0.1)) {
            const dmg = Math.floor(this.maxHp * 0.1)
            this.hp -= dmg
            result.text = `参悟走火入魔！受到 ${dmg} 点伤害`
          } else {
            const exp = Math.floor(this.cultNeed * 0.1)
            this.cultivation += exp
            result.text = `参悟成功，获得 ${exp} 点修为`
          }
          break
        }
        case 'elite_battle': {
          result.text = '你偷袭了守宝妖兽！'
          // 触发精英战斗
          const monster = generateMonster(this.realmId, this.dungeonDepth, true, false)
          this.currentMonster = monster
          this.inBattle = true
          this.battleLog = [`你偷袭了 ${monster.name}！`]
          result.battle = true
          break
        }
        case 'steal': {
          if (Math.random() < (choice.risk || 0.4)) {
            const monster = generateMonster(this.realmId, this.dungeonDepth, true, false)
            this.currentMonster = monster
            this.inBattle = true
            this.battleLog = [`被发现了！${monster.name}醒了过来！`]
            result.text = '偷窃被发现！'
            result.battle = true
          } else {
            const stone = Math.floor(50 * (1 + this.dungeonDepth * 0.2))
            this.spiritStones += stone
            result.text = `成功偷到 ${stone} 灵石，溜之大吉！`
          }
          break
        }
        case 'loot': {
          if (Math.random() < (choice.risk || 0.1)) {
            this.statusEffects.push({ type: 'poison', turns: 3, value: 0.05 })
            result.text = '储物袋上有陷阱！你中毒了'
          } else {
            const stone = Math.floor(30 * (1 + this.dungeonDepth * 0.15))
            this.spiritStones += stone
            // 随机物品
            const pool = [...PILLS, ...TALISMANS]
            const item = pool[Math.floor(Math.random() * pool.length)]
            this.addItem(item, item.effect?.type === 'damage' || item.effect?.type === 'shield' || item.effect?.type === 'escape' || item.effect?.type === 'summon' ? 'talisman' : 'pill', 1)
            result.text = `搜索到 ${stone} 灵石和 ${item.name}`
          }
          break
        }
        case 'demon_buff': {
          const cost = Math.floor(this.maxHp * (choice.cost || 0.2))
          this.hp -= cost
          this.activeBuffs.push({ type: 'atk', value: 0.3, duration: 600, name: '魔血沸腾' })
          this.activeBuffs.push({ type: 'critRate', value: 0.1, duration: 600, name: '魔血沸腾' })
          result.text = `献祭 ${cost} 气血，获得魔神祝福：攻击+30%，暴击+10%，持续10分钟`
          break
        }
        case 'teleport': {
          if (Math.random() < (choice.risk || 0.3)) {
            const dmg = Math.floor(this.maxHp * 0.2)
            this.hp -= dmg
            result.text = `传送失败！空间乱流造成 ${dmg} 点伤害`
          } else {
            this.nextFloor()
            result.text = '传送成功！直接进入下一层'
            result.teleported = true
          }
          break
        }
        case 'shop':
          result.text = '查看商品'
          result.shop = true
          break
        case 'karma_good':
          this.luck += 0.5
          result.text = '你妥善埋葬了遗骸，感到心境提升，幸运+0.5'
          break
        case 'karma_good_battle': {
          result.text = '你摧毁了魔祭坛！但惊动了守护魔物'
          const monster = generateMonster(this.realmId, this.dungeonDepth, true, false)
          this.currentMonster = monster
          this.inBattle = true
          this.battleLog = [`魔祭坛的守护魔物出现了！`]
          result.battle = true
          break
        }
        case 'none':
        default:
          result.text = '你选择了离开'
          break
      }
      
      this.dungeonLog.push(result.text)
      if (this.hp <= 0 && !result.battle) {
        this.onBattleDefeat()
        result.died = true
      }
      if (!result.battle && !result.teleported) this.checkFloorCleared()
      return result
    },

    buyShopItem(itemId, price) {
      if (this.spiritStones < price) return { success: false, reason: '灵石不足' }
      const item = getItemById(itemId)
      if (!item) return { success: false, reason: '物品不存在' }
      this.spiritStones -= price
      const type = item.effect?.type === 'damage' || item.effect?.type === 'shield' || item.effect?.type === 'escape' || item.effect?.type === 'summon' ? 'talisman' : 'pill'
      this.addItem(item, type, 1)
      this.dungeonLog.push(`购买了 ${item.name}`)
      return { success: true }
    },

    // ========== 功法 ==========
    learnTechnique(techId) {
      if (this.learnedTechniques.includes(techId)) return false
      this.learnedTechniques.push(techId)
      const tech = getTechniqueById(techId)
      this.addLog(`学会了新功法：${tech.name}`)
      return true
    },

    switchTechnique(techId) {
      if (!this.learnedTechniques.includes(techId)) return false
      this.activeTechnique = techId
      this.recalcStats()
      const tech = getTechniqueById(techId)
      this.addLog(`切换功法为：${tech.name}`)
      return true
    },

    // ========== 日志 ==========
    addLog(msg) {
      const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      this.gameLog.unshift({ time, msg })
      if (this.gameLog.length > 100) this.gameLog.pop()
    },

    // ========== 存档 ==========
    saveGame() {
      const saveData = {
        name: this.name,
        realmId: this.realmId,
        subId: this.subId,
        cultivation: this.cultivation,
        attributePoints: this.attributePoints,
        allocatedAttrs: this.allocatedAttrs,
        spiritStones: this.spiritStones,
        inventory: this.inventory,
        equipped: this.equipped,
        activeTechnique: this.activeTechnique,
        learnedTechniques: this.learnedTechniques,
        hp: this.hp,
        stats: this.stats,
        settings: this.settings,
        isNewPlayer: this.isNewPlayer,
        lastUpdateTime: Date.now(),
        activeBuffs: this.activeBuffs
      }
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
        return true
      } catch (e) {
        console.error('保存失败', e)
        return false
      }
    },

    loadGame() {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return false
        const data = JSON.parse(raw)
        
        // 恢复数据
        Object.keys(data).forEach(key => {
          if (key in this) this[key] = data[key]
        })
        
        // 离线收益
        if (this.settings.offlineEarnings && data.lastUpdateTime) {
          const offlineSeconds = Math.floor((Date.now() - data.lastUpdateTime) / 1000)
          if (offlineSeconds > 60) {
            const maxOffline = 8 * 3600 // 最多8小时
            const effectiveSeconds = Math.min(offlineSeconds, maxOffline)
            const offlineCult = Math.floor(this.effectiveCultRate * effectiveSeconds * 0.5) // 离线50%效率
            this.cultivation += offlineCult
            this.addLog(`离线 ${Math.floor(offlineSeconds / 60)} 分钟，获得 ${offlineCult} 点修为（离线效率50%）`)
          }
        }
        
        this.lastUpdateTime = Date.now()
        return true
      } catch (e) {
        console.error('读取存档失败', e)
        return false
      }
    },

    startAutoSave() {
      if (this._saveTimer) clearInterval(this._saveTimer)
      this._saveTimer = setInterval(() => {
        if (this.settings.autoSave) this.saveGame()
      }, AUTO_SAVE_INTERVAL)
    },

    resetGame() {
      localStorage.removeItem(SAVE_KEY)
      location.reload()
    },

    // 清理
    destroy() {
      if (this._cultTimer) clearInterval(this._cultTimer)
      if (this._saveTimer) clearInterval(this._saveTimer)
      this.saveGame()
    }
  }
})
