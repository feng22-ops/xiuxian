// 怪物系统
export const MONSTER_TYPES = [
  // 练气期怪物
  { id: 'wolf', name: '妖狼', minRealm: 0, maxRealm: 1, hpMult: 1.0, atkMult: 1.0, defMult: 0.8, speedMult: 1.2, expMult: 1.0, stoneMult: 1.0, skills: [] },
  { id: 'snake', name: '毒蛇', minRealm: 0, maxRealm: 1, hpMult: 0.7, atkMult: 0.9, defMult: 0.6, speedMult: 1.3, expMult: 0.9, stoneMult: 0.8, skills: ['poison'] },
  { id: 'bat', name: '血蝠', minRealm: 0, maxRealm: 2, hpMult: 0.6, atkMult: 1.1, defMult: 0.5, speedMult: 1.5, expMult: 1.0, stoneMult: 0.9, skills: ['vampire'] },
  { id: 'spider', name: '毒蛛', minRealm: 0, maxRealm: 2, hpMult: 0.9, atkMult: 0.8, defMult: 0.9, speedMult: 0.9, expMult: 1.1, stoneMult: 1.0, skills: ['poison', 'web'] },
  // 筑基期怪物
  { id: 'bear', name: '黑熊精', minRealm: 1, maxRealm: 3, hpMult: 1.8, atkMult: 1.2, defMult: 1.3, speedMult: 0.7, expMult: 1.5, stoneMult: 1.5, skills: [] },
  { id: 'tiger', name: '猛虎妖', minRealm: 1, maxRealm: 3, hpMult: 1.2, atkMult: 1.5, defMult: 0.9, speedMult: 1.2, expMult: 1.4, stoneMult: 1.3, skills: ['crit'] },
  { id: 'ghost', name: '游魂', minRealm: 1, maxRealm: 4, hpMult: 0.8, atkMult: 1.3, defMult: 0.6, speedMult: 1.4, expMult: 1.3, stoneMult: 1.2, skills: ['drain'] },
  { id: 'skeleton', name: '骷髅兵', minRealm: 1, maxRealm: 4, hpMult: 1.0, atkMult: 1.0, defMult: 1.2, speedMult: 0.8, expMult: 1.2, stoneMult: 1.1, skills: [] },
  // 金丹期怪物
  { id: 'demon_ape', name: '魔猿', minRealm: 2, maxRealm: 5, hpMult: 1.5, atkMult: 1.6, defMult: 1.0, speedMult: 1.0, expMult: 1.8, stoneMult: 1.8, skills: ['crit', 'rage'] },
  { id: 'water_demon', name: '水妖', minRealm: 2, maxRealm: 5, hpMult: 1.3, atkMult: 1.2, defMult: 1.1, speedMult: 1.1, expMult: 1.6, stoneMult: 1.6, skills: ['heal'] },
  { id: 'fire_lizard', name: '火蜥', minRealm: 2, maxRealm: 5, hpMult: 1.1, atkMult: 1.7, defMult: 0.9, speedMult: 1.1, expMult: 1.7, stoneMult: 1.5, skills: ['burn'] },
  // 元婴及以上
  { id: 'ancient_beast', name: '上古凶兽', minRealm: 3, maxRealm: 8, hpMult: 2.0, atkMult: 1.8, defMult: 1.5, speedMult: 0.9, expMult: 2.5, stoneMult: 2.5, skills: ['crit', 'rage', 'aoe'] },
  { id: 'evil_cultivator', name: '邪修', minRealm: 2, maxRealm: 8, hpMult: 1.0, atkMult: 2.0, defMult: 0.8, speedMult: 1.3, expMult: 2.0, stoneMult: 2.0, skills: ['drain', 'poison', 'crit'] },
  { id: 'stone_golem', name: '石傀儡', minRealm: 2, maxRealm: 8, hpMult: 2.5, atkMult: 1.2, defMult: 2.0, speedMult: 0.5, expMult: 2.0, stoneMult: 3.0, skills: [] }
]

