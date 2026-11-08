<!--
  基于 Element Plus ElCascader 的封装
  设计要点：
  1. 关闭 inheritAttrs，让 $attrs 只通过 v-bind 应用一次，避免未声明事件被触发两次
  2. 统一通过 resolveByValue 在 getCheckedNodes 失效时兜底反查节点数据（主要解决单选场景）
  3. disabled 字段名可通过 disabledKey 配置，与 valueKey / labelKey / childrenKey 保持一致风格
  4. 默认 filterMethod 对数字 label、非字符串 keyword 做健壮化
  5. width 默认值通过 :style 提供，但放在 v-bind="attrs" 之前，允许父级 style 覆盖
  6. getCheckedNodes / getCheckedValues / change 的 leafOnly 推导统一走 getCheckedNodesSafe

  兼容性：defineOptions 需要 Vue 3.3+；低版本请拆出独立的 <script> 块导出
    export default { inheritAttrs: false }
-->
<template>
  <ElCascader
    ref="cascaderRef"
    :style="wrapperStyle"
    v-bind="attrs"
    :model-value="modelValue"
    :options="options"
    :disabled="disabled"
    :props="computedProps"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :filter-method="effectiveFilterMethod"
    :show-all-levels="showAllLevels"
    :separator="separator"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @clear="handleClear"
    @expand-change="handleExpandChange"
    @visible-change="handleVisibleChange"
  >
    <!-- 插槽透传 -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ElCascader>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import { ElCascader, type CascaderValue } from "element-plus";

// 根节点就是 ElCascader，若不关闭，$attrs 会先被自动应用到根节点、又被 v-bind="attrs" 应用一次。
// 事件监听器会被 mergeProps 合并为数组并全部调用 —— 表现为父组件绑定的未声明事件触发两次。
// 关闭后，所有 $attrs 只通过显式的 v-bind="attrs" 应用一次。
defineOptions({ inheritAttrs: false });

// ==================== Props 定义 ====================
const props = withDefaults(
  defineProps<{
    /** 当前选中的值（多选时是数组；单选时可能是路径数组或单值，取决于 emitPath） */
    modelValue?: CascaderValue;
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
    /**
     * 数据项中表示"禁用"的字段名
     * @default 'disabled'
     * 原实现硬编码为 'disabled'，这里改为可配置，与 valueKey / labelKey 等保持一致
     */
    disabledKey?: string;
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
    expandTrigger?: "click" | "hover";
    /** 最大标签数量（多选时折叠） */
    collapseTags?: boolean;
    /** 折叠标签的 tooltip 提示 */
    collapseTagsTooltip?: boolean;
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: "请选择",
    clearable: true,
    filterable: false,
    showAllLevels: true,
    disabled: false,
    valueKey: "value",
    labelKey: "label",
    childrenKey: "children",
    disabledKey: "disabled",
    lazy: false,
    emitPath: true,
    separator: "/",
    width: "100%",
    multiple: false,
    checkStrictly: false,
    expandTrigger: "click",
    collapseTags: false,
    collapseTagsTooltip: false,
  },
);

// ==================== Emits 定义 ====================
const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
  /** 与 Element Plus 原生行为对齐：清空时第二参数为空数组 */
  (
    e: "change",
    value: CascaderValue | null | undefined,
    selectedOptions: any[],
  ): void;
  (e: "clear"): void;
  (e: "expand-change", value: any[]): void;
  (e: "visible-change", visible: boolean): void;
}>();

// ==================== Refs ====================
const cascaderRef = ref<InstanceType<typeof ElCascader>>();

// 直接使用 useAttrs 结果。原实现的 filteredAttrs 里那串解构是死代码：
// defineProps 已声明的属性不会进入 $attrs，解构根本过滤不到任何东西。
const attrs = useAttrs();

// ==================== Computed ====================
/**
 * Cascader 的 props 配置
 * disabled 走 disabledKey 配置，默认 'disabled'，与数据层字段名解耦
 */
const computedProps = computed(() => ({
  value: props.valueKey,
  label: props.labelKey,
  children: props.childrenKey,
  disabled: props.disabledKey,
  lazy: props.lazy,
  lazyLoad: props.lazy ? props.lazyLoad : undefined,
  emitPath: props.emitPath,
  multiple: props.multiple,
  checkStrictly: props.checkStrictly,
  expandTrigger: props.expandTrigger,
}));

/**
 * 宽度样式
 * 在模板中放在 v-bind="attrs" 之前，因此父级传的 style（含 width）会覆盖这里的默认值。
 */
const wrapperStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
}));

/**
 * 默认过滤方法
 * 修复点：
 * 1. label 可能不是字符串（数字会没有 toLowerCase），统一 String(...)
 * 2. keyword 可能不是字符串，统一 String(...)
 * 3. 优先从 node.data 中按 labelKey 取值，兼容自定义 labelKey；回退到 node.label
 */
const defaultFilterMethod = (node: any, keyword: string): boolean => {
  if (keyword == null || keyword === "") return true;
  const raw = node?.data ?? node;
  const label = String(
    raw?.[props.labelKey] ?? node?.label ?? "",
  ).toLowerCase();
  return label.includes(String(keyword).toLowerCase());
};

/** 优先使用外部传入的过滤方法 */
const effectiveFilterMethod = computed(
  () => props.filterMethod || defaultFilterMethod,
);

