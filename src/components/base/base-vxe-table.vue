<!--
 * ============================================================================
 * 可编辑表格组件（基于 vxe-table 封装）
 * ============================================================================
 *
 * 功能特性：
 *   ✅ 数据编辑（单元格/行编辑模式）
 *   ✅ 多级表头 / 树形数据
 *   ✅ 虚拟滚动（大数据量性能优化）
 *   ✅ 多种编辑类型：输入框、下拉选择、数字输入、日期、开关、文本域、级联选择
 *   ✅ 数据字典映射
 *   ✅ 分页
 *   ✅ 可配置的工具栏
 *   ✅ 表头提示（在表头文字后显示自定义图标，鼠标悬停显示提示内容）
 *   ✅ 合计行（支持 sum / avg / count / custom，通过 showSummary 或 summary 配置）
 *
 * 使用示例：
 *   <base-vxe-table
 *     v-model="tableData"
 *     :columns="columns"
 *     row-key="id"
 *     :edit-config="{ trigger: 'click', mode: 'cell' }"
 *     @data-change="handleDataChange"
 *     :show-footer="true"
 *   />
 * ============================================================================
 -->

<template>
  <div class="base-vxe-table-wrapper">
    <!-- ===== 操作栏（插槽） ===== -->
    <div class="action-bar" v-if="$slots.actionBar">
      <slot name="actionBar" />
    </div>

    <!-- ===== 工具栏 ===== -->
    <div class="toolbar" v-if="showToolbar">
      <div class="left">
        <slot name="toolbar-left">
          <span v-if="selectedRows.length > 0" class="selected-count">
            已选择 {{ selectedRows.length }} 项
            <el-button link type="primary" @click="clearSelection">
              清空
            </el-button>
          </span>
        </slot>
      </div>
      <div class="right">
        <slot name="toolbar-right">
          <el-tooltip content="刷新">
            <el-button size="small" @click="handleRefresh" :loading="loading">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </slot>
      </div>
    </div>

    <!-- ===== vxe-grid 表格 ===== -->
    <div class="table-wrapper" ref="tableWrapperRef">
      <vxe-grid
        ref="gridRef"
        v-bind="gridOptions"
        :data="internalData"
        :columns="computedColumns"
        :loading="loading"
        :row-config="rowConfig"
        :tree-config="treeConfig"
        :edit-config="editConfig"
        :tooltip-config="tooltipConfig"
        :scroll-y="scrollYConfig"
        :height="computedHeight"
        :max-height="maxHeight"
        :column-config="columnConfig"
        :header-cell-config="headerCellConfig"
        :cell-config="cellConfig"
        :footer-cell-config="footerCellConfig"
        :edit-rules="computedEditRules"
        :show-header-overflow="true"
        :show-overflow="true"
        @checkbox-change="handleCheckboxChange"
        @checkbox-all="handleCheckboxAll"
        @radio-change="handleRadioChange"
        @edit-actived="handleEditActived"
        @edit-closed="handleEditClosed"
        @cell-click="handleCellClick"
      >
        <!--
          透传所有插槽：
          允许外部通过具名插槽自定义单元格内容，如：
          <template #status="{ row }"> ... </template>
        -->
        <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
          <slot :name="name" v-bind="scope" />
        </template>

        <!-- 空数据状态 -->
        <template #empty>
          <el-empty :image-size="80" description="暂无数据" />
        </template>
      </vxe-grid>
    </div>

    <!-- ===== 分页组件 ===== -->
    <div class="pagination" v-if="pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="'total, sizes, prev, pager, next, jumper'"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentChange"
        :size="'small'"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  h,
  resolveComponent,
  nextTick,
} from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import type { VxeGridInstance, VxeGridProps } from "vxe-table";

/**
 * 表头提示配置
 */
export interface HeaderTipConfig {
  /** 提示文本内容（必填） */
  content: string;
  /** 提示图标名称（默认 QuestionFilled） */
  icon?: string;
  /** 提示框显示位置（默认 top） */
  placement?:
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "left-start"
    | "left-end"
    | "right"
    | "right-start"
    | "right-end";
  /** 提示框宽度 */
  width?: string | number;
}

/**
 * vxe-table 校验规则
 * @example
 * // 必填
 * { required: true, message: '请输入合同编号' }
 * // 长度限制
 * { min: 3, max: 20, message: '长度 3-20 个字符' }
 * // 数值大小限制（type: 'number' 时 min/max 表示数值大小）
 * { type: 'number', min: 0, max: 9999, message: '金额需在 0-9999 之间' }
 * // 数组类型（多选 cascader 等）
 * { type: 'array', message: '请至少选择一个' }
 * // 正则
 * { pattern: /^[A-Z]{2}-\d{4}$/, message: '格式如 HT-2024' }
 * // 自定义校验
 * {
 *   validator: ({ cellValue, row }) => {
 *     if (cellValue === row.other) return new Error('不能与 other 相同');
 *   },
 *   message: '校验失败',
 * }
 */
export interface VxeValidatorRule {
  /** 指定校验的字段名 */
  field?: string;
  /** 是否必填，true 时表头会自动显示红色星号  */
  required?: boolean;
  /** 最小长度 / 最小值 - `type` 为 `'number'` 时表示数值大小比较 */
  min?: number;
  /** 最大长度 / 最大值 - `type` 为 `'number'` 时表示数值大小比较 */
  max?: number;
  /**
   * 数据校验的类型
   * - `'number'`：数值类型，min/max 按数值大小比较
   * - `'string'`：字符串类型（默认）
   * - `'array'`：数组类型（多选场景必须指定，否则 required 对 [] 不生效）
   * @default 'string'
   */
  type?: "number" | "string" | "array";
  /** 正则校验 */
  pattern?: RegExp | string;
  /** 自定义校验方法 */
  validator?: (params: {
    cellValue: any;
    rule: VxeValidatorRule;
    rules: VxeValidatorRule[];
    row: any;
    rowIndex: number;
    column: any;
    columnIndex: number;
  }) => Error | Promise<any> | void | null;
  /** 校验提示内容 */
  message?: string;
}
/**
 * 可编辑列配置接口
 *
 * 扩展了 vxe-table 的列配置，增加了编辑相关的配置项。
 * 支持配置编辑类型、选项、校验规则等。
 */
export interface VxeTableColumn {
  // ===== 基础列配置 =====
  /** 字段名，对应数据中的键 */
  field?: string;
  /** 表头标题 */
  title?: string;
  /** 列宽度（px） */
  width?: number | string;
  /** 最小宽度（px） */
  minWidth?: number | string;
  /** 对齐方式：left | center | right */
  align?: "left" | "center" | "right";
  /** 是否可排序 */
  sortable?: boolean;
  /** 固定列位置：left | right */
  fixed?: "left" | "right";
  /** 是否显示溢出提示（鼠标悬停显示完整内容） */
  showOverflow?: boolean;
  /** 自定义插槽配置，用于渲染自定义内容 */
  slots?: {
    default?: string; // 默认内容插槽名
    header?: string; // 表头插槽名
    edit?: string; // 编辑状态插槽名
    content?: string; // 展开行内容插槽名
  };
  /** 列类型：checkbox（多选）| seq（序号）| radio（单选）| expand（展开） */
  type?: "checkbox" | "seq" | "radio" | "expand";
  /** 是否为树形节点列（显示展开箭头） */
  treeNode?: boolean;

