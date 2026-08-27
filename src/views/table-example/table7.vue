<!-- 示例7：完全只读表格 -->
<template>
  <div class="demo-page">
    <h3>📊 经营报表（只读模式）</h3>
    <p style="color: #909399; font-size: 13px">
      通过设置 <code>:readonly="true"</code> 禁用所有编辑功能
    </p>

    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :readonly="true"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="false"
      @selection-change="handleSelectionChange"
    >
      <!-- 金额格式化 -->
      <template #amount="{ row }">
        <span style="color: #409eff; font-weight: 500">
          ¥ {{ row.amount?.toLocaleString("zh-CN") }}
        </span>
      </template>

      <!-- 状态标签 -->
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
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

const tableData = ref([
  {
    id: 1,
    contractNo: "HT-2024-001",
    contractName: "幕墙工程施工合同",
    supplier: "中建幕墙有限公司",
    amount: 12500000,
    status: 1,
  },
  {
    id: 2,
    contractNo: "HT-2024-002",
    contractName: "电梯采购安装合同",
    supplier: "三菱电梯有限公司",
    amount: 3800000,
    status: 1,
  },
  {
    id: 3,
    contractNo: "HT-2024-003",
    contractName: "消防系统改造合同",
    supplier: "华安消防工程公司",
    amount: 980000,
    status: 0,
  },
  {
    id: 4,
    contractNo: "HT-2024-004",
    contractName: "智能化系统集成合同",
    supplier: "海康威视科技",
    amount: 5600000,
    status: 1,
  },
  {
    id: 5,
    contractNo: "HT-2024-005",
    contractName: "园林景观设计合同",
    supplier: "泛亚景观设计",
    amount: 280000,
    status: 0,
  },
]);

const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { type: "seq", width: 60, title: "序号" },
  {
    field: "contractNo",
    title: "合同编号",
    width: 150,
    // 即使设置了 editable，disabled: true 也会覆盖
    editable: true,
  },
  {
    field: "contractName",
    title: "合同名称",
    width: 200,
    editable: true,
  },
  {
    field: "supplier",
    title: "供应商",
    width: 180,
    editable: true,
  },
  {
    field: "amount",
    title: "合同金额",
    width: 150,
    slots: { default: "amount" },
    editable: true,
  },
  {
    field: "status",
    title: "状态",
    width: 100,
    slots: { default: "status" },
    editable: true,
  },
];

const handleSelectionChange = (selection: any[]) => {
  console.log("选中:", selection);
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>