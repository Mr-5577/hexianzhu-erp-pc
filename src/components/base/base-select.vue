<!-- 基于 Element Plus ElSelect 的封装 -->
<template>
  <ElSelect
    ref="selectRef"
    v-bind="filteredAttrs"
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    :max-collapse-tags="maxCollapseTags"
    :disabled="disabled"
    :filterable="filterable"
    :filter-method="effectiveFilterMethod"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @clear="handleClear"
    @visible-change="handleVisibleChange"
    :style="wrapperStyle"
  >
    <!-- 选项渲染：key 增加 index 兜底，避免 value 重复/取空时 key 冲突 -->
    <ElOption
      v-for="(item, index) in displayOptions"
      :key="`${getValue(item)}-${index}`"
      :label="getLabel(item)"
      :value="getValue(item)"
      :disabled="getDisabled(item)"
    />

    <!-- 空状态插槽：优先使用父组件传入的 no-data-text，再回退到 emptyText -->
    <template #empty>
      <slot name="empty">
        <div class="empty-text">{{ noDataText }}</div>
      </slot>
    </template>

    <!-- 其他插槽透传（排除 default / empty，避免干扰内部渲染） -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot
        v-if="name !== 'default' && name !== 'empty'"
        :name="name"
        v-bind="slotData"
      />
    </template>
  </ElSelect>
</template>

<script setup lang="ts">
import { ref, computed, useAttrs } from "vue";
import { ElSelect, ElOption } from "element-plus";

// ==================== 组件选项 ====================
// 关闭自动 attrs 透传：组件根节点是 ElSelect，若继续自动继承，
// 父组件的 @change / @update:modelValue 等会「自动继承一次 + v-bind 一次 + 内部 emit 一次」共触发多次。
// 因此改为手动 v-bind="filteredAttrs"，只透传我们未处理的内容。
defineOptions({ inheritAttrs: false });

// ==================== 类型定义 ====================
interface Option {
  /** 选项值（使用自定义 valueKey 时可为其他字段，故设为可选） */
  value?: any;
  /** 选项标签（使用自定义 labelKey 时可为其他字段，故设为可选） */
  label?: string;
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
    /** 是否在清空时触发 search 事件（默认 true） */
    searchOnClear?: boolean;
    /** 多选时是否过滤空值（默认 false，避免误删合法空字符串选项） */
    filterEmptyValue?: boolean;
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: "请选择",
    clearable: true,
    filterable: false,
    disabled: false,
    emptyText: "暂无数据",
    valueKey: "value",
    labelKey: "label",
    multiple: false,
    collapseTags: false,
    collapseTagsTooltip: false,
    maxCollapseTags: undefined,
    width: "100%",
    searchOnClear: true,
    filterEmptyValue: false,
  },
);

// ==================== Emits ====================
const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
  (e: "change", value: any): void;
  (e: "clear"): void;
  (e: "search", keyword: string): void;
  (e: "visible-change", visible: boolean): void;
}>();

// ==================== Refs / Attrs ====================
const selectRef = ref<InstanceType<typeof ElSelect>>();
const searchKeyword = ref("");
const attrs = useAttrs();

/**
 * 已显式处理的事件名（attrs 中以 onXxx 形式出现）。
 * 这些事件由组件内部 emit，若再通过 v-bind 透传给 ElSelect，会造成重复触发，必须过滤。
 */
const HANDLED_EVENTS = new Set([
  "onUpdate:modelValue",
  "onChange",
  "onClear",
  "onVisibleChange",
]);

/**
 * 需要从 attrs 中排除的属性：
 * - 已处理事件：避免重复触发
 * - style：与 wrapperStyle 合并，避免 width 冲突
 * - filter-method：由 effectiveFilterMethod 统一控制，避免被模板显式绑定覆盖
 */
const filteredAttrs = computed(() => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (HANDLED_EVENTS.has(key)) continue;
    if (key === "style") continue;
    if (key === "filter-method") continue;
    result[key] = value;
  }
  return result;
});

/** 是否为远程搜索模式（由父组件透传 remote 决定） */
const isRemote = computed(() => Boolean((attrs as Record<string, any>).remote));

// ==================== 工具方法 ====================
/** 选项值提取 */
const getValue = (item: any) => {
  if (typeof item === "object" && item !== null) {
    return item[props.valueKey];
  }
  return item;
};

/**
 * 选项标签提取。
 * 1. 统一返回 string，避免 displayOptions 中 .toLowerCase() 对 number 抛错；
 * 2. 使用显式判空，避免 label 为 0 / '' 时被 || 误判回退到 value。
 */
const getLabel = (item: any): string => {
  if (item && typeof item === "object") {
    const label = item[props.labelKey];
    if (label !== undefined && label !== null && label !== "") {
      return String(label);
    }
    const val = item[props.valueKey];
    return val === undefined || val === null ? "" : String(val);
  }
  return item === undefined || item === null ? "" : String(item);
};

/** 选项禁用状态提取 */
const getDisabled = (item: any) => {
  if (typeof item === "object" && item !== null) {
    return item.disabled || false;
  }
  return false;
};

// ==================== Computed ====================
/**
 * 显示选项。
 * 远程模式下不再做本地二次过滤，避免把服务端已匹配好的结果过滤掉。
 */
const displayOptions = computed(() => {
  const list = props.options || [];
  if (isRemote.value || !props.filterable || !searchKeyword.value.trim()) {
    return list;
  }
  const keyword = searchKeyword.value.trim().toLowerCase();
  return list.filter((item) => getLabel(item).toLowerCase().includes(keyword));
});

/**
 * 有效过滤方法。
 *
 * 1. 父组件若自定义 filter-method，则优先使用（之前会被模板显式绑定静默覆盖）；
 * 2. 远程模式下不绑定本地过滤，避免与 remote-method 同时生效造成双请求 / 结果被过滤。
 */
const effectiveFilterMethod = computed(() => {
  const userFilter = (attrs as Record<string, any>)["filter-method"];
  if (typeof userFilter === "function") return userFilter;
  if (!props.filterable || isRemote.value) return undefined;
  return handleFilter;
});

/** 空状态文本：父组件 no-data-text 优先 */
const noDataText = computed(
  () =>
    ((attrs as Record<string, any>)["no-data-text"] as string) ??
    props.emptyText,
);

/**
 * 宽度样式。
 * 把父组件传入的 style 合并进来，width 作为默认值，用户 style 优先。
 */
const wrapperStyle = computed(() => {
  const width =
    typeof props.width === "number" ? `${props.width}px` : props.width;
  const userStyle = (attrs as Record<string, any>).style;
  return [{ width }, userStyle];
});

// ==================== 事件处理 ====================
/**
 * @update:model-value - 双向绑定更新（内部使用）
 * 空值过滤改为可选（filterEmptyValue），默认不再静默丢弃合法空字符串值。
 */
const handleUpdate = (value: any) => {
  if (props.multiple && props.filterEmptyValue && Array.isArray(value)) {
    value = value.filter((v) => v !== null && v !== undefined && v !== "");
  }
  emit("update:modelValue", value);
};

const handleChange = (value: any) => {
  emit("change", value);
};

const handleClear = () => {
  searchKeyword.value = "";
  emit("clear");
  if (props.searchOnClear) {
    emit("search", "");
  }
};

/**
 * 下拉显示状态变化。
 * 关闭时重置本地搜索关键字，避免下次打开仍被上次关键字过滤。
 */
const handleVisibleChange = (visible: boolean) => {
  if (!visible && searchKeyword.value) {
    searchKeyword.value = "";
    emit("search", "");
  }
  emit("visible-change", visible);
};

/**
 * 本地搜索过滤方法（非远程）。
 * 注意：远程场景请使用 remote-method（透传给 ElSelect），不要与本地过滤混用。
 */
const handleFilter = (keyword: string) => {
  searchKeyword.value = keyword;
  // 父组件可监听 @search 做额外处理（如远程搜索，建议在父组件内做防抖）
  emit("search", keyword);
};

/**
 * 清空选中值（暴露给父组件调用）。
 * 与用户点击清除按钮的行为保持一致，补充 emit('change')。
 */
const clear = () => {
  const value = props.multiple ? [] : undefined;
  searchKeyword.value = "";
  emit("update:modelValue", value);
  emit("change", value);
  emit("clear");
  if (props.searchOnClear) {
    emit("search", "");
  }
};

// ==================== 暴露方法 ====================
defineExpose({
  /** 获取焦点 */
  focus: () => selectRef.value?.focus(),
  /** 失去焦点 */
  blur: () => selectRef.value?.blur(),
  /** 清空选中值（会触发 update:modelValue / change / clear / search 事件） */
  clear,
  /** 获取当前选项列表（返回浅拷贝，避免外部篡改内部引用） */
  getOptions: () => [...(props.options || [])],
  /** 获取当前显示选项（搜索过滤后，返回浅拷贝） */
  getDisplayOptions: () => [...displayOptions.value],
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
