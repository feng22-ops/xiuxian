// 物品系统：丹药、符箓、材料、装备

// ========== 丹药 ==========
export const PILLS = [
  { id: 'huiqi', name: '回气丹', grade: '下品', description: '恢复少量气血。', effect: { type: 'heal', value: 0.2 }, price: 20, dropRate: 0.3 },
  { id: 'yangqi', name: '养气丹', grade: '中品', description: '恢复中量气血，并短暂提升防御。', effect: { type: 'heal', value: 0.4, buff: { def: 0.1, duration: 3 } }, price: 80, dropRate: 0.15 },
  { id: 'jiedu', name: '解毒丹', grade: '中品', description: '清除中毒状态，并恢复少量气血。', effect: { type: 'cleanse', heal: 0.15 }, price: 60, dropRate: 0.12 },
  { id: 'poling', name: '破障丹', grade: '上品', description: '突破时使用，提升20%成功率。', effect: { type: 'breakthrough', bonus: 0.2 }, price: 500, dropRate: 0.05 },
  { id: 'zengling', name: '增灵丹', grade: '上品', description: '修炼速度提升50%，持续30分钟。', effect: { type: 'cultBuff', value: 0.5, duration: 1800 }, price: 300, dropRate: 0.06 },
  { id: 'dahuan', name: '大还丹', grade: '极品', description: '完全恢复气血，并在5回合内提升30%攻击。', effect: { type: 'heal', value: 1.0, buff: { atk: 0.3, duration: 5 } }, price: 2000, dropRate: 0.02 },
  { id: 'xitian', name: '洗髓丹', grade: '极品', description: '重置所有属性点，可重新分配。', effect: { type: 'reset' }, price: 5000, dropRate: 0.01 },
  { id: 'zhuji', name: '筑基丹', grade: '仙品', description: '筑基期以下突破必定成功。', effect: { type: 'breakthroughGuarantee', maxRealm: 1 }, price: 10000, dropRate: 0.005 }
]

// ========== 符箓 ==========
export const TALISMANS = [
  { id: 'huolei', name: '火雷符', grade: '下品', description: '对敌人造成当前攻击150%的伤害。', effect: { type: 'damage', mult: 1.5 }, price: 30, dropRate: 0.25 },
  { id: 'bingfeng', name: '冰封符', grade: '中品', description: '冻结敌人2回合，并造成100%攻击伤害。', effect: { type: 'damage', mult: 1.0, stun: 2 }, price: 100, dropRate: 0.12 },
  { id: 'hudun', name: '护盾符', grade: '中品', description: '获得相当于最大气血30%的护盾，持续3回合。', effect: { type: 'shield', value: 0.3, duration: 3 }, price: 90, dropRate: 0.14 },
  { id: 'chuansong', name: '传送符', grade: '上品', description: '立即逃离地牢，保留所有收益。', effect: { type: 'escape' }, price: 300, dropRate: 0.05 },
  { id: 'zhaohuan', name: '召唤符', grade: '上品', description: '召唤一具傀儡助战3回合，攻击力为自身的80%。', effect: { type: 'summon', mult: 0.8, duration: 3 }, price: 250, dropRate: 0.06 },
  { id: 'tianlei', name: '天雷符', grade: '极品', description: '召唤天雷，对敌人造成500%攻击的毁灭伤害。', effect: { type: 'damage', mult: 5.0 }, price: 1500, dropRate: 0.015 }
]

// ========== 材料 ==========
export const MATERIALS = [
  { id: 'lingcao_low', name: '百年灵草', grade: '普通', description: '炼丹的基础材料。', price: 10, dropRate: 0.4 },
  { id: 'lingcao_mid', name: '千年灵草', grade: '稀有', description: '炼制中品丹药的材料。', price: 50, dropRate: 0.15 },
  { id: 'yaogu_low', name: '低级妖骨', grade: '普通', description: '炼器材料。', price: 15, dropRate: 0.35 },
  { id: 'yaogu_mid', name: '中级妖骨', grade: '稀有', description: '炼制精良装备的材料。', price: 80, dropRate: 0.12 },
  { id: 'jingpo', name: '妖兽精魄', grade: '稀有', description: '蕴含妖兽之力，可用于装备强化。', price: 120, dropRate: 0.08 },
  { id: 'tianshu', name: '天书残页', grade: '史诗', description: '上古功法的残页，收集可参悟高阶功法。', price: 500, dropRate: 0.02 }
]

// ========== 装备 ==========
// 装备槽位
export const EQUIP_SLOTS = [
  { id: 'weapon', name: '法器' },
  { id: 'armor', name: '护甲' },
  { id: 'accessory', name: '饰品' }
]

// 装备品质
export const EQUIP_QUALITIES = [
  { id: 'common', name: '凡品', color: '#9ca3af', mult: 1.0, subStatCount: 0 },
  { id: 'fine', name: '良品', color: '#22c55e', mult: 1.3, subStatCount: 1 },
  { id: 'rare', name: '上品', color: '#3b82f6', mult: 1.7, subStatCount: 2 },
  { id: 'epic', name: '极品', color: '#a855f7', mult: 2.3, subStatCount: 3 },
  { id: 'legendary', name: '仙品', color: '#f59e0b', mult: 3.2, subStatCount: 4 }
]

