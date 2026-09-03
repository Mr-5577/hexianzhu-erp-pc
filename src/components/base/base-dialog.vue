<!-- 增强版对话框 -->
<template>
  <ElDialog
    ref="dialogRef"
    v-model="dialogVisible"
    v-bind="dialogAttrs"
    :title="title"
    :width="width"
    :fullscreen="innerFullscreen"
    :top="top"
    :modal="modal"
    :modal-class="modalClass"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleBeforeClose"
    :destroy-on-close="destroyOnClose"
    :center="center"
    :align-center="alignCenter"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
  >
    <!-- 标题插槽（支持用户自定义，但内置全屏按钮功能） -->
    <template #title>
      <slot name="title">
        <!-- 默认标题：带全屏按钮 -->
        <div class="dialog-header">
          <span class="dialog-title-text">{{ title }}</span>
          <ElButton
            v-if="showFullscreenBtn"
            class="fullscreen-toggle-btn"
            :size="fullscreenBtnSize"
            :type="fullscreenBtnType"
            :icon="innerFullscreen ? 'FullScreen' : 'FullScreen'"
            @click.stop="toggleFullscreen"
          >
            {{ innerFullscreen ? '退出全屏' : '全屏' }}
          </ElButton>
        </div>
      </slot>
    </template>

    <!-- 内容 -->
    <div class="dialog-body" :style="bodyStyle">
      <slot />
    </div>

    <!-- 底部按钮 -->
    <template v-if="showFooter" #footer>
      <div class="dialog-footer">
        <slot name="footer">
          <ElButton
            v-if="showCancel"
            :loading="innerCancelLoading"
            :disabled="innerConfirmLoading"
            @click="handleCancel"
          >
            {{ cancelText }}
          </ElButton>
          <ElButton
            v-if="showConfirm"
            :type="confirmType"
            :loading="innerConfirmLoading"
            :disabled="innerCancelLoading"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </ElButton>
        </slot>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, useAttrs, onBeforeUnmount } from 'vue';
import { ElDialog, ElButton } from 'element-plus';

// ==================== Props ====================
const props = withDefaults(
  defineProps<{
    /** 控制对话框显示 */
    modelValue?: boolean;
    /** 标题 */
    title?: string;
    /** 宽度 */
    width?: string | number;
    /** 是否全屏（支持 v-model:fullscreen） */
    fullscreen?: boolean;
    /** 距离顶部距离 */
    top?: string;
    /** 是否显示遮罩 */
    modal?: boolean;
    /** 遮罩自定义类名 */
    modalClass?: string;
    /** 是否追加到 body */
    appendToBody?: boolean;
    /** 是否锁定滚动 */
    lockScroll?: boolean;
    /** 点击遮罩是否关闭 */
    closeOnClickModal?: boolean;
    /** 按 ESC 是否关闭 */
    closeOnPressEscape?: boolean;
    /** 是否显示关闭按钮 */
    showClose?: boolean;
    /** 自定义关闭前回调 */
    beforeClose?: (done: () => void) => void;
    /** 关闭后是否销毁内容 */
    destroyOnClose?: boolean;
    /** 标题是否居中 */
    center?: boolean;
    /** 对话框是否居中 */
    alignCenter?: boolean;
    /** 是否显示底部 */
    showFooter?: boolean;
    /** 是否显示取消按钮 */
    showCancel?: boolean;
    /** 是否显示确认按钮 */
    showConfirm?: boolean;
    /** 取消按钮文字 */
    cancelText?: string;
    /** 确认按钮文字 */
    confirmText?: string;
    /** 确认按钮类型 */
    confirmType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    /** 确认按钮加载状态 */
    confirmLoading?: boolean;
    /** 取消按钮加载状态 */
    cancelLoading?: boolean;
    /** 确认前校验 */
    beforeConfirm?: () => boolean | Promise<boolean>;
    /** 弹窗内容最大高度 */
    maxHeight?: string | number;
    /** 弹窗内容内边距 */
    bodyPadding?: string | number;
    /** 是否显示全屏切换按钮（默认 true） */
    showFullscreenBtn?: boolean;
    /** 全屏按钮尺寸 */
    fullscreenBtnSize?: 'default' | 'small' | 'large';
    /** 全屏按钮类型 */
    fullscreenBtnType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text';
  }>(),
  {
    modelValue: false,
    title: '提示',
    width: '50%',
    fullscreen: false,
    top: '12vh',
    modal: true,
    modalClass: '',
    appendToBody: true,
    lockScroll: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    beforeClose: undefined,
    destroyOnClose: false,
    center: false,
    alignCenter: false,
    showFooter: true,
    showCancel: true,
    showConfirm: true,
    cancelText: '取消',
    confirmText: '确定',
    confirmType: 'primary',
    confirmLoading: false,
    cancelLoading: false,
    beforeConfirm: undefined,
    maxHeight: undefined,
    bodyPadding: '20px',
    showFullscreenBtn: true,
    fullscreenBtnSize: 'small',
    fullscreenBtnType: 'text',
  }
);

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:fullscreen', value: boolean): void;
  (e: 'open'): void;
  (e: 'opened'): void;
  (e: 'close'): void;
  (e: 'closed'): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'before-confirm'): void;
}>();

// ==================== Refs ====================
const dialogRef = ref<InstanceType<typeof ElDialog>>();
const visible = ref(props.modelValue);

// 全屏状态（内部管理，支持外部 v-model:fullscreen）
const innerFullscreen = ref(props.fullscreen ?? false);

