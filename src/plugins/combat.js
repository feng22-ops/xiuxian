// 战斗系统 - 回合制，支持多维度属性
import { MONSTER_SKILLS } from './monsters.js'

export function calculatePlayerDamage(attacker, defender) {
  let damage = attacker.atk
  let isCrit = false
  let isCombo = false
  let isVampire = false
  let isStun = false
  
  // 暴击
  const critRate = Math.max(0, (attacker.critRate || 0) - (defender.critResist || 0))
  if (Math.random() < critRate) {
    damage *= 1.5 + (attacker.critDamageBoost || 0.5)
    isCrit = true
  }
  
  // 连击
  const comboRate = Math.max(0, attacker.comboRate || 0)
  if (Math.random() < comboRate) {
    damage *= 1.3
    isCombo = true
  }
  
  // 最终增伤
  damage *= 1 + (attacker.finalDamageBoost || 0)
  
  // 防御减伤
  const effectiveDef = defender.def * (1 + (defender.combatBoost || 0))
  damage *= 100 / (100 + effectiveDef)
  
  // 最终减伤
  damage *= 1 - (defender.finalDamageReduce || 0)
  
  // 吸血判定
  const vampireRate = Math.max(0, attacker.vampireRate || 0)
  if (Math.random() < vampireRate) {
    isVampire = true
  }
  
  // 眩晕判定
  const stunRate = Math.max(0, attacker.stunRate || 0)
  if (Math.random() < stunRate) {
    isStun = true
  }
  
  return {
    damage: Math.max(1, Math.floor(damage)),
    isCrit,
    isCombo,
    isVampire,
    isStun
  }
}

export function calculateMonsterDamage(attacker, defender) {
  let damage = attacker.atk
  let isCrit = false
  let isPoison = false
  let isBurn = false
  let isStun = false
  let isDrain = false
  
  // 怪物被动技能：暴击
  if (attacker.skills && attacker.skills.includes('crit')) {
    if (Math.random() < 0.2 + (attacker.isBoss ? 0.1 : 0)) {
      damage *= 1.8
      isCrit = true
    }
  }
  
  // 狂暴：血量低于30%攻击+50%
  if (attacker.skills && attacker.skills.includes('rage') && attacker.hp < attacker.maxHp * 0.3) {
    damage *= 1.5
  }
  
  // 防御减伤
  const effectiveDef = defender.def * (1 + (defender.combatBoost || 0))
  damage *= 100 / (100 + effectiveDef)
  damage *= 1 - (defender.finalDamageReduce || 0)
  
  // 技能触发
  if (attacker.skills) {
    if (attacker.skills.includes('poison') && Math.random() < 0.3) isPoison = true
    if (attacker.skills.includes('burn') && Math.random() < 0.3) isBurn = true
    if (attacker.skills.includes('stun') && Math.random() < 0.15) isStun = true
    if (attacker.skills.includes('drain') && Math.random() < 0.25) isDrain = true
  }
  
  return {
    damage: Math.max(1, Math.floor(damage)),
    isCrit,
    isPoison,
    isBurn,
    isStun,
    isDrain
  }
}

