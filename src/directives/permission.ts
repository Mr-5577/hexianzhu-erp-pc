import type { Directive } from "vue";
import { useUserStore } from "@/stores/user-store";

/**
 * v-permission 权限指令（按钮/元素级权限控制）
 *
 * 用法：
 *   <el-button v-permission="'user:create'">新增用户</el-button>
 *   <el-button v-permission="['user:update', 'user:edit']">编辑</el-button>
 *
 * 说明：
 * - 无权限时直接移除元素（从 DOM 中删除）
 * - 权限标识由后端登录接口返回，存储于 user store
 * - 数组形式表示"拥有任意一个即可"
 */
export const vPermission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const userStore = useUserStore();
    const value = binding.value;
    if (!value) return;

    const needPermissions = Array.isArray(value) ? value : [value];
    const pass = needPermissions.some(
      (code) =>
        userStore.permissions.includes("*") ||
        userStore.permissions.includes(code),
    );

    if (!pass) {
      el.parentNode?.removeChild(el);
    }
  },
};