  /**
   * 表头提示配置
   *
   * 配置后会在表头文字后面显示一个问号图标，
   * 鼠标悬停时显示提示内容。
   *
   * @example
   * {
   *   field: 'amount',
   *   title: '金额',
   *   headerTip: {
   *     content: '金额单位为元，含税',
   *     icon: 'QuestionFilled',
   *     placement: 'top'
   *   }
   * }
   */
  headerTip?: HeaderTipConfig;

  // ===== 编辑相关配置 =====
  /** 编辑类型，决定使用哪种编辑组件 */
  editType?:
    | "input" // 文本输入框
    | "select" // 下拉选择器
    | "number" // 数字输入框
    | "date" // 日期选择器
    | "datetime" // 日期时间选择器
    | "year" // 年份选择器
    | "month" // 月份选择器
    | "cascader"; // 级联选择器
  /**
   * 编辑校验规则（列级）
   * - 只写规则数组即可，不需要再包一层 `{ [field]: [...] }`
   * - 组件内部会自动聚合到 vxe-grid 的 editRules 上
   * - 支持多级表头（children 里的规则也会被收集）
   * @example
   * editRules: [
   *   { required: true, message: '请输入合同编号' },
   *   { min: 3, max: 20, message: '长度 3-20 个字符' },
   * ]
   */
  editRules?: VxeValidatorRule[];
  /** 是否可编辑，默认为 true */
  editable?: boolean;
  /** 禁用状态，支持布尔值或函数 */
  disabled?: boolean | ((row: any) => boolean);
  /**
   * 禁用时的提示消息
   * - string：统一提示
   * - function：按行动态返回提示（返回空字符串或 null 则不提示）
   */
  disabledTip?: string | ((row: any) => string | null | undefined);
  /** 占位符文本 */
  placeholder?: string;

  // ===== 选项相关（用于 select / cascader） =====
  /** 选项数据，支持静态数组或动态函数 */
  options?: Array<any> | ((row: any) => Array<any>);
  /** 选项的标签字段名，默认 'label' */
  optionLabelField?: string;
  /** 选项的值字段名，默认 'value' */
  optionValueField?: string;
  /** 是否多选（仅 select 类型有效） */
  multiple?: boolean;

  // ===== 数字输入相关 =====
  /** 数字间隔 */
  step?: number;
  /** 数字输入类型：'number' | 'integer' | 'float'，默认 'float' */
  numberType?: "number" | "integer" | "float";
  /** 小数位数（当numberType设置为float时才生效） */
  digits?: number;
  /** 最小值，仅 number 类型有效 */
  min?: number;
  /** 最大值，仅 number 类型有效 */
  max?: number;

  // ===== 级联选择相关 =====
  /** 级联选择器配置 */
  cascaderProps?: {
    /** 选项文本字段名，默认 'label' */
    labelField?: string;
    /** 选项值字段名，默认 'value' */
    valueField?: string;
    /** 子节点字段名，默认 'children' */
    childrenField?: string;
    /** 是否多选，默认 false */
    multiple?: boolean;
    /** 是否只返回叶子节点值 */
    emitPath?: boolean;
    /** 自定义过滤方法 */
    filterMethod?: (params: { node: any; filterValue: string }) => boolean;
  };

  // ===== 子列（多级表头） =====
  children?: VxeTableColumn[];

  // ===== 格式化与交互 =====
  /** 自定义格式化函数 */
  formatter?: (value: any, row: any) => string;
  /** 是否可点击（添加点击样式和事件） */
  clickable?: boolean;
  /** 点击回调函数 */
  onClick?: (row: any, column: VxeTableColumn) => void;
  /** 数据字典键名，从 dictData 中获取选项 */
  dict?: string;
  /** 是否显示在汇总行（简化开关，默认对数值列求和） */
  showSummary?: boolean;
  /** 合计配置（高级用法，可指定类型和自定义函数） */
  summary?: {
    /** 合计类型：sum | avg | count | custom */
    type: "sum" | "avg" | "count" | "custom";
    /** 自定义合计函数，当 type 为 custom 时使用 */
    customFunc?: (values: any[]) => any;
    /** 合计值的格式化器 */
    formatter?: (value: any) => string;
  };
}

/**
 * 组件 Props 接口
 */
interface Props {
  // ===== 数据 =====
  /** 表格数据（推荐使用 v-model=tableData 绑定） */
  modelValue?: any[];
  /** 列配置，定义了表格的结构和行为 */
  columns: VxeTableColumn[];
  /** 行数据的唯一标识字段，用于选中、编辑等场景，默认 'id' */
  rowKey?: string;
  /** 表头单元格配置 */
  headerCellConfig?: {
    height?: number;
  };
  /** 表格单元格配置 */
  cellConfig?: {
    height?: number;
  };
  /** 表尾单元格配置 */
  footerCellConfig?: {
    height?: number;
  };
  /**
   * 全局校验规则（兜底）
   * 适用于"所有表格都需要"的通用规则，避免在每个列的 editRules 里重复写。
   * 列级 `editRules` 优先级更高，同名字段会被列级覆盖。
   *
   * key 为字段名，value 为该字段的规则数组。
   * @example
   * :edit-rules="{
   *   remark: [{ max: 200, message: '备注不能超过 200 字' }],
   *   amount: [{ type: 'number', min: 0, message: '金额不能为负数' }],
   * }"
   */
  editRules?: Record<string, VxeValidatorRule[]>;

  // ===== 状态 =====
  /** 加载状态（显示加载动画） */
  loading?: boolean;
  /** 是否只读（禁用所有编辑功能） */
  readonly?: boolean;

  // ===== 分页 =====
  /** 是否显示分页 */
  pagination?: boolean;
  /** 每页条数 */
  pageSize?: number;
  /** 当前页码 */
  currentPage?: number;
  /** 数据总条数 */
  total?: number;
  /** 每页条数选项列表 */
  pageSizes?: number[];

  // ===== 表格样式与行为 =====
  /** 表格高度，支持数字（px）或字符串 */
  height?: string | number;
  /** 表格最大高度 */
  maxHeight?: string | number;
  /** 是否显示边框 */
  border?: boolean;
  /** 是否显示斑马纹 */
  stripe?: boolean;
  /** 是否可调整列宽 */
  resizable?: boolean;
  /** 是否显示工具栏 */
  showToolbar?: boolean;

  // ===== 编辑行为 =====
  /** 编辑触发方式：click（单击）| dblclick（双击）| manual（手动） */
  editTrigger?: "click" | "dblclick" | "manual";
  /** 编辑模式：row（行编辑）| cell（单元格编辑） */
  editMode?: "row" | "cell";

