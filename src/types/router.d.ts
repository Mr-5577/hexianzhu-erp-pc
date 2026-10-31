import "vue-router";

// ============================================================================
// 路由 meta 类型扩展（菜单生成、守卫、标题均依赖这些字段）
// ============================================================================
declare module "vue-router" {
  interface RouteMeta {
    /** 页面标题（同时用于菜单名、面包屑、document.title） */
    title?: string;
    /** 菜单图标（element-plus 图标组件名，已全局注册，如 "HomeFilled"） */
    icon?: string;
    /** 是否在菜单中隐藏（登录页、详情页等） */
    hidden?: boolean;
    /** 是否固定在首页标签（预留） */
    affix?: boolean;
    /** 是否需要登录（默认需要，白名单路由设为 false） */
    requiresAuth?: boolean;
    /** 菜单排序，数字越小越靠前 */
    order?: number;
    /** 权限标识：拥有该权限的用户才能访问/看到该菜单（后端登录接口下发） */
    code?: string;
  }
}

export {};
