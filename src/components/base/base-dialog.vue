<!--
  基于 Element Plus ElDialog 的封装，提供：
    1. 受控 / 非受控 两种 loading 模式（外部接管或内部自管理）
    2. beforeConfirm / beforeCancel 异步前置校验钩子
    3. 全屏切换（支持 v-model:fullscreen）
    4. 内容区高度 / 内边距 / 标题 / 底部按钮定制
    5. 保留 ElDialog 所有原生 attr / 事件透传

  【重要约定】
  · modelValue：标准 v-model，单一状态源（组件内部不维护 visible 副本）
  · fullscreen：`初值 + 内部管理` 模式。内部点击会 emit('update:fullscreen')，
    外部若不绑 v-model:fullscreen，状态只在组件内部生效。推荐始终用 v-model:fullscreen。
  · confirmLoading / cancelLoading：
      - 不传（undefined）→ 组件内部管理（beforeConfirm/beforeCancel 执行期间自动 loading）
      - 传值（true/false）→ 外部受控，组件内部不再改动该状态
    ⚠️ 千万不要给这两个 prop 设置非 undefined 的默认值，否则"未受控"语义失效。
  · beforeConfirm：仅覆盖"校验阶段"。若要异步提交期间按钮保持 loading，
    必须由父组件用 :confirm-loading="loading" 受控。
  · 样式约定：ElDialog 内部是 Teleport → ElOverlay → .el-dialog，
    父组件 scopeId 不会继承到 .el-dialog 上，所以命中 .el-dialog / .el-dialog__* 的规则
    一律写在文件末尾的「非 scoped 块」，不要写在 scoped 里用 :deep()（那样不会生效）。
-->
<template>
  <ElDialog
    ref="baseDialogRef"
    class="base-dialog"
    v-model="dialogVisible"
    v-bind="$attrs"
    :title="title"
    :width="normalizedWidth"
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
    <!-- ==================== 标题栏 ==================== -->
    <!-- el-dialog 3.0 起 title 插槽废弃，统一使用 header 插槽 -->
    <template #header>
      <div class="dialog-header">
        <!--
          注意：#title 插槽只替换"标题文字"，
          全屏按钮放在插槽外，避免用户自定义标题时把全屏按钮吞掉。
        -->
        <slot name="title">
          <span class="dialog-title-text">{{ title }}</span>
        </slot>
        <ElButton
          v-if="showFullscreenBtn"
          class="fullscreen-toggle-btn"
          :size="fullscreenBtnSize"
          :type="fullscreenBtnType"
          :link="fullscreenBtnLink"
          :icon="innerFullscreen ? Aim : FullScreen"
          @click.stop="toggleFullscreen"
        >
          {{ innerFullscreen ? "退出全屏" : "全屏" }}
        </ElButton>
      </div>
    </template>

    <!-- ==================== 内容区 ==================== -->
    <div class="dialog-body" :style="bodyStyle">
      <slot />
    </div>

    <!-- ==================== 底部 ==================== -->
    <!--
      footer 可见性判断放在模板里用 $slots.footer，
      而不是用 useSlots() 存变量：$slots 在 render 期每次取最新，
      父组件用 v-if 动态挂载 #footer 时也能正确响应。
      另外：showCancel / showConfirm 都为 false 且无 #footer 插槽时不渲染空 footer。
    -->
    <template
      v-if="$slots.footer || (showFooter && (showCancel || showConfirm))"
      #footer
    >
      <div class="dialog-footer">
        <slot name="footer">
          <!-- 取消按钮：v-bind 在前，内部属性在后，内部属性优先级更高 -->
          <ElButton
            v-if="showCancel"
            v-bind="cancelAttrs"
            :loading="displayCancelLoading"
            :disabled="displayConfirmLoading"
            @click="handleCancel"
          >
            {{ cancelText }}
          </ElButton>
          <!--
            确认按钮：v-bind 必须放在内部属性之前！
            否则用户传入的 confirmAttrs.loading/disabled/type 会覆盖内部防重复提交逻辑。
          -->
          <ElButton
            v-if="showConfirm"
            v-bind="confirmAttrs"
            :type="confirmType"
            :loading="displayConfirmLoading"
            :disabled="displayCancelLoading"
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
import { computed, ref, watch } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { Aim, FullScreen } from "@element-plus/icons-vue";

// 关闭默认 attrs 透传，模板里手动 v-bind="$attrs" 到 ElDialog，
// 避免同一份 attrs 被绑定两次（事件重复触发的隐患）
defineOptions({ inheritAttrs: false });