  // ===== 树形配置 =====
  /** 树形数据配置 */
  treeConfig?: {
    /** 子节点的字段名，默认 'children' */
    childrenField?: string;
    /** 是否有子节点的字段名，默认 'hasChildren' */
    hasChildrenField?: string;
    /** 是否默认展开所有节点 */
    expandAll?: boolean;
    /** 是否手风琴模式（同时只能展开一个节点） */
    accordion?: boolean;
    /** 是否将扁平数据转为树形（大数据量 + 虚拟滚动时必须为 true） */
    transform?: boolean;
    /** 扁平数据下的父节点字段名，默认 'parentId'（transform=true 时生效） */
    parentField?: string;
    /** 扁平数据下的节点 id 字段名，默认 'id'（transform=true 时生效） */
    rowField?: string;
  };

  // ===== 合计行 =====
  /** 是否显示合计行 */
  showFooter?: boolean;
  /**
   * 自定义合计方法
   * @param data 当前表格数据（数组）
   * @returns 二维数组，每个子数组代表一行合计行
   */
  footerMethod?: (params: { data: any[] }) => any[][];
  /** 合计行数据（直接传入，与 footerMethod 二选一，优先级更高） */
  footerData?: any[][];
  /** 合计行样式（固定/浮动等） */
  footerRowConfig?: { className?: string; style?: any };

  // ===== 数据字典 =====
  /** 数据字典对象，用于将值映射为显示文本 */
  dictData?: Record<string, Array<{ label: string; value: any }>>;

  // ===== 虚拟滚动 =====
  /** 是否启用虚拟滚动（大数据量性能优化） */
  virtualScroll?: boolean;
  /** 虚拟滚动阈值，超过该数量启用虚拟滚动，默认 100 */
  virtualThreshold?: number;

  // ===== 合并单元格 =====
  /** 合并单元格方法，透传给 vxe-grid 的 span-method */
  spanMethod?: (params: {
    row: any;
    rowIndex: number;
    column: any;
    columnIndex: number;
  }) => { rowspan: number; colspan: number } | void;

  // ==== 展开行配置 =====
  /** 展开行配置 */
  expandConfig?: any;
}

/**
 * 组件 Emits 接口
 */
interface Emits {
  /** 更新表格数据（v-model:tableData） */
  (e: "update:modelValue", data: any[]): void;
  /** 更新当前页码 */
  (e: "update:currentPage", page: number): void;
  /** 更新每页条数 */
  (e: "update:pageSize", size: number): void;
  /** 分页变化事件，包含当前页码和每页条数 */
  (
    e: "pagination-change",
    params: { currentPage: number; pageSize: number },
  ): void;
  /** 选择变化事件，返回选中的行数据数组 */
  (e: "selection-change", selection: any[]): void;
  /** 数据变化事件，在单元格编辑完成且值发生变化时触发 */
  (
    e: "data-change",
    params: { row: any; field: string; newValue: any; oldValue: any },
  ): void;
  /** 刷新事件，点击刷新按钮时触发 */
  (e: "refresh"): void;
  /** 单元格点击事件 */
  (
    e: "cell-click",
    params: { row: any; column: VxeTableColumn; event: Event },
  ): void;
  /** 行点击事件 */
  (e: "row-click", params: { row: any; event: Event }): void;
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  rowKey: "id",
  headerCellConfig: () => ({
    height: 30,
  }),
  cellConfig: () => ({
    height: 30,
  }),
  footerCellConfig: () => ({
    height: 30,
  }),
  editRules: () => ({}),
  loading: false,
  pagination: false,
  pageSize: 20,
  currentPage: 1,
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  showToolbar: false,
  height: undefined,
  maxHeight: undefined,
  /**
   * 树形数据配置：
   * {
   *  childrenField: 子节点的字段名，默认 'children'
   *  hasChildrenField: 是否有子节点的字段名，默认 'hasChildren'
   *  expandAll: 是否默认展开所有节点
   *  accordion: 是否手风琴模式（同时只能展开一个节点）
   *  transform: 是否将扁平数据转为树形（大数据量 + 虚拟滚动时必须为 true）
   *  parentField: 扁平数据下的父节点字段名，默认 'parentId'（transform=true 时生效）
   *  rowField: 扁平数据下的节点 id 字段名，默认 'id'（transform=true 时生效）
   * }
   */
  treeConfig: undefined,
  resizable: true,
  dictData: () => ({}),
  editTrigger: "click",
  editMode: "cell",
  border: true,
  stripe: false,
  readonly: false,
  virtualScroll: false,
  virtualThreshold: 100,
  showFooter: false,
  footerMethod: undefined,
  footerData: () => [],
  footerRowConfig: () => ({}),
});

const emit = defineEmits<Emits>();

/** vxe-grid 实例引用 */
const gridRef = ref<VxeGridInstance>();
/** 表格容器引用（用于高度计算） */
const tableWrapperRef = ref<HTMLElement>();
/** 选中的行数据 */
const selectedRows = ref<any[]>([]);

/**
 * 实际数据源
 *
 * 优先使用 modelValue，如果未定义则使用 tableData。
 * 这样既支持 v-model 也支持传统的 prop 传递方式。
 */
const actualData = computed(() => {
  return props.modelValue;
});

/**
 * 内部数据副本
 *
 * 用于编辑时的双向绑定，避免直接修改外部数据。
 * 编辑完成后通过 edit-closed 事件将变更同步到外部。
 */
const internalData = ref<any[]>([]);

/**
 * 监听外部数据变化，同步到内部数据
 *
 * 注意：使用 deep: false 只监听数组本身的变化，
 * 不监听数组内部对象的属性变化，以提高性能。
 */
watch(
  () => actualData.value,
  (newData) => {
    // 引用相同 → 编辑回写场景，跳过
    if (newData === internalData.value) return;

    // 内容相同（浅比较）→ 也跳过，避免无意义重载
    if (
      Array.isArray(newData) &&
      newData.length === internalData.value.length &&
      newData.every((r, i) => r === internalData.value[i])
    ) {
      return;
    }

    // 把新数据直接赋给 internalData，而不是展开复制
    // 这样 internalData.value 和 props.modelValue 始终是同一引用
    internalData.value = Array.isArray(newData) ? newData : [];
  },
  { immediate: true, deep: false },
);

// ============================================================================
// vxe-table 配置（兼容 v4.x API）
// ============================================================================

/**
 * 行配置
 *
 * keyField: 行数据的唯一标识字段，用于 vxe-table 内部追踪行
 * isHover: 是否启用悬停效果
 * isCurrent: 是否启用当前行高亮
 */
const rowConfig = computed(() => ({
  keyField: props.rowKey,
  isHover: true,
  isCurrent: true,
}));

/**
 * 树形数据配置
 *
 * childrenField: 子节点数据的字段名
 * hasChildrenField: 是否有子节点的字段名
 * expandAll: 是否默认展开所有节点
 * accordion: 是否手风琴模式
 *
 * 重要：
 * 当启用虚拟滚动（virtual-y）时，vxe-table 要求数据必须是「扁平 + parentField」，
 * 并通过 tree-config.transform=true 让 vxe 自己构建树形关系。
 * 因此无论是否开启虚拟滚动，只要外部传入了 transform 相关配置，都走 transform 模式。
 */
