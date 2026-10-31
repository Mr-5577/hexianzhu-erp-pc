<!-- 示例12：高度自适应（minHeight + maxHeight） -->
<template>
  <div class="demo-page">
    <h3>📏 高度自适应列表示例</h3>

    <el-alert type="info" :closable="false" class="demo-tip">
      <p>
        不传 <code>height</code>，只传 <code>:min-height="150"</code> 和
        <code>:max-height="400"</code>：
      </p>
      <p>· 无数据 / 数据少 → 表格高度随内容伸缩，最小不低于 150px</p>
      <p>· 数据多 → 表格最高撑到 400px，超出部分出现内部滚动条</p>
      <p>点击下方按钮切换数据量，观察表格高度变化：</p>
    </el-alert>

    <div class="demo-actions">
      <el-button @click="setData(0)">无数据（0 条）</el-button>
      <el-button @click="setData(2)">少量数据（2 条）</el-button>
      <el-button type="primary" @click="setData(6)">
        中等数据（6 条）
      </el-button>
      <el-button type="success" @click="setData(30)">
        大量数据（30 条）
      </el-button>
    </div>

    <base-vxe-table
      v-model="tableData"
      :columns="columns"
      row-key="id"
      :readonly="true"
      :border="true"
      :stripe="true"
      :min-height="150"
      :max-height="400"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseVxeTable from "@/components/base/base-vxe-table.vue";
import type { VxeTableColumn } from "@/components/base/base-vxe-table.vue";

// ===== 列配置 =====
const columns: VxeTableColumn[] = [
  { type: "seq", width: 60, title: "序号" },
  { field: "contractNo", title: "合同编号", width: 150 },
  { field: "contractName", title: "合同名称", minWidth: 200 },
  { field: "supplier", title: "供应商", width: 150 },
  { field: "amount", title: "合同金额", width: 150 },
  { field: "signDate", title: "签订日期", width: 120 },
];

// ===== 生成模拟数据 =====
const generateRows = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    contractNo: `HT-2024-${String(i + 1).padStart(3, "0")}`,
    contractName: `${i + 1} 号工程施工合同`,
    supplier: ["中建集团", "三菱电梯", "华安消防", "海康威视"][i % 4],
    amount: `¥ ${((i + 1) * 125000).toLocaleString("zh-CN")}`,
    signDate: `2024-0${(i % 9) + 1}-15`,
  }));
};

const tableData = ref<any[]>(generateRows(2));

/** 切换数据量，演示高度自适应 */
const setData = (count: number) => {
  tableData.value = generateRows(count);
};
</script>

<style scoped>
.demo-page {
  padding: 20px;
  height: 100%;
}

.demo-tip {
  margin: 12px 0;
  line-height: 1.8;
}

.demo-tip code {
  padding: 2px 6px;
  background: #ecf5ff;
  border-radius: 4px;
  color: #409eff;
}

.demo-actions {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
