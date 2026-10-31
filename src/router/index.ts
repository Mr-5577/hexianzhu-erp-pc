import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { TOKEN_KEY, WHITE_LIST } from "@/constants";
import { usePermissionStore } from "@/stores/permission-store";
import { useUserStore } from "@/stores/user-store";

NProgress.configure({ showSpinner: false });

/**
 * 基础路由（无需权限过滤，始终注册）
 * 业务路由统一放在 src/router/routes.ts 的 asyncRoutes 中，
 * 登录后由守卫按用户权限动态注册到 Layout 下。
 */
const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: { title: "登录", hidden: true, requiresAuth: false },
  },
  {
    path: "/",
    name: "Layout",
    component: () => import("@/layout/index.vue"),
    redirect: "/dashboard",
    children: [],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/404.vue"),
    // 注意：不要给兜底路由加 requiresAuth: false——
    // 动态路由注册完成前，任何未匹配地址（含 /dashboard 首次跳转）都会
    // 落入此兜底路由，若在守卫白名单判断之前放行，会跳过登录校验与动态路由注册
    meta: { title: "404", hidden: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// ============================================================================
// 全局路由守卫
// ============================================================================
router.beforeEach(async (to, _from, next) => {
  NProgress.start();

  // 动态页面标题
  const appTitle = import.meta.env.VITE_APP_TITLE || "管理系统";
  document.title = to.meta?.title ? `${to.meta.title} - ${appTitle}` : appTitle;

  const token = localStorage.getItem(TOKEN_KEY);

  // 免登录白名单：仅按路径判断（不能用 to.meta.requiresAuth——
  // 未匹配地址会落入 404 兜底路由并携带其 meta，导致绕过登录校验）
  if (WHITE_LIST.includes(to.path)) {
    // 已登录时访问登录页则跳回首页
    if (to.path === "/login" && token) {
      next("/");
      return;
    }
    next();
    return;
  }

  // 未登录：跳转登录页并记录回跳地址
  if (!token) {
    next({ path: "/login", query: { redirect: to.fullPath } });
    return;
  }

  // 已登录：首次进入时按权限注册动态路由
  const permissionStore = usePermissionStore();
  if (!permissionStore.routesAdded) {
    permissionStore.generateRoutes(router);

    /**
     * 没有任何可见路由：说明当前登录态缺少权限数据
     * （常见于旧版本持久化的 token：有 token 但 permissions 为空），
     * 继续导航必然落到 404 兜底路由，这里直接清理会话引导重新登录
     */
    if (permissionStore.menuRoutes.length === 0) {
      const userStore = useUserStore();
      userStore.clearUserInfo();
      permissionStore.reset();
      next({ path: "/login", query: { redirect: to.fullPath } });
      return;
    }

    /**
     * 动态路由刚注册完成，需要重新导航：
     * 必须用 to.fullPath 而不是 to.path——初次访问 "/" 时 redirect 到
     * /dashboard 会因路由尚未注册而落入 404 兜底（to.path 已变成
     * /:pathMatch(.*)*），此时 to.fullPath 仍保留原始地址 /dashboard，
     * 重新导航即可正确匹配；query/hash 也随 fullPath 一并保留
     */
    next({ path: to.fullPath, replace: true });
    return;
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
