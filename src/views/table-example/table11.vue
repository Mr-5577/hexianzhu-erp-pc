<!-- 示例11：表格组件展开行示例 -->
<template>
  <div class="expand-table-demo">
    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :expand-config="expandConfig"
      :height="500"
      border
      stripe
      @selection-change="onSelectionChange"
    >
      <!-- ===== 展开行内容 ===== -->
      <template #expandContent="{ row }">
        <div class="expand-detail">
          <div class="expand-detail__title">订单详情：{{ row.orderNo }}</div>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="客户名称">
              {{ row.customer }}
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">
              {{ row.createTime }}
            </el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="statusTagType(row.status)">
                {{ statusText(row.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="商品数量">
              {{ row.quantity }}
            </el-descriptions-item>
            <el-descriptions-item label="单价">
              ￥{{ row.price.toFixed(2) }}
            </el-descriptions-item>
            <el-descriptions-item label="总金额">
              <span style="color: #f56c6c; font-weight: 600">
                ￥{{ (row.price * row.quantity).toFixed(2) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">
              {{ row.remark || "—" }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 再放个子表格，模拟更复杂的展开内容 -->
          <el-table
            :data="row.items"
            size="small"
            border
            style="margin-top: 12px"
          >
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="name" label="商品名称" />
            <el-table-column prop="spec" label="规格" />
            <el-table-column
              prop="count"
              label="数量"
              width="80"
              align="center"
            />
            <el-table-column
              prop="amount"
              label="金额"
              width="120"
              align="right"
            >
              <template #default="{ row: item }">
                ￥{{ item.amount.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ===== 展开行配置 =====
const expandConfig = {
  // 点击行是否展开/收起
  trigger: "default", // 'default' | 'row' | 'cell'
  // 是否允许展开
  // visibleMethod: ({ row }) => row.items && row.items.length > 0,
  // 是否同时只允许展开一行
  accordion: false,
  // 是否显示展开图标
  showIcon: true,
  // 图标展开方向
  iconOpen: "vxe-icon-square-minus",
  iconClose: "vxe-icon-square-plus",
};

// ===== 列配置 =====
const columns: VxeTableColumn[] = [
  {
    type: "expand",
    width: 34,
    align: "center",
    // 不写 slots 时，默认就是 { content: 'expandContent' }
    // slots: { content: 'expandContent' },
  },
  { type: "checkbox", width: 50 },
  { type: "seq", title: "序号", width: 60, align: "center" },
  { field: "orderNo", title: "订单编号", minWidth: 160 },
  { field: "customer", title: "客户名称", minWidth: 120 },
  { field: "quantity", title: "数量", width: 90, align: "center" },
  {
    field: "price",
    title: "单价",
    width: 120,
    align: "right",
    formatter: (val: number) => `￥${Number(val).toFixed(2)}`,
  },
  {
    field: "status",
    title: "状态",
    width: 100,
    align: "center",
    // 使用数据字典自动映射
    dict: "orderStatus",
  },
  {
    field: "createTime",
    title: "下单时间",
    editable: true,
    editType: "datetime",
    placeholder: "请选择时间",
    width: 170,
    align: "center",
  },
  {
    field: "yearVal",
    title: "年份",
    editable: true,
    editType: "year",
    placeholder: "请选择",
    width: 170,
  },
  { field: "remark", title: "备注", minWidth: 160, showOverflow: true },
];

// ===== 数据字典 =====
const dictData = {
  orderStatus: [
    { label: "待付款", value: "pending" },
    { label: "已付款", value: "paid" },
    { label: "已发货", value: "shipped" },
    { label: "已完成", value: "done" },
  ],
};

// ===== 表格数据 =====
const tableData = ref([
  {
    id: 1,
    orderNo: "ORD-20240101-001",
    customer: "张三",
    quantity: 3,
    price: 199.5,
    status: "paid",
    createTime: "2026-10-01 10:23:11",
    yearVal: "2026",
    remark: "顺丰到付，尽快发货",
    items: [
      { name: "iPhone 手机壳", spec: "透明 / 6.1寸", count: 2, amount: 99 },
      { name: "Type-C 数据线", spec: "1.5m / 快充", count: 1, amount: 49.5 },
    ],
  },
  {
    id: 2,
    orderNo: "ORD-20240102-002",
    customer: "李四",
    quantity: 1,
    price: 1299,
    status: "shipped",
    createTime: "2026-10-02 14:05:33",
    yearVal: "2026",
    remark: "",
    items: [
      { name: "无线蓝牙耳机", spec: "白色 / 降噪", count: 1, amount: 1299 },
    ],
  },
  {
    id: 3,
    orderNo: "ORD-20240103-003",
    customer: "王五",
    quantity: 5,
    price: 39.9,
    status: "pending",
    createTime: "2026-10-03 09:11:02",
    yearVal: "2026",
    remark: "需要开票",
    items: [
      { name: "手机贴膜", spec: "钢化膜", count: 3, amount: 89.7 },
      { name: "清洁布", spec: "纤维布", count: 2, amount: 39.9 },
    ],
  },
  {
    id: 4,
    orderNo: "ORD-20240104-004",
    customer: "赵六",
    quantity: 2,
    price: 588,
    status: "done",
    createTime: "2026-10-04 16:44:18",
    yearVal: "2026",
    remark: "已签收",
    items: [
      { name: "机械键盘", spec: "青轴 / 87键", count: 1, amount: 488 },
      { name: "掌托", spec: "木质", count: 1, amount: 100 },
    ],
  },
]);

// ===== 事件 =====
const onSelectionChange = (rows: any[]) => {
  console.log("选中行：", rows);
};

// 状态标签类型
const statusTagType = (status: string) => {
  const map: Record<string, any> = {
    pending: "warning",
    paid: "primary",
    shipped: "info",
    done: "success",
  };
  return map[status] || "default";
};

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending: "待付款",
    paid: "已付款",
    shipped: "已发货",
    done: "已完成",
  };
  return map[status] || status;
};
</script>

<style scoped>
.expand-table-demo {
  width: 100%;
  height: calc(100vh - 100px);
  padding: 12px;
  box-sizing: border-box;
  background: #f5f7fa;
}

.expand-detail {
  padding: 12px 20px;
  background: #fafbfc;
  border-left: 3px solid #409eff;
}

.expand-detail__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
</style>
