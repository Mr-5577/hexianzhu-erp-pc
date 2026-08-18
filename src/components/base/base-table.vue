<!-- 增强版表格 -->
<template>
    <div class="base-table">
        <!-- 表格工具栏 -->
        <div v-if="$slots.toolbar || showToolbar" class="table-toolbar">
            <slot name="toolbar" />
        </div>

        <!-- 表格 -->
        <ElTable ref="tableRef" v-bind="tableAttrs" :data="tableData" :loading="loading" :border="border"
            :stripe="stripe" :height="height" :max-height="maxHeight" :size="size" :row-key="rowKey"
            :default-sort="defaultSortValue" @sort-change="handleSortChange" @selection-change="handleSelectionChange"
            @current-change="handleCurrentChange" @row-click="handleRowClick" @row-dblclick="handleRowDblClick">
            <!-- 选择列 -->
            <ElTableColumn v-if="selection" type="selection" :width="selectionWidth"
                :reserve-selection="reserveSelection" :selectable="selectable" />

            <!-- 序号列 -->
            <ElTableColumn v-if="showIndex" type="index" :label="indexLabel" :width="indexWidth" :index="indexValue"
                :align="indexAlign" />

            <!-- 动态列 -->
            <ElTableColumn v-for="col in columns" :key="col.prop || col.label" v-bind="col">
                <template v-if="col.slotName" #default="scope">
                    <slot :name="col.slotName" :row="scope.row" :column="scope.column" :$index="scope.$index" />
                </template>
            </ElTableColumn>

            <!-- 操作列 -->
            <ElTableColumn v-if="$slots.actions || showActions" :label="actionsLabel" :width="actionsWidth"
                :fixed="actionsFixed" :align="actionsAlign">
                <template #default="scope">
                    <slot name="actions" :row="scope.row" :$index="scope.$index" />
                </template>
            </ElTableColumn>

            <!-- 其他插槽透传 -->
            <template v-for="(_, name) in $slots" #[name]="slotData">
                <slot v-if="
                    name !== 'toolbar' &&
                    name !== 'actions' &&
                    !isColumnSlot(name)
                " :name="name" v-bind="slotData" />
            </template>
        </ElTable>

        <!-- 分页 -->
        <div v-if="pagination" class="table-pagination">
            <ElPagination v-bind="paginationAttrs" :current-page="currentPage" :page-size="pageSize"
                :page-sizes="pageSizes" :total="total" :layout="paginationLayout" @size-change="handleSizeChange"
                @current-change="handleCurrentPageChange" @prev-click="handlePrevClick" @next-click="handleNextClick" />
        </div>

        <!-- 空状态 -->
        <slot name="empty">
            <div v-if="!loading && tableData.length === 0" class="table-empty">
                <ElEmpty :description="emptyText" />
            </div>
        </slot>
    </div>
</template>

<script setup lang="ts">
import {
    ref,
    computed,
    watch,
    useAttrs,
    nextTick,
    type ComponentPublicInstance,
} from 'vue';
import {
    ElTable,
    ElTableColumn,
    ElPagination,
    ElEmpty,
    type TableColumnCtx,
} from 'element-plus';

// ==================== 类型定义 ====================
type TableSortOrder = 'ascending' | 'descending' | null;

interface TableColumn {
    prop?: string;
    label?: string;
    width?: string | number;
    minWidth?: string | number;
    fixed?: boolean | 'left' | 'right';
    align?: 'left' | 'center' | 'right';
    sortable?: boolean | 'custom';
    slotName?: string;
    [key: string]: any;
}

// 与 ElTable 的 sort-change 事件类型一致
interface SortChangeData {
    column: TableColumnCtx<any>;
    prop: string | null;
    order: TableSortOrder;
}

// 与 ElTable 的 defaultSort 类型一致（prop 必须是 string，不能是 null）
interface SortConfig {
    prop: string;
    order: TableSortOrder;
}

