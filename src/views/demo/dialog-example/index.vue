<!-- 弹窗组件示例：BaseDialog -->
<template>
  <div class="dialog-demo">
    <el-card shadow="never">
      <h3>🪟 BaseDialog 弹窗示例</h3>
      <el-divider />

      <div class="demo-actions">
        <el-button type="primary" @click="basicVisible = true">
          基础弹窗
        </el-button>
        <el-button type="success" @click="openFormDialog">
          表单弹窗（异步校验 + Loading）
        </el-button>
        <el-button type="warning" @click="longVisible = true">
          长内容弹窗（限高滚动 + 全屏）
        </el-button>
        <el-button @click="customVisible = true">
          自定义底部 / 无底部
        </el-button>
      </div>
    </el-card>

    <!-- ==================== 1. 基础弹窗 ==================== -->
    <base-dialog
      v-model="basicVisible"
      title="基础弹窗"
      width="500px"
      @confirm="handleBasicConfirm"
      @cancel="handleBasicCancel"
    >
      <p>这是一个基础弹窗，点击「确定」触发 @confirm，点击「取消」触发 @cancel。</p>
      <p>默认行为：</p>
      <ul>
        <li>点击遮罩不关闭（close-on-click-modal = false）</li>
        <li>标题栏右侧可切换全屏</li>
        <li>ESC 可关闭</li>
      </ul>
    </base-dialog>

    <!-- ==================== 2. 表单弹窗（推荐业务用法） ==================== -->
    <base-dialog
      v-model="formVisible"
      title="新增供应商"
      width="600px"
      :confirm-loading="submitting"
      :before-confirm="validateForm"
      destroy-on-close
      @confirm="handleFormConfirm"
    >
      <base-form
        ref="supplierFormRef"
        v-model="supplierForm"
        :items="supplierFormItems"
        label-width="100px"
      />
    </base-dialog>

    <!-- ==================== 3. 长内容弹窗 ==================== -->
    <base-dialog
      v-model="longVisible"
      title="长内容弹窗"
      width="600px"
      :max-height="300"
      confirm-text="我已阅读"
      @confirm="longVisible = false"
    >
      <p v-for="i in 30" :key="i">
        第 {{ i }} 段内容：body 区域通过 max-height=300 限高，超出后内部滚动；点击标题栏「全屏」可放大查看。
      </p>
    </base-dialog>

    <!-- ==================== 4. 自定义底部 / 无底部 ==================== -->
    <base-dialog
      v-model="customVisible"
      title="自定义底部"
      width="500px"
      :show-footer="false"
    >
      <p>通过 :show-footer="false" 隐藏默认底部，完全自定义操作区：</p>
      <div class="custom-footer">
        <el-button type="danger" plain @click="customVisible = false">
          自定义关闭按钮
        </el-button>
      </div>
    </base-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";

// ==================== 1. 基础弹窗 ====================
const basicVisible = ref(false);

const handleBasicConfirm = () => {
  ElMessage.success("点击了确定");
  basicVisible.value = false;
};

const handleBasicCancel = () => {
  ElMessage.info("点击了取消");
};

// ==================== 2. 表单弹窗 ====================
const formVisible = ref(false);
const submitting = ref(false);
const supplierFormRef = ref();
const supplierForm = ref<Record<string, any>>({});

const supplierFormItems = [
  {
    prop: "name",
    label: "供应商名称",
    type: "input",
    required: true,
  },
  {
    prop: "contact",
    label: "联系人",
    type: "input",
    required: true,
  },
  {
    prop: "phone",
    label: "联系电话",
    type: "input",
    required: true,
  },
  {
    prop: "level",
    label: "合作等级",
    type: "select",
    defaultValue: "A",
    options: [
      { label: "A 级（战略）", value: "A" },
      { label: "B 级（优选）", value: "B" },
      { label: "C 级（普通）", value: "C" },
    ],
  },
] as any[];

const openFormDialog = () => {
  supplierForm.value = {};
  formVisible.value = true;
};

/**
 * 确定前的校验钩子：
 * 返回 false 阻止 confirm 事件；执行期间按钮自动 loading，防止重复点击
 */
const validateForm = async (): Promise<boolean> => {
  const valid = await supplierFormRef.value?.validate();
  if (!valid) {
    ElMessage.warning("请完善必填项");
  }
  return !!valid;
};

const handleFormConfirm = () => {
  // 模拟异步提交：confirm-loading 控制按钮加载态
  submitting.value = true;
  setTimeout(() => {
    submitting.value = false;
    formVisible.value = false;
    ElMessage.success("保存成功");
    console.log("供应商数据：", supplierForm.value);
  }, 1000);
};

// ==================== 3. 长内容弹窗 ====================
const longVisible = ref(false);

// ==================== 4. 自定义底部 ====================
const customVisible = ref(false);
</script>

<style scoped>
.dialog-demo {
  padding: 12px;
  background: #fff;
}

.demo-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.custom-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}
</style>
