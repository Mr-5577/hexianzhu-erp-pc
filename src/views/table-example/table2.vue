<!-- 示例2：带分页 -->
<template>
  <div class="demo-page">
    <h3>📄 请款单列表（带分页）</h3>
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
      @data-change="handleDataChange"
      @selection-change="handleSelectionChange"
    >
      <!-- 金额列自定义格式化（使用插槽） -->
      <template #amount="{ row }">
        <span style="color: #409eff; font-weight: 600">
          ¥ {{ row.amount?.toLocaleString("zh-CN") }}
        </span>
      </template>

      <!-- 状态标签 -->
      <template #payStatus="{ row }">
        <el-tag :type="getPayStatusType(row.payStatus)" size="small">
          {{ row.payStatus }}
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

// ===== 生成模拟数据 =====
const generateData = (count: number) => {
  const statuses = ["未支付", "部分支付", "已支付"];
  const names = ["工程款", "材料款", "服务费", "咨询费", "设计费"];
  const suppliers = ["中建集团", "华为技术", "腾讯云", "阿里巴巴", "字节跳动"];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    reqNo: `PAY-2024-${String(i + 1).padStart(4, "0")}`,
    reqTitle: `${names[i % names.length]}请款单`,
    supplier: suppliers[i % suppliers.length],
    amount: Math.round((Math.random() * 500000 + 50000) / 100) * 100,
    payStatus: statuses[i % statuses.length],
    createDate: '2026-08-12',
  }));
};

const allData = generateData(45);
const tableData = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(allData.length);

// ===== 分页数据计算 =====
const getPageData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  tableData.value = allData.slice(start, end);
};

// ===== 列配置 =====
const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { type: "seq", width: 60, title: "序号" },
  {
    field: "reqNo",
    title: "付款单号",
    width: 160,
    editable: true,
    editType: "input",
    placeholder: "请输入付款单号",
  },
  {
    field: "reqTitle",
    title: "请款标题",
    width: 200,
    editable: true,
    editType: "input",
    placeholder: "请输入请款标题",
  },
  {
    field: "supplier",
    title: "供应商",
    width: 150,
    editable: true,
    editType: "input",
    placeholder: "请输入供应商",
  },
  {
    field: "amount",
    title: "请款金额",
    width: 150,
    slots: { default: "amount" },
    editable: true,
    editType: "number",
    placeholder: "请输入金额",
    // ✅ 添加表头提示
    headerTip: {
      content: '金额单位为元（含税），请填写不含税金额的汇总值',
      icon: 'QuestionFilled',
      placement: 'top',
    },
  },
  {
    field: "payStatus",
    title: "支付状态",
    width: 120,
    slots: { default: "payStatus" },
    editable: true,
    editType: "select",
    options: [
      { label: "未支付", value: "未支付" },
      { label: "部分支付", value: "部分支付" },
      { label: "已支付", value: "已支付" },
    ],
  },
  {
    field: "createDate",
    title: "申请日期",
    width: 120,
    editable: true,
    editType: "date",
    placeholder: "请选择日期",
  },
];

// ===== 辅助方法 =====
const getPayStatusType = (status: string) => {
  const map: Record<string, any> = {
    未支付: "danger",
    部分支付: "warning",
    已支付: "success",
  };
  return map[status] || "info";
};

// ===== 事件处理 =====
const handlePageChange = (params: {
  currentPage: number;
  pageSize: number;
}) => {
  currentPage.value = params.currentPage;
  pageSize.value = params.pageSize;
  getPageData();
  ElMessage.info(`切换到第 ${params.currentPage} 页`);
};

const handleDataChange = (params: any) => {
  console.log("数据变化:", params);
};

const handleSelectionChange = (selection: any[]) => {
  console.log("选中:", selection);
};

// ===== 初始化 =====
getPageData();
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>