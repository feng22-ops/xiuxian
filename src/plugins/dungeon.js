// 地牢Roguelike系统
// 地牢由多层组成，每层有随机房间，玩家选择路径前进

// 房间类型
export const ROOM_TYPES = {
  BATTLE: { id: 'battle', name: '战斗', icon: '⚔️', desc: '遭遇怪物' },
  ELITE: { id: 'elite', name: '精英', icon: '💀', desc: '强大的精英怪物' },
  BOSS: { id: 'boss', name: 'BOSS', icon: '👹', desc: '层主BOSS' },
  TREASURE: { id: 'treasure', name: '宝箱', icon: '📦', desc: '发现宝箱' },
  SHOP: { id: 'shop', name: '商店', icon: '🏪', desc: '神秘商人' },
  REST: { id: 'rest', name: '休息', icon: '🔥', desc: '篝火休息点' },
  EVENT: { id: 'event', name: '奇遇', icon: '❓', desc: '随机奇遇事件' },
  TRAP: { id: 'trap', name: '陷阱', icon: '⚠️', desc: '危险的陷阱' }
}

// 地牢层数配置
export const DUNGEON_CONFIGS = [
  { id: 'wanxiang', name: '万象窟', minRealm: 0, maxDepth: 10, desc: '入门修士的试炼之地，危机与机遇并存。', enemyMult: 1.0, rewardMult: 1.0 },
  { id: 'xuanming', name: '玄冥渊', minRealm: 1, maxDepth: 15, desc: '阴气森森的深渊，藏有筑基期的机缘。', enemyMult: 1.5, rewardMult: 1.5 },
  { id: 'jindan', name: '金丹秘境', minRealm: 2, maxDepth: 20, desc: '上古金丹修士的坐化之地，凶险异常。', enemyMult: 2.2, rewardMult: 2.2 },
  { id: 'yuanying', name: '元婴坟场', minRealm: 3, maxDepth: 25, desc: '无数元婴大能陨落之地，怨气冲天。', enemyMult: 3.0, rewardMult: 3.0 },
  { id: 'huashen', name: '化神遗迹', minRealm: 4, maxDepth: 30, desc: '化神期存在的遗迹，一步一生死。', enemyMult: 4.0, rewardMult: 4.0 },
  { id: 'tianmo', name: '天魔战场', minRealm: 6, maxDepth: 40, desc: '上古神魔大战的战场，天魔横行。', enemyMult: 6.0, rewardMult: 6.0 }
]

// 奇遇事件池
export const DUNGEON_EVENTS = [
  {
    id: 'old_man',
    name: '神秘老者',
    desc: '一位白发老者盘坐在地，似乎在等待什么人。',
    choices: [
      { text: '上前请教', effect: 'random_buff', risk: 0.2 },
      { text: '留下灵石供奉', effect: 'donate', cost: 0.1 },
      { text: '绕道而行', effect: 'none' }
    ]
  },
  {
    id: 'spirit_spring',
    name: '灵泉',
    desc: '一汪散发着灵气的泉水，饮之似乎有益。',
    choices: [
      { text: '饮用灵泉', effect: 'heal_or_poison', risk: 0.15 },
      { text: '收集灵泉水', effect: 'get_item', item: 'lingquan_water' },
      { text: '不碰为妙', effect: 'none' }
    ]
  },
  {
    id: 'stone_tablet',
    name: '古碑',
    desc: '一块刻满符文的古碑，似乎记载着某种功法。',
    choices: [
      { text: '参悟碑文', effect: 'cult_exp', risk: 0.1 },
      { text: '拓印碑文', effect: 'get_item', item: 'tablet_rubbing' },
      { text: '离开', effect: 'none' }
    ]
  },
  {
    id: 'treasure_guardian',
    name: '守宝妖兽',
    desc: '一只妖兽守护着一堆宝物，它似乎在打瞌睡。',
    choices: [
      { text: '偷袭妖兽', effect: 'elite_battle' },
      { text: '悄悄拿一件就跑', effect: 'steal', risk: 0.4 },
      { text: '不打扰它', effect: 'none' }
    ]
  },
  {
    id: 'fallen_cultivator',
    name: '陨落修士',
    desc: '一位修士的遗骸，身上似乎还有储物袋。',
    choices: [
      { text: '搜索储物袋', effect: 'loot', risk: 0.1 },
      { text: '埋葬遗骸', effect: 'karma_good' },
      { text: '无视', effect: 'none' }
    ]
  },
  {
    id: 'demon_altar',
    name: '魔祭坛',
    desc: '一座散发着邪气的祭坛，上面放着祭品。',
    choices: [
      { text: '献祭精血', effect: 'demon_buff', cost: 0.2 },
      { text: '摧毁祭坛', effect: 'karma_good_battle' },
      { text: '离开', effect: 'none' }
    ]
  },
  {
    id: 'merchant',
    name: '游商',
    desc: '一位神秘的游商，出售着稀奇古怪的东西。',
    choices: [
      { text: '查看商品', effect: 'shop' },
      { text: '离开', effect: 'none' }
    ]
  },
  {
    id: 'formation',
    name: '传送阵',
    desc: '一座古老的传送阵，光芒闪烁不定。',
    choices: [
      { text: '激活传送阵', effect: 'teleport', risk: 0.3 },
      { text: '研究阵法', effect: 'cult_exp' },
      { text: '离开', effect: 'none' }
    ]
  }
]

