<template>
    <div>
        <h1>欢迎来到 ERP 管理系统</h1>
        <p>项目已成功启动！</p>
        <el-button type="primary">主要按钮</el-button>
        <el-input v-model="inputValue" placeholder="请输入内容" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const inputValue = ref('')
</script>

<style scoped>
h1 {
    color: #42b883;
}
</style>