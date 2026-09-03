<!-- 增强版级联选择器 -->
<template>
  <ElCascader
    ref="cascaderRef"
    v-bind="filteredAttrs"
    :model-value="modelValue"
    :options="options"
    :disabled="disabled"
    :props="computedProps"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :filter-method="filterMethod"
    :show-all-levels="showAllLevels"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @clear="handleClear"
    @expand-change="handleExpandChange"
    @visible-change="handleVisibleChange"
    :style="wrapperStyle"
  >
    <!-- 插槽透传 -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ElCascader>
</template>

<script setup lang="ts">
import { ref, computed, useAttrs } from 'vue';
import { ElCascader, type CascaderValue } from 'element-plus';

// ==================== Props 定义 ====================
const props = withDefaults(
  defineProps<{
    /** 当前选中的值（数组或单个值） */
    modelValue?: any[] | any;
    /** 树形选项数据（外部传入，已转换好） */
    options?: any[];
    /** 占位文本 */
    placeholder?: string;
    /** 是否可清空 */
    clearable?: boolean;
    /** 是否可搜索 */
    filterable?: boolean;
    /** 自定义搜索方法 */
    filterMethod?: (node: any, keyword: string) => boolean;
    /** 是否显示所有层级标签 */
    showAllLevels?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 值字段名 */
    valueKey?: string;
    /** 标签字段名 */
    labelKey?: string;
    /** 子级字段名 */
    childrenKey?: string;
    /** 是否懒加载 */
    lazy?: boolean;
    /** 懒加载函数（仅当 lazy=true 时生效） */
    lazyLoad?: (node: any, resolve: (data: any[]) => void) => void;
    /** 是否 emit 路径数组 */
    emitPath?: boolean;
    /** 分隔符 */
    separator?: string;
    /** 组件宽度 */
    width?: string | number;
    /** 是否多选 */
    multiple?: boolean;
    /** 是否严格模式（父级节点可选） */
    checkStrictly?: boolean;
    /** 是否可展开触发 hover */
    expandTrigger?: 'click' | 'hover';
    /** 最大标签数量（多选时折叠） */
    collapseTags?: boolean;
    /** 折叠标签的 tooltip 提示 */
    collapseTagsTooltip?: boolean;
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: '请选择',
    clearable: true,
    filterable: false,
    showAllLevels: true,
    disabled: false,
    valueKey: 'value',
    labelKey: 'label',
    childrenKey: 'children',
    lazy: false,
    emitPath: true,
    separator: '/',
    width: '100%',
    multiple: false,
    checkStrictly: false,
    expandTrigger: 'click',
    collapseTags: false,
    collapseTagsTooltip: false,
  }
);

// ==================== Emits 定义 ====================
const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any, selectedOptions: any[] | undefined): void;
  (e: 'clear'): void;
  (e: 'expand-change', value: any[]): void;
  (e: 'visible-change', visible: boolean): void;
}>();

// ==================== Refs ====================
const cascaderRef = ref<InstanceType<typeof ElCascader>>();
const attrs = useAttrs();

// ==================== Attrs 过滤（避免覆盖 props） ====================
const filteredAttrs = computed(() => {
  const {
    modelValue,
    options,
    disabled,
    placeholder,
    clearable,
    filterable,
    showAllLevels,
    valueKey,
    labelKey,
    childrenKey,
    lazy,
    lazyLoad,
    emitPath,
    separator,
    width,
    multiple,
    checkStrictly,
    expandTrigger,
    collapseTags,
    collapseTagsTooltip,
    ...rest
  } = attrs as Record<string, any>;
  return rest;
});

// ==================== Computed ====================
/**
 * Cascader 的 props 配置
 * 注意：disabled: 'disabled' 表示从数据项的 'disabled' 字段读取禁用状态
 * 这是一个字段映射配置，而不是传递具体的布尔值
 */
const computedProps = computed(() => ({
  value: props.valueKey,
  label: props.labelKey,
  children: props.childrenKey,
  disabled: 'disabled', // 固定字段名，数据层做适配
  lazy: props.lazy,
  lazyLoad: props.lazy ? props.lazyLoad : undefined,
  emitPath: props.emitPath,
  separator: props.separator,
  multiple: props.multiple,
  checkStrictly: props.checkStrictly,
  expandTrigger: props.expandTrigger,
  collapseTags: props.collapseTags,
  collapseTagsTooltip: props.collapseTagsTooltip,
}));

/** 宽度样式 */
const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}));

/** 默认过滤方法（支持中文搜索） */
const defaultFilterMethod = (node: any, keyword: string): boolean => {
  if (!keyword) return true;
  const label = node.label?.toLowerCase?.() || '';
  return label.includes(keyword.toLowerCase());
};

/** 优先使用外部传入的过滤方法 */
const filterMethod = computed(() => props.filterMethod || defaultFilterMethod);

// ==================== 事件处理 ====================
const handleUpdate = (value: any) => {
  emit('update:modelValue', value);
};

const handleChange = (value: CascaderValue | null | undefined) => {
  // 多选且非严格模式时只取叶子节点，否则取所有选中节点
  const leafOnly = props.multiple && !props.checkStrictly;
  const checkedNodes = cascaderRef.value?.getCheckedNodes(leafOnly) || [];
  const selectedOptions = checkedNodes.map((node: any) => node.data || node);
  // 如果没有任何选中项，传 undefined 而不是空数组
  emit('change', value, selectedOptions.length > 0 ? selectedOptions : undefined);
};

const handleClear = () => {
  emit('clear');
};

const handleExpandChange = (value: CascaderValue) => {
  const valArray = Array.isArray(value)
    ? value
    : value !== null && value !== undefined
      ? [value]
      : [];
  emit('expand-change', valArray);
};

const handleVisibleChange = (visible: boolean) => {
  emit('visible-change', visible);
};

// ==================== 暴露方法（供父组件调用） ====================
defineExpose({
  /** 获取焦点 */
  focus: () => cascaderRef.value?.focus(),
  /** 失去焦点 */
  blur: () => cascaderRef.value?.blur(),
  /** 获取选中的节点 */
  getCheckedNodes: (leafOnly: boolean = false) =>
    cascaderRef.value?.getCheckedNodes(leafOnly) || [],
  /** 获取选中的值列表 */
  getCheckedValues: (leafOnly: boolean = false) => {
    const nodes = cascaderRef.value?.getCheckedNodes(leafOnly) || [];
    return nodes.map((node: any) => node.value);
  },
  /** 获取 Cascader 实例（用于高级操作） */
  getInstance: () => cascaderRef.value,
});
</script>

<style scoped lang="scss">
/* 组件本身无额外样式，完全继承 Element Plus 样式 */
</style>