// ==================== Props ====================
const props = withDefaults(
  defineProps<{
    /* ---- v-model ---- */
    /** 控制对话框显示（标准 v-model） */
    modelValue?: boolean;

    /* ---- 基础 ---- */
    /** 标题（未提供 #title 插槽时使用） */
    title?: string;
    /** 宽度，number 自动转 px */
    width?: string | number;

    /* ---- 全屏（支持 v-model:fullscreen） ---- */
    /** 全屏初始状态 / 受控状态（建议配合 v-model:fullscreen 使用） */
    fullscreen?: boolean;

    /* ---- ElDialog 透传（有默认值/有差异的在此显式声明） ---- */
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
    /** 按 ESC 是否关闭（全屏态下组件会拦截，优先退出全屏） */
    closeOnPressEscape?: boolean;
    /** 是否显示右上角关闭按钮 */
    showClose?: boolean;
    /** 原生关闭前回调（全屏态下优先退出全屏，不调用此回调） */
    beforeClose?: (done: () => void) => void;
    /** 关闭后是否销毁内容 */
    destroyOnClose?: boolean;
    /** 标题是否居中 */
    center?: boolean;
    /** 对话框是否垂直居中（注意 top 将失效） */
    alignCenter?: boolean;

    /* ---- Footer ---- */
    /** 是否显示底部（若提供 #footer 插槽则忽略此值） */
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
    confirmType?:
      | "default"
      | "primary"
      | "success"
      | "warning"
      | "danger"
      | "info";
    /** 取消按钮额外属性（透传给 ElButton，如 size / plain / icon） */
    cancelAttrs?: Record<string, any>;
    /** 确认按钮额外属性（透传给 ElButton） */
    confirmAttrs?: Record<string, any>;

    /* ---- Loading ----
       语义：undefined = 未受控（内部管理）；boolean = 外部受控
    */
    /** 确认按钮 loading */
    confirmLoading?: boolean;
    /** 取消按钮 loading */
    cancelLoading?: boolean;

    /* ---- 交互流程 ---- */
    /** 点击确认前校验，返回 false（或抛异常）阻止提交 */
    beforeConfirm?: () => boolean | void | Promise<boolean | void>;
    /** 点击取消前校验，返回 false（或抛异常）阻止关闭 */
    beforeCancel?: () => boolean | void | Promise<boolean | void>;
    /** emit('confirm') 后是否自动关闭（默认 false，异步提交由外部控制） */
    closeOnConfirm?: boolean;
    /** emit('cancel') 后是否自动关闭（默认 true） */
    closeOnCancel?: boolean;

    /* ---- 内容区样式 ---- */
    /** 内容区最大高度（全屏态下忽略此值） */
    maxHeight?: string | number;
    /**
     * 内容区内边距
     * @default '0px'
     * Element Plus 2.11+ 已把 padding 放在 .el-dialog 上（16px），
     * .el-dialog__body 自身没有 padding。这里默认 0，让 body 与标题左右对齐；
     * 若再叠加 20px，内容会比标题多缩进一层，视觉上是错位的。
     */
    bodyPadding?: string | number;

    /* ---- 全屏按钮 ---- */
    /** 是否显示全屏按钮 */
    showFullscreenBtn?: boolean;
    /** 全屏按钮尺寸 */
    fullscreenBtnSize?: "default" | "small" | "large";
    /** 全屏按钮类型 */
    fullscreenBtnType?:
      | "primary"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "default";
    /** 全屏按钮是否为 link 样式 */
    fullscreenBtnLink?: boolean;
  }>(),
  {
    modelValue: false,
    title: "提示",
    width: "50%",
    fullscreen: false,

    top: "12vh",
    modal: true,
    modalClass: "",
    appendToBody: true,
    lockScroll: true,
    closeOnClickModal: false,
    closeOnPressEscape: true,
    showClose: true,
    beforeClose: undefined,
    destroyOnClose: false,
    center: false,
    alignCenter: false,

    showFooter: true,
    showCancel: true,
    showConfirm: true,
    cancelText: "取消",
    confirmText: "确定",
    confirmType: "primary",
    cancelAttrs: () => ({}),
    confirmAttrs: () => ({}),

    // ⚠️ 关键：必须是 undefined！
    // 只有 undefined 才能表达"未受控"，让组件内部管理 loading。
    // 若改成 false，外部永远"受控"，内部 beforeConfirm 期间的 loading 会被立即冲掉。
    confirmLoading: undefined,
    cancelLoading: undefined,

    beforeConfirm: undefined,
    beforeCancel: undefined,
    closeOnConfirm: false,
    closeOnCancel: true,

    maxHeight: undefined,
    // 默认 0：EP 2.11+ 的 .el-dialog 自带 16px padding，body 再叠加会与标题左右错位。
    // 需要更宽松的留白时显式传 body-padding（如 :body-padding="16"）。
    bodyPadding: "0px",

    showFullscreenBtn: true,
    fullscreenBtnSize: "small",
    fullscreenBtnType: "primary",
    fullscreenBtnLink: true,
  },
);

