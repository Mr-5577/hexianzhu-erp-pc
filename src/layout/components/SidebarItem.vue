<!-- 菜单项（递归支持多级菜单） -->
<template>
  <!-- 有可见子菜单 → 递归渲染 el-sub-menu -->
  <el-sub-menu v-if="visibleChildren.length > 0" :index="resolvePath">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <span>{{ item.meta?.title }}</span>
    </template>
    <SidebarItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      :base-path="resolvePath"
    />
  </el-sub-menu>

  <!-- 无子菜单 → 普通菜单项 -->
  <el-menu-item v-else :index="resolvePath">
    <el-icon v-if="item.meta?.icon">
      <component :is="item.meta.icon" />
    </el-icon>
    <template #title>{{ item.meta?.title }}</template>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RouteRecordRaw } from "vue-router";

const props = defineProps<{
  item: RouteRecordRaw;
  basePath: string;
}>();

/** 过滤掉 hidden 的子路由 */
const visibleChildren = computed(() => {
  return (props.item.children || []).filter((r) => !r.meta?.hidden);
});

/** 拼接完整路径（处理相对/绝对路径） */
const resolvePath = computed(() => {
  if (props.item.path.startsWith("/")) return props.item.path;
  return `${props.basePath.replace(/\/$/, "")}/${props.item.path}`;
});
</script>
