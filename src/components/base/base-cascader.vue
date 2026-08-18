<!-- 增强版级联选择器 -->
<template>
    <ElCascader ref="cascaderRef" v-bind="cascaderAttrs" :model-value="modelValue" :options="displayOptions"
        :disabled="disabled || loading" :props="cascaderProps" :placeholder="placeholder" :clearable="clearable"
        :filterable="filterable" :filter-method="filterMethod" :show-all-levels="showAllLevels"
        @update:model-value="handleUpdate" @change="handleChange" @clear="handleClear"
        @expand-change="handleExpandChange" @visible-change="handleVisibleChange" :style="wrapperStyle">
        <!-- 插槽透传 -->
        <template v-for="(_, name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData" />
        </template>
    </ElCascader>
</template>

<script setup lang="ts">
import { ref, computed, watch, useAttrs, onMounted } from 'vue';
import { ElCascader, type CascaderValue } from 'element-plus';

// ==================== 类型定义 ====================
interface CascaderOption {
    value: any;
    label: string;
    children?: CascaderOption[];
    disabled?: boolean;
    [key: string]: any;
}

type DataSource = 'dict' | 'api' | 'static';

// ==================== Props ====================
const props = withDefaults(
    defineProps<{
        /** 当前选中的值（数组或单个值） */
        modelValue?: any[] | any;
        /** 静态选项数据 */
        options?: CascaderOption[];
        /** 字典类型 */
        dictType?: string;
        /** 自定义API */
        api?: () => Promise<any>;
        /** 数据源类型 */
        dataSource?: DataSource;
        /** 是否启用缓存 */
        cache?: boolean;
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
        /** 是否自动加载 */
        autoLoad?: boolean;
        /** 值字段名 */
        valueKey?: string;
        /** 标签字段名 */
        labelKey?: string;
        /** 子级字段名 */
        childrenKey?: string;
        /** 是否懒加载（需要配合 lazyLoad 使用） */
        lazy?: boolean;
        /** 懒加载函数 */
        lazyLoad?: (node: any, resolve: (data: CascaderOption[]) => void) => void;
        /** 是否 emit 路径数组 */
        emitPath?: boolean;
        /** 分隔符 */
        separator?: string;
        /** 组件宽度 */
        width?: string | number;
    }>(),
    {
        modelValue: undefined,
        options: () => [],
        dictType: '',
        dataSource: 'static',
        cache: true,
        placeholder: '请选择',
        clearable: true,
        filterable: false,
        showAllLevels: true,
        disabled: false,
        autoLoad: true,
        valueKey: 'value',
        labelKey: 'label',
        childrenKey: 'children',
        lazy: false,
        emitPath: true,
        separator: '/',
        width: '100%',
    }
);

// ==================== Emits ====================
const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
    (e: 'change', value: any, selectedOptions: any[]): void;
    (e: 'clear'): void;
    (e: 'expand-change', value: any[]): void;
    (e: 'visible-change', visible: boolean): void;
    (e: 'load', data: CascaderOption[]): void;
}>();

// ==================== Refs ====================
const cascaderRef = ref<InstanceType<typeof ElCascader>>();
const innerOptions = ref<CascaderOption[]>([]);
const loading = ref(false);
const expandNodes = ref<any[]>([]);

// ==================== Attrs ====================
const attrs = useAttrs();

const cascaderAttrs = computed(() => {
    const { modelValue, ...rest } = attrs as Record<string, any>;
    return rest;
});

// 宽度样式
const wrapperStyle = computed(() => ({
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}));

// ==================== Computed ====================
// 显示选项
const displayOptions = computed(() => {
    return innerOptions.value;
});

// Cascader 配置
const cascaderProps = computed(() => {
    return {
        value: props.valueKey,
        label: props.labelKey,
        children: props.childrenKey,
        disabled: 'disabled',
        lazy: props.lazy,
        lazyLoad: props.lazy ? props.lazyLoad : undefined,
        emitPath: props.emitPath,
        separator: props.separator,
        checkStrictly: false,
    };
});

// ==================== 数据转换 ====================
// 转换树形数据（兼容不同数据格式）
const transformTreeData = (data: any[]): CascaderOption[] => {
    return data.map(item => {
        const option: CascaderOption = {
            value: item[props.valueKey],
            label: item[props.labelKey] || String(item[props.valueKey] || ''),
            disabled: item.disabled || false,
        };

        // 递归处理子级
        if (item[props.childrenKey] && Array.isArray(item[props.childrenKey])) {
            option.children = transformTreeData(item[props.childrenKey]);
        } else if (item.children && Array.isArray(item.children)) {
            option.children = transformTreeData(item.children);
        }

        return option;
    });
};

