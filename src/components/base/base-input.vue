<!-- 基于 Element Plus ElInput 的封装 -->
<template>
  <ElInput
    ref="inputRef"
    v-bind="forwardedAttrs"
    :model-value="innerValue"
    :disabled="disabled"
    :readonly="readonly"
    :clearable="clearable"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    :type="type"
    :rows="rows"
    :autosize="autosize"
    :style="wrapperStyle"
    @update:model-value="handleUpdate"
    @focus="handleFocus"
    @blur="handleBlur"
    @keyup.enter="handleEnter"
    @clear="handleClear"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
  >
    <!-- 插槽透传 -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ElInput>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount, useAttrs } from "vue";
import { ElInput } from "element-plus";

// 关键：关闭自动 attrs 透传，避免 $attrs 被自动应用到根节点（ElInput）又被 v-bind 应用一次，
// 导致未声明的监听器（如 @keydown.enter）触发两次。
defineOptions({ inheritAttrs: false });

// ==================== Props ====================
const props = withDefaults(
  defineProps<{
    /** 当前值 */
    modelValue?: string;
    /** 是否自动去除首尾空格（输入过程中不生效，仅在失焦/回车/防抖结束时应用） */
    trim?: boolean;
    /** 防抖延迟（毫秒），0 表示不启用 */
    debounce?: number;
    /** 是否大写（实时生效） */
    uppercase?: boolean;
    /** 是否小写（实时生效，uppercase 优先） */
    lowercase?: boolean;
    /** 最大长度 */
    maxlength?: number;
    /** 是否显示字数统计 */
    showWordLimit?: boolean;
    /** 输入框类型 */
    type?: "text" | "textarea" | "password";
    /** 文本域行数 */
    rows?: number;
    /** 自适应高度 */
    autosize?: boolean | { minRows?: number; maxRows?: number };
    /** 是否可清空 */
    clearable?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否只读 */
    readonly?: boolean;
    /** 是否自动获取焦点 */
    autofocus?: boolean;
    /** 输入框宽度 */
    width?: string | number;
    /** 是否在回车时触发搜索事件（默认 true，textarea 下自动忽略） */
    searchOnEnter?: boolean;
    /** 是否在清空时触发搜索事件（默认 true） */
    searchOnClear?: boolean;
  }>(),
  {
    modelValue: "",
    trim: true,
    debounce: 0,
    uppercase: false,
    lowercase: false,
    maxlength: undefined,
    showWordLimit: false,
    type: "text",
    rows: 3,
    autosize: false,
    clearable: true,
    disabled: false,
    readonly: false,
    autofocus: false,
    width: "100%",
    searchOnEnter: true,
    searchOnClear: true,
  },
);

// ==================== Emits ====================
/**
 * 事件语义说明：
 *   - `input`：每次值变化（输入、防抖结束、清空）都触发，替代原 `change` 的"每次变化"语义；
 *   - `change`：与原生语义对齐，仅在失焦/回车时、且相对"上次已确认值"发生净变化才触发。
 * 注意：这是一次 breaking change，调用方若用 `@change` 做实时逻辑，应改为 `@input`。
 */
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  /** 每次值变化都会触发（替代原 change 的"每次变化"语义） */
  (e: "input", value: string): void;
  /** 与原生语义对齐：仅在失焦/回车且相对上次确认值发生净变化时触发 */
  (e: "change", value: string): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
  (e: "enter", value: string): void;
  (e: "clear"): void;
  (e: "search", value: string): void;
}>();

// ==================== Attrs 过滤 ====================
/**
 * 组件自身已显式 emit 这些事件，若再通过 $attrs 透传给 ElInput，
 * 父组件的同名监听器会被绑定两次（一次在 ElInput 内部事件上，一次在组件 emit 时）。
 * 原代码在 change / focus / blur 等场景已存在重复触发风险；
 * 本次新增 `input` 事件后若不处理，每次输入都会触发两次 @input，问题会被放大。
 * 因此这里过滤掉所有组件自身负责转发的事件监听器，只透传其余 attrs（class / placeholder / id 等）。
 *
 * 注意：`style` 也从 attrs 中摘出来，交给 wrapperStyle 统一合并。
 * 否则 `v-bind="forwardedAttrs"` 里的 style 会与 `:style="wrapperStyle"` 一起走 mergeProps，
 * 而 wrapperStyle 在后会胜出——父组件传 `style="width: 180px"` 会被默认的 width:100% 覆盖掉。
 */
