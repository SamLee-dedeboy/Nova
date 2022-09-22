import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import Overview from "../views/overview.vue"
import CompareView from "../views/CompareView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Overview,
    },
    {
      path: "/compare/:entity",
      name: "compare",
      component: CompareView,
    },
    
  ],
});

export default router;
