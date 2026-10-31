<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn";
</script>

<style lang="scss">
// 全局样式统一在 src/styles/index.scss 中维护（由 main.ts 引入）
</style>