const treeConfig = computed(() => {
  const cfg = props.treeConfig;
  // 未传入 treeConfig → 非树形数据，不传配置
  if (!cfg) return undefined;
  // 扁平结构转树 + 虚拟滚动
  if (props.virtualScroll && cfg.transform) {
    return {
      transform: cfg.transform, // 扁平数据转树形并开启虚拟滚动
      parentField: cfg.parentField || "parentId",
      rowField: cfg.rowField || "id",
      childrenField: cfg.childrenField || "children",
      hasChildrenField: cfg.hasChildrenField || "hasChildren",
      expandAll: cfg.expandAll || false,
      accordion: cfg.accordion || false,
    };
  }

  // 注意：嵌套树形数据
  // vxe 要求虚拟滚动时必须是 transform 模式，所以这里如果同时开启会报错
  // 需要给用户警告或者强制 transform
  if (props.virtualScroll) {
    console.warn(
      "[editable-table-vxe] 树形数据 + 虚拟滚动必须使用 transform=true，" +
        "当前 transform=false，已自动忽略 tree-config。建议改为扁平数据 + transform 模式。",
    );
    return undefined;
  }

  // 嵌套树形数据（无虚拟滚动）
  return {
    childrenField: cfg.childrenField || "children",
    hasChildrenField: cfg.hasChildrenField || "hasChildren",
    expandAll: cfg.expandAll || false,
    accordion: cfg.accordion || false,
  };
});

/**
 * 列配置
 *
 * resizable: 是否允许调整列宽
 */
const columnConfig = computed(() => ({
  resizable: props.resizable,
}));

/**
 * 聚合校验规则：全局 editRules + 列级 editRules
 *
 * - 列级优先级更高，会覆盖同名字段的全局规则
 * - 支持多级表头（递归 children）
 * - computed 缓存：props.editRules / props.columns 引用不变时不重算
 */
const computedEditRules: any = computed<Record<string, VxeValidatorRule[]>>(
  () => {
    // 先铺一层全局兜底规则（浅拷贝，避免污染 props）
    const merged: Record<string, VxeValidatorRule[]> = { ...props.editRules };

    // 递归遍历列配置，把列级 editRules 挂到对应字段上
    const walk = (cols: VxeTableColumn[]) => {
      for (const c of cols) {
        // 只处理"有字段名 + 有规则 + 规则为非空数组"的列
        if (c.field && Array.isArray(c.editRules) && c.editRules.length > 0) {
          merged[c.field] = c.editRules; // 列级覆盖全局
        }
        // 多级表头继续往下走
        if (c.children?.length) walk(c.children);
      }
    };
    walk(props.columns);

    return merged;
  },
);
/**
 * 编辑配置
 *
 * 当 readonly 为 true 时，禁用所有编辑功能
 * trigger: 编辑触发方式：manual（手动触发方式，只能用于 mode=row）,click（点击触发编辑）,dblclick（双击触发编辑）
 * enabled: 是否启用编辑功能
 * showIcon: 是否显示列头编辑图标
 * mode: 编辑模式：cell（单元格编辑模式）,row（行编辑模式）
 * showStatus: 显示编辑状态，只对 keepSource 开启有效
 * autoClear: 是否自动清除编辑状态
 * showAsterisk: 是否显示必填字段的红色星号
 */
const editConfig: any = computed(() => {
  if (props.readonly) {
    return { trigger: "manual", mode: props.editMode, showStatus: false };
  }
  return {
    trigger: props.editTrigger,
    enabled: true, // 是否启用编辑功能
    showIcon: true, // 是否显示列头编辑图标
    mode: props.editMode, // editConfig.mode: 编辑模式：cell（单元格编辑模式）,row（行编辑模式）
    showStatus: false, // 显示编辑状态，showStatus开启后, keepSource 开启才有效
    autoClear: true, // 是否自动清除编辑状态
    showAsterisk: true, // 是否显示必填字段的红色星号
    // 👇 动态校验是否可编辑：由列配置的 disabled 决定
    beforeEditMethod: ({ row, column }: any) => {
      // 1. 找到该列在原始 columns 里的配置（支持多级表头递归）
      const col = findColumnByField(props.columns, column.field);
      if (!col) return true;

      // 2. 列级开关：editable === false 直接不允许编辑
      if (col.editable === false) return false;

      // 3. 动态 disabled：函数就调用，布尔就直接用
      const disabled =
        typeof col.disabled === "function"
          ? col.disabled(row)
          : col.disabled === true;
      if (disabled) {
        // 解析提示文案
        let tip: string | null | undefined;
        if (typeof col.disabledTip === "function") {
          tip = col.disabledTip(row);
        } else {
          tip = col.disabledTip;
        }
        // 有提示才弹
        if (tip) {
          ElMessage.warning(tip);
        }
        return false;
      }

      // 4. 默认允许
      return true;
    },
  };
});

/**
 * Tooltip 配置
 */
const tooltipConfig: any = computed(() => ({
  theme: "dark",
  enterable: false,
  showAll: true,
}));

/**
 * 虚拟滚动配置
 *
 * 当数据量超过 virtualThreshold 时启用虚拟滚动
 * 只渲染可视区域的行，大幅提升大数据量下的性能
 */
const scrollYConfig = computed(() => {
  if (!props.virtualScroll) return undefined;
  return {
    enabled: true,
    gt: props.virtualThreshold || 100,
  };
});

/**
 * 表格高度
 * 优先使用外部传入的 height，否则使用 auto
 */
const computedHeight = computed(() => {
  if (props.height) return props.height;
  // return undefined;
  return "100%";
});

/**
 * 基础 Grid 配置
 *
 * 这些是 vxe-grid 的全局配置项
 */
const gridOptions = computed<VxeGridProps>(() => ({
  border: props.border,
  stripe: props.stripe,
  showOverflow: true,
  showHeaderOverflow: true,
  keepSource: false,
  // 合计行配置
  showFooter: props.showFooter,
  footerData:
    props.footerData && props.footerData.length > 0
      ? props.footerData
      : undefined,
  footerMethod:
    props.footerData && props.footerData.length > 0
      ? undefined
      : props.footerMethod || defaultFooterMethod,
  // 👇 合并默认合计行样式，外部可覆盖
  footerRowConfig: props.footerRowConfig,
  // 👇 把合并方法传给 vxe-grid
  spanMethod: props.spanMethod as any,
  // 展开行配置
  expandConfig: props.expandConfig,
}));

// ============================================================================
// 列配置转换（核心）
// ============================================================================

/**
 * 创建带提示图标的表头渲染函数
 *
 * 使用 h 函数创建自定义表头，包含标题文本和提示图标。
 *
 * @param title 表头标题
 * @param tipConfig 提示配置
 * @returns VNode 渲染函数
 */
