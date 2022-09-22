import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import Overview from "../views/overview.vue"
import CompareView from "../views/CompareView.vue";
import InspectionView from "../views/InspectionView.vue"

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
    {
      path: "/inspection/:entity/:outlet",
      name: "inspection",
      component: InspectionView,
    },
  ],
});

export default router;
