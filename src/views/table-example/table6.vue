<!-- 示例6：综合示例（带操作栏和自定义插槽） -->
<template>
  <div class="demo-page">
    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50]"
      @pagination-change="handlePageChange"
      @selection-change="handleSelectionChange"
      @refresh="handleRefresh"
    >
      <!-- ===== 操作栏插槽 ===== -->
      <template #actionBar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增合同
        </el-button>
        <el-button
          type="danger"
          plain
          @click="handleBatchDelete"
          :disabled="selectedRows.length === 0"
        >
          批量删除
        </el-button>
        <el-button type="success" plain @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <span style="margin-left: 12px; font-size: 13px; color: #909399">
          已选 {{ selectedRows.length }} 项
        </span>
      </template>

      <!-- ===== 工具栏左侧插槽 ===== -->
      <template #toolbar-left>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索合同名称/编号"
          size="small"
          style="width: 200px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filterStatus"
          placeholder="全部状态"
          size="small"
          style="width: 120px"
          clearable
        >
          <el-option label="生效中" value="1" />
          <el-option label="已终止" value="0" />
        </el-select>
      </template>

      <!-- ===== 状态插槽 ===== -->
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
          {{ row.status === 1 ? "生效中" : "已终止" }}
        </el-tag>
      </template>

      <!-- ===== 金额插槽 ===== -->
      <template #amount="{ row }">
        <span style="color: #409eff; font-weight: 600">
          ¥ {{ row.amount?.toLocaleString("zh-CN") }}
        </span>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Download, Search } from "@element-plus/icons-vue";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ===== 静态数据 =====
const allData = ref([
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
  {
    id: 6,
    contractNo: "HT-2024-006",
    contractName: "空调设备采购合同",
    supplier: "格力电器",
    amount: 1200000,
    status: 1,
  },
  {
    id: 7,
    contractNo: "HT-2024-007",
    contractName: "弱电系统施工合同",
    supplier: "华为技术",
    amount: 2300000,
    status: 1,
  },
  {
    id: 8,
    contractNo: "HT-2024-008",
    contractName: "精装修施工合同",
    supplier: "金螳螂装饰",
    amount: 8500000,
    status: 0,
  },
]);

const tableData = ref<any[]>([]);
const selectedRows = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);
const searchKeyword = ref("");
const filterStatus = ref("");

// ===== 列配置 =====
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
    title: "合同金额",
    width: 150,
    slots: { default: "amount" },
    editable: true,
    editType: "number",
    placeholder: "请输入金额",
  },
  {
    field: "status",
    title: "状态",
    width: 100,
    slots: { default: "status" },
    editable: true,
    editType: "select",
    options: [
      { label: "生效中", value: 1 },
      { label: "已终止", value: 0 },
    ],
  },
];

// ===== 筛选和分页 =====
const filteredData = computed(() => {
  return allData.value.filter((item) => {
    // 关键词搜索
    const matchKeyword =
      !searchKeyword.value ||
      item.contractName.includes(searchKeyword.value) ||
      item.contractNo.includes(searchKeyword.value);
    // 状态筛选
    const matchStatus =
      !filterStatus.value || item.status === Number(filterStatus.value);
    return matchKeyword && matchStatus;
  });
});

const updateTableData = () => {
  total.value = filteredData.value.length;
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  tableData.value = filteredData.value.slice(start, end);
};

// ===== 事件处理 =====
const handlePageChange = (params: {
  currentPage: number;
  pageSize: number;
}) => {
  currentPage.value = params.currentPage;
  pageSize.value = params.pageSize;
  updateTableData();
};

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
};

const handleRefresh = () => {
  ElMessage.success("刷新成功");
  updateTableData();
};

const handleSearch = () => {
  currentPage.value = 1;
  updateTableData();
};

const handleAdd = () => {
  const newId = Math.max(...allData.value.map((d) => d.id)) + 1;
  allData.value.push({
    id: newId,
    contractNo: `HT-2024-${String(newId).padStart(3, "0")}`,
    contractName: `新合同${newId}`,
    supplier: "待定",
    amount: 0,
    status: 1,
  });
  updateTableData();
  ElMessage.success("新增成功");
};

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return;
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条合同吗？`,
    "批量删除",
    { type: "warning" },
  )
    .then(() => {
      const ids = selectedRows.value.map((r) => r.id);
      allData.value = allData.value.filter((item) => !ids.includes(item.id));
      selectedRows.value = [];
      updateTableData();
      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

const handleExport = () => {
  ElMessage.success("导出成功");
};

// ===== 监听筛选变化 =====
watch([searchKeyword, filterStatus], () => {
  currentPage.value = 1;
  updateTableData();
});

// ===== 初始化 =====
updateTableData();
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>