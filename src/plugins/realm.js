// 境界系统配置
// 每个大境界分初期/中期/后期/圆满四个小阶段
export const REALMS = [
  { id: 0, name: '练气', sub: ['一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层'], baseCultivation: 100, cultMult: 1.5, baseHp: 100, baseAtk: 10, baseDef: 5 },
  { id: 1, name: '筑基', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 5000, cultMult: 2.0, baseHp: 500, baseAtk: 50, baseDef: 25 },
  { id: 2, name: '金丹', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 50000, cultMult: 2.2, baseHp: 2000, baseAtk: 200, baseDef: 100 },
  { id: 3, name: '元婴', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 300000, cultMult: 2.5, baseHp: 8000, baseAtk: 800, baseDef: 400 },
  { id: 4, name: '化神', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 2000000, cultMult: 2.8, baseHp: 30000, baseAtk: 3000, baseDef: 1500 },
  { id: 5, name: '炼虚', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 12000000, cultMult: 3.0, baseHp: 100000, baseAtk: 10000, baseDef: 5000 },
  { id: 6, name: '合体', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 80000000, cultMult: 3.2, baseHp: 350000, baseAtk: 35000, baseDef: 17500 },
  { id: 7, name: '大乘', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 500000000, cultMult: 3.5, baseHp: 1200000, baseAtk: 120000, baseDef: 60000 },
  { id: 8, name: '渡劫', sub: ['初期', '中期', '后期', '圆满'], baseCultivation: 3000000000, cultMult: 4.0, baseHp: 5000000, baseAtk: 500000, baseDef: 250000 }
]

export function getRealmInfo(realmId, subId) {
  const realm = REALMS[realmId]
  if (!realm) return null
  const subName = realm.sub[subId] || realm.sub[realm.sub.length - 1]
  const totalSub = realm.sub.length
  // 修为需求 = base * cultMult^subId
  const cultNeed = Math.floor(realm.baseCultivation * Math.pow(realm.cultMult, subId))
  return {
    realmId,
    subId,
    name: `${realm.name}${subName}`,
    realmName: realm.name,
    subName,
    totalSub,
    cultNeed,
    baseHp: realm.baseHp * (1 + subId * 0.15),
    baseAtk: realm.baseAtk * (1 + subId * 0.15),
    baseDef: realm.baseDef * (1 + subId * 0.15)
  }
}

export function getNextRealm(realmId, subId) {
  const realm = REALMS[realmId]
  if (!realm) return null
  if (subId < realm.sub.length - 1) {
    return { realmId, subId: subId + 1, isBreakthrough: false }
  }
  if (realmId < REALMS.length - 1) {
    return { realmId: realmId + 1, subId: 0, isBreakthrough: true }
  }
  return null // 已达巅峰
}

// 突破成功率（大境界突破更低）
export function getBreakthroughRate(realmId, subId, isBigBreakthrough, luck) {
  let base
  if (isBigBreakthrough) {
    base = Math.max(0.15, 0.7 - realmId * 0.06)
  } else {
    base = Math.max(0.4, 0.9 - realmId * 0.05)
  }
  // 幸运值加成，每点幸运+1%，上限+30%
  const luckBonus = Math.min(0.3, luck * 0.01)
  return Math.min(0.95, base + luckBonus)
}
