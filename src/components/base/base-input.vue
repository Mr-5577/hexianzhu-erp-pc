<!-- 增强版输入框 -->
<template>
  <ElInput
    ref="inputRef"
    v-bind="filteredAttrs"
    :model-value="displayValue"
    :disabled="disabled"
    :readonly="readonly"
    :clearable="clearable"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    :type="computedType"
    :rows="rows"
    :autosize="autosize"
    @update:model-value="handleUpdate"
    @focus="handleFocus"
    @blur="handleBlur"
    @keyup.enter="handleEnter"
    @clear="handleClear"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
    :style="wrapperStyle"
  >
    <!-- 插槽透传 -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ElInput>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useAttrs, onBeforeUnmount } from 'vue';
import { ElInput } from 'element-plus';

// ==================== Props ====================
const props = withDefaults(
  defineProps<{
    /** 当前值 */
    modelValue?: string | number;
    /** 是否自动去除首尾空格 */
    trim?: boolean;
    /** 防抖延迟（毫秒），0 表示不启用 */
    debounce?: number;
    /** 是否大写 */
    uppercase?: boolean;
    /** 是否小写 */
    lowercase?: boolean;
    /** 是否只允许数字 */
    number?: boolean;
    /** 小数位数限制（仅 number 模式生效） */
    decimalPlaces?: number;
    /** 最大长度 */
    maxlength?: number;
    /** 是否显示字数统计 */
    showWordLimit?: boolean;
    /** 输入框类型 */
    type?: 'text' | 'textarea' | 'password' | 'number';
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
    /** 是否在回车时触发搜索事件（默认 true） */
    searchOnEnter?: boolean;
    /** 是否在清空时触发搜索事件（默认 true） */
    searchOnClear?: boolean;
  }>(),
  {
    modelValue: '',
    trim: true,
    debounce: 0,
    uppercase: false,
    lowercase: false,
    number: false,
    decimalPlaces: undefined,
    maxlength: undefined,
    showWordLimit: false,
    type: 'text',
    rows: 3,
    autosize: false,
    clearable: true,
    disabled: false,
    readonly: false,
    autofocus: false,
    width: '100%',
    searchOnEnter: true,
    searchOnClear: true,
  }
);

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'enter', value: string | number): void;
  (e: 'clear'): void;
  (e: 'search', value: string): void;
}>();

// ==================== Refs ====================
const inputRef = ref<InstanceType<typeof ElInput>>();

// 内部显示值（用于防抖期间保留用户输入）
const innerValue = ref<string | number>(props.modelValue ?? '');

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 是否正在防抖等待中
let isDebouncing = false;

// 是否正在中文输入法组合输入中
let isComposing = false;

// ==================== Attrs ====================
const attrs = useAttrs();

// 过滤所有已声明的 props，避免覆盖
const filteredAttrs = computed(() => {
  const {
    modelValue,
    trim,
    debounce,
    uppercase,
    lowercase,
    number,
    decimalPlaces,
    maxlength,
    showWordLimit,
    type,
    rows,
    autosize,
    clearable,
    disabled,
    readonly,
    autofocus,
    width,
    searchOnEnter,
    searchOnClear,
    ...rest
  } = attrs as Record<string, any>;
  return rest;
});

// ==================== Computed ====================
const displayValue = computed({
  get: () => innerValue.value,
  set: (val) => {
    innerValue.value = val;
  },
});

// 计算实际 type（number 模式使用 text 并配合格式化）
const computedType = computed(() => {
  // 如果显式设置了 type='number'，保留原生 number 输入
  if (props.type === 'number') return 'number';
  // 如果开启了 number 模式但 type 未显式设置，使用 text（自定义控制）
  if (props.number) return 'text';
  return props.type;
});

const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}));

