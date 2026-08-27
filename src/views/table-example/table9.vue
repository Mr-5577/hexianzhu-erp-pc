<!-- 示例9：报表列表页（完全不编辑） -->
<template>
  <div class="demo-page">
    <h3>📈 请款单列表（报表页）</h3>

    <base-vxe-table
      ref="tableRef"
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :readonly="true"
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
      <!-- ===== 操作栏（新增、导出等） ===== -->
      <template #actionBar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增请款
        </el-button>
        <el-button type="success" plain @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button type="warning" plain @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
      </template>

      <!-- ===== 工具栏左侧（搜索、筛选） ===== -->
      <template #toolbar-left>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索请款单号/标题"
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
          placeholder="支付状态"
          size="small"
          style="width: 130px"
          clearable
        >
          <el-option label="未支付" value="未支付" />
          <el-option label="部分支付" value="部分支付" />
          <el-option label="已支付" value="已支付" />
        </el-select>
      </template>

      <!-- ===== 金额格式化 ===== -->
      <template #amount="{ row }">
        <span style="color: #409eff; font-weight: 500">
          ¥ {{ row.amount?.toLocaleString("zh-CN") }}
        </span>
      </template>

      <!-- ===== 状态标签 ===== -->
      <template #payStatus="{ row }">
        <el-tag :type="getStatusType(row.payStatus)" size="small">
          {{ row.payStatus }}
        </el-tag>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Download, Printer, Search } from "@element-plus/icons-vue";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ===== 静态数据（所有数据） =====
const allData = ref([
  {
    id: 1,
    reqNo: "PAY-2024-001",
    reqTitle: "1月工程进度款",
    supplier: "中建集团",
    amount: 12500000,
    payStatus: "部分支付",
    applyDate: "2024-01-15",
  },
  {
    id: 2,
    reqNo: "PAY-2024-002",
    reqTitle: "电梯设备预付款",
    supplier: "三菱电梯",
    amount: 3800000,
    payStatus: "未支付",
    applyDate: "2024-02-20",
  },
  {
    id: 3,
    reqNo: "PAY-2024-003",
    reqTitle: "消防系统改造款",
    supplier: "华安消防",
    amount: 980000,
    payStatus: "已支付",
    applyDate: "2024-03-10",
  },
  {
    id: 4,
    reqNo: "PAY-2024-004",
    reqTitle: "智能化系统集成款",
    supplier: "海康威视",
    amount: 5600000,
    payStatus: "部分支付",
    applyDate: "2024-03-25",
  },
  {
    id: 5,
    reqNo: "PAY-2024-005",
    reqTitle: "设计咨询服务费",
    supplier: "泛亚设计",
    amount: 280000,
    payStatus: "已支付",
    applyDate: "2024-04-01",
  },
  {
    id: 6,
    reqNo: "PAY-2024-006",
    reqTitle: "2月工程进度款",
    supplier: "中建集团",
    amount: 8200000,
    payStatus: "未支付",
    applyDate: "2024-04-15",
  },
  {
    id: 7,
    reqNo: "PAY-2024-007",
    reqTitle: "幕墙材料采购款",
    supplier: "中建幕墙",
    amount: 4500000,
    payStatus: "部分支付",
    applyDate: "2024-05-05",
  },
]);

// ===== 分页相关 =====
const tableData = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(5);
const total = ref(0);

// ===== 搜索/筛选 =====
const searchKeyword = ref("");
const filterStatus = ref("");

// ===== 列配置 =====
const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { type: "seq", width: 60, title: "序号" },
  {
    field: "reqNo",
    title: "请款单号",
    width: 150,
  },
  {
    field: "reqTitle",
    title: "请款标题",
    width: 200,
  },
  {
    field: "supplier",
    title: "供应商",
    width: 150,
  },
  {
    field: "amount",
    title: "请款金额",
    width: 150,
    slots: { default: "amount" },
  },
  {
    field: "payStatus",
    title: "支付状态",
    width: 120,
    slots: { default: "payStatus" },
  },
  {
    field: "applyDate",
    title: "申请日期",
    width: 120,
  },
];

// ===== 辅助方法 =====
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    未支付: "danger",
    部分支付: "warning",
    已支付: "success",
  };
  return map[status] || "info";
};

// ===== 数据筛选和分页 =====
const getFilteredData = () => {
  return allData.value.filter((item) => {
    const matchKeyword =
      !searchKeyword.value ||
      item.reqNo.includes(searchKeyword.value) ||
      item.reqTitle.includes(searchKeyword.value);
    const matchStatus =
      !filterStatus.value || item.payStatus === filterStatus.value;
    return matchKeyword && matchStatus;
  });
};

const updateTableData = () => {
  const filtered = getFilteredData();
  total.value = filtered.length;
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  tableData.value = filtered.slice(start, end);
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

const handleSearch = () => {
  currentPage.value = 1;
  updateTableData();
};

const handleSelectionChange = (selection: any[]) => {
  console.log("选中:", selection);
};

const handleRefresh = () => {
  ElMessage.success("刷新成功");
  updateTableData();
};

const handleAdd = () => {
  ElMessage.info("打开新增弹窗");
};

const handleExport = () => {
  ElMessage.success("导出成功");
};

const handlePrint = () => {
  window.print();
};

// ===== 监听筛选变化 =====
import { watch } from "vue";
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
