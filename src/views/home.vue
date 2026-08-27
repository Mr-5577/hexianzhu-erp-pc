<template>
  <div style="width: 100%; height: 100%; padding: 20px">
    <h1>欢迎来到 ERP 管理系统</h1>
    <p>项目已成功启动！</p>
    <el-button type="primary">主要按钮</el-button>
    <el-input v-model="inputValue" placeholder="请输入内容" />
    <el-tabs v-model="activeTab">
      <el-tab-pane label="列表(基础编辑)" name="table1" style="height: 100%">
        <table1 />
      </el-tab-pane>
      <el-tab-pane label="列表（带分页）" name="table2" style="height: 100%">
        <table2 />
      </el-tab-pane>
      <el-tab-pane label="树形列表" name="table3" style="height: 100%">
        <table3 />
      </el-tab-pane>
      <el-tab-pane label="字典映射列表" name="table4" style="height: 100%">
        <table4 />
      </el-tab-pane>
      <el-tab-pane label="多级表头-编辑" name="table5" style="height: 100%">
        <table5 />
      </el-tab-pane>
      <el-tab-pane label="综合列表" name="table6" style="height: 100%">
        <table6 />
      </el-tab-pane>
      <el-tab-pane label="列表-只读" name="table7" style="height: 100%">
        <table7 />
      </el-tab-pane>
      <el-tab-pane label="列表-部分可编辑" name="table8" style="height: 100%">
        <table8 />
      </el-tab-pane>
      <el-tab-pane label="列表-不编辑" name="table9" style="height: 100%">
        <table9 />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import table1 from "./table-example/table1.vue";
import table2 from "./table-example/table2.vue";
import table3 from "./table-example/table3.vue";
import table4 from "./table-example/table4.vue";
import table5 from "./table-example/table5.vue";
import table6 from "./table-example/table6.vue";
import table7 from "./table-example/table7.vue";
import table8 from "./table-example/table8.vue";
import table9 from "./table-example/table9.vue";

const inputValue = ref("");

const activeTab = ref("table1");
</script>

<style scoped>
h1 {
  color: #42b883;
}
</style>