// ==================== 数据加载 ====================
// 缓存
const cacheMap = new Map<string, CascaderOption[]>();

const loadData = async () => {
    if (loading.value) return;

    try {
        loading.value = true;
        let data: CascaderOption[] = [];

        if (props.dataSource === 'dict' && props.dictType) {
            data = await loadDictData();
        } else if (props.dataSource === 'api' && props.api) {
            data = await loadApiData();
        } else if (props.dataSource === 'static') {
            data = transformTreeData(props.options || []);
        }

        innerOptions.value = data;
        emit('load', data);
    } catch (error) {
        console.error('BaseCascader 加载数据失败:', error);
        innerOptions.value = [];
    } finally {
        loading.value = false;
    }
};

// 加载字典数据
const loadDictData = async (): Promise<CascaderOption[]> => {
    const cacheKey = props.dictType;

    if (props.cache && cacheMap.has(cacheKey)) {
        return cacheMap.get(cacheKey)!;
    }

    // TODO: 替换为实际字典接口
    // const res = await getDictTree(props.dictType);
    // const data = transformTreeData(res.data);

    // 模拟字典树形数据
    const mockData: CascaderOption[] = [
        {
            value: 'tech',
            label: '技术部',
            children: [
                { value: 'frontend', label: '前端组' },
                { value: 'backend', label: '后端组' },
                { value: 'devops', label: '运维组' },
            ],
        },
        {
            value: 'product',
            label: '产品部',
            children: [
                { value: 'pm', label: '产品经理' },
                { value: 'designer', label: '设计师' },
            ],
        },
    ];

    if (props.cache) {
        cacheMap.set(cacheKey, mockData);
    }

    return mockData;
};

// 加载API数据
const loadApiData = async (): Promise<CascaderOption[]> => {
    if (!props.api) return [];

    try {
        const res = await props.api();
        const data = Array.isArray(res) ? res : (res.list || res.data || []);
        return transformTreeData(data);
    } catch (error) {
        console.error('API 加载失败:', error);
        return [];
    }
};

// ==================== 事件处理 ====================
const handleUpdate = (value: any) => {
    emit('update:modelValue', value);
};

// ✅ 修复：change 事件签名，Element Plus 的 change 只传 value，selectedOptions 通过其他方式获取
const handleChange = (value: CascaderValue | null | undefined) => {
    // 获取选中的节点
    const checkedNodes = cascaderRef.value?.getCheckedNodes(false) || [];
    const selectedOptions = checkedNodes.map((node: any) => node.data || node);

    emit('change', value, selectedOptions);
};

const handleClear = () => {
    emit('clear');
};

// ✅ 修复：expand-change 事件签名
const handleExpandChange = (value: CascaderValue) => {
    // 确保 value 是数组类型
    const valArray = Array.isArray(value) ? value : [value];
    expandNodes.value = valArray;
    emit('expand-change', valArray);
};

const handleVisibleChange = (visible: boolean) => {
    emit('visible-change', visible);
};

// 自定义搜索方法（支持中文搜索）
const filterMethod = (node: any, keyword: string) => {
    if (!keyword) return true;
    const label = node.label?.toLowerCase() || '';
    const keywordLower = keyword.toLowerCase();
    return label.includes(keywordLower);
};

// ==================== 监听 ====================
watch(
    () => [props.dictType, props.options, props.dataSource],
    () => {
        if (props.autoLoad) {
            loadData();
        }
    },
    { deep: true }
);

// ==================== 生命周期 ====================
onMounted(() => {
    if (props.autoLoad) {
        loadData();
    }
});

// ==================== 暴露方法 ====================
defineExpose({
    focus: () => cascaderRef.value?.focus(),
    blur: () => cascaderRef.value?.blur(),
    reload: loadData,
    clear: () => {
        innerOptions.value = [];
    },
    getOptions: () => innerOptions.value,
    // ✅ 修复：getCheckedNodes 需要传入 leafOnly 参数
    getCheckedNodes: (leafOnly?: boolean) => cascaderRef.value?.getCheckedNodes(leafOnly ?? false),
    // 额外暴露便捷方法
    getCheckedValues: (leafOnly?: boolean) => {
        const nodes = cascaderRef.value?.getCheckedNodes(leafOnly ?? false) || [];
        return nodes.map((node: any) => node.value);
    },
});
</script>

<style scoped lang="scss">
// 无额外样式，完全继承 Element Plus
</style>