// 加载状态
const innerConfirmLoading = ref(props.confirmLoading);
const innerCancelLoading = ref(props.cancelLoading);

// ==================== Attrs ====================
const attrs = useAttrs();

// 过滤所有已声明的 props
const dialogAttrs = computed(() => {
  const {
    modelValue,
    title,
    width,
    fullscreen,
    top,
    modal,
    modalClass,
    appendToBody,
    lockScroll,
    closeOnClickModal,
    closeOnPressEscape,
    showClose,
    beforeClose,
    destroyOnClose,
    center,
    alignCenter,
    showFooter,
    showCancel,
    showConfirm,
    cancelText,
    confirmText,
    confirmType,
    confirmLoading,
    cancelLoading,
    beforeConfirm,
    maxHeight,
    bodyPadding,
    showFullscreenBtn,
    fullscreenBtnSize,
    fullscreenBtnType,
    ...rest
  } = attrs as Record<string, any>;
  return rest;
});

// ==================== Computed ====================
const dialogVisible = computed({
  get: () => visible.value,
  set: (val) => {
    visible.value = val;
    emit('update:modelValue', val);
  },
});

const bodyStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.maxHeight) {
    const maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
    style.maxHeight = maxHeight;
    style.overflow = 'auto';
  }
  if (props.bodyPadding) {
    const padding = typeof props.bodyPadding === 'number' ? `${props.bodyPadding}px` : props.bodyPadding;
    style.padding = padding;
  }
  return style;
});

// ==================== 方法 ====================
const open = () => {
  dialogVisible.value = true;
};

const close = () => {
  dialogVisible.value = false;
};

/** 切换全屏状态 */
const toggleFullscreen = () => {
  const newVal = !innerFullscreen.value;
  innerFullscreen.value = newVal;
  emit('update:fullscreen', newVal);
};

/** 设置全屏状态 */
const setFullscreen = (val: boolean) => {
  innerFullscreen.value = val;
  emit('update:fullscreen', val);
};

// 自定义关闭前处理
const handleBeforeClose = (done: () => void) => {
  // 关闭时重置加载状态
  innerConfirmLoading.value = false;
  innerCancelLoading.value = false;

  if (props.beforeClose) {
    props.beforeClose(done);
  } else {
    done();
  }
};

// 确认
const handleConfirm = async () => {
  try {
    // 执行前置校验
    if (props.beforeConfirm) {
      emit('before-confirm');
      const result = await props.beforeConfirm();
      if (result === false) {
        innerConfirmLoading.value = false;
        return;
      }
    }

    emit('confirm');
  } catch (error) {
    console.error('Confirm error:', error);
    innerConfirmLoading.value = false;
  }
};

// 取消
const handleCancel = () => {
  emit('cancel');
  close();
};

// 事件处理
const handleOpen = () => {
  emit('open');
};

const handleOpened = () => {
  emit('opened');
};

const handleClose = () => {
  emit('close');
  // 关闭时重置加载状态（双重保险）
  innerConfirmLoading.value = false;
  innerCancelLoading.value = false;
};

const handleClosed = () => {
  emit('closed');
};

// ==================== 监听 ====================
// 监听外部 modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== visible.value) {
      visible.value = newVal;
    }
  }
);

// 监听外部 fullscreen
watch(
  () => props.fullscreen,
  (newVal) => {
    if (newVal !== undefined && newVal !== innerFullscreen.value) {
      innerFullscreen.value = newVal;
    }
  }
);

// 监听确认加载状态
watch(
  () => props.confirmLoading,
  (newVal) => {
    innerConfirmLoading.value = newVal;
  }
);

// 监听取消加载状态
watch(
  () => props.cancelLoading,
  (newVal) => {
    innerCancelLoading.value = newVal;
  }
);

// ==================== 暴露方法 ====================
defineExpose({
  /** 打开弹窗 */
  open,
  /** 关闭弹窗 */
  close,
  /** 获取弹窗实例 */
  getDialog: () => dialogRef.value,
  /** 设置确认加载状态 */
  setConfirmLoading: (loading: boolean) => {
    innerConfirmLoading.value = loading;
  },
  /** 设置取消加载状态 */
  setCancelLoading: (loading: boolean) => {
    innerCancelLoading.value = loading;
  },
  /** 是否可见 */
  isVisible: () => visible.value,
  /** 切换全屏 */
  toggleFullscreen,
  /** 设置全屏状态 */
  setFullscreen,
  /** 获取全屏状态 */
  isFullscreen: () => innerFullscreen.value,
});
</script>

<style scoped lang="scss">
// ==================== 标题栏 ====================
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;

  .dialog-title-text {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fullscreen-toggle-btn {
    flex-shrink: 0;
    font-size: 13px;
    
    // 文字按钮默认样式
    &.el-button--text {
      color: #909399;
      
      &:hover {
        color: #409EFF;
      }
    }
  }
}

// ==================== 内容区 ====================
.dialog-body {
  max-height: 60vh;
  overflow: auto;
  padding: 20px;

  // 滚动条美化
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c7cd;
    border-radius: 3px;

    &:hover {
      background: #a0a6ab;
    }
  }

  &::-webkit-scrollbar-track {
    background: #f0f2f5;
    border-radius: 3px;
  }
}

// ==================== 底部 ====================
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px 0 0;
}

// ==================== 全屏适配 ====================
:deep(.el-dialog) {
  &.is-fullscreen {
    .el-dialog__body {
      max-height: calc(100vh - 120px);
      overflow: auto;
    }
  }
}
</style>
