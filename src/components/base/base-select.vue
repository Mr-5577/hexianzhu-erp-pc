<!-- 增强版下拉选择器 -->
<template>
  <ElSelect
    ref="selectRef"
    v-bind="filteredAttrs"
    :model-value="modelValue"
    :disabled="disabled"
    :filterable="filterable"
    :filter-method="filterable ? handleFilter : undefined"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @clear="handleClear"
    @visible-change="handleVisibleChange"
    :style="wrapperStyle"
  >
    <!-- 选项渲染 -->
    <ElOption
      v-for="item in displayOptions"
      :key="getValue(item)"
      :label="getLabel(item)"
      :value="getValue(item)"
      :disabled="getDisabled(item)"
    />

    <!-- 空状态插槽 -->
    <template #empty>
      <slot name="empty">
        <div class="empty-text">{{ emptyText }}</div>
      </slot>
    </template>

    <!-- 其他插槽透传 -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot v-if="name !== 'default' && name !== 'empty'" :name="name" v-bind="slotData" />
    </template>
  </ElSelect>
</template>

<script setup lang="ts">
import { ref, computed, useAttrs } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

// ==================== 类型定义 ====================
interface Option {
  value: any;
  label: string;
  disabled?: boolean;
  [key: string]: any;
}

// ==================== Props ====================
const props = withDefaults(
  defineProps<{
    /** 当前选中的值 */
    modelValue?: any;
    /** 选项列表 */
    options?: Option[];
    /** 占位文本 */
    placeholder?: string;
    /** 是否可清空 */
    clearable?: boolean;
    /** 是否可搜索（本地搜索） */
    filterable?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 空状态文本 */
    emptyText?: string;
    /** 值字段名 */
    valueKey?: string;
    /** 标签字段名 */
    labelKey?: string;
    /** 是否多选 */
    multiple?: boolean;
    /** 是否可折叠标签（多选） */
    collapseTags?: boolean;
    /** 折叠标签提示（多选） */
    collapseTagsTooltip?: boolean;
    /** 最大标签数量（多选） */
    maxCollapseTags?: number;
    /** 组件宽度 */
    width?: string | number;
    /** 是否在清空时触发搜索事件（默认 true） */
    searchOnClear?: boolean;
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: '请选择',
    clearable: true,
    filterable: false,
    disabled: false,
    emptyText: '暂无数据',
    valueKey: 'value',
    labelKey: 'label',
    multiple: false,
    collapseTags: false,
    collapseTagsTooltip: false,
    maxCollapseTags: undefined,
    width: '100%',
    searchOnClear: true,
  }
);

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
  (e: 'clear'): void;
  (e: 'search', keyword: string): void;
  (e: 'visible-change', visible: boolean): void;
}>();

// ==================== Refs ====================
const selectRef = ref<InstanceType<typeof ElSelect>>();
const searchKeyword = ref('');

// ==================== Attrs ====================
const attrs = useAttrs();

// 过滤已声明的 props，避免覆盖
const filteredAttrs = computed(() => {
  const {
    modelValue,
    options,
    placeholder,
    clearable,
    filterable,
    disabled,
    emptyText,
    valueKey,
    labelKey,
    multiple,
    collapseTags,
    collapseTagsTooltip,
    maxCollapseTags,
    width,
    searchOnClear,
    ...rest
  } = attrs as Record<string, any>;
  return rest;
});

// ==================== Computed ====================
/** 显示选项（本地搜索过滤） */
const displayOptions = computed(() => {
  if (!props.filterable || !searchKeyword.value) {
    return props.options || [];
  }

  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return props.options || [];

  return (props.options || []).filter(item => {
    const label = getLabel(item).toLowerCase();
    return label.includes(keyword);
  });
});

/** 选项值提取 */
const getValue = (item: any) => {
  if (typeof item === 'object' && item !== null) {
    return item[props.valueKey];
  }
  return item;
};

/** 选项标签提取 */
const getLabel = (item: any) => {
  if (typeof item === 'object' && item !== null) {
    return item[props.labelKey] || String(item[props.valueKey] || '');
  }
  return String(item);
};

/** 选项禁用状态提取 */
const getDisabled = (item: any) => {
  if (typeof item === 'object' && item !== null) {
    return item.disabled || false;
  }
  return false;
};

/** 宽度样式 */
const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}));

// ==================== 事件处理 ====================
/**
 * @update:model-value - 双向绑定更新（内部使用）
 * @change - 值变化通知（父组件监听）
 */
const handleUpdate = (value: any) => {
  // 多选时过滤空值
  if (props.multiple && Array.isArray(value)) {
    value = value.filter(v => v !== null && v !== undefined && v !== '');
  }
  emit('update:modelValue', value);
};

const handleChange = (value: any) => {
  emit('change', value);
};

const handleClear = () => {
  searchKeyword.value = '';
  emit('clear');
  if (props.searchOnClear) {
    emit('search', '');
  }
};

const handleVisibleChange = (visible: boolean) => {
  emit('visible-change', visible);
};

/** 本地搜索过滤方法（非远程） */
const handleFilter = (keyword: string) => {
  searchKeyword.value = keyword;
  // 父组件可监听 @search 做额外处理（如远程搜索）
  emit('search', keyword);
};

// ==================== 暴露方法 ====================
defineExpose({
  /** 获取焦点 */
  focus: () => selectRef.value?.focus(),
  /** 失去焦点 */
  blur: () => selectRef.value?.blur(),
  /** 清空选中值（会触发 clear 和 search 事件） */
  clear: () => {
    selectRef.value?.clear?.();
    // 同步触发清空逻辑，让父组件感知
    searchKeyword.value = '';
    emit('clear');
    if (props.searchOnClear) {
      emit('search', '');
    }
  },
  /** 获取当前选项列表 */
  getOptions: () => props.options || [],
  /** 获取当前显示选项（搜索过滤后） */
  getDisplayOptions: () => displayOptions.value,
});
</script>

<style scoped lang="scss">
.empty-text {
  padding: 20px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