const createHeaderWithTip = (title: string, tipConfig: HeaderTipConfig) => {
  // 使用 h 函数创建自定义表头
  return () => {
    // 获取图标组件（默认 QuestionFilled）
    const iconName = tipConfig.icon || "QuestionFilled";
    const Icon = resolveComponent(iconName);

    // 获取 Tooltip 组件
    const Tooltip = resolveComponent("el-tooltip");

    // 返回包含标题和图标的 VNode
    return h(
      "div",
      {
        class: "header-with-tip",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
        },
      },
      [
        // 表头标题文本
        h("span", { class: "header-label" }, title),
        // 提示图标（使用 el-tooltip 包裹）
        h(
          Tooltip,
          {
            content: tipConfig.content,
            placement: tipConfig.placement || "top",
            effect: "dark",
            popperStyle: {
              maxWidth: tipConfig.width || "300px",
              wordBreak: "break-word",
            },
          },
          {
            default: () =>
              h(
                "span",
                {
                  class: "header-tip-icon",
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "help",
                    color: "#909399",
                    fontSize: "14px",
                    marginLeft: "2px",
                  },
                },
                [
                  h(Icon, {
                    style: {
                      width: "14px",
                      height: "14px",
                    },
                  }),
                ],
              ),
          },
        ),
      ],
    );
  };
};

/**
 * 获取编辑渲染配置
 *
 * 根据列的 editType 返回对应的 vxe-table 编辑组件配置。
 * 这是实现可编辑功能的核心函数。
 *
 * @param col 列配置
 * @returns vxe-table 的 editRender 配置对象
 */
const getEditRender = (col: VxeTableColumn): any => {
  const commonProps = {
    size: "small", // 组件尺寸
    placeholder: col.placeholder || "", // 占位符文本
    // disabled: col.disabled, // 是否禁用
    disabled: false, // 这里在可编辑表格下默认编辑，具体单元格编辑主要通过 beforeEditMethod 方法动态校验
  };

  switch (col.editType) {
    case "select": {
      // elementplus-ui 组件
      return {
        name: "VxeSelect",
        options: getOptions(col),
        props: {
          ...commonProps,
          multiple: col.multiple || false,
          clearable: true,
          filterable: true,
        },
      };
    }
    case "number": {
      // 使用专门的数字输入组件，而非 VxeInput type="number"
      return {
        name: "VxeNumberInput",
        props: {
          ...commonProps,
          step: col.step ? col.step : 1, // 数字间隔
          type: col.numberType || "float", // 默认 float
          digits: col.digits ?? 2, // 控制小数位数,仅当 type='float' 时生效
          min: col.min, // 最小值
          max: col.max, // 最大值
          // 控制按钮配置项
          controlConfig: {
            enabled: false, // 不启用增减按钮
          },
        },
      };
    }
    case "date": {
      // elementplus-ui 组件
      return {
        name: "ElDatePicker",
        props: {
          ...commonProps,
          type: "date",
          format: "YYYY-MM-DD",
          valueFormat: "YYYY-MM-DD",
        },
      };
    }
    case "datetime": {
      // elementplus-ui 组件
      return {
        name: "ElDatePicker",
        props: {
          ...commonProps,
          type: "datetime",
          format: "YYYY-MM-DD HH:mm:ss",
          valueFormat: "YYYY-MM-DD HH:mm:ss",
        },
      };
    }
    case "year": {
      return {
        name: "VxeDatePicker",
        props: {
          ...commonProps,
          type: "year",
          format: "yyyy",
          valueFormat: "yyyy",
        },
      };
    }
    case "month": {
      return {
        name: "VxeDatePicker",
        props: {
          ...commonProps,
          type: "month",
          format: "yyyy-MM",
          valueFormat: "yyyy-MM",
        },
      };
    }
    // elementplus-ui 组件
    case "cascader": {
      const rawOptions = Array.isArray(col.options) ? col.options : [];
      const labelField = col.cascaderProps?.labelField || "label";
      const valueField = col.cascaderProps?.valueField || "value";
      const childrenField = col.cascaderProps?.childrenField || "children";
      return {
        name: "ElCascader",
        props: {
          ...commonProps,
          options: rawOptions,
          clearable: true,
          filterable: true,
          showAllLevels: false, // 是否显示完整路径
          collapseTags: true, // 多选时是否折叠tag
          props: {
            value: valueField,
            label: labelField,
            children: childrenField,
            multiple: col.cascaderProps?.multiple ?? false, // 是否多选
            checkStrictly: false, // 父子不互相关联
            emitPath: (col.cascaderProps as any)?.emitPath ?? false, // 不返回整个路径，只返回叶子节点值
          },
        },
        events: {
          change: (params: any) => {
            const { $table } = params;
            $table?.updateStatus?.(params);
          },
        },
      };
    }
    case "input":
    default: {
      return {
        name: "VxeInput",
        props: {
          ...commonProps,
          type: "text",
          clearable: true,
        },
      };
    }
  }
};

/**
 * 获取列选项数据
 *
 * 支持静态数组或动态函数，统一转换为 vxe-table 所需的格式
 */
const getOptions = (col: VxeTableColumn): any[] => {
  if (typeof col.options === "function") {
    return [];
  }
  if (Array.isArray(col.options)) {
    const labelField = col.optionLabelField || "label";
    const valueField = col.optionValueField || "value";
    return col.options.map((opt) => ({
      label: opt[labelField] || opt,
      value: opt[valueField] !== undefined ? opt[valueField] : opt,
    }));
  }
  return [];
};

// ============================================================================
// 级联选项 value → label 缓存（预构建 Map，O(1) 查找）
// 用 WeakMap 以 options 数组为 key 缓存，只要引用不变就一直复用
// ============================================================================
const cascaderLabelMapCache = new WeakMap<object, Map<any, string>>();
// 递归构建 Map
const buildCascaderLabelMap = (
  options: any[],
  valueField: string,
  labelField: string,
  childrenField: string,
  map = new Map<any, string>(),
): Map<any, string> => {
  for (const opt of options) {
    // 同一 value 只存一次（后面的不覆盖前面的，保持首次出现）
    if (!map.has(opt[valueField])) {
      map.set(opt[valueField], opt[labelField]);
    }
    const children = opt[childrenField];
    if (Array.isArray(children) && children.length) {
      buildCascaderLabelMap(
        children,
        valueField,
        labelField,
        childrenField,
        map,
      );
    }
  }
  return map;
};
// 获取 Map
const getCascaderLabelMap = (
  options: any[],
  valueField: string,
  labelField: string,
  childrenField: string,
): Map<any, string> => {
  const cached = cascaderLabelMapCache.get(options);
  if (cached) return cached;
  const map = buildCascaderLabelMap(
    options,
    valueField,
    labelField,
    childrenField,
  );
  cascaderLabelMapCache.set(options, map);
  return map;
};

/**
 * 转换列配置为 vxe-table 格式
 *
 * 递归处理多级表头，为可编辑列注入 editRender 配置，
 * 处理字典映射、格式化、点击事件等。
 *
 * @param col 自定义列配置
 * @returns vxe-table 列配置对象
 */
