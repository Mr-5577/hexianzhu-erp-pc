<!-- 示例8：树形级联可编辑（含多选） -->
<template>
  <div class="demo-page">
    <h3>📋 合同台账（含树形级联可编辑列）</h3>
    <p style="color: #909399; font-size: 13px">
      合同编号、合同名称、项目分类（单选）、项目分类（多选）可编辑；供应商、金额、状态只读
    </p>

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
      <template #amount="{ row }">
        <span style="color: #409eff; font-weight: 500">
          ¥ {{ row.amount?.toLocaleString("zh-CN") }}
        </span>
      </template>

      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
          {{ row.status === 1 ? "生效中" : "已终止" }}
        </el-tag>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ============================================================
// 项目分类选项（树形），单选列 + 多选列共用同一份数据源
// ============================================================
const categoryOptions = [
  {
    value: 1,
    label: "土地类",
    children: [
      { value: 101, label: "住宅用地" },
      { value: 102, label: "商业用地" },
    ],
  },
  {
    value: 2,
    label: "建安类",
    children: [
      {
        value: 201,
        label: "设计类",
        children: [
          { value: 20101, label: "建筑设计" },
          { value: 20102, label: "景观设计" },
          { value: 20103, label: "幕墙设计" },
        ],
      },
      {
        value: 202,
        label: "土建工程",
        children: [
          { value: 20201, label: "桩基工程" },
          { value: 20202, label: "土石方工程" },
        ],
      },
    ],
  },
];

// ============================================================
// 表格数据
// - categoryId：单选（单值）
// - categoryIds：多选（数组）👈 新增
// ============================================================
const tableData = ref([
  {
    id: 1,
    contractNo: "HT-2024-001",
    contractName: "幕墙工程施工合同",
    categoryId: 20103,
    categoryIds: [20103, 20201], // 👈 多选：幕墙设计 + 桩基工程
    supplier: "中建幕墙有限公司",
    amount: 12500000,
    status: 1,
  },
  {
    id: 2,
    contractNo: "HT-2024-002",
    contractName: "电梯采购安装合同",
    categoryId: 20201,
    categoryIds: [20201], // 👈 多选：只选一项
    supplier: "三菱电梯有限公司",
    amount: 3800000,
    status: 1,
  },
  {
    id: 3,
    contractNo: "HT-2024-003",
    contractName: "消防系统改造合同",
    categoryId: 20202,
    categoryIds: [101, 102, 20202], // 👈 多选：跨层级选择
    supplier: "华安消防工程公司",
    amount: 980000,
    status: 0,
  },
]);

// ============================================================
// 列配置
// ============================================================
const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { type: "seq", width: 60, title: "序号" },
  {
    field: "contractNo",
    title: "合同编号",
    width: 150,
    editable: true,
    editType: "input",
    placeholder: "请输入合同编号",
  },
  {
    field: "contractName",
    title: "合同名称",
    width: 200,
    editable: true,
    editType: "input",
    placeholder: "请输入合同名称",
  },
  // ============================================================
  // 项目分类（单选）
  // ============================================================
  {
    field: "categoryId",
    title: "项目分类",
    width: 200,
    editable: true,
    editType: "cascader",
    options: categoryOptions,
    cascaderProps: {
      labelField: "label",
      valueField: "value",
      childrenField: "children",
      multiple: false,
    },
    placeholder: "请选择项目分类",
    editRules: [
      {
        field: "categoryId",
        required: true,
        message: "请选择项目分类22",
      },
    ],
  },
  // ============================================================
  // 👈 新增：项目分类（多选），与单选列共用同一份 categoryOptions
  // ============================================================
  {
    field: "categoryIds",
    title: "项目分类（多选）",
    width: 280,
    editable: true,
    editType: "cascader",
    options: categoryOptions,
    cascaderProps: {
      labelField: "label",
      valueField: "value",
      childrenField: "children",
      multiple: true, // 👈 关键：开启多选
    },
    placeholder: "请选择项目分类（可多选）",
  },
  {
    field: "supplier",
    title: "供应商",
    width: 180,
    editable: false,
  },
  {
    field: "amount",
    title: "合同金额",
    width: 150,
    slots: { default: "amount" },
    editable: false,
  },
  {
    field: "status",
    title: "状态",
    width: 100,
    slots: { default: "status" },
    editable: false,
  },
];

const handleDataChange = (params: any) => {
  ElMessage.success(
    `"${params.field}" 已更新为: ${
      Array.isArray(params.newValue)
        ? params.newValue.join("、")
        : params.newValue
    }`,
  );
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>
