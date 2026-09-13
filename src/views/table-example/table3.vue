<!-- 示例3：树形表格（修正版） -->
<template>
  <div class="demo-page">
    <h3>🌳 项目树形结构（无虚拟滚动）</h3>
    <div style="margin-top: 12px">
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
      :height="'500px'"
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
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

interface TreeNode {
  id: number;
  name: string;
  status: string;
  budget: number;
  manager: string;
  children?: TreeNode[];
}
/**
 * 生成树形结构数据
 * @param rootCount 根节点数量（建议 5~6）
 * @param maxDepth 最大深度（建议 6）
 * @param childCount 每层平均子节点数（可动态变化）
 * @param totalTarget 目标总节点数（约 600~700）
 * @returns 树形数组
 */
function generateTreeData(
  rootCount = 6,
  maxDepth = 6,
  childCount = 3,
  totalTarget = 650,
): TreeNode[] {
  let idCounter = 0;
  const result: TreeNode[] = [];

  // 随机状态
  const statuses = ["待启动", "进行中", "已完成"];
  const managers = [
    "张明",
    "李强",
    "王刚",
    "刘伟",
    "陈志",
    "赵岩",
    "孙阳",
    "周平",
    "吴华",
    "郑杰",
    "钱丽",
    "冯志",
    "杨璐",
    "高华",
    "黄海",
    "林峰",
    "何欣",
  ];
  const namePrefixes = [
    "项目",
    "工程",
    "标段",
    "区块",
    "阶段",
    "任务",
    "子项",
    "工作包",
    "节点",
    "单元",
  ];
  const nameSuffixes = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
  ];

  let currentTotal = 0;

  function randomItem<T>(arr: T[]): T {
    if (arr.length === 0) {
      throw new Error("randomItem: 数组不能为空");
    }
    return arr[Math.floor(Math.random() * arr.length)]!;
  }

  function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateNode(depth: number): TreeNode {
    const node: TreeNode = {
      id: ++idCounter,
      name: `${randomItem(namePrefixes)}${randomItem(nameSuffixes)}-${idCounter}`,
      status: randomItem(statuses),
      budget: randomInt(500000, 5000000),
      manager: randomItem(managers),
    };

    // 如果未达到最大深度且当前总节点数未达到目标，且有概率生成子节点
    if (depth < maxDepth && currentTotal < totalTarget) {
      // 动态计算子节点数量：越深子节点越少，但保持总数
      let childrenCount = 0;
      if (depth < 2) {
        childrenCount = randomInt(2, 4);
      } else if (depth < 4) {
        childrenCount = randomInt(1, 3);
      } else {
        childrenCount = randomInt(0, 2);
      }
      // 若当前节点是叶子，则不再继续
      if (childrenCount > 0) {
        const children: TreeNode[] = [];
        for (let i = 0; i < childrenCount; i++) {
          if (currentTotal >= totalTarget) break;
          const child = generateNode(depth + 1);
          children.push(child);
          currentTotal++;
        }
        if (children.length > 0) {
          node.children = children;
        }
      }
    }
    return node;
  }

  // 生成根节点
  for (let i = 0; i < rootCount; i++) {
    if (currentTotal >= totalTarget) break;
    const root = generateNode(1);
    result.push(root);
    currentTotal++;
  }

  // 如果未达到目标数，补充一些根节点或子节点（简单再生成几个根节点）
  while (currentTotal < totalTarget) {
    // 随机挑一个已有节点追加子节点（简单策略）
    const allNodes: TreeNode[] = [];
    function collect(node: TreeNode) {
      allNodes.push(node);
      if (node.children) {
        node.children.forEach(collect);
      }
    }
    result.forEach(collect);
    const targetParent = allNodes[Math.floor(Math.random() * allNodes.length)];
    if (
      targetParent &&
      targetParent.children &&
      targetParent.children.length < 5
    ) {
      // 追加一个子节点
      const child = generateNode(getDepth(targetParent, 1) + 1);
      if (targetParent.children) {
        targetParent.children.push(child);
      } else {
        targetParent.children = [child];
      }
      currentTotal++;
    } else {
      // 如果没有可追加的，直接加一个根节点
      const newRoot = generateNode(1);
      result.push(newRoot);
      currentTotal++;
    }
  }

  function getDepth(node: TreeNode, currentDepth: number): number {
    if (!node.children || node.children.length === 0) return currentDepth;
    let maxDepth = currentDepth;
    node.children.forEach((child) => {
      const d = getDepth(child, currentDepth + 1);
      if (d > maxDepth) maxDepth = d;
    });
    return maxDepth;
  }

  return result;
}
// ===== 树形静态数据 =====
const treeData: any = ref([]);

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
onMounted(() => {
  // 生成约 650 条数据，6 个根节点，深度约 6 层
  const data = generateTreeData(6, 6, 3, 650);
  // 设置树形表格的数据
  treeData.value = data;
});
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>