// ==================== Emits ====================
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:fullscreen", value: boolean): void;
  (e: "open"): void;
  (e: "opened"): void;
  (e: "close"): void;
  (e: "closed"): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "before-confirm"): void;
  (e: "before-cancel"): void;
}>();

// ==================== Refs ====================
const baseDialogRef = ref<InstanceType<typeof ElDialog>>();
const innerFullscreen = ref(props.fullscreen);
const innerConfirmLoading = ref(false);
const innerCancelLoading = ref(false);

// ==================== Computed ====================
/**
 * 单一状态源：直接用 props.modelValue 作为读写源，
 * 不额外维护 visible ref，避免"内部 visible 与外部 modelValue 双源不同步"。
 * 内部 close()/open() 通过 setter → emit('update:modelValue') 驱动父组件更新。
 */
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

/** width 支持 number（自动 px），string 原样传入 */
const normalizedWidth = computed(() =>
  typeof props.width === "number" ? `${props.width}px` : props.width,
);

/**
 * loading 的最终展示值：
 *   props.xxxLoading !== undefined → 外部受控
 *   props.xxxLoading === undefined → 走内部 loading
 */
const displayConfirmLoading = computed(() =>
  props.confirmLoading !== undefined
    ? props.confirmLoading
    : innerConfirmLoading.value,
);
const displayCancelLoading = computed(() =>
  props.cancelLoading !== undefined
    ? props.cancelLoading
    : innerCancelLoading.value,
);

/** 内容区 inline 样式：全屏态下忽略 maxHeight，避免破坏全屏体验 */
const bodyStyle = computed(() => {
  const style: Record<string, string> = {};
  if (!innerFullscreen.value && props.maxHeight != null) {
    style.maxHeight = toUnit(props.maxHeight);
    style.overflow = "auto";
  }
  if (props.bodyPadding != null) {
    style.padding = toUnit(props.bodyPadding);
  }
  return style;
});

// ==================== Utils ====================
/** number 自动转 px */
function toUnit(val: string | number): string {
  return typeof val === "number" ? `${val}px` : val;
}

// ==================== Methods ====================
/** 打开弹窗（配合 ref 使用） */
const open = () => {
  dialogVisible.value = true;
};

/** 关闭弹窗（注意：此方法绕过 ElDialog 的 before-close） */
const close = () => {
  dialogVisible.value = false;
};

/** 切换全屏 */
const toggleFullscreen = () => {
  const newVal = !innerFullscreen.value;
  innerFullscreen.value = newVal;
  emit("update:fullscreen", newVal);
};

/** 设置全屏状态（相同值不重复 emit） */
const setFullscreen = (val: boolean) => {
  if (innerFullscreen.value === val) return;
  innerFullscreen.value = val;
  emit("update:fullscreen", val);
};

/**
 * 关闭前处理（拦截 ESC / 右上角关闭按钮 / 点击遮罩）：
 *   - 全屏态下：优先退出全屏，不关弹窗（符合用户直觉）
 *   - 非全屏态：透传给用户的 beforeClose
 * 注意：通过 ref.close() 关闭不会走这里，属设计选择。
 */
const handleBeforeClose = (done: () => void) => {
  if (innerFullscreen.value) {
    setFullscreen(false);
    return;
  }
  if (props.beforeClose) {
    props.beforeClose(done);
  } else {
    done();
  }
};

/**
 * 确认流程：
 *   1. 未提供 beforeConfirm → 直接 emit('confirm')，loading 由外部控制
 *   2. 提供 beforeConfirm → 内部 loading 仅覆盖校验阶段
 *      校验通过后 emit('confirm')；
 *      异步提交的 loading 由父组件 :confirm-loading 接管
 */
const handleConfirm = async () => {
  if (!props.beforeConfirm) {
    emit("confirm");
    if (props.closeOnConfirm) close();
    return;
  }

  emit("before-confirm");
  innerConfirmLoading.value = true;
  try {
    const result = await props.beforeConfirm();
    if (result === false) return; // 校验不通过，中断
  } catch (err) {
    console.error("[EnhancedDialog] beforeConfirm error:", err);
    return;
  } finally {
    // 只在外部未受控时才回收内部 loading
    if (props.confirmLoading === undefined) {
      innerConfirmLoading.value = false;
    }
  }

  emit("confirm");
  if (props.closeOnConfirm) close();
};