const attrs = useAttrs();
const FORWARDED_EVENT_KEYS = [
  "onUpdate:modelValue",
  "onInput",
  "onChange",
  "onFocus",
  "onBlur",
  "onEnter",
  "onClear",
  "onSearch",
] as const;

const forwardedAttrs = computed(() => {
  const rest: Record<string, unknown> = { ...attrs };
  for (const key of FORWARDED_EVENT_KEYS) {
    delete rest[key];
  }
  delete rest.style;
  return rest;
});

// ==================== Computed ====================
/**
 * 宽度样式。
 * 与 base-select 保持一致：width prop 只作为默认值，父组件传入的 style 优先。
 * 返回数组而非对象，是为了让 Vue 依次应用，后一项覆盖前一项的同名属性。
 */
const wrapperStyle = computed(() => {
  const width =
    typeof props.width === "number" ? `${props.width}px` : props.width;
  const userStyle = (attrs as Record<string, any>).style;
  return [{ width }, userStyle];
});

// ==================== Refs ====================
const inputRef = ref<InstanceType<typeof ElInput>>();

// ==================== 工具函数 ====================
/**
 * 格式化值
 * @param value 原始值
 * @param doTrim 是否执行 trim（输入过程中传 false 以保留用户输入的空格）
 */
const formatValue = (value: unknown, doTrim = true): string => {
  if (value === null || value === undefined) return "";
  let formatted = String(value);
  if (props.uppercase) {
    formatted = formatted.toUpperCase();
  } else if (props.lowercase) {
    formatted = formatted.toLowerCase();
  }
  if (doTrim && props.trim) {
    formatted = formatted.trim();
  }
  return formatted;
};

// 内部显示值：始终对应用户看到的内容
const innerValue = ref<string>(formatValue(props.modelValue, true));

/**
 * 上一次"已确认"的值，用于失焦/回车时判断 change 是否发生净变化。
 * 更新时机：失焦/回车确认、外部修改、清空、主动 format()。
 * 不在每次输入时更新，这样"输入后又改回原值"不会误触发 change。
 */
let lastCommittedValue: string = formatValue(props.modelValue, true);

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 是否正在中文输入法组合输入中
let isComposing = false;

const clearDebounce = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
};

// ==================== 核心逻辑 ====================
/** 应用最终格式化（含 trim）并提交（防抖结束时调用） */
const commitValue = () => {
  const final = formatValue(innerValue.value, true);
  if (final !== innerValue.value) {
    innerValue.value = final;
  }
  emit("update:modelValue", final);
  // 每次值变化统一走 input，change 留给 blur/enter
  emit("input", final);
};

const handleUpdate = (value: string) => {
  // 中文输入法组合期间不提交，仅同步显示
  if (isComposing) {
    innerValue.value = value ?? "";
    return;
  }

  // 输入过程中：只做大小写转换，不做 trim（避免吞掉中间/尾部空格）
  const transformed = formatValue(value, false);
  innerValue.value = transformed;
  clearDebounce();

  // 空值不防抖，立即派发（保证清空操作即时生效）
  const useDebounce = props.debounce > 0 && transformed !== "";

  if (useDebounce) {
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      commitValue();
    }, props.debounce);
  } else {
    emit("update:modelValue", transformed);
    // 每次值变化 emit input，而非 change
    emit("input", transformed);
  }
};

// ==================== 事件处理 ====================
const handleFocus = (event: FocusEvent) => emit("focus", event);

const handleBlur = (event: FocusEvent) => {
  const hadPending = debounceTimer !== null;
  clearDebounce();
  const final = formatValue(innerValue.value, true);
  const trimmedChanged = final !== innerValue.value;
  if (trimmedChanged) innerValue.value = final;

  // 有挂起的防抖或 trim 导致显示值变化 → 需要同步给父组件
  if (hadPending || trimmedChanged) {
    emit("update:modelValue", final);
    emit("input", final);
  }

  // 只有相对"上次确认值"发生净变化才触发 change（与原生语义对齐）
  if (final !== lastCommittedValue) {
    lastCommittedValue = final;
    emit("change", final);
  }

  emit("blur", event);
};

/**
 * 回车处理
 * textarea 下回车是换行，不能走 trim/enter/search 逻辑，
 * 否则换行符会被 trim 掉，且每次回车都会误触发 search。
 */
