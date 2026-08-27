<!-- 示例5：多级表头（带编辑） -->
<template>
  <div class="demo-page">
    <h3>📊 项目经营报表（多级表头-带编辑）</h3>

    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="false"
      @data-change="handleDataChange"
    >
      <!-- 金额列格式化 -->
      <template #amount-format="{ row, column }">
        <span
          :style="{
            color:
              column.field === 'profit'
                ? row[column.field] < 0
                  ? '#f56c6c'
                  : '#67c23a'
                : '#303133',
          }"
        >
          {{ row[column.field]?.toLocaleString("zh-CN") }}
        </span>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ===== 静态数据 =====
const tableData = ref([
  {
    id: 1,
    project: "成都金融城项目",
    revenue: 12500000,
    cost: 8200000,
    profit: 4300000,
    margin: 34.4,
  },
  {
    id: 2,
    project: "天府新区孵化园",
    revenue: 8800000,
    cost: 6100000,
    profit: 2700000,
    margin: 30.7,
  },
  {
    id: 3,
    project: "高新区智慧园区",
    revenue: 5600000,
    cost: 4300000,
    profit: 1300000,
    margin: 23.2,
  },
  {
    id: 4,
    project: "锦江生态带整治",
    revenue: 3200000,
    cost: 3800000,
    profit: -600000,
    margin: -18.8,
  },
  {
    id: 5,
    project: "东部新区基础设施",
    revenue: 21000000,
    cost: 15600000,
    profit: 5400000,
    margin: 25.7,
  },
]);

// ===== 多级表头配置 =====
const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { type: "seq", width: 60, title: "序号" },
  {
    field: "project",
    title: "项目名称",
    width: 200,
    editable: true,
    editType: "input",
    placeholder: "请输入项目名称",
  },
  {
    title: "经营数据",
    children: [
      {
        field: "revenue",
        title: "营业收入",
        width: 150,
        slots: { default: "amount-format" },
        editable: true,
        editType: "number",
        precision: 2,
        placeholder: "请输入收入",
      },
      {
        field: "cost",
        title: "营业成本",
        width: 150,
        slots: { default: "amount-format" },
        editable: true,
        editType: "number",
        precision: 2,
        placeholder: "请输入成本",
      },
      {
        field: "profit",
        title: "利润",
        width: 150,
        slots: { default: "amount-format" },
        editable: true,
        editType: "number",
        precision: 2,
        placeholder: "请输入利润",
      },
    ],
  },
  {
    title: "比率",
    children: [
      {
        field: "margin",
        title: "利润率（%）",
        width: 120,
        editable: true,
        editType: "number",
        precision: 1,
        placeholder: "请输入利润率",
        formatter: (value) => (value !== undefined ? `${value}%` : "-"),
      },
    ],
  },
];

const handleDataChange = (params: any) => {
  console.log("数据变化:", params);
  ElMessage.success(`"${params.field}" 已更新`);
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>