// ============================================================================
// 全局常量
// ============================================================================

/** localStorage 中 token 的 key（request 拦截器与 user store 共用） */
export const TOKEN_KEY = "token";

/** 免登录白名单（路由 path） */
export const WHITE_LIST: string[] = ["/login"];

/** 默认分页配置 */
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];