const convertColumn = (col: VxeTableColumn): any => {
  // ===== 特殊列类型 =====
  //   展开列
  if (col.type === "expand") {
    return {
      type: "expand",
      width: col.width || 34,
      align: col.align || "center",
      fixed: col.fixed,
      slots: col.slots || { content: "expandContent" },
    };
  }
  // 复选框列
  if (col.type === "checkbox") {
    return {
      type: "checkbox",
      width: col.width || 50,
      align: col.align || "center",
      fixed: col.fixed,
    };
  }
  // 单选框列
  if (col.type === "radio") {
    return {
      type: "radio",
      width: col.width || 50,
      align: col.align || "center",
      fixed: col.fixed,
    };
  }
  // 序号列
  if (col.type === "seq") {
    return {
      type: "seq",
      width: col.width || 60,
      align: col.align || "center",
      fixed: col.fixed,
      title: col.title || "序号",
    };
  }

  // ===== 基础列配置 =====
  const baseCol: any = {
    field: col.field,
    title: col.title,
    width: col.width,
    minWidth: col.minWidth,
    align: col.align || "center",
    sortable: col.sortable || false,
    fixed: col.fixed,
    showOverflow: col.showOverflow !== false,
    slots: col.slots || {},
    resizable: true,
    treeNode: col.treeNode || false,
  };

  // ===== 递归处理子列（多级表头） =====
  if (col.children && col.children.length > 0) {
    baseCol.children = col.children.map((c) => convertColumn(c));
    return baseCol;
  }

  // ===== 表头提示配置 =====
  // 如果配置了 headerTip，使用自定义表头渲染
  if (col.headerTip && col.title) {
    // 如果用户已经自定义了 slots.header，则不覆盖
    if (!baseCol.slots.header) {
      baseCol.slots.header = createHeaderWithTip(col.title, col.headerTip);
    }
  }

  // ===== 可编辑配置 =====
  // 只有 editable !== false 且未禁用时才启用编辑
  if (col.editable !== false && !props.readonly) {
    baseCol.editRender = getEditRender(col);
  }

  // ===== 数据字典映射 =====
  // 当配置了 dict 且 dictData 中存在对应字典时，自动进行值到文本的映射
  if (col.dict && props.dictData[col.dict]) {
    const dictOptions = props.dictData[col.dict] || [];
    const labelField = col.optionLabelField || "label";
    const valueField = col.optionValueField || "value";
    baseCol.formatter = (params: any) => {
      const item: any = dictOptions.find(
        (d: any) => d[valueField] === params.cellValue,
      );
      return item ? item[labelField] : params.cellValue;
    };
    // 如果可编辑，将字典选项同步到编辑组件
    if (baseCol.editRender) {
      baseCol.editRender.options = dictOptions.map((d: any) => ({
        label: d[labelField],
        value: d[valueField],
      }));
    }
  }

  //  ===== 👇 新增：cascader 值 → label 自动映射（预构建 Map）=====
  if (
    col.editType === "cascader" &&
    Array.isArray(col.options) && // 只处理静态数组，函数式 options 无法缓存
    !col.formatter // 用户自定义 formatter 优先，不覆盖
  ) {
    const valueField = col.cascaderProps?.valueField || "value";
    const labelField = col.cascaderProps?.labelField || "label";
    const childrenField = col.cascaderProps?.childrenField || "children";
    // 👇 默认 false（单值），只有显式传 true 才走数组分支
    const emitPath = (col.cascaderProps as any)?.emitPath === true;
    const isMultiple = col.cascaderProps?.multiple === true; // 多选时，值是数组，需要特殊处理

    const options = col.options as any[];

    baseCol.formatter = (params: any) => {
      const raw = params.cellValue;
      // 惰性获取 Map：第一次渲染时构建，之后全部命中缓存
      const labelMap = getCascaderLabelMap(
        options,
        valueField,
        labelField,
        childrenField,
      );
      // 多选：值是数组，逐个映射后拼接
      if (isMultiple) {
        if (!Array.isArray(raw) || raw.length === 0) return "";
        if (emitPath) {
          // raw 是二维数组，每条路径取最后一级
          return raw
            .map((path) => {
              if (!Array.isArray(path) || path.length === 0) return "";
              return labelMap.get(path[path.length - 1]) ?? "";
            })
            .filter(Boolean)
            .join("、");
        }
        // 一维数组：直接映射
        return raw.map((v: any) => labelMap.get(v) ?? v).join("、");
      }
      if (emitPath) {
        // 值是路径数组，只显示最后一级
        if (!Array.isArray(raw) || raw.length === 0) return "";
        return labelMap.get(raw[raw.length - 1]) ?? "";
      }
      // 值是单值
      if (raw === null || raw === undefined || raw === "") return "";
      return labelMap.get(raw) ?? "";
    };
  }

  // ===== 自定义格式化 =====
  if (col.formatter) {
    baseCol.formatter = (params: any) =>
      col.formatter!(params.cellValue, params.row);
  }

  // ===== 可点击单元格 =====
  // 添加点击样式
  if (col.clickable) {
    baseCol.className = "clickable-cell";
  }

  return baseCol;
};

/**
 * 计算列配置
 *
 * 将外部传入的 columns 转换为 vxe-table 可识别的列配置
 */
const computedColumns = computed(() => {
  const cols = props.columns.map((col) => convertColumn(col));
  return cols;
});

// ============================================================================
// 合计行相关功能
// ============================================================================

/**
 * 递归获取所有叶子列（用于合计计算）
 */
const getAllLeafColumns = (cols: VxeTableColumn[]): VxeTableColumn[] => {
  let leaves: VxeTableColumn[] = [];
  cols.forEach((col) => {
    if (col.children?.length) {
      leaves = leaves.concat(getAllLeafColumns(col.children));
    } else {
      leaves.push(col);
    }
  });
  return leaves;
};

/**
 * 默认合计方法（加强版）
 *
 * 支持两种配置方式：
 * 1. 简写：`showSummary: true` → 对数值列求和
 * 2. 高级：`summary: { type: 'sum' | 'avg' | 'count' | 'custom', customFunc?, formatter? }`
 *
 * 注意：合计行仅对叶子列（没有 children 的列）生效，多级表头会自动展平。
 */
const defaultFooterMethod = ({ data }: { data: any[] }) => {
  const leafColumns = getAllLeafColumns(props.columns);

  // 找到第一个可作为合计标签的列（排除 checkbox/seq/radio）
  const labelColumnIndex = leafColumns.findIndex(
    (col) => col.type && ["checkbox", "seq", "radio"].includes(col.type || ""),
  );

  // 按列顺序生成合计值
  const sumRow = leafColumns.map((col, index) => {
    // 如果是第一个标签列，显示“合计”
    if (index === labelColumnIndex) {
      return "合计";
    }

    // 检查是否有合计配置（优先使用 summary 对象，其次使用 showSummary 布尔）
    const hasSummary = !!(col.summary || col.showSummary);
    if (!hasSummary) return "";
    // 【修复】确保 field 存在，否则跳过该列合计
    if (!col.field) return "";

    // 提取数值
    const values = data
      .map((row) => Number(row[col.field ?? ""] ?? 0))
      .filter((v) => !isNaN(v));

    let result = 0;

    // 如果配置了 summary 对象，按类型计算
    if (col.summary) {
      switch (col.summary.type) {
        case "sum":
          result = values.reduce((a, b) => a + b, 0);
          break;
        case "avg":
          result = values.length
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
          break;
        case "count":
          result = values.length;
          break;
        case "custom":
          result = col.summary.customFunc?.(values) ?? 0;
          break;
        default:
          result = 0;
      }
      // 如果有自定义格式化器，使用它
      if (col.summary.formatter) {
        return col.summary.formatter(result);
      }
    } else if (col.showSummary) {
      // 简写模式：只求和
      result = values.reduce((a, b) => a + b, 0);
    }

    // 如果没有指定 formatter，则直接返回数值（vxe-table 会原样显示）
    return result;
  });

  return [sumRow]; // 返回二维数组，支持多行合计
};

