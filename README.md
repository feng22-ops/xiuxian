# 玄府地牢 - 放置修仙 + 地牢肉鸽

一款硬核生存向的文字修仙放置游戏，适合上班摸鱼。

## 核心玩法

- **挂机修炼**：修为自动增长，满后可突破境界（练气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫）
- **地牢探索**：Roguelike 地牢，每层随机房间（战斗/精英/BOSS/宝箱/商店/休息/奇遇/陷阱）
- **硬核生存**：地牢中死亡损失 20% 修为和 10% 灵石，可能丢失物品
- **装备养成**：5 档品质（凡品→良品→上品→极品→仙品），随机主副属性
- **功法系统**：9 种功法，影响修炼速度和战斗属性
- **丹药符箓**：战斗中使用，回血/输出/控制/逃跑
- **离线收益**：关闭游戏后继续获得修为（50% 效率，最多 8 小时）
- **本地存档**：自动保存 + 手动导出/导入备份

## 技术栈

- Vue 3 + Vite
- Pinia 状态管理
- Vue Router
- 纯前端，无需后端

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署到 GitHub Pages（推荐，自动构建）

项目已内置 GitHub Actions 自动部署配置，推送代码后自动构建发布：

1. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
2. 推送代码到 `main` 或 `master` 分支
3. 等待 Actions 构建完成（约1-2分钟）
4. 访问 `https://你的用户名.github.io/仓库名/`

### 手动部署

```bash
npm run build
# 将 dist 目录内容推送到 gh-pages 分支
```

## 移动端

游戏已适配手机浏览器，支持触摸操作。建议在手机上"添加到主屏幕"，获得类似 App 的体验。

## 游戏提示

- 上班时挂着修炼，有空就下地牢刷装备
- 地牢中注意保留气血，篝火点可以恢复
- 大境界突破成功率较低，建议使用破障丹
- 每 5 层是 BOSS 层，击败后才能继续深入
- 幸运值影响掉落和突破成功率
- 死亡惩罚较重，打不过就跑，留得青山在不怕没柴烧

## 项目结构

```
src/
├── main.js              # 入口
├── App.vue              # 主布局
├── router/              # 路由
├── stores/
│   └── player.js        # 玩家状态（核心逻辑）
├── plugins/
│   ├── realm.js         # 境界系统
│   ├── techniques.js    # 功法系统
│   ├── items.js         # 物品/装备系统
│   ├── monsters.js      # 怪物系统
│   ├── dungeon.js       # 地牢生成
│   └── combat.js        # 战斗系统
└── views/
    ├── Home.vue         # 主页
    ├── Cultivation.vue  # 修炼
    ├── Dungeon.vue      # 地牢
    ├── Battle.vue       # 战斗
    ├── Inventory.vue    # 背包
    ├── Technique.vue    # 功法
    └── Settings.vue     # 设置
```

## License

MIT