// 执行一回合战斗
export function executeBattleTurn(player, monster, playerAction = 'attack', usedItem = null) {
  const log = []
  let playerDmg = null
  let monsterDmg = null
  
  // 检查玩家是否被眩晕
  const playerStunned = player.statusEffects?.some(e => e.type === 'stun' && e.turns > 0)
  
  // 玩家行动
  if (playerAction === 'attack' && !playerStunned) {
    playerDmg = calculatePlayerDamage(player, monster)
    monster.hp -= playerDmg.damage
    log.push(`你对${monster.name}造成了 ${playerDmg.damage} 点伤害${playerDmg.isCrit ? '（暴击！）' : ''}${playerDmg.isCombo ? '（连击！）' : ''}`)
    
    if (playerDmg.isVampire) {
      const heal = Math.floor(playerDmg.damage * 0.3)
      player.hp = Math.min(player.maxHp, player.hp + heal)
      log.push(`你吸取了 ${heal} 点气血`)
    }
    if (playerDmg.isStun) {
      monster.statusEffects = monster.statusEffects || []
      monster.statusEffects.push({ type: 'stun', turns: 1 })
      log.push(`${monster.name}被眩晕了！`)
    }
  } else if (playerStunned) {
    log.push('你被眩晕，无法行动！')
  } else if (playerAction === 'item' && usedItem) {
    log.push(`你使用了${usedItem.name}`)
    // 道具效果在外部处理
  } else if (playerAction === 'defend') {
    player.defending = true
    log.push('你进入防御姿态，本回合受到的伤害减半')
  }
  
  // 怪物死亡检查
  if (monster.hp <= 0) {
    return { victory: true, log, playerDmg, monsterDmg: null }
  }
  
  // 怪物自愈
  if (monster.skills && monster.skills.includes('heal')) {
    const heal = Math.floor(monster.maxHp * 0.05)
    monster.hp = Math.min(monster.maxHp, monster.hp + heal)
    log.push(`${monster.name}回复了 ${heal} 点气血`)
  }
  
  // 检查怪物是否被眩晕
  const monsterStunned = monster.statusEffects?.some(e => e.type === 'stun' && e.turns > 0)
  
  // 怪物行动
  if (!monsterStunned) {
    // AOE技能
    if (monster.skills && monster.skills.includes('aoe')) {
      monster.skillCooldowns = monster.skillCooldowns || {}
      const cd = monster.skillCooldowns.aoe || 0
      if (cd <= 0) {
        let aoeDmg = calculateMonsterDamage(monster, player)
        aoeDmg.damage = Math.floor(aoeDmg.damage * 1.5)
        if (player.defending) aoeDmg.damage = Math.floor(aoeDmg.damage * 0.5)
        player.hp -= aoeDmg.damage
        log.push(`${monster.name}释放范围攻击，造成 ${aoeDmg.damage} 点伤害！`)
        monster.skillCooldowns.aoe = 3
        monsterDmg = aoeDmg
      } else {
        monster.skillCooldowns.aoe = cd - 1
        monsterDmg = doMonsterAttack(monster, player, log)
      }
    } else {
      monsterDmg = doMonsterAttack(monster, player, log)
    }
  } else {
    log.push(`${monster.name}被眩晕，无法行动！`)
  }
  
  // 处理状态效果
  processStatusEffects(player, monster, log)
  
  // 重置防御姿态
  player.defending = false
  
  // 玩家死亡检查
  if (player.hp <= 0) {
    return { victory: false, log, playerDmg, monsterDmg }
  }
  
  return { victory: null, log, playerDmg, monsterDmg }
}

function doMonsterAttack(monster, player, log) {
  const dmg = calculateMonsterDamage(monster, player)
  let finalDmg = dmg.damage
  if (player.defending) finalDmg = Math.floor(finalDmg * 0.5)
  
  // 护盾
  if (player.shield && player.shield > 0) {
    const absorbed = Math.min(player.shield, finalDmg)
    player.shield -= absorbed
    finalDmg -= absorbed
    if (absorbed > 0) log.push(`护盾吸收了 ${absorbed} 点伤害`)
  }
  
  player.hp -= finalDmg
  log.push(`${monster.name}对你造成了 ${finalDmg} 点伤害${dmg.isCrit ? '（暴击！）' : ''}`)
  
  // 怪物吸血
  if (monster.skills && monster.skills.includes('vampire')) {
    const heal = Math.floor(dmg.damage * 0.3)
    monster.hp = Math.min(monster.maxHp, monster.hp + heal)
    log.push(`${monster.name}吸取了 ${heal} 点气血`)
  }
  
  // 状态效果
  if (dmg.isPoison) {
    player.statusEffects = player.statusEffects || []
    if (!player.statusEffects.some(e => e.type === 'poison')) {
      player.statusEffects.push({ type: 'poison', turns: 3, value: 0.05 })
    }
    log.push('你中毒了！')
  }
  if (dmg.isBurn) {
    player.statusEffects = player.statusEffects || []
    if (!player.statusEffects.some(e => e.type === 'burn')) {
      player.statusEffects.push({ type: 'burn', turns: 3, value: 0.08 })
    }
    log.push('你被灼烧了！')
  }
  if (dmg.isStun) {
    player.statusEffects = player.statusEffects || []
    player.statusEffects.push({ type: 'stun', turns: 1 })
    log.push('你被眩晕了！')
  }
  if (dmg.isDrain) {
    const drain = Math.floor(player.hp * 0.1)
    player.hp -= drain
    monster.hp = Math.min(monster.maxHp, monster.hp + drain)
    log.push(`${monster.name}吸取了你 ${drain} 点气血`)
  }
  
  return dmg
}

function processStatusEffects(player, monster, log) {
  // 玩家状态
  if (player.statusEffects) {
    player.statusEffects = player.statusEffects.filter(e => {
      if (e.type === 'poison' || e.type === 'burn') {
        const dmg = Math.floor(player.maxHp * e.value)
        player.hp -= dmg
        log.push(`你因${e.type === 'poison' ? '中毒' : '灼烧'}损失 ${dmg} 点气血`)
      }
      e.turns--
      return e.turns > 0
    })
  }
  // 怪物状态
  if (monster.statusEffects) {
    monster.statusEffects = monster.statusEffects.filter(e => {
      e.turns--
      return e.turns > 0
    })
  }
  // 护盾持续
  if (player.shieldDuration !== undefined) {
    player.shieldDuration--
    if (player.shieldDuration <= 0) {
      player.shield = 0
      player.shieldDuration = 0
    }
  }
}