// 生成一层地牢的房间布局
export function generateDungeonFloor(depth, config) {
  const rooms = []
  // 每层3-5个房间可选路径
  const roomCount = 3 + Math.floor(Math.random() * 3)
  
  // BOSS层（每5层）
  const isBossFloor = depth % 5 === 0
  
  for (let i = 0; i < roomCount; i++) {
    let roomType
    if (isBossFloor && i === roomCount - 1) {
      roomType = ROOM_TYPES.BOSS
    } else {
      roomType = rollRoomType(depth, config)
    }
    rooms.push({
      id: `room_${depth}_${i}`,
      type: roomType.id,
      name: roomType.name,
      icon: roomType.icon,
      desc: roomType.desc,
      cleared: false,
      data: generateRoomData(roomType.id, depth, config)
    })
  }
  return { depth, rooms, isBossFloor }
}

function rollRoomType(depth, config) {
  const roll = Math.random()
  // 深度越深，精英和陷阱越多
  const eliteChance = Math.min(0.2, 0.08 + depth * 0.005)
  const trapChance = Math.min(0.15, 0.05 + depth * 0.004)
  const treasureChance = 0.12
  const shopChance = 0.08
  const restChance = 0.08
  const eventChance = 0.15
  
  if (roll < eliteChance) return ROOM_TYPES.ELITE
  if (roll < eliteChance + trapChance) return ROOM_TYPES.TRAP
  if (roll < eliteChance + trapChance + treasureChance) return ROOM_TYPES.TREASURE
  if (roll < eliteChance + trapChance + treasureChance + shopChance) return ROOM_TYPES.SHOP
  if (roll < eliteChance + trapChance + treasureChance + shopChance + restChance) return ROOM_TYPES.REST
  if (roll < eliteChance + trapChance + treasureChance + shopChance + restChance + eventChance) return ROOM_TYPES.EVENT
  return ROOM_TYPES.BATTLE
}

function generateRoomData(type, depth, config) {
  switch (type) {
    case 'battle':
    case 'elite':
    case 'boss':
      return { monsterCount: type === 'boss' ? 1 : (type === 'elite' ? 1 : 1 + Math.floor(Math.random() * 2)) }
    case 'treasure':
      return { opened: false, quality: Math.random() < 0.1 ? 'epic' : (Math.random() < 0.3 ? 'rare' : 'common') }
    case 'shop':
      return { items: generateShopItems(depth, config) }
    case 'rest':
      return { used: false, healAmount: 0.3 + Math.random() * 0.2 }
    case 'event':
      return { event: DUNGEON_EVENTS[Math.floor(Math.random() * DUNGEON_EVENTS.length)] }
    case 'trap':
      return { disarmed: false, damage: 0.1 + Math.random() * 0.15, detected: Math.random() < 0.3 }
    default:
      return {}
  }
}

function generateShopItems(depth, config) {
  // 生成3-5个商店物品
  const items = []
  const count = 3 + Math.floor(Math.random() * 3)
  // 从丹药和符箓中随机选
  const allConsumables = [
    { id: 'huiqi', type: 'pill' }, { id: 'yangqi', type: 'pill' }, { id: 'jiedu', type: 'pill' },
    { id: 'poling', type: 'pill' }, { id: 'zengling', type: 'pill' }, { id: 'dahuan', type: 'pill' },
    { id: 'huolei', type: 'talisman' }, { id: 'bingfeng', type: 'talisman' }, { id: 'hudun', type: 'talisman' },
    { id: 'chuansong', type: 'talisman' }, { id: 'tianlei', type: 'talisman' }
  ]
  const shuffled = allConsumables.sort(() => Math.random() - 0.5)
  for (let i = 0; i < count && i < shuffled.length; i++) {
    items.push({ ...shuffled[i], sold: false })
  }
  return items
}
