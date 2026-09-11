import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue') },
  { path: '/cultivation', name: 'cultivation', component: () => import('../views/Cultivation.vue') },
  { path: '/dungeon', name: 'dungeon', component: () => import('../views/Dungeon.vue') },
  { path: '/battle', name: 'battle', component: () => import('../views/Battle.vue') },
  { path: '/inventory', name: 'inventory', component: () => import('../views/Inventory.vue') },
  { path: '/blacksmith', name: 'blacksmith', component: () => import('../views/Blacksmith.vue') },
  { path: '/technique', name: 'technique', component: () => import('../views/Technique.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