// ============================================================================
// 事件处理
// ============================================================================

// 编辑快照直接挂在行对象上（Symbol 不可枚举，不影响 JSON/遍历）
const EDIT_SNAPSHOT_KEY = Symbol("__edit_snapshot__");
/**
 * 空值归一化：null / undefined → ''，避免同一"空"值因类型不同被判为变更
 */
const normalizeEmpty = (v: any) => (v === null || v === undefined ? "" : v);

/**
 * 单元格进入编辑状态：记录旧值
 */
const handleEditActived = ({ row, column }: any) => {
  if (!column?.field) return;
  const value = row[column.field];

  // 惰性创建快照对象（一行只创建一次）
  if (!(row as any)[EDIT_SNAPSHOT_KEY]) {
    // 用 Object.create(null) 避免原型链污染（防止字段名叫 constructor 等）
    (row as any)[EDIT_SNAPSHOT_KEY] = Object.create(null);
  }

  (row as any)[EDIT_SNAPSHOT_KEY][column.field] =
    value !== null && typeof value === "object"
      ? JSON.parse(JSON.stringify(value))
      : value;
};

/**
 * 编辑关闭事件处理，取出该字段旧值，清掉该字段的快照
 *
 * 当用户完成单元格编辑并确认（如点击其他地方或按 Enter）时触发。
 * 这是数据同步的关键：将内部数据的变化同步到外部。
 *
 * @param params 事件参数，包含行、列等
 */
const handleEditClosed = (params: any) => {
  const { row, rowIndex, column, columnIndex, $event } = params; // 获取单元格的值
  if (!column?.field) return;

  const field = column.field;
  const snapshot = (row as any)[EDIT_SNAPSHOT_KEY];
  const oldValue = snapshot ? snapshot[field] : undefined;

  // 清掉当前字段的快照；没有待处理字段时整块释放
  if (snapshot) {
    delete snapshot[field];
    if (Object.keys(snapshot).length === 0) {
      delete (row as any)[EDIT_SNAPSHOT_KEY];
    }
  }

  const newValue = row[field];
  // 如果新旧值相等，则不触发更新（避免不必要的更新）
  // 注意：这里需要深度比较（对象类型需要）
  // 深度比较（对象类型需要）
  const isEqual =
    normalizeEmpty(newValue) === normalizeEmpty(oldValue) ||
    (newValue !== null &&
      oldValue !== null &&
      typeof newValue === "object" &&
      typeof oldValue === "object" &&
      JSON.stringify(newValue) === JSON.stringify(oldValue));

  // 当值发生变化时才触发更新
  if (!isEqual) {
    // 更新数据
    emit("update:modelValue", internalData.value);

    // data-change 事件
    emit("data-change", { row, field, newValue, oldValue });

    // 合计行刷新
    if (props.showFooter) {
      nextTick(() => gridRef.value?.updateFooter?.());
    }
  }
};

/**
 * 复选框选择变化
 */
const handleCheckboxChange = (params: any) => {
  const selection = gridRef.value?.getCheckboxRecords?.() || [];
  selectedRows.value = selection;
  emit("selection-change", selectedRows.value);
};

/**
 * 全选变化
 */
const handleCheckboxAll = (params: any) => {
  const selection = gridRef.value?.getCheckboxRecords?.() || [];
  selectedRows.value = selection;
  emit("selection-change", selectedRows.value);
};

/**
 * 单选框选择变化
 */
const handleRadioChange = (_params: any) => {
  const record = gridRef.value?.getRadioRecord?.() || null;
  selectedRows.value = record ? [record] : [];
  emit("selection-change", selectedRows.value);
};

// 以 columns 数组引用为 key，缓存「字段名 → 列配置」的索引
const fieldIndexCache = new WeakMap<
  VxeTableColumn[],
  Map<string, VxeTableColumn>
>();
/**
 * 获取所有叶子节点列
 * （支持多级表头）
 */
