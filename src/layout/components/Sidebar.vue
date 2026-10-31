<!-- 侧边栏：Logo + 菜单（菜单根据路由 meta 自动生成） -->
<template>
  <div class="sidebar">
    <!-- Logo -->
    <div class="logo" @click="$router.push('/')">
      <img src="/logo.png" alt="logo" class="logo-img" />
      <span v-show="!collapsed" class="logo-title">{{ appTitle }}</span>
    </div>

    <!-- 菜单 -->
    <el-scrollbar class="menu-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <SidebarItem
          v-for="route in menuRoutes"
          :key="route.path"
          :item="route"
          :base-path="layoutPath"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SidebarItem from "./SidebarItem.vue";
import { usePermissionStore } from "@/stores/permission-store";

defineProps<{
  collapsed: boolean;
}>();

const route = useRoute();
const permissionStore = usePermissionStore();

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || "管理系统");

/** 主布局路径（子菜单路径基于此拼接） */
const layoutPath = "/";

/**
 * 菜单数据源：来自权限 store（登录后按用户权限过滤生成的路由），
 * 过滤 hidden、按 meta.order 排序
 */
const menuRoutes = computed(() =>
  permissionStore.menuRoutes
    .filter((r) => !r.meta?.hidden)
    .sort((a, b) => (a.meta?.order ?? 99) - (b.meta?.order ?? 99)),
);

/** 当前激活菜单 */
const activeMenu = computed(() => route.path);
</script>

<style lang="scss" scoped>
@use "@/styles/variables.scss" as *;

.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo {
  height: $logo-height;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  .logo-img {
    width: 30px;
    height: 30px;
  }

  .logo-title {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
  }
}

.menu-scrollbar {
  flex: 1;
}

// 深色菜单主题
.sidebar-menu {
  border-right: none;
  background: $sidebar-bg;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    color: $sidebar-text;

    &:hover {
      background: $sidebar-hover-bg;
      color: $sidebar-active-text;
    }
  }

  :deep(.el-menu-item.is-active) {
    background: $sidebar-active-bg;
    color: $sidebar-active-text;
  }

  :deep(.el-menu--inline) {
    background: darken($sidebar-bg, 4%);
  }

  // 折叠时去掉右侧留白
  &.el-menu--collapse {
    width: 64px;
  }
}
</style>