/**
 * 取消流程：
 *   1. 未提供 beforeCancel → emit('cancel')，默认自动关闭
 *   2. 提供 beforeCancel → 校验通过才关闭
 */
const handleCancel = async () => {
  if (props.beforeCancel) {
    emit("before-cancel");
    innerCancelLoading.value = true;
    try {
      const result = await props.beforeCancel();
      if (result === false) return;
    } catch (err) {
      console.error("[EnhancedDialog] beforeCancel error:", err);
      return;
    } finally {
      if (props.cancelLoading === undefined) {
        innerCancelLoading.value = false;
      }
    }
  }

  emit("cancel");
  if (props.closeOnCancel) close();
};

const handleOpen = () => emit("open");
const handleOpened = () => emit("opened");
const handleClose = () => emit("close");

/**
 * 只有 closed 之后才重置内部 loading：
 * 关闭动画过程中不重置，避免按钮"闪一下可点"。
 */
const handleClosed = () => {
  innerConfirmLoading.value = false;
  innerCancelLoading.value = false;
  emit("closed");
};

// ==================== Watchers ====================
// 外部 v-model:fullscreen 变化时同步到内部
watch(
  () => props.fullscreen,
  (val) => {
    if (val !== innerFullscreen.value) innerFullscreen.value = val;
  },
);

// ==================== Expose ====================
defineExpose({
  /** 打开弹窗 */
  open,
  /** 关闭弹窗（绕过 before-close） */
  close,
  /** 获取底层 ElDialog 实例 */
  getDialog: () => baseDialogRef.value,
  /** 手动设置确认 loading（受控模式下无效） */
  setConfirmLoading: (v: boolean) => {
    innerConfirmLoading.value = v;
  },
  /** 手动设置取消 loading（受控模式下无效） */
  setCancelLoading: (v: boolean) => {
    innerCancelLoading.value = v;
  },
  /** 是否可见（非响应式快照） */
  isVisible: () => dialogVisible.value,
  /** 切换全屏 */
  toggleFullscreen,
  /** 设置全屏状态 */
  setFullscreen,
  /** 是否全屏（非响应式快照） */
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
  }
}

// ==================== 内容区 ====================
// 注意：ElDialog 2.11+ 的 padding 挂在 .el-dialog 上（--el-dialog-padding-primary: 16px），
// .el-dialog__body 本身没有 padding，所以这里无需再覆写 body 的 padding。
// （原实现写过 `:deep(.el-dialog__body){padding:0}`，但 ElDialog 内部是 Teleport 到 body，
//   父级 scopeId 不会落到 .el-dialog 的任何祖先上，该规则实际从未生效，属死代码，已删除。）
.dialog-body {
  max-height: 60vh; // 用户传了 maxHeight 会被 inline 覆盖
  overflow: auto;
  box-sizing: border-box;

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
}
</style>

<!--
  非 scoped 块：只放「必须穿透 Teleport 作用域」的规则。
  ElDialog 内部结构是 Teleport → ElOverlay → .el-dialog(.base-dialog)，
  根节点是 Teleport，父组件的 scopeId 不会继承到 .el-dialog 及其任何祖先上。
  所以 scoped 里写 `:deep(.el-dialog...)` 会被编译成 `[data-v-x] .el-dialog...`，
  永远找不到带 data-v-x 的祖先 —— 规则不生效。这类规则必须放这里。
-->
<style lang="scss">
.base-dialog {
  // EP 的 .el-dialog__footer 默认 padding-top: 16px，这里收到 10px
  // （选择器权重 0-2-0 高于 EP 的 0-1-0，无需 !important）
  .el-dialog__footer {
    padding-top: 10px;
  }

  // ==================== 全屏适配 ====================
  // 用 flex 布局撑满：header / footer 固定，滚动只发生在内层 .dialog-body。
  // 相比 calc(100vh - xxxpx) 的魔法数字方案，不怕 header / footer 高度变化。
  &.is-fullscreen {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    margin: 0;
    overflow: hidden;

    .el-dialog__header {
      flex-shrink: 0;
    }

    .el-dialog__body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .el-dialog__footer {
      flex-shrink: 0;
    }

    .dialog-body {
      flex: 1;
      min-height: 0;
      max-height: none;
      overflow: auto;
    }
  }
}
</style>