// ==================== Props ====================
const props = withDefaults(
    defineProps<{
        /** 表格数据 */
        data?: any[];
        /** 列配置 */
        columns?: TableColumn[];
        /** 加载状态 */
        loading?: boolean;
        /** 是否显示边框 */
        border?: boolean;
        /** 是否显示斑马纹 */
        stripe?: boolean;
        /** 表格高度 */
        height?: string | number;
        /** 表格最大高度 */
        maxHeight?: string | number;
        /** 表格尺寸 */
        size?: 'large' | 'default' | 'small';
        /** 行唯一标识 */
        rowKey?: string | ((row: any) => string);
        /** 默认排序配置 */
        defaultSort?: SortConfig | null;
        /** 是否显示选择列 */
        selection?: boolean;
        /** 选择列宽度 */
        selectionWidth?: string | number;
        /** 是否保留选中状态（翻页时） */
        reserveSelection?: boolean;
        /** 可选择的行的判断函数 */
        selectable?: (row: any, index: number) => boolean;
        /** 是否显示序号 */
        showIndex?: boolean;
        /** 序号列标签 */
        indexLabel?: string;
        /** 序号列宽度 */
        indexWidth?: string | number;
        /** 序号方法 - 必须返回 number */
        indexMethod?: (index: number) => number;
        /** 序号列对齐方式 */
        indexAlign?: 'left' | 'center' | 'right';
        /** 是否显示操作列 */
        showActions?: boolean;
        /** 操作列标签 */
        actionsLabel?: string;
        /** 操作列宽度 */
        actionsWidth?: string | number;
        /** 操作列固定 */
        actionsFixed?: boolean | 'left' | 'right';
        /** 操作列对齐方式 */
        actionsAlign?: 'left' | 'center' | 'right';
        /** 是否显示分页 */
        pagination?: boolean;
        /** 当前页码 */
        currentPage?: number;
        /** 每页条数 */
        pageSize?: number;
        /** 每页条数选项 */
        pageSizes?: number[];
        /** 总条数 */
        total?: number;
        /** 分页布局 */
        paginationLayout?: string;
        /** 是否显示工具栏 */
        showToolbar?: boolean;
        /** 空状态文本 */
        emptyText?: string;
    }>(),
    {
        data: () => [],
        columns: () => [],
        loading: false,
        border: true,
        stripe: true,
        height: undefined,
        maxHeight: undefined,
        size: 'default',
        rowKey: 'id',
        defaultSort: null,
        selection: false,
        selectionWidth: 55,
        reserveSelection: true,
        selectable: undefined,
        showIndex: false,
        indexLabel: '#',
        indexWidth: 60,
        indexMethod: undefined,
        indexAlign: 'center',
        showActions: false,
        actionsLabel: '操作',
        actionsWidth: 200,
        actionsFixed: 'right',
        actionsAlign: 'center',
        pagination: false,
        currentPage: 1,
        pageSize: 20,
        pageSizes: () => [10, 20, 50, 100],
        total: 0,
        paginationLayout: 'total, sizes, prev, pager, next, jumper',
        showToolbar: false,
        emptyText: '暂无数据',
    }
);

// ==================== Emits ====================
const emit = defineEmits<{
    (e: 'update:currentPage', page: number): void;
    (e: 'update:pageSize', size: number): void;
    (e: 'update:data', data: any[]): void;
    (e: 'sort-change', params: SortChangeData): void;
    (e: 'selection-change', selection: any[]): void;
    (e: 'current-change', row: any, oldRow: any): void;
    (e: 'row-click', row: any, column: any, event: Event): void;
    (e: 'row-dblclick', row: any, column: any, event: Event): void;
    (e: 'page-change', page: number, size: number): void;
}>();

// ==================== Refs ====================
// 使用 ComponentPublicInstance 类型
const tableRef = ref<ComponentPublicInstance | null>(null);
const innerData = ref<any[]>(props.data);
const innerCurrentPage = ref(props.currentPage);
const innerPageSize = ref(props.pageSize);
const selectedRows = ref<any[]>([]);
const sortParams = ref<SortChangeData | null>(null);

// ==================== Attrs ====================
const attrs = useAttrs();

const tableAttrs = computed(() => {
    const { data, ...rest } = attrs as Record<string, any>;
    return rest;
});

// ==================== Computed ====================
const tableData = computed(() => innerData.value);

// defaultSort 值处理 - prop 必须是 string
const defaultSortValue = computed(() => {
    if (!props.defaultSort) return undefined;
    // 确保 prop 存在且是字符串
    if (!props.defaultSort.prop) return undefined;
    return {
        prop: props.defaultSort.prop,
        order: props.defaultSort.order ?? null,
    } as any
});

