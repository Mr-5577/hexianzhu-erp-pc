<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>
<script setup lang="ts"></script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  min-height: 100vh;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
  "Helvetica Neue", Arial, sans-serif;
}

// 全局滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: var(--el-border-color-dark);
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background: var(--el-border-color-darker);
  }
}
</style>
