// 功法系统
// 功法影响修炼速度和战斗属性，可通过地牢奇遇/商店获得
export const TECHNIQUES = [
  {
    id: 'basic',
    name: '基础吐纳术',
    grade: '凡级',
    description: '最基础的修炼功法，聊胜于无。',
    cultBonus: 1.0,
    combatBonus: { atk: 0, def: 0, hp: 0, speed: 0 },
    dropRate: 1.0
  },
  {
    id: 'qingfeng',
    name: '清风诀',
    grade: '黄级',
    description: '轻灵飘逸的功法，提升速度和闪避。',
    cultBonus: 1.15,
    combatBonus: { atk: 0.05, def: 0, hp: 0, speed: 0.15, dodgeRate: 0.03 },
    dropRate: 0.3
  },
  {
    id: 'tieta',
    name: '铁塔金身功',
    grade: '黄级',
    description: '炼体功法，大幅提升防御和生命。',
    cultBonus: 1.1,
    combatBonus: { atk: 0, def: 0.2, hp: 0.15, speed: -0.05 },
    dropRate: 0.25
  },
  {
    id: 'lieyan',
    name: '烈焰真经',
    grade: '玄级',
    description: '刚猛霸道的火属性功法，攻击极强。',
    cultBonus: 1.3,
    combatBonus: { atk: 0.25, def: 0.05, hp: 0.05, speed: 0.05, critRate: 0.05 },
    dropRate: 0.12
  },
  {
    id: 'hanbing',
    name: '寒冰玄功',
    grade: '玄级',
    description: '阴寒内劲，有几率冻结敌人。',
    cultBonus: 1.28,
    combatBonus: { atk: 0.15, def: 0.1, hp: 0.1, speed: 0, stunRate: 0.05 },
    dropRate: 0.1
  },
  {
    id: 'ziqi',
    name: '紫气东来诀',
    grade: '地级',
    description: '玄门正宗功法，修为增长极快，属性全面。',
    cultBonus: 1.6,
    combatBonus: { atk: 0.2, def: 0.15, hp: 0.15, speed: 0.1, critRate: 0.03, dodgeRate: 0.03 },
    dropRate: 0.05
  },
  {
    id: 'taiyi',
    name: '太一混元功',
    grade: '天级',
    description: '传说中的上古功法，修炼至极致可肉身成圣。',
    cultBonus: 2.0,
    combatBonus: { atk: 0.4, def: 0.3, hp: 0.3, speed: 0.2, critRate: 0.08, critDamageBoost: 0.2, vampireRate: 0.05 },
    dropRate: 0.015
  },
  {
    id: 'xuanming',
    name: '玄冥吞天道',
    grade: '天级',
    description: '魔道至尊功法，以战养战，越战越强。',
    cultBonus: 1.8,
    combatBonus: { atk: 0.5, def: 0.1, hp: 0.1, speed: 0.15, critRate: 0.1, vampireRate: 0.1, comboRate: 0.05 },
    dropRate: 0.01
  }
]

export function getTechniqueById(id) {
  return TECHNIQUES.find(t => t.id === id) || TECHNIQUES[0]
}

// 随机获取功法（根据地牢深度调整稀有度）
export function rollTechnique(dungeonDepth = 1, luck = 1) {
  const pool = TECHNIQUES.filter(t => t.id !== 'basic')
  // 深度越深，高等级功法概率越高
  const depthBonus = Math.min(0.5, dungeonDepth * 0.02)
  const luckBonus = Math.min(0.3, luck * 0.02)
  
  const weights = pool.map(t => {
    let w = t.dropRate
    if (t.grade === '玄级') w *= (1 + depthBonus)
    if (t.grade === '地级') w *= (1 + depthBonus * 1.5)
    if (t.grade === '天级') w *= (1 + depthBonus * 2 + luckBonus)
    return w
  })
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[0]
}
