import { createRouter, createWebHistory } from "vue-router";
import Cooking from "@/views/Cooking.vue";
import Store from "@/views/Store.vue";
import Todo from "@/views/Todo.vue";
import History from "@/views/History.vue";
import RecipeView from "@/views/RecipeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "cooking",
      component: Cooking,
    },
    {
      path: "/cooking",
      name: "cooking-main",
      component: Cooking,
    },
    {
      path: "/store",
      name: "store",
      component: Store,
    },
    {
      path: "/todo",
      name: "todo",
      component: Todo,
    },
    {
      path: "/history",
      name: "history",
      component: History,
    },
    {
      path: "/recipe/:id",
      name: "recipe",
      component: RecipeView,
      props: true,
    },
  ],
});

export default router;
