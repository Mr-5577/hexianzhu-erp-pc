<!-- 示例8：部分列只读 -->
<template>
  <div class="demo-page">
    <h3>📋 合同台账（部分列可编辑）</h3>
    <p style="color: #909399; font-size: 13px;">
      合同编号、合同名称可编辑，供应商、金额、状态为只读
    </p>

    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :border="true"
      :stripe="true"
      :show-toolbar="true"
      :pagination="false"
      @data-change="handleDataChange"
    >
      <!-- 金额只读展示 -->
      <template #amount="{ row }">
        <span style="color: #409eff; font-weight: 500;">
          ¥ {{ row.amount?.toLocaleString('zh-CN') }}
        </span>
      </template>

      <!-- 状态标签只读展示 -->
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
          {{ row.status === 1 ? '生效中' : '已终止' }}
        </el-tag>
      </template>
    </base-vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import BaseVxeTable from '@/components/base/base-vxe-table.vue'
import type { VxeTableColumn } from '@/components/base/base-vxe-table.vue'

const tableData = ref([
  { id: 1, contractNo: 'HT-2024-001', contractName: '幕墙工程施工合同', supplier: '中建幕墙有限公司', amount: 12500000, status: 1 },
  { id: 2, contractNo: 'HT-2024-002', contractName: '电梯采购安装合同', supplier: '三菱电梯有限公司', amount: 3800000, status: 1 },
  { id: 3, contractNo: 'HT-2024-003', contractName: '消防系统改造合同', supplier: '华安消防工程公司', amount: 980000, status: 0 },
])

const columns: VxeTableColumn[] = [
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 60, title: '序号' },
  {
    field: 'contractNo',
    title: '合同编号',
    width: 150,
    editable: true, // ✅ 可编辑
    editType: 'input',
    placeholder: '请输入合同编号',
  },
  {
    field: 'contractName',
    title: '合同名称',
    width: 200,
    editable: true, // ✅ 可编辑
    editType: 'input',
    placeholder: '请输入合同名称',
  },
  {
    field: 'supplier',
    title: '供应商',
    width: 180,
    editable: false, // ❌ 只读
  },
  {
    field: 'amount',
    title: '合同金额',
    width: 150,
    slots: { default: 'amount' },
    editable: false, // ❌ 只读
  },
  {
    field: 'status',
    title: '状态',
    width: 100,
    slots: { default: 'status' },
    editable: false, // ❌ 只读
  },
]

const handleDataChange = (params: any) => {
  ElMessage.success(`"${params.field}" 已更新为: ${params.newValue}`)
}
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}
</style>