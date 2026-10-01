<!-- 示例7：完全只读表格 + 操作列 -->
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
      @cell-click="handleCellClick"
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

      <!-- 操作列：通用 TableActions 组件 -->
      <template #action="{ row }">
        <TableActions
          :row="row"
          :actions="actionList"
          :max-visible="2"
          @action="handleAction"
        />
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  Edit,
  Delete,
  View,
  CopyDocument,
  Download,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";
import TableActions from "@/components/base/table-actions.vue";
import type { TableActionItem } from "@/components/base/table-actions.vue";

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

/** 判断当前行是否可编辑/删除：状态为 0（已终止）时不可操作 */
const canOperate = (row: any) => row.status !== 0;

/** 操作项配置 */
const actionList: TableActionItem[] = [
  {
    key: "edit",
    label: "编辑",
    type: "primary",
    icon: Edit,
    disabled: (row) => !canOperate(row),
  },
  {
    key: "detail",
    label: "详情",
    type: "primary",
    icon: View,
  },
  {
    key: "delete",
    label: "删除",
    type: "danger",
    icon: Delete,
    disabled: (row) => !canOperate(row),
  },
  {
    key: "copy",
    label: "复制",
    type: "primary",
    icon: CopyDocument,
    alwaysHidden: true,
  },
  {
    key: "export",
    label: "导出",
    type: "primary",
    icon: Download,
    alwaysHidden: true,
  },
];

/** 统一事件分发 */
const handleAction = ({ key, row }: { key: string; row: any }) => {
  const map: Record<string, (r: any) => void> = {
    edit: handleEdit,
    detail: handleDetail,
    delete: handleDelete,
    copy: handleCopy,
    export: handleExport,
  };
  map[key]?.(row);
};

const handleEdit = (row: any) => {
  ElMessage.info(`编辑：${row.contractName}`);
};

const handleDetail = (row: any) => {
  ElMessage.info(`查看详情：${row.contractName}`);
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除「${row.contractName}」吗？`, "提示", {
    type: "warning",
  })
    .then(() => {
      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

const handleCopy = (row: any) => {
  ElMessage.success(`已复制：${row.contractNo}`);
};

const handleExport = (row: any) => {
  ElMessage.success(`导出：${row.contractNo}`);
};

const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { type: "seq", width: 60, title: "序号" },
  {
    field: "contractNo",
    title: "合同编号",
    width: 150,
    editable: true,
    clickable: true,
    onClick: (data) => {
      console.log("点击了合同编号:", data);
    },
  },
  {
    field: "contractName",
    title: "合同名称",
    width: 200,
  },
  {
    field: "supplier",
    title: "供应商",
    width: 180,
  },
  {
    field: "amount",
    title: "合同金额",
    width: 150,
    slots: { default: "amount" },
  },
  {
    field: "status",
    title: "状态",
    width: 100,
    slots: { default: "status" },
  },
  {
    field: "action",
    title: "操作",
    width: 190,
    fixed: "right",
    slots: { default: "action" },
  },
];

const handleSelectionChange = (selection: any[]) => {
  console.log("选中:", selection);
};
const handleCellClick = (data: any) => {
  console.log("单元格点击:", data);
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>