const getFieldIndex = (
  columns: VxeTableColumn[],
): Map<string, VxeTableColumn> => {
  const cached = fieldIndexCache.get(columns);
  if (cached) return cached;
  const map = new Map<string, VxeTableColumn>();
  const walk = (cols: VxeTableColumn[]) => {
    for (const c of cols) {
      if (c.field) map.set(c.field, c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(columns);
  fieldIndexCache.set(columns, map);
  return map;
};
const findColumnByField = (
  columns: VxeTableColumn[],
  field: string,
): VxeTableColumn | undefined => {
  return getFieldIndex(columns).get(field);
};

/**
 * 单元格点击事件
 */
const handleCellClick = (params: any) => {
  // 根据点击列的 field 匹配原始列配置
  const field = params.column.field;
  if (field) {
    const col = findColumnByField(props.columns, field);
    if (col?.clickable && typeof col.onClick === "function") {
      col.onClick(params.row, col);
    }
  }
  // 触发单元格点击事件，供父组件监听
  emit("cell-click", {
    row: params.row,
    column: params.column,
    event: params.$event,
  });
  // 触发行点击事件
  emit("row-click", {
    row: params.row,
    event: params.$event,
  });
};

/**
 * element-plus 分页组件变化事件
 */
const handlePageSizeChange = (val: number): void => {
  emit("update:pageSize", val);
  emit("pagination-change", { pageSize: val, currentPage: props.currentPage });
};

const handleCurrentChange = (val: number): void => {
  emit("update:currentPage", val);
  emit("pagination-change", { pageSize: props.pageSize, currentPage: val });
};

/**
 * 刷新按钮点击
 */
const handleRefresh = () => {
  emit("refresh");
};

/**
 * 清空选中
 */
const clearSelection = () => {
  gridRef.value?.clearCheckboxRow();
  gridRef.value?.clearRadioRow?.();
  selectedRows.value = [];
};

// watch 内部数据变化时刷新合计（数据编辑后自动更新）
watch(
  () => internalData.value,
  () => {
    if (props.showFooter) {
      nextTick(() => {
        gridRef.value?.updateFooter?.();
      });
    }
  },
  { deep: false },
);
// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 初始化时更新合计
  if (props.showFooter) {
    nextTick(() => gridRef.value?.updateFooter?.());
  }
});

// ============================================================================
// 暴露方法（供父组件调用）
// ============================================================================

/**
 * 暴露给父组件的方法
 *
 * 这些方法可以通过 ref 调用，例如：
 *   const tableRef = ref()
 *   tableRef.value?.getData()
 */
defineExpose({
  /** 获取当前编辑后的数据 */
  getData: () => internalData.value,
  /**
   * 获取原始数据（编辑前）
   *
   * ⚠️ 依赖 vxe-grid 的 keepSource: true。
   *    本项目 keepSource 已关闭，因此返回值与 getData() 相同，
   *    如需真正的"编辑前数据"，请开启 keepSource 或自行备份。
   */
  getOriginalData: () => {
    return gridRef.value?.getTableData?.()?.fullData ?? internalData.value;
  },
  /** 刷新数据（从外部重新加载） */
  refresh: () => {
    if (actualData.value !== internalData.value) {
      internalData.value = Array.isArray(actualData.value)
        ? actualData.value
        : [];
    }
  },
  /** 更新合计行数据（手动触发重新计算） */
  updateFooter: () => gridRef.value?.updateFooter?.(),
  /** 获取 vxe-grid 实例，用于高级操作 */
  getGridRef: () => gridRef.value,
  /** 清空所有选中 */
  clearSelection,
  /** 获取当前选中的行数据 */
  getSelection: () => selectedRows.value,
  /** 展开所有树节点 */
  expandAll: () => gridRef.value?.setAllTreeExpand(true),
  /** 收起所有树节点 */
  collapseAll: () => gridRef.value?.setAllTreeExpand(false),
  /** 展开到指定层级 */
  // 在 defineExpose 中替换 expandToLevel
  expandToLevel: async (level: number) => {
    // 等待 DOM 更新
    await nextTick();
    const grid = gridRef.value;
    if (!grid) {
      console.warn("表格实例未就绪");
      return;
    }

    // 然后逐层展开到目标层级
    // for (let i = 0; i < level; i++) {
    //   grid.setTreeExpand(i, true);
    // }

    // 先全部收起，避免之前展开状态干扰
    grid.setAllTreeExpand(false);

    // 获取树形数据（直接使用 internalData，它是响应式数据）
    const data = internalData.value;
    if (!data || data.length === 0) return;
    // 递归展开节点
    const expandNode = (node: any, currentDepth: number) => {
      // currentDepth 从 0 开始（根节点深度为 0）
      if (currentDepth < level) {
        // 展开当前节点（v4 支持 setTreeExpand(row, expand)）
        grid.setTreeExpand(node, true);
        // 获取子节点
        const childrenField = props.treeConfig?.childrenField || "children";
        const children = node[childrenField];
        if (Array.isArray(children) && children.length) {
          children.forEach((child: any) => expandNode(child, currentDepth + 1));
        }
      }
    };

    // 从所有根节点开始展开
    data.forEach((root: any) => expandNode(root, 0));

    // 可选：强制刷新表格（部分版本需要）
    // grid.reloadData?.();
  },
  /**
   * 手动触发编辑
   * @param row 要编辑的行数据
   * @param field 要编辑的字段名（可选）
   */
  startEdit: (row: any, field?: string) => {
    gridRef.value?.setActiveRow(row);
    if (field) {
      gridRef.value?.setEditCell(row, field);
    }
  },
  /** 保存当前正在编辑的单元格（触发校验） */
  saveEdit: () => {
    (gridRef.value as any)?.validateEditCell();
  },
  /** 取消编辑 */
  cancelEdit: () => gridRef.value?.clearEdit(),
  /** 设置所有行的展开状态 */
  setAllRowExpand: (expand: boolean) => gridRef.value?.setAllRowExpand(expand),
  /** 设置指定行的展开状态 */
  setRowExpand: (row: any, expand: boolean) =>
    gridRef.value?.setRowExpand(row, expand),
});
</script>

<style lang="scss" scoped>
.base-vxe-table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: 12px 12px;
  box-sizing: border-box;
  overflow: hidden;
}

.action-bar {
  margin-bottom: 10px;
  flex-shrink: 0;
}

// 工具栏样式
.toolbar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;

  .left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .selected-count {
    font-size: 14px;
    color: #409eff;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.table-wrapper {
  flex: 1;
  min-height: 150px;
  overflow: hidden;

  :deep(.vxe-grid) {
    height: 100%;

    .vxe-table {
      .vxe-table--header-wrapper {
        background-color: #f8f8f9;

        .vxe-header--column {
          .vxe-cell {
            color: #515a6e;
            font-weight: 600;
            font-size: 14px;
            padding: 0 8px;
          }

          // 表头提示图标样式
          .header-with-tip {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 4px;

            .header-tip-icon {
              display: inline-flex !important;
              align-items: center;
              color: #909399;
              font-size: 14px;
              cursor: help;
              transition: color 0.2s;

              &:hover {
                color: #409eff;
              }
            }
          }
        }
      }
      // 可点击单元格样式
      .clickable-cell {
        cursor: pointer;
        color: #1890ff !important;

        &:hover {
          text-decoration: underline;
        }
      }
      // 调整body单元格样式
      .vxe-table--body {
        tr td {
          .vxe-cell {
            padding: 0 8px !important; // 去掉单元格默认的内边距
            .vxe-cell--wrapper {
              .el-input,
              .el-select .el-select__wrapper {
                height: 28px; // 设置可编辑表单的高度
              }
            }
          }
        }
      }
    }
  }
}

// 合计行统一样式（覆盖 vxe-table 默认）
.table-wrapper {
  :deep(.vxe-table--footer-wrapper) {
    .vxe-footer--row {
      background: #f5f7fa !important;
      .vxe-footer--column {
        .vxe-cell {
          padding: 0 8px !important;
          font-weight: 500;
          // color: #303841;
        }
      }
    }
  }
}

// ==================== element-plus分页样式 ====================
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  flex-shrink: 0;

  // 穿透修改 el-pagination 样式
  :deep(.el-pagination) {
    background: #fff;
    padding: 4px 4px;
    box-sizing: border-box;
    border-radius: 6px;
    // 可加轻微边框或阴影
    // border: 1px solid #e2e8f0;
    // box-shadow: 0 1px 3px rgba(0,0,0,0.04);

    // 上一页、下一页按钮
    .btn-prev,
    .btn-next {
      border-radius: 4px;
      border: 1px solid #dcdfe6;
      background: #fff;
      margin: 0 2px;
      transition: all 0.2s;
      &:hover:not(.is-disabled):not([disabled]) {
        color: #409eff;
        border-color: #409eff;
        background: #ecf5ff;
      }
      // 禁用状态统一样式（包含类或属性）
      &.is-disabled,
      &[disabled] {
        opacity: 0.9;
        cursor: not-allowed;
        // border-color: #e4e7ed; // 更淡的灰色边框
      }
    }

    // 页码列表容器
    .el-pager {
      display: flex;
      gap: 4px; // 按钮间距
      li {
        border-radius: 4px;
        border: 1px solid transparent;
        transition: all 0.2s;
        text-align: center;
        cursor: pointer;
        &:hover:not(.is-active):not(.more) {
          background: #f0f5ff;
          color: #409eff;
          border-color: #c6e2ff;
        }
        &.is-active {
          // background: linear-gradient(135deg, #05456e 0%, #4096cc 100%);
          color: #fff;
          // box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
          border-color: transparent;
          cursor: default;
        }
        // 省略号（more）样式
        &.more {
          border: none;
          background: transparent;
          cursor: pointer;
          color: #606266;
          &:hover {
            color: #409eff;
          }
        }
      }
    }
  }
}

// 滚动条美化
.table-wrapper ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-wrapper ::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.table-wrapper ::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.table-wrapper ::-webkit-scrollbar-track {
  background: transparent;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    height: auto;
    gap: 8px;
  }
}
</style>