// ==================== 工具函数 ====================
const formatValue = (value: any): string | number => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  let formatted = String(value);

  // 1. 数字模式：先移除非法字符（保留数字和小数点）
  if (props.number) {
    // 只保留数字和小数点
    formatted = formatted.replace(/[^\d.]/g, '');
    // 多个小数点只保留第一个
    const parts = formatted.split('.');
    if (parts.length > 2) {
      formatted = parts[0] + '.' + parts.slice(1).join('');
    }
    // 限制小数位数
    if (props.decimalPlaces !== undefined && formatted.includes('.')) {
      const parts2 = formatted.split('.');
      if (parts2.length === 2) {
        parts2[1] = parts2[1].slice(0, props.decimalPlaces);
        formatted = parts2.join('.');
      }
    }
    // 不允许以多个零开头（如 "00" → "0"）
    if (formatted.startsWith('0') && formatted.length > 1 && !formatted.startsWith('0.')) {
      // 如果是 "001" → "1"，但 "0.5" 保持不变
      const num = Number(formatted);
      if (!isNaN(num)) {
        formatted = String(num);
      }
    }
  } else {
    // 2. 大小写转换（仅非数字模式）
    if (props.uppercase) {
      formatted = formatted.toUpperCase();
    } else if (props.lowercase) {
      formatted = formatted.toLowerCase();
    }
  }

  // 3. 去除首尾空格
  if (props.trim && typeof formatted === 'string') {
    formatted = formatted.trim();
  }

  // 4. 数字类型转换（仅当 number 模式且格式化后不为空）
  if (props.number && formatted !== '') {
    const num = Number(formatted);
    if (!isNaN(num)) {
      // 如果是整数，返回 number 类型；否则保留浮点数
      return Number.isInteger(num) ? num : parseFloat(formatted);
    }
    return '';
  }

  return formatted;
};

// 触发搜索事件
const triggerSearch = (value: any) => {
  emit('search', String(value ?? ''));
};

// ==================== 核心更新逻辑 ====================
const handleUpdate = (value: any) => {
  // 中文输入法组合期间不处理
  if (isComposing) {
    // 但仍需更新显示值（让用户看到拼音）
    innerValue.value = value;
    return;
  }

  // 更新显示值
  innerValue.value = value;

  // 清除之前的防抖定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // 格式化值
  const formatted = formatValue(value);

  // 防抖处理
  if (props.debounce > 0) {
    isDebouncing = true;
    debounceTimer = setTimeout(() => {
      isDebouncing = false;
      debounceTimer = null;

      // 防抖结束后，应用格式化值
      if (props.number) {
        innerValue.value = formatted;
      }
      emit('update:modelValue', formatted);
      emit('change', formatted);
    }, props.debounce);
  } else {
    // 无防抖，直接更新
    // 数字模式下显示格式化后的值（更干净）
    if (props.number) {
      innerValue.value = formatted;
    }
    emit('update:modelValue', formatted);
    emit('change', formatted);
  }
};

// ==================== 事件处理 ====================
const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  // 失焦时应用格式化
  const formatted = formatValue(innerValue.value);
  if (String(formatted) !== String(innerValue.value)) {
    innerValue.value = formatted;
    emit('update:modelValue', formatted);
  }
  emit('blur', event);
};

const handleEnter = () => {
  const value = innerValue.value;
  emit('enter', value);
  if (props.searchOnEnter) {
    triggerSearch(value);
  }
};

const handleClear = () => {
  innerValue.value = '';
  emit('update:modelValue', '');
  emit('clear');
  emit('change', '');
  if (props.searchOnClear) {
    triggerSearch('');
  }
};

// 中文输入法支持
const handleCompositionStart = () => {
  isComposing = true;
};

const handleCompositionEnd = (event: any) => {
  isComposing = false;
  const value = event.target?.value;
  if (value !== undefined && value !== null) {
    // 组合结束后，触发一次更新
    handleUpdate(value);
  }
};

// ==================== 监听外部变化 ====================
watch(
  () => props.modelValue,
  (newVal) => {
    // 防抖期间不覆盖用户输入
    if (isDebouncing) return;
    // 中文输入法组合期间不覆盖
    if (isComposing) return;

    const formatted = formatValue(newVal);
    if (String(formatted) !== String(innerValue.value)) {
      innerValue.value = formatted;
    }
  },
  { immediate: true }
);

// ==================== 生命周期 ====================
// 自动获取焦点
if (props.autofocus) {
  nextTick(() => {
    inputRef.value?.focus();
  });
}

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
});

// ==================== 暴露方法 ====================
defineExpose({
  /** 获取焦点 */
  focus: () => inputRef.value?.focus(),
  /** 失去焦点 */
  blur: () => inputRef.value?.blur(),
  /** 全选 */
  select: () => inputRef.value?.select(),
  /** 清空输入 */
  clear: () => {
    innerValue.value = '';
    emit('update:modelValue', '');
    emit('clear');
    emit('change', '');
  },
  /** 获取当前值（未格式化） */
  getValue: () => innerValue.value,
  /** 获取格式化后的值 */
  getFormattedValue: () => formatValue(innerValue.value),
  /** 强制应用格式化 */
  format: () => {
    const formatted = formatValue(innerValue.value);
    innerValue.value = formatted;
    emit('update:modelValue', formatted);
    return formatted;
  },
});
</script>

<style scoped lang="scss">
/* 无额外样式，完全继承 Element Plus */
</style>
