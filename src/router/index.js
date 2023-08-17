import { createRouter, createWebHistory } from "vue-router";
import Tutorialview from "../views/Tutorialview.vue"
import Overview from "../views/overview.vue"
import BeliefView from "../views/BeliefView.vue"
// import CompareView from "../views/CompareView.vue";
import InspectionView from "../views/InspectionView.vue"
import SummaryView from "../views/SummaryView.vue"
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "tutorial",
      component: Tutorialview,
      meta: { order: 0 },
    },
    {
      path: "/home",
      name: "home",
      component: Overview,
      meta: { order: 1 },
    },
    {
      path: "/belief/:outlet/:entity",
      name: "belief",
      component: BeliefView,
      meta: { order: 2 },
    },
    // {
    //   path: "/compare/:entity/",
    //   name: "compare",
    //   component: CompareView,
    //   meta: { order: 2 },
    // },
    {
      path: "/inspection/:outlet/:entity",
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
router.beforeEach((to, from, next) => {
  // Redirect if user is disallowed to view the page
  if(to.name === "belief" && from.name === "inspection") {
    return router.push({ name: 'home'})
  }
  return next()
})

export default router;
