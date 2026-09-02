<!-- 示例4：字典映射 -->
<template>
  <div class="demo-page">
    <h3>📋 合同台账（字典映射）</h3>
    <p style="color: #909399; font-size: 13px">
      合同类型、合同分类、付款方式等通过字典自动映射为显示文本
    </p>

    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      :dict-data="dictData"
      row-key="id"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="false"
      @data-change="handleDataChange"
    >
      <!-- 金额格式化 -->
      <template #amount="{ row }">
        <span style="color: #409eff">
          ¥ {{ row.amount?.toLocaleString("zh-CN") }}
        </span>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ===== 静态数据字典 =====
const dictData = {
  contractType: [
    { label: "总价合同", value: "total_price" },
    { label: "单价合同", value: "unit_price" },
    { label: "成本加酬金合同", value: "cost_plus" },
    { label: "框架协议", value: "framework" },
  ],
  contractCategory: [
    { label: "施工总承包", value: "construction" },
    { label: "专业分包", value: "subcontract" },
    { label: "材料采购", value: "material" },
    { label: "服务采购", value: "service" },
    { label: "设计咨询", value: "design" },
  ],
  paymentMethod: [
    { label: "按节点支付", value: "node" },
    { label: "按月支付", value: "monthly" },
    { label: "按进度支付", value: "progress" },
    { label: "一次性支付", value: "one_time" },
  ],
  payStatus: [
    { label: "未支付", value: "unpaid" },
    { label: "部分支付", value: "partial" },
    { label: "全部支付", value: "paid" },
  ],
};

// ===== 静态数据 =====
const tableData = ref([
  {
    id: 1,
    contractNo: "HT-2024-001",
    contractName: "幕墙工程施工合同",
    supplier: "中建幕墙有限公司",
    contractType: "total_price",
    category: "subcontract",
    amount: 12500000,
    paymentMethod: "node",
    payStatus: "partial",
    signDate: "2024-01-15",
  },
  {
    id: 2,
    contractNo: "HT-2024-002",
    contractName: "电梯采购安装合同",
    supplier: "三菱电梯有限公司",
    contractType: "unit_price",
    category: "material",
    amount: 3800000,
    paymentMethod: "progress",
    payStatus: "unpaid",
    signDate: "2024-03-20",
  },
  {
    id: 3,
    contractNo: "HT-2024-003",
    contractName: "消防系统改造合同",
    supplier: "华安消防工程公司",
    contractType: "total_price",
    category: "subcontract",
    amount: 980000,
    paymentMethod: "one_time",
    payStatus: "paid",
    signDate: "2024-05-10",
  },
  {
    id: 4,
    contractNo: "HT-2024-004",
    contractName: "智能化系统集成合同",
    supplier: "海康威视科技",
    contractType: "cost_plus",
    category: "service",
    amount: 5600000,
    paymentMethod: "monthly",
    payStatus: "partial",
    signDate: "2024-06-01",
  },
  {
    id: 5,
    contractNo: "HT-2024-005",
    contractName: "园林景观设计合同",
    supplier: "泛亚景观设计",
    contractType: "framework",
    category: "design",
    amount: 280000,
    paymentMethod: "one_time",
    payStatus: "paid",
    signDate: "2024-07-12",
  },
]);

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
    width: 200,
    editable: true,
    editType: "input",
    placeholder: "请输入合同名称",
  },
  {
    field: "supplier",
    title: "供应商",
    width: 160,
    editable: true,
    editType: "input",
    placeholder: "请输入供应商",
  },
  {
    field: "contractType",
    title: "合同类型",
    width: 140,
    dict: "contractType", // 使用字典映射
    editable: true,
    editType: "select",
    placeholder: "请选择合同类型",
  },
  {
    field: "category",
    title: "合同分类",
    width: 120,
    dict: "contractCategory",
    editable: true,
    editType: "select",
    placeholder: "请选择分类",
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
    field: "paymentMethod",
    title: "付款方式",
    width: 130,
    dict: "paymentMethod",
    editable: true,
    editType: "select",
    placeholder: "请选择付款方式",
  },
  {
    field: "payStatus",
    title: "支付状态",
    width: 110,
    dict: "payStatus",
    editable: true,
    editType: "select",
    placeholder: "请选择支付状态",
  },
  {
    field: "signDate",
    title: "签订日期",
    width: 120,
    editable: true,
    editType: "date",
    placeholder: "请选择日期",
    formatter: (value: any) => {
      if (!value) return "-";
      // 使用 dayjs 统一格式化
      return dayjs(value).format("YYYY-MM-DD");
    },
  },
];

const handleDataChange = (params: any) => {
  console.log("数据变化:", params);
  ElMessage.success(`"${params.field}" 已更新为: ${params.newValue}`);
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>
