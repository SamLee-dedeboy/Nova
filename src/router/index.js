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
    },
    {
      path: "/belief/:order/:outlet/:entity",
      name: "belief",
      component: BeliefView,
    },
    {
      path: "/compare/:entity/",
      name: "compare",
      component: CompareView,
    },
    {
      path: "/inspection/:entity",
      name: "inspection",
      component: InspectionView,
    },
    {
      path: "/summary/:entity",
      name: "summary",
      component: SummaryView,
    },
  ],
});

export default router;