// BOSS配置
export const BOSSES = [
  { id: 'boss_wolf_king', name: '狼王', realm: 0, hpMult: 5, atkMult: 2, defMult: 1.5, speedMult: 1.2, skills: ['crit', 'rage'], lootMult: 3 },
  { id: 'boss_snake_demon', name: '蛇妖', realm: 1, hpMult: 5, atkMult: 2.2, defMult: 1.3, speedMult: 1.3, skills: ['poison', 'drain'], lootMult: 3.5 },
  { id: 'boss_bear_demon', name: '熊罴怪', realm: 2, hpMult: 6, atkMult: 2.0, defMult: 2.0, speedMult: 0.8, skills: ['rage', 'aoe'], lootMult: 4 },
  { id: 'boss_fire_demon', name: '火魔', realm: 3, hpMult: 5.5, atkMult: 2.5, defMult: 1.5, speedMult: 1.1, skills: ['burn', 'aoe', 'crit'], lootMult: 4.5 },
  { id: 'boss_ice_demon', name: '冰魔', realm: 4, hpMult: 5.5, atkMult: 2.3, defMult: 1.8, speedMult: 1.0, skills: ['stun', 'aoe'], lootMult: 5 },
  { id: 'boss_thunder_demon', name: '雷魔', realm: 5, hpMult: 6, atkMult: 2.8, defMult: 1.6, speedMult: 1.4, skills: ['crit', 'stun', 'aoe'], lootMult: 5.5 },
  { id: 'boss_demon_lord', name: '魔尊', realm: 6, hpMult: 7, atkMult: 3.0, defMult: 2.0, speedMult: 1.2, skills: ['drain', 'poison', 'crit', 'rage', 'aoe'], lootMult: 6 },
  { id: 'boss_ancient_dragon', name: '古龙', realm: 7, hpMult: 8, atkMult: 3.2, defMult: 2.5, speedMult: 1.1, skills: ['burn', 'aoe', 'crit', 'rage'], lootMult: 7 },
  { id: 'boss_heavenly_demon', name: '天魔', realm: 8, hpMult: 10, atkMult: 4.0, defMult: 3.0, speedMult: 1.5, skills: ['drain', 'poison', 'burn', 'stun', 'crit', 'rage', 'aoe'], lootMult: 10 }
]

// 怪物技能效果
export const MONSTER_SKILLS = {
  poison: { name: '毒', desc: '攻击有30%几率使目标中毒，每回合损失5%最大气血', proc: 0.3, effect: 'poison' },
  vampire: { name: '吸血', desc: '攻击时回复造成伤害的30%气血', proc: 1.0, effect: 'vampire', value: 0.3 },
  web: { name: '蛛网', desc: '攻击有20%几率使目标减速2回合', proc: 0.2, effect: 'slow' },
  crit: { name: '暴击', desc: '暴击率提升20%', proc: 1.0, effect: 'passive', stat: 'critRate', value: 0.2 },
  rage: { name: '狂暴', desc: '气血低于30%时攻击力提升50%', proc: 1.0, effect: 'passive_rage' },
  drain: { name: '吸取', desc: '攻击有25%几率吸取目标10%当前气血', proc: 0.25, effect: 'drain' },
  heal: { name: '自愈', desc: '每回合回复5%最大气血', proc: 1.0, effect: 'regen', value: 0.05 },
  burn: { name: '灼烧', desc: '攻击有30%几率使目标灼烧，每回合损失8%当前气血', proc: 0.3, effect: 'burn' },
  aoe: { name: '范围攻击', desc: '每3回合释放一次范围攻击，造成150%伤害', proc: 1.0, effect: 'aoe', mult: 1.5, cd: 3 },
  stun: { name: '眩晕', desc: '攻击有15%几率眩晕目标1回合', proc: 0.15, effect: 'stun' }
}

export function generateMonster(realmId, depth, isElite = false, isBoss = false) {
  if (isBoss) {
    const bossPool = BOSSES.filter(b => b.realm <= realmId)
    const boss = bossPool[bossPool.length - 1] || BOSSES[0]
    return createMonsterInstance(boss, realmId, depth, true)
  }
  
  const pool = MONSTER_TYPES.filter(m => realmId >= m.minRealm && realmId <= m.maxRealm)
  const template = pool[Math.floor(Math.random() * pool.length)] || MONSTER_TYPES[0]
  return createMonsterInstance(template, realmId, depth, false, isElite)
}

function createMonsterInstance(template, realmId, depth, isBoss, isElite = false) {
  // 基础值根据境界
  const realmBase = {
    hp: 100 * Math.pow(3, realmId),
    atk: 10 * Math.pow(2.5, realmId),
    def: 5 * Math.pow(2.2, realmId),
    speed: 10 * (1 + realmId * 0.1)
  }
  
  const depthMult = 1 + depth * 0.08
  const eliteMult = isElite ? 1.8 : 1
  
  const maxHp = Math.floor(realmBase.hp * template.hpMult * depthMult * eliteMult * (0.9 + Math.random() * 0.2))
  const atk = Math.floor(realmBase.atk * template.atkMult * depthMult * eliteMult * (0.9 + Math.random() * 0.2))
  const def = Math.floor(realmBase.def * template.defMult * depthMult * eliteMult * (0.9 + Math.random() * 0.2))
  const speed = Math.floor(realmBase.speed * template.speedMult * (0.9 + Math.random() * 0.2))
  
  return {
    id: `mon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: template.name,
    isBoss,
    isElite,
    maxHp,
    hp: maxHp,
    atk,
    def,
    speed,
    skills: template.skills ? [...template.skills] : [],
    statusEffects: [],
    expReward: Math.floor((20 + depth * 10) * (template.expMult || 1) * eliteMult * (isBoss ? (template.lootMult || 3) : 1)),
    stoneReward: Math.floor((15 + depth * 8) * (template.stoneMult || 1) * eliteMult * (isBoss ? (template.lootMult || 3) : 1)),
    skillCooldowns: {}
  }
}
