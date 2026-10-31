<!--
  演示中心：
  - 📋 业务场景示例：按真实业务页面组织的用法（含去重后的合并示例）
  - 🔧 常用功能示例：vxe-table 各特性独立的最小化用法
-->
<template>
  <div class="demo-page">
    <el-tabs v-model="activeGroup" class="group-tabs">
      <!-- ==================== 业务场景示例 ==================== -->
      <el-tab-pane label="📋 业务场景示例" name="biz">
        <el-tabs v-model="bizTab" class="inner-tabs">
          <el-tab-pane label="基础编辑列表" name="biz1" style="height: 100%">
            <table1 />
          </el-tab-pane>
          <el-tab-pane label="综合业务列表" name="biz2" style="height: 100%">
            <table6 />
          </el-tab-pane>
          <el-tab-pane label="只读报表页" name="biz3" style="height: 100%">
            <table9 />
          </el-tab-pane>
          <el-tab-pane label="明细展开行" name="biz4" style="height: 100%">
            <table11 />
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>

      <!-- ==================== 常用功能示例 ==================== -->
      <el-tab-pane label="🔧 常用功能示例" name="feature">
        <el-tabs v-model="featureTab" class="inner-tabs">
          <el-tab-pane label="分页列表" name="f1" style="height: 100%">
            <table2 />
          </el-tab-pane>
          <el-tab-pane label="树形表格" name="f2" style="height: 100%">
            <table3 />
          </el-tab-pane>
          <el-tab-pane label="字典映射" name="f3" style="height: 100%">
            <table4 />
          </el-tab-pane>
          <el-tab-pane label="多级表头编辑" name="f4" style="height: 100%">
            <table5 />
          </el-tab-pane>
          <el-tab-pane label="树形级联编辑" name="f5" style="height: 100%">
            <table8 />
          </el-tab-pane>
          <el-tab-pane label="树形+虚拟滚动" name="f6" style="height: 100%">
            <table10 />
          </el-tab-pane>
          <el-tab-pane label="高度自适应" name="f7" style="height: 100%">
            <table12 />
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>

      <!-- ==================== 其他组件 ==================== -->
      <el-tab-pane label="📝 表单组件示例" name="form" style="height: 100%">
        <form-example />
      </el-tab-pane>
      <el-tab-pane label="🪟 弹窗组件示例" name="dialog" style="height: 100%">
        <dialog-example />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// ===== 业务场景示例 =====
import table1 from "./table-example/table1.vue"; // 基础编辑列表
import table6 from "./table-example/table6.vue"; // 综合业务列表
import table9 from "./table-example/table9.vue"; // 只读报表页（含操作列）
import table11 from "./table-example/table11.vue"; // 明细展开行

// ===== 常用功能示例 =====
import table2 from "./table-example/table2.vue"; // 分页
import table3 from "./table-example/table3.vue"; // 树形
import table4 from "./table-example/table4.vue"; // 字典映射
import table5 from "./table-example/table5.vue"; // 多级表头
import table8 from "./table-example/table8.vue"; // 树形级联编辑
import table10 from "./table-example/table10.vue"; // 树形+虚拟滚动
import table12 from "./table-example/table12.vue"; // 高度自适应

// ===== 其他组件 =====
import formExample from "./form-example/index.vue";
import dialogExample from "./dialog-example/index.vue";

const activeGroup = ref("biz");
const bizTab = ref("biz1");
const featureTab = ref("f1");
</script>

<style scoped>
.demo-page {
  width: 100%;
  height: 100%;
  padding: 12px;
  background: #fff;
}

/* 外层分组页签加粗，与内层示例页签区分 */
.group-tabs :deep(.el-tabs__item) {
  font-weight: 600;
}

.inner-tabs {
  padding-top: 4px;
}
</style>
