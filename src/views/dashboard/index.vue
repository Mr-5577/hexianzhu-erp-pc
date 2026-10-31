<!-- 首页（工作台占位，按业务需要替换） -->
<template>
  <div class="dashboard">
    <el-card shadow="never">
      <h2>欢迎使用 {{ appTitle }}</h2>
      <p class="desc">
        这是一个基于 Vue3 + Vite + TypeScript + Element Plus + vxe-table
        的后台管理系统基础模板。
      </p>
      <el-divider />
      <p>左侧「组件示例」菜单中内置了 base-vxe-table 的 11 种典型用法示例。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE || "管理系统";
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.desc {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
}
</style>