// index 值处理 - 必须返回 number
const indexValue = computed(() => {
    if (!props.indexMethod) return undefined;
    // 包装函数，确保返回 number
    return (index: number): number => {
        const result = props.indexMethod!(index);
        return typeof result === 'number' ? result : index + 1;
    };
});

const currentPage = computed({
    get: () => innerCurrentPage.value,
    set: (val) => {
        innerCurrentPage.value = val;
        emit('update:currentPage', val);
    },
});

const pageSize = computed({
    get: () => innerPageSize.value,
    set: (val) => {
        innerPageSize.value = val;
        emit('update:pageSize', val);
    },
});

const paginationAttrs = computed(() => {
    const { currentPage, pageSize, total, pageSizes, paginationLayout } = props;
    return {
        currentPage,
        pageSize,
        pageSizes,
        total,
        layout: paginationLayout,
    };
});

// ==================== 方法 ====================
const isColumnSlot = (name: string) => {
    return props.columns.some((col) => col.slotName === name);
};

const handleSortChange = (data: SortChangeData) => {
    sortParams.value = data;
    emit('sort-change', data);
};

const handleSelectionChange = (selection: any[]) => {
    selectedRows.value = selection;
    emit('selection-change', selection);
};

const handleCurrentChange = (row: any, oldRow: any) => {
    emit('current-change', row, oldRow);
};

const handleRowClick = (row: any, column: any, event: Event) => {
    emit('row-click', row, column, event);
};

const handleRowDblClick = (row: any, column: any, event: Event) => {
    emit('row-dblclick', row, column, event);
};

const handleSizeChange = (size: number) => {
    pageSize.value = size;
    emit('page-change', currentPage.value, size);
};

const handleCurrentPageChange = (page: number) => {
    currentPage.value = page;
    emit('page-change', page, pageSize.value);
};

const handlePrevClick = (page: number) => {
    // 可在此添加前置逻辑
};

const handleNextClick = (page: number) => {
    // 可在此添加前置逻辑
};

const refresh = async () => {
    await nextTick();
    emit('update:data', innerData.value);
};

// 使用类型断言调用表格方法
const getTableInstance = () => {
    return tableRef.value as any;
};

const clearSelection = () => {
    const instance = getTableInstance();
    instance?.clearSelection?.();
    selectedRows.value = [];
};

const toggleRowSelection = (row: any, selected?: boolean) => {
    const instance = getTableInstance();
    instance?.toggleRowSelection?.(row, selected);
};

const scrollToRow = (row: any) => {
    const instance = getTableInstance();
    instance?.scrollToRow?.(row);
};

// ==================== 监听 ====================
watch(
    () => props.data,
    (newData) => {
        innerData.value = newData || [];
    },
    { deep: true, immediate: true }
);

watch(
    () => props.currentPage,
    (newPage) => {
        if (newPage !== innerCurrentPage.value) {
            innerCurrentPage.value = newPage;
        }
    }
);

watch(
    () => props.pageSize,
    (newSize) => {
        if (newSize !== innerPageSize.value) {
            innerPageSize.value = newSize;
        }
    }
);

// ==================== 暴露方法 ====================
defineExpose({
    /** 获取表格实例 */
    getTable: getTableInstance,
    /** 刷新表格 */
    refresh,
    /** 清空选中 */
    clearSelection,
    /** 切换行选中 */
    toggleRowSelection,
    /** 滚动到指定行 */
    scrollToRow,
    /** 获取选中行 */
    getSelectedRows: () => selectedRows.value,
    /** 设置表格数据 */
    setData: (data: any[]) => {
        innerData.value = data;
    },
    /** 获取排序参数 */
    getSortParams: () => sortParams.value,
});
</script>

<style scoped lang="scss">
.base-table {
    width: 100%;
    background: #fff;
    border-radius: 4px;

    .table-toolbar {
        padding: 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
    }

    .table-pagination {
        padding: 16px 0 0;
        display: flex;
        justify-content: flex-end;
    }

    .table-empty {
        padding: 40px 0;
        text-align: center;
    }

    // 表格样式微调
    :deep(.el-table) {
        .el-table__header-wrapper {
            .el-table__header {
                th {
                    background-color: #f5f7fa;
                    font-weight: 600;
                }
            }
        }

        .el-table__body-wrapper {
            .el-table__body {
                tr {
                    transition: background-color 0.2s;

                    &:hover {
                        td {
                            background-color: #f5f7fa !important;
                        }
                    }
                }
            }
        }
    }
}
</style>