const handleEnter = () => {
  // textarea 中回车用于换行，不触发 enter/search，也不打断输入/防抖
  if (props.type === "textarea") return;
  // 输入法组合中的回车（选择候选词）不处理
  if (isComposing) return;

  const hadPending = debounceTimer !== null;
  clearDebounce();
  const final = formatValue(innerValue.value, true);
  const trimmedChanged = final !== innerValue.value;
  if (trimmedChanged) innerValue.value = final;

  if (hadPending || trimmedChanged) {
    emit("update:modelValue", final);
    emit("input", final);
  }

  // 回车也是一次确认时机，净变化时触发 change
  if (final !== lastCommittedValue) {
    lastCommittedValue = final;
    emit("change", final);
  }

  emit("enter", final);
  if (props.searchOnEnter) emit("search", final);
};

/**
 * ElInput 点击 clear 按钮时，内部会先 emit('update:modelValue', '') → 已由 handleUpdate 处理，
 * 再 emit('clear') → 这里只负责清理防抖、确认 change、派发 clear / search，避免重复 emit。
 */
const handleClear = () => {
  clearDebounce();
  innerValue.value = "";
  // 清空是一次确认变更，若上次确认值非空则触发 change
  if (lastCommittedValue !== "") {
    lastCommittedValue = "";
    emit("change", "");
  }
  emit("clear");
  if (props.searchOnClear) emit("search", "");
};

// 中文输入法支持
const handleCompositionStart = () => {
  isComposing = true;
};

/**
 * 原实现这里手动调用 handleUpdate(value)，
 * 而 ElInput 在 compositionend 后自身也会触发 update:modelValue → handleUpdate，
 * 导致非防抖模式下 update:modelValue / input 重复触发。
 * 现在只重置 isComposing，依赖 ElInput 的 update:modelValue 统一提交。
 * 执行顺序：ElInput 内部先处理 compositionend，再 emit('compositionend') 触发本函数；
 * 其内部 nextTick 的 handleInput 晚于本函数执行，此时 isComposing 已为 false，可正常提交。
 */
const handleCompositionEnd = () => {
  isComposing = false;
};

// ==================== 监听外部变化 ====================
watch(
  () => props.modelValue,
  (newVal) => {
    if (isComposing) return;
    const raw = newVal ?? "";
    const normalized = formatValue(raw, false);
    // 与当前显示一致 → 是自身 emit 的回声，忽略
    if (normalized === innerValue.value) return;
    // 外部真正修改了值 → 中断防抖并接受外部值
    clearDebounce();
    const trimmed = formatValue(raw, true);
    innerValue.value = trimmed;
    /**
     * 外部传入值 trim 后与原始值不同时，回写父组件，保持父子一致。
     * 否则父组件持有的仍是带空格的值，而 UI 显示的是 trim 后的值，提交时会出现不一致。
     * 注意：immediate 时若初始值带首尾空格，会在初始化阶段回写一次 update:modelValue，
     * 如需避免可在业务侧确保初始值已 trim，或后续增加 syncTrimOnInit 开关。
     */
    if (trimmed !== raw) {
      emit("update:modelValue", trimmed);
    }
    // 外部修改视为一次已确认变更，同步 lastCommittedValue
    lastCommittedValue = trimmed;
  },
  { immediate: true },
);

// ==================== 生命周期 ====================
watch(
  () => props.autofocus,
  (val) => {
    if (val) {
      nextTick(() => inputRef.value?.focus());
    }
  },
  { immediate: true },
);

onBeforeUnmount(clearDebounce);

// ==================== 暴露方法 ====================
defineExpose({
  /** 获取焦点 */
  focus: () => inputRef.value?.focus(),
  /** 失去焦点 */
  blur: () => inputRef.value?.blur(),
  /** 全选 */
  select: () => inputRef.value?.select(),
  /** 清空输入（代码调用，完整派发事件） */
  clear: () => {
    clearDebounce();
    innerValue.value = "";
    emit("update:modelValue", "");
    emit("input", "");
    if (lastCommittedValue !== "") {
      lastCommittedValue = "";
      emit("change", "");
    }
    emit("clear");
    if (props.searchOnClear) emit("search", "");
  },
  /** 获取当前显示值 */
  getValue: () => innerValue.value,
  /** 获取格式化后的值（含 trim） */
  getFormattedValue: () => formatValue(innerValue.value, true),
  /** 强制应用完整格式化并提交（视为一次确认变更，净变化时触发 change） */
  format: () => {
    const final = formatValue(innerValue.value, true);
    innerValue.value = final;
    emit("update:modelValue", final);
    emit("input", final);
    if (final !== lastCommittedValue) {
      lastCommittedValue = final;
      emit("change", final);
    }
    return final;
  },
});
</script>

<style scoped lang="scss">
/* 无额外样式，完全继承 Element Plus */
</style>
