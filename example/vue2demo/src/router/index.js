import Vue from 'vue'
import VueRouter from 'vue-router'
import HelloWorld from '../components/HelloWorld.vue'
import PageB from '../components/PageB.vue'
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HelloWorld
  },
  {
    path: '/pageb',
    name: 'PageB',
    component: PageB
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// router.afterEach((to, from) => {
//     console.log('全局监听路由切换：', from.path, '→', to.path);
// });

export default router

