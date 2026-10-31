<!-- 系统主布局：左侧菜单 + 顶部导航 + 主内容区 -->
<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="asideWidth" class="layout-aside">
      <Sidebar :collapsed="collapsed" />
    </el-aside>

    <el-container class="layout-right">
      <!-- 顶部导航 -->
      <el-header class="layout-header" height="50px">
        <Navbar v-model:collapsed="collapsed" />
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import Sidebar from "./components/Sidebar.vue";
import Navbar from "./components/Navbar.vue";

/** 侧边栏折叠状态 */
const collapsed = ref(false);

const asideWidth = computed(() => (collapsed.value ? "64px" : "210px"));
</script>

<style lang="scss" scoped>
@use "@/styles/variables.scss" as *;

.layout-container {
  width: 100%;
  height: 100%;
}

.layout-aside {
  background: $sidebar-bg;
  transition: width 0.28s;
  overflow: hidden;
}

.layout-right {
  min-width: 0;
  height: 100%;
}

.layout-header {
  padding: 0;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
}

.layout-main {
  padding: $page-padding;
  background: var(--el-fill-color-light);
  overflow: auto;
}

// 页面切换动画
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
