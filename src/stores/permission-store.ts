import { defineStore } from "pinia";
import { ref } from "vue";
import type { RouteRecordRaw } from "vue-router";
import { asyncRoutes } from "@/router/routes";
import { useUserStore } from "@/stores/user-store";

/**
 * 权限路由 store：根据当前用户权限过滤动态路由，
 * 生成「路由注册列表」与「菜单列表」
 */
export const usePermissionStore = defineStore("permission-store", () => {
  /** 已生成的菜单路由（侧边栏数据源） */
  const menuRoutes = ref<RouteRecordRaw[]>([]);
  /** 动态路由是否已注册（防止重复 addRoute） */
  const routesAdded = ref(false);

  /**
   * 按权限过滤路由树
   * - 无 meta.code 的路由所有人可见
   * - 有 meta.code 的路由需拥有对应权限
   * - 过滤后 children 为空的多级菜单容器也被移除
   */
  const filterRoutes = (
    routes: RouteRecordRaw[],
    hasPermission: (code: string) => boolean,
  ): RouteRecordRaw[] => {
    return routes
      .filter((route) => {
        const code = route.meta?.code as string | undefined;
        return !code || hasPermission(code);
      })
      .map((route) => {
        if (route.children?.length) {
          const children = filterRoutes(route.children, hasPermission);
          // 子级全部被过滤掉时，若该路由本身有权限要求则保留与否取决于它自己；
          // 作为纯容器（无 component 或无自身标题）且子级为空时丢弃
          const isContainer = !route.meta?.title;
          if (isContainer && children.length === 0) {
            return null;
          }
          return { ...route, children } as RouteRecordRaw;
        }
        return route;
      })
      .filter((r): r is RouteRecordRaw => r !== null);
  };

  /**
   * 生成权限路由：
   * 1. 过滤 asyncRoutes
   * 2. 注册到主布局下（router 实例由调用方传入，避免循环依赖）
   */
  const generateRoutes = (router: {
    addRoute: (parentName: string, route: RouteRecordRaw) => void;
  }) => {
    const userStore = useUserStore();
    const filtered = filterRoutes(asyncRoutes, userStore.hasPermission);

    for (const route of filtered) {
      router.addRoute("Layout", route);
    }

    // 动态路由重定向兜底：权限变化后 / 可能指向不可见页面
    menuRoutes.value = filtered.filter((r) => !r.meta?.hidden);
    routesAdded.value = true;
  };

  /** 重置（退出登录 / 切换账号时调用） */
  const reset = () => {
    menuRoutes.value = [];
    routesAdded.value = false;
  };

  return {
    menuRoutes,
    routesAdded,
    generateRoutes,
    reset,
  };
});
