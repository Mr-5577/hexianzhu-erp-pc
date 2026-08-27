<!-- 示例1：基础表格 -->
<template>
  <div class="demo-page">
    <h3>📋 合同列表（基础编辑）</h3>
    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="false"
      @data-change="handleDataChange"
      @selection-change="handleSelectionChange"
      @refresh="handleRefresh"
    >
      <!-- 状态列自定义插槽 -->
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

// ===== 静态数据 =====
const tableData = ref([
  {
    id: 1,
    contractNo: "HT-2024-001",
    contractName: "幕墙工程施工合同",
    supplier: "中建幕墙有限公司",
    amount: 12500000,
    taxRate: 9,
    status: 1,
  },
  {
    id: 2,
    contractNo: "HT-2024-002",
    contractName: "电梯采购安装合同",
    supplier: "三菱电梯有限公司",
    amount: 3800000,
    taxRate: 13,
    status: 1,
  },
  {
    id: 3,
    contractNo: "HT-2024-003",
    contractName: "消防系统改造合同",
    supplier: "华安消防工程公司",
    amount: 980000,
    taxRate: 6,
    status: 0,
  },
  {
    id: 4,
    contractNo: "HT-2024-004",
    contractName: "智能化系统集成合同",
    supplier: "海康威视科技",
    amount: 5600000,
    taxRate: 6,
    status: 1,
  },
  {
    id: 5,
    contractNo: "HT-2024-005",
    contractName: "园林景观设计合同",
    supplier: "泛亚景观设计",
    amount: 280000,
    taxRate: 3,
    status: 0,
  },
]);

// ===== 列配置 =====
const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { field: "id", title: "ID", width: 70 },
  {
    field: "contractNo",
    title: "合同编号",
    width: 550,
    editable: true,
    editType: "input",
    placeholder: "请输入合同编号",
  },
  {
    field: "contractName",
    title: "合同名称",
    width: 220,
    editable: true,
    editType: "input",
    placeholder: "请输入合同名称",
  },
  {
    field: "supplier",
    title: "供应商",
    width: 180,
    editable: true,
    editType: "input",
    placeholder: "请输入供应商名称",
  },
  {
    field: "amount",
    title: "合同金额（元）",
    width: 160,
    editable: true,
    editType: "number",
    precision: 2,
    placeholder: "请输入金额",
    formatter: (value) => {
      if (!value) return "-";
      return value.toLocaleString("zh-CN");
    },
  },
  {
    field: "taxRate",
    title: "税率（%）",
    width: 100,
    editable: true,
    editType: "number",
    precision: 0,
    placeholder: "请输入税率",
  },
  {
    field: "status",
    title: "状态",
    width: 100,
    slots: { default: "status" },
  },
];

// ===== 事件处理 =====
const handleDataChange = (params: any) => {
  console.log("数据变化:", params);
  ElMessage.success(`"${params.field}" 已更新为: ${params.newValue}`);
};

const handleSelectionChange = (selection: any[]) => {
  console.log("选中行:", selection);
};

const handleRefresh = () => {
  ElMessage.info("刷新数据");
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>
