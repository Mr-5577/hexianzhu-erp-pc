<!-- 示例3：树形表格（修正版） -->
<template>
  <div class="demo-page">
    <h3>🌳 项目树形结构</h3>
    <div style="margin-bottom: 12px">
      <el-button size="small" @click="expandAll">展开全部</el-button>
      <el-button size="small" @click="collapseAll">收起全部</el-button>
      <el-button size="small" @click="expandToLevel(1)">展开到第1层</el-button>
      <el-button size="small" @click="expandToLevel(2)">展开到第2层</el-button>
    </div>

    <base-vxe-table
      ref="tableRef"
      v-model="treeData"
      :columns="columns"
      row-key="id"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="false"
      :tree-config="{
        childrenField: 'children', // ✅ 使用 childrenField（v4 语法）
        expandAll: false,
      }"
      @data-change="handleDataChange"
    >
      <!-- 状态插槽 -->
      <template #status="{ row }">
        <el-tag
          :type="
            row.status === '进行中'
              ? 'warning'
              : row.status === '已完成'
                ? 'success'
                : 'info'
          "
          size="small"
        >
          {{ row.status }}
        </el-tag>
      </template>

      <!-- 金额格式化 -->
      <template #budget="{ row }">
        <span v-if="row.budget"
          >¥ {{ row.budget.toLocaleString("zh-CN") }}</span
        >
        <span v-else style="color: #ccc">-</span>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ===== 树形静态数据 =====
const treeData = ref([
  {
    id: 1,
    name: "成都金融城项目",
    status: "进行中",
    budget: 150000000,
    manager: "张明",
    children: [
      {
        id: 11,
        name: "土建工程",
        status: "已完成",
        budget: 45000000,
        manager: "李强",
        children: [
          {
            id: 111,
            name: "地基施工",
            status: "已完成",
            budget: 12000000,
            manager: "王刚",
          },
          {
            id: 112,
            name: "主体结构",
            status: "已完成",
            budget: 23000000,
            manager: "刘伟",
          },
          {
            id: 113,
            name: "砌体工程",
            status: "进行中",
            budget: 10000000,
            manager: "陈志",
          },
        ],
      },
      {
        id: 12,
        name: "安装工程",
        status: "进行中",
        budget: 35000000,
        manager: "赵岩",
        children: [
          {
            id: 121,
            name: "机电安装",
            status: "进行中",
            budget: 15000000,
            manager: "孙阳",
          },
          {
            id: 122,
            name: "电梯安装",
            status: "待启动",
            budget: 8000000,
            manager: "周平",
          },
          {
            id: 123,
            name: "消防工程",
            status: "进行中",
            budget: 12000000,
            manager: "吴华",
          },
        ],
      },
      {
        id: 13,
        name: "装饰装修",
        status: "待启动",
        budget: 28000000,
        manager: "郑杰",
        children: [
          {
            id: 131,
            name: "外墙装饰",
            status: "待启动",
            budget: 12000000,
            manager: "钱丽",
          },
          {
            id: 132,
            name: "室内精装",
            status: "待启动",
            budget: 16000000,
            manager: "冯志",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "天府新区孵化园",
    status: "已完成",
    budget: 80000000,
    manager: "杨璐",
    children: [
      {
        id: 21,
        name: "A栋办公楼",
        status: "已完成",
        budget: 35000000,
        manager: "高华",
        children: [
          {
            id: 211,
            name: "标准层装修",
            status: "已完成",
            budget: 15000000,
            manager: "黄海",
          },
          {
            id: 212,
            name: "大堂及公区",
            status: "已完成",
            budget: 8000000,
            manager: "林峰",
          },
        ],
      },
      {
        id: 22,
        name: "B栋研发中心",
        status: "已完成",
        budget: 28000000,
        manager: "何欣",
      },
    ],
  },
]);

// ===== 列配置 =====
const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  {
    field: "name",
    title: "项目/标段名称",
    width: 250,
    align: "left",
    treeNode: true, // 指定这一列作为树形节点，展开箭头会显示在这里
    editable: true,
    editType: "input",
    placeholder: "请输入名称",
  },
  {
    field: "status",
    title: "状态",
    width: 120,
    slots: { default: "status" },
    editable: true,
    editType: "select",
    options: [
      { label: "待启动", value: "待启动" },
      { label: "进行中", value: "进行中" },
      { label: "已完成", value: "已完成" },
    ],
  },
  {
    field: "budget",
    title: "预算金额",
    width: 160,
    slots: { default: "budget" },
    editable: true,
    editType: "number",
    precision: 2,
    placeholder: "请输入预算",
  },
  {
    field: "manager",
    title: "负责人",
    width: 120,
    editable: true,
    editType: "input",
    placeholder: "请输入负责人",
  },
];

const tableRef = ref();

const expandAll = () => {
  tableRef.value?.expandAll();
};

const collapseAll = () => {
  tableRef.value?.collapseAll();
};

const expandToLevel = (level: number) => {
  tableRef.value?.expandToLevel(level);
};

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