// ==================== 工具函数：反查节点数据 ====================
/**
 * 注意：Element Plus 的 getCheckedNodes 在多选场景可靠，但在单选场景
 * （尤其是懒加载 / 外部直接设置 modelValue）可能返回空数组。
 * 以下反查函数仅作为兜底，避免 change 事件的第二个参数丢失。

 * 反查结果统一为**原始 options 数据对象**，与 getCheckedNodes 的 .data 语义保持一致。
 *
 * ⚠️ 懒加载场景注意事项：
 * 以下反查函数仅基于当前已加载的 props.options 遍历。
 * 懒加载（lazy=true）时，未展开的层级数据尚未进入 options，
 * 反查可能返回 undefined，此时 change 的第二参数兜底会失效。
 * 懒加载场景请优先依赖 getCheckedNodes 的结果。
 */

/** 根据路径数组在树中查找节点（返回原始数据对象） */
function findNodeByPath(options: any[], path: any[]): any | undefined {
  let list: any[] | undefined = options;
  let node: any;
  for (const v of path) {
    node = list?.find((o: any) => o?.[props.valueKey] === v);
    if (!node) return undefined;
    list = node[props.childrenKey];
  }
  return node;
}

/** 根据叶子值在树中递归查找节点（返回原始数据对象） */
function findNodeByValue(options: any[], value: any): any | undefined {
  for (const o of options || []) {
    if (o?.[props.valueKey] === value) return o;
    const children = o?.[props.childrenKey];
    if (Array.isArray(children) && children.length) {
      const found = findNodeByValue(children, value);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * 根据单个 value 反查节点，兼容 emitPath 两种模式：
 * - emitPath: true  → value 是路径数组，按路径查找
 * - emitPath: false → value 是叶子值，全树递归查找
 */
function resolveSingle(value: any): any | undefined {
  if (value == null) return undefined;
  if (props.emitPath && Array.isArray(value)) {
    return findNodeByPath(props.options, value);
  }
  return findNodeByValue(props.options, value);
}

/**
 * 根据整体 modelValue 反查节点列表
 * - 单选：modelValue 本身是路径/单值，resolveSingle 即可
 * - 多选：modelValue 是数组（路径数组的数组 / 值数组），逐个 resolveSingle
 */
function resolveByValue(value: any): any[] {
  if (value == null) return [];
  if (props.multiple) {
    const items = Array.isArray(value) ? value : [value];
    return items
      .map((item) => resolveSingle(item))
      .filter((n): n is any => n != null);
  }
  const node = resolveSingle(value);
  return node ? [node] : [];
}

/**
 * 安全获取选中节点（原始数据对象）
 * 优先走组件实例的 getCheckedNodes（多选场景更准确），失效时反查兜底。
 *
 * @param value   当前值（change 事件中传入新值，其它场景默认取 props.modelValue）
 * @param leafOnly 是否只取叶子节点；不传时按"多选且非严格模式"推导。
 *                 该推导同时服务于内部 change 事件与对外暴露的 getCheckedNodes API，
 *                 保证两者语义一致。
 */
function getCheckedNodesSafe(
  value: any = props.modelValue,
  leafOnly?: boolean,
): any[] {
  const useLeafOnly = leafOnly ?? (props.multiple && !props.checkStrictly);
  const nodes = cascaderRef.value?.getCheckedNodes(useLeafOnly) || [];
  if (nodes.length) {
    return nodes.map((n: any) => n?.data ?? n);
  }
  // 兜底：getCheckedNodes 为空时反查（主要修复单选场景 change 第二参数丢失的问题）
  return resolveByValue(value);
}

// ==================== 事件处理 ====================
const handleUpdate = (value: any) => {
  emit("update:modelValue", value);
};

const handleChange = (value: CascaderValue | null | undefined) => {
  // 使用 change 事件的新值做兜底反查，避免依赖尚未同步的 props.modelValue
  const selectedOptions = getCheckedNodesSafe(value);
  // 与 Element Plus 原生行为对齐：清空时第二参数为空数组 []
  emit("change", value, selectedOptions);
};

const handleClear = () => {
  emit("clear");
};

const handleExpandChange = (value: CascaderValue) => {
  const valArray = Array.isArray(value)
    ? value
    : value !== null && value !== undefined
      ? [value]
      : [];
  emit("expand-change", valArray);
};

const handleVisibleChange = (visible: boolean) => {
  emit("visible-change", visible);
};

// ==================== 暴露方法（供父组件调用） ====================
defineExpose({
  /** 获取焦点 */
  focus: () => {
    const instance: any = cascaderRef.value;
    if (!instance) return;
    instance.focus();
  },
  /** 失去焦点 */
  blur: () => {
    const instance: any = cascaderRef.value;
    if (!instance) return;
    instance.blur();
  },
  /**
   * 获取选中的节点（返回原始 options 数据对象数组）
   * - leafOnly 不传时与内部 change 事件一致：多选且非严格模式下只取叶子节点
   * - 单选模式下同样做了兜底，不会因 getCheckedNodes 失效而返回空数组
   */
  getCheckedNodes: (leafOnly?: boolean) =>
    getCheckedNodesSafe(props.modelValue, leafOnly),
  /** 获取选中的值列表（leafOnly 推导规则与 getCheckedNodes 一致） */
  getCheckedValues: (leafOnly?: boolean) => {
    const nodes = getCheckedNodesSafe(props.modelValue, leafOnly);
    return nodes.map((n: any) => n?.[props.valueKey]);
  },
  /** 获取 Cascader 实例（用于高级操作） */
  getInstance: () => cascaderRef.value,
});
</script>
