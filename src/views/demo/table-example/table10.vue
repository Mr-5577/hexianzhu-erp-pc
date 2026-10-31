<!-- 示例10：树形数据 + 虚拟滚动（扁平结构 + transform） -->
<template>
  <div class="demo-page">
    <h3>📈 树形数据 + 虚拟滚动（扁平结构 + transform）</h3>

    <base-vxe-table
      ref="tableRef"
      v-model="allData"
      :columns="columns"
      row-key="id"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :virtual-scroll="true"
      :pagination="false"
      :tree-config="treeConfig"
      @selection-change="handleSelectionChange"
      @refresh="handleRefresh"
    >
      <!-- ===== 操作栏 ===== -->
      <template #actionBar>
        <el-button type="primary" @click="handleExpandLevel2">
          展开到二级
        </el-button>
        <el-button @click="handleExpandAll">展开全部</el-button>
        <el-button @click="handleCollapseAll">收起全部</el-button>
        <span style="margin-left: 12px; font-size: 13px; color: #909399">
          扁平数据共 {{ allData.length }} 行 · 已选 {{ selectedRows.length }} 项
        </span>
      </template>

      <!-- ===== 工具栏左侧插槽 ===== -->
      <template #toolbar-left>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索名称/合同编号"
          size="small"
          style="width: 220px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </template>

      <!-- ===== 名称插槽（带层级字体加粗） ===== -->
      <template #name="{ row }">
        <span :style="{ fontWeight: row.parentId === 0 ? 600 : 400 }">
          {{ row.name }}
        </span>
      </template>

      <!-- ===== 类型标签插槽 ===== -->
      <template #type="{ row }">
        <el-tag :type="typeTagMap[row.type]?.color" size="small" effect="plain">
          {{ typeTagMap[row.type]?.label || row.type }}
        </el-tag>
      </template>

      <!-- ===== 金额插槽 ===== -->
      <template #amount="{ row }">
        <span v-if="row.amount > 0" style="color: #409eff; font-weight: 600">
          ¥ {{ row.amount.toLocaleString("zh-CN") }}
        </span>
        <span v-else style="color: #c0c4cc">—</span>
      </template>

      <!-- ===== 状态插槽 ===== -->
      <template #status="{ row }">
        <el-tag
          v-if="row.type === 'contract'"
          :type="row.status === 1 ? 'success' : 'danger'"
          size="small"
        >
          {{ row.status === 1 ? "生效中" : "已终止" }}
        </el-tag>
        <span v-else style="color: #c0c4cc">—</span>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ============================================================================
// 1. 数据：扁平结构（带 parentId），不是嵌套 children
// ============================================================================
interface TreeRow {
  id: number;
  parentId: number; // 0 表示根节点
  name: string;
  type: "project" | "segment" | "contract";
  contractNo: string;
  supplier: string | undefined;
  amount: number;
  status: number;
}

const SUPPLIERS = [
  "中建幕墙有限公司",
  "三菱电梯有限公司",
  "华安消防工程公司",
  "海康威视科技",
  "泛亚景观设计",
  "格力电器",
  "华为技术",
  "金螳螂装饰",
];

/**
 * 生成扁平化的树形数据：
 *   300 个项目 × 每个 3 个标段 × 每个 5 个合同
 *   = 300 + 900 + 1500 = 2700 条
 *
 * 关键点：所有行都在同一个数组里，靠 parentId 关联
 */
const generateFlatTree = (): TreeRow[] => {
  const list: TreeRow[] = [];
  let id = 0;

  for (let p = 1; p <= 300; p++) {
    // ===== 项目（根节点，parentId = 0） =====
    const projId = ++id;
    list.push({
      id: projId,
      parentId: 0,
      name: `项目-${String(p).padStart(2, "0")}`,
      type: "project",
      contractNo: "",
      supplier: "",
      amount: 0,
      status: 1,
    });

    for (let s = 1; s <= 3; s++) {
      // ===== 标段（挂在项目下） =====
      const segId = ++id;
      list.push({
        id: segId,
        parentId: projId,
        name: `标段-${p}-${s}`,
        type: "segment",
        contractNo: "",
        supplier: "",
        amount: 0,
        status: 1,
      });

      for (let c = 1; c <= 5; c++) {
        // ===== 合同（挂在标段下） =====
        list.push({
          id: ++id,
          parentId: segId,
          name: `合同-${p}-${s}-${c}`,
          type: "contract",
          contractNo: `HT-2024-${String(id).padStart(4, "0")}`,
          supplier: SUPPLIERS[(p + s + c) % SUPPLIERS.length],
          amount: Math.floor(Math.random() * 10_000_000) + 500_000,
          status: Math.random() < 0.7 ? 1 : 0,
        });
      }
    }
  }

  return list;
};

const allData = ref<TreeRow[]>(generateFlatTree());
const selectedRows = ref<any[]>([]);
const searchKeyword = ref("");

// ============================================================================
// 2. treeConfig：核心，必须开启 transform
// ============================================================================
const treeConfig = {
  transform: true, // ⚠️ 关键：扁平 → 树，虚拟滚动必须为 true
  parentField: "parentId", // 父节点字段名
  rowField: "id", // 唯一标识字段名
  expandAll: false, // 初始不展开
  accordion: false, // 允许同时展开多个节点
};

// ============================================================================
// 3. 列配置：树节点列必须标记 treeNode: true
// ============================================================================
const columns: VxeTableColumn[] = [
  { type: "checkbox", width: 50 },
  { type: "seq", width: 60, title: "序号" },
  {
    field: "name",
    title: "名称",
    minWidth: 260,
    treeNode: true, // ⚠️ 关键：这一列负责渲染展开箭头
    align: "left",
    slots: { default: "name" },
    editable: true,
    editType: "input",
    placeholder: "请输入名称",
  },
  {
    field: "type",
    title: "类型",
    width: 100,
    slots: { default: "type" },
  },
  {
    field: "contractNo",
    title: "合同编号",
    width: 160,
    editable: true,
    editType: "input",
    placeholder: "请输入编号",
  },
  {
    field: "supplier",
    title: "供应商",
    width: 180,
    editable: true,
    editType: "input",
    placeholder: "请输入供应商",
  },
  {
    field: "amount",
    title: "合同金额",
    width: 160,
    align: "right",
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

const typeTagMap: Record<string, { label: string; color: any }> = {
  project: { label: "项目", color: "primary" },
  segment: { label: "标段", color: "warning" },
  contract: { label: "合同", color: "success" },
};

// ============================================================================
// 4. 展开 / 收起
// ============================================================================
const tableRef = ref<InstanceType<typeof BaseVxeTable>>();

const handleExpandAll = () => {
  tableRef.value?.expandAll();
};

const handleCollapseAll = () => {
  tableRef.value?.collapseAll();
};

/**
 * 展开到二级：
 *   只展开 parentId === 0 的根节点（项目），
 *   这样能看见项目 + 标段（两级），合同仍折叠
 */
const handleExpandLevel2 = async () => {
  const grid = tableRef.value?.getGridRef();
  if (!grid) return;

  // 先全部收起，避免之前状态干扰
  grid.setAllTreeExpand(false);

  // 遍历扁平数据，只展开根节点
  allData.value.forEach((row) => {
    if (row.parentId === 0) {
      grid.setTreeExpand(row, true);
    }
  });

  ElMessage.success("已展开到二级");
};

// ============================================================================
// 5. 其他事件
// ============================================================================
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
};

const handleRefresh = () => {
  ElMessage.success("刷新成功");
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>