// 装备主属性模板
export const EQUIP_TEMPLATES = {
  weapon: [
    { name: '剑', atkMult: 1.2, speedMult: 1.0 },
    { name: '刀', atkMult: 1.4, speedMult: 0.85 },
    { name: '杖', atkMult: 1.0, speedMult: 1.1, cultBonus: 0.05 },
    { name: '幡', atkMult: 0.9, speedMult: 1.0, hpBonus: 0.1 }
  ],
  armor: [
    { name: '袍', defMult: 1.0, hpMult: 1.2, speedMult: 1.05 },
    { name: '甲', defMult: 1.4, hpMult: 1.0, speedMult: 0.9 },
    { name: '衣', defMult: 0.8, hpMult: 1.1, speedMult: 1.15, dodgeBonus: 0.03 }
  ],
  accessory: [
    { name: '戒指', atkMult: 0.5, defMult: 0.3, hpMult: 0.3 },
    { name: '项链', hpMult: 0.8, defMult: 0.2, cultBonus: 0.03 },
    { name: '玉佩', defMult: 0.5, hpMult: 0.5, luckBonus: 1 }
  ]
}

// 副属性池
export const SUB_STATS = [
  { id: 'atk', name: '攻击', base: 5, isPercent: false },
  { id: 'def', name: '防御', base: 3, isPercent: false },
  { id: 'hp', name: '气血', base: 20, isPercent: false },
  { id: 'speed', name: '速度', base: 2, isPercent: false },
  { id: 'critRate', name: '暴击率', base: 0.02, isPercent: true },
  { id: 'dodgeRate', name: '闪避率', base: 0.02, isPercent: true },
  { id: 'vampireRate', name: '吸血率', base: 0.02, isPercent: true },
  { id: 'comboRate', name: '连击率', base: 0.02, isPercent: true },
  { id: 'stunRate', name: '眩晕率', base: 0.015, isPercent: true },
  { id: 'critDamage', name: '暴击伤害', base: 0.05, isPercent: true }
]

// 生成随机装备
export function generateEquip(slot, realmId, depth = 1, luck = 1) {
  const templates = EQUIP_TEMPLATES[slot]
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  // 品质roll（深度和幸运影响）
  const qualityRoll = Math.random() + depth * 0.01 + luck * 0.005
  let quality
  if (qualityRoll > 0.98) quality = EQUIP_QUALITIES[4]
  else if (qualityRoll > 0.9) quality = EQUIP_QUALITIES[3]
  else if (qualityRoll > 0.75) quality = EQUIP_QUALITIES[2]
  else if (qualityRoll > 0.5) quality = EQUIP_QUALITIES[1]
  else quality = EQUIP_QUALITIES[0]
  
  // 基础值根据境界
  const realmMult = Math.pow(1.8, realmId) * (1 + depth * 0.05)
  const baseAtk = Math.floor(10 * realmMult * template.atkMult * quality.mult)
  const baseDef = Math.floor(5 * realmMult * (template.defMult || 0.5) * quality.mult)
  const baseHp = Math.floor(50 * realmMult * (template.hpMult || 0.5) * quality.mult)
  
  // 副属性
  const subStats = []
  const availableStats = [...SUB_STATS]
  for (let i = 0; i < quality.subStatCount; i++) {
    if (availableStats.length === 0) break
    const idx = Math.floor(Math.random() * availableStats.length)
    const stat = availableStats.splice(idx, 1)[0]
    const value = stat.isPercent 
      ? +(stat.base * quality.mult * (0.8 + Math.random() * 0.4)).toFixed(3)
      : Math.floor(stat.base * quality.mult * realmMult * (0.8 + Math.random() * 0.4))
    subStats.push({ id: stat.id, name: stat.name, value, isPercent: stat.isPercent })
  }
  
  const name = `${quality.name}${template.name}`
  return {
    id: `equip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    slot,
    name,
    quality: quality.id,
    qualityName: quality.name,
    color: quality.color,
    mainStats: { atk: baseAtk, def: baseDef, hp: baseHp },
    subStats,
    cultBonus: template.cultBonus || 0,
    luckBonus: template.luckBonus || 0,
    dodgeBonus: template.dodgeBonus || 0,
    level: 0,
    price: Math.floor((baseAtk + baseDef + baseHp) * quality.mult * 2)
  }
}

export function getItemById(id) {
  return [...PILLS, ...TALISMANS, ...MATERIALS].find(i => i.id === id)
}

export function rollLootTable(depth, realmId, luck) {
  // 根据地牢深度和境界生成战利品
  const loot = { items: [], stone: 0, exp: 0 }
  loot.stone = Math.floor((10 + depth * 5) * (1 + realmId * 0.5) * (0.8 + Math.random() * 0.4))
  loot.exp = Math.floor((5 + depth * 3) * (1 + realmId * 0.5))
  
  // 丹药掉落
  if (Math.random() < 0.3 + luck * 0.01) {
    const pill = PILLS[Math.floor(Math.random() * PILLS.length)]
    if (Math.random() < pill.dropRate * (1 + depth * 0.02)) {
      loot.items.push({ ...pill, type: 'pill', quantity: 1 })
    }
  }
  // 符箓掉落
  if (Math.random() < 0.2 + luck * 0.01) {
    const tal = TALISMANS[Math.floor(Math.random() * TALISMANS.length)]
    if (Math.random() < tal.dropRate * (1 + depth * 0.02)) {
      loot.items.push({ ...tal, type: 'talisman', quantity: 1 })
    }
  }
  // 材料掉落
  if (Math.random() < 0.5) {
    const mat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)]
    if (Math.random() < mat.dropRate) {
      loot.items.push({ ...mat, type: 'material', quantity: 1 + Math.floor(Math.random() * 3) })
    }
  }
  return loot
}
