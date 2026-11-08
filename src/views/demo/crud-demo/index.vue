<!--
  CRUD 标准页样板
  =================
  新项目 90% 的列表页可以复制此文件，只需修改：
  1. src/api/crud-demo.ts 中的接口地址与字段类型
  2. 下方 searchItems / formItems / columns 三处配置
  其余逻辑（搜索、分页、弹窗、新增/编辑/删除闭环）开箱即用
-->
<template>
  <div class="crud-page">
    <el-alert type="info" :closable="false" class="page-tip">
      这是 CRUD 标准页样板：搜索区 + 分页表格 + 新增/编辑弹窗 + 删除确认，
      接口层为 mock 实现，复制本页修改「接口文件 + 三处配置」即可对接真实业务。
    </el-alert>

    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="true"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :min-height="200"
      :max-height="520"
      @page-change="handlePageChange"
    >
      <!-- ===== 操作栏：新增（演示按钮级权限） ===== -->
      <template #actionBar>
        <el-button
          v-permission="'demo:crud'"
          type="primary"
          @click="openDialog()"
        >
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
      </template>

      <!-- ===== 工具栏左侧：搜索区 ===== -->
      <template #toolbar-left>
        <!-- 宽度优先取 style：组件的 width prop 只是默认值（100%），style 里的 width 会覆盖它 -->
        <base-input
          v-model="queryParams.name"
          placeholder="名称搜索"
          :debounce="400"
          style="width: 180px"
          @search="handleQuery"
        />
        <base-select
          v-model="queryParams.status"
          :options="statusOptions"
          placeholder="状态"
          style="width: 130px"
          @change="handleQuery"
        />
        <el-button type="primary" plain @click="handleQuery">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetQuery">重置</el-button>
      </template>

      <!-- ===== 金额格式化 ===== -->
      <template #amount="{ row }">
        <span class="text-primary" style="font-weight: 500">
          ¥ {{ formatMoney(row.amount) }}
        </span>
      </template>

      <!-- ===== 状态 ===== -->
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
          {{ row.status === 1 ? "启用" : "停用" }}
        </el-tag>
      </template>

      <!-- ===== 操作列 ===== -->
      <template #action="{ row }">
        <table-actions
          :row="row"
          :actions="rowActions"
          @action="handleRowAction"
        />
      </template>
    </base-vxe-table>

    <!-- ===== 新增 / 编辑弹窗 ===== -->
    <base-dialog
      v-model="dialogVisible"
      :title="editingRow ? '编辑' : '新增'"
      width="560px"
      :confirm-loading="saving"
      :before-confirm="validateForm"
      destroy-on-close
      @confirm="handleSave"
    >
      <base-form
        ref="formRef"
        v-model="formData"
        :items="formItems"
        label-width="90px"
      />
    </base-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";
import type { TableActionItem } from "@/components/base/table-actions.vue";
import { useTable } from "@/hooks/useTable";
import { formatMoney } from "@/utils";
import {
  getDemoListApi,
  createDemoApi,
  updateDemoApi,
  deleteDemoApi,
  type DemoItem,
  type DemoSaveParams,
} from "@/api/crud-demo";

// ==================== 搜索 + 分页（useTable 封装样板代码） ====================
const {
  tableData,
  loading,
  total,
  currentPage,
  pageSize,
  pageSizes,
  queryParams,
  loadData,
  handleQuery,
  resetQuery,
  handlePageChange,
} = useTable<DemoItem>(getDemoListApi, {
  defaultParams: { name: "", status: "" },
});

// ==================== 列配置 ====================
const columns: VxeTableColumn[] = [
  { type: "seq", width: 60, title: "序号" },
  { field: "name", title: "项目名称", minWidth: 160, showOverflow: true },
  { field: "code", title: "编号", width: 140 },
  { field: "amount", title: "金额", width: 140, slots: { default: "amount" } },
  { field: "status", title: "状态", width: 90, slots: { default: "status" } },
  { field: "remark", title: "备注", minWidth: 140, showOverflow: true },
  { field: "createTime", title: "创建时间", width: 170 },
  {
    field: "action",
    title: "操作",
    width: 140,
    fixed: "right",
    slots: { default: "action" },
  },
];

// ==================== 搜索区选项 ====================
const statusOptions = [
  { label: "启用", value: 1 },
  { label: "停用", value: 0 },
];

// ==================== 操作列 ====================
const rowActions: TableActionItem[] = [
  { key: "edit", label: "编辑", type: "primary" },
  { key: "delete", label: "删除", type: "danger" },
];

// ==================== 新增 / 编辑弹窗 ====================
const dialogVisible = ref(false);
const saving = ref(false);
const editingRow = ref<DemoItem | null>(null);
const formRef = ref();
const formData = ref<Partial<DemoSaveParams>>({});

/** 弹窗表单配置（业务字段改这里） */
const formItems = [
  { prop: "name", label: "项目名称", type: "input", required: true },
  { prop: "code", label: "编号", type: "input", required: true },
  {
    prop: "status",
    label: "状态",
    type: "radio",
    defaultValue: 1,
    options: statusOptions,
  },
  { prop: "amount", label: "金额", type: "input-number", required: true },
  { prop: "remark", label: "备注", type: "textarea" },
] as any[];

const openDialog = (row?: DemoItem) => {
  editingRow.value = row ?? null;
  formData.value = row ? { ...row } : {};
  dialogVisible.value = true;
};

/** 确定前校验：表单不通过则阻止提交 */
const validateForm = async (): Promise<boolean> => {
  return (await formRef.value?.validate()) ?? false;
};

const handleSave = async () => {
  saving.value = true;
  try {
    if (editingRow.value) {
      await updateDemoApi(formData.value as DemoSaveParams);
      ElMessage.success("更新成功");
    } else {
      await createDemoApi(formData.value as DemoSaveParams);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    loadData();
  } finally {
    saving.value = false;
  }
};

// ==================== 行操作 ====================
const handleRowAction = async ({ key, row }: { key: string; row: DemoItem }) => {
  if (key === "edit") {
    openDialog(row);
    return;
  }
  if (key === "delete") {
    await ElMessageBox.confirm(
      `确定删除「${row.name}」吗？删除后不可恢复。`,
      "删除确认",
      { type: "warning" },
    );
    await deleteDemoApi(row.id);
    ElMessage.success("删除成功");
    // 删除的是当前页最后一条时自动回退一页
    if (tableData.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }
    loadData();
  }
};
</script>

<style scoped>
.crud-page {
  padding: 12px;
  background: #fff;
}

.page-tip {
  margin-bottom: 12px;
}
</style>
