import { createRouter, createWebHistory } from "vue-router";
import Overview from "../views/overview.vue"
import BeliefView from "../views/BeliefView.vue"
import CompareView from "../views/CompareView.vue";
import InspectionView from "../views/InspectionView.vue"
import SummaryView from "../views/SummaryView.vue"
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Overview,
      meta: { order: 0 },
    },
    {
      path: "/belief/:order/:outlet/:entity",
      name: "belief",
      component: BeliefView,
      meta: { order: 1 },
    },
    {
      path: "/compare/:entity/",
      name: "compare",
      component: CompareView,
      meta: { order: 2 },
    },
    {
      path: "/inspection/:entity",
      name: "inspection",
      component: InspectionView,
      meta: { order: 3 },
    },
    {
      path: "/summary/:entity",
      name: "summary",
      component: SummaryView,
      meta: { order: 4 },
    },
  ],
});

export default router;
