import type { RouteRecordRaw } from "vue-router";

/**
 * 动态业务路由（登录后按权限注册）
 *
 * 权限规则：
 * - meta 无 code：所有登录用户可见
 * - meta 有 code：需拥有对应权限标识（后端登录接口下发）
 * - meta.hidden：不在菜单显示（如详情页）
 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: "dashboard",
    name: "Dashboard",
    component: () => import("@/views/dashboard/index.vue"),
    meta: {
      title: "首页",
      icon: "HomeFilled",
      code: "dashboard:view",
      order: 1,
      affix: true,
    },
  },
  {
    path: "crud-demo",
    name: "CrudDemo",
    component: () => import("@/views/demo/crud-demo/index.vue"),
    meta: { title: "CRUD 样板", icon: "Files", code: "demo:crud", order: 2 },
  },
  {
    path: "demo",
    name: "Demo",
    component: () => import("@/views/demo/index.vue"),
    meta: { title: "组件示例", icon: "Grid", code: "system:demo", order: 3 },
  },
];
