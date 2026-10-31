import { defineStore } from "pinia";
import { ref } from "vue";
import { TOKEN_KEY } from "@/constants";

/** 用户信息（按实际业务字段扩展） */
export interface UserInfo {
  id?: string | number;
  name?: string;
  avatar?: string;
  [key: string]: any;
}

export const useUserStore = defineStore(
  "user-store",
  () => {
    const userInfo = ref<UserInfo | null>(null);
    const token = ref<string>("");
    /** 角色列表（如 ['admin']） */
    const roles = ref<string[]>([]);
    /**
     * 权限标识列表（如 ['dashboard:view', 'demo:crud']）。
     * 包含 '*' 表示超级管理员，拥有全部权限。
     */
    const permissions = ref<string[]>([]);

    const setUserInfo = (info: UserInfo | null) => {
      userInfo.value = info;
    };

    const setToken = (newToken: string) => {
      token.value = newToken;
      // 同步到 localStorage，供 axios 请求拦截器在非 setup 环境读取
      localStorage.setItem(TOKEN_KEY, newToken);
    };

    /** 设置角色与权限（登录后由后端返回） */
    const setPermissions = (newRoles: string[], newPermissions: string[]) => {
      roles.value = newRoles || [];
      permissions.value = newPermissions || [];
    };

    const clearUserInfo = () => {
      userInfo.value = null;
      token.value = "";
      roles.value = [];
      permissions.value = [];
      localStorage.removeItem(TOKEN_KEY);
    };

    // ==================== 权限判断 ====================
    /** 是否拥有指定权限标识 */
    const hasPermission = (code: string): boolean => {
      if (!code) return true;
      return (
        permissions.value.includes("*") || permissions.value.includes(code)
      );
    };

    /** 是否拥有任意一个权限标识 */
    const hasAnyPermission = (codes: string | string[]): boolean => {
      const list = Array.isArray(codes) ? codes : [codes];
      return list.some((code) => hasPermission(code));
    };

    /** 是否拥有全部权限标识 */
    const hasAllPermissions = (codes: string | string[]): boolean => {
      const list = Array.isArray(codes) ? codes : [codes];
      return list.every((code) => hasPermission(code));
    };

    /** 是否拥有指定角色 */
    const hasRole = (role: string): boolean => {
      return roles.value.includes(role);
    };

    return {
      // 数据
      userInfo,
      token,
      roles,
      permissions,

      // 方法
      setUserInfo,
      setToken,
      setPermissions,
      clearUserInfo,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
    };
  },
  {
    persist: true, // 添加持久化配置
  },
);
