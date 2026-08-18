<!-- 增强版下拉选择器 -->
<template>
    <ElSelect ref="selectRef" v-bind="selectAttrs" :model-value="modelValue" :disabled="disabled || loading"
        :filterable="filterable" :remote="remote" :remote-method="remote ? handleRemoteSearch : undefined"
        @update:model-value="handleUpdate" @change="handleChange" @clear="handleClear" :style="wrapperStyle">
        <!-- 选项渲染 -->
        <ElOption v-for="item in displayOptions" :key="getValue(item)" :label="getLabel(item)" :value="getValue(item)"
            :disabled="getDisabled(item)" />

        <!-- 加载状态 -->
        <template v-if="loading" #loading>
            <ElLoading :text="loadingText" />
        </template>

        <!-- 空状态 -->
        <template #empty>
            <slot name="empty">
                <div class="empty-text">{{ emptyText }}</div>
            </slot>
        </template>

        <!-- 其他插槽透传 -->
        <template v-for="(_, name) in $slots" #[name]="slotData">
            <slot v-if="name !== 'default' && name !== 'empty'" :name="name" v-bind="slotData" />
        </template>
    </ElSelect>
</template>

<script setup lang="ts">
import { ref, computed, watch, useAttrs, onMounted, nextTick } from 'vue';
import { ElSelect, ElOption, ElLoading } from 'element-plus';

// ==================== 类型定义 ====================
interface Option {
    value: any;
    label: string;
    disabled?: boolean;
    children?: Option[];
    [key: string]: any;
}

interface DictItem {
    dictValue: string | number;
    dictLabel: string;
    [key: string]: any;
}

type DataSource = 'dict' | 'api' | 'static';

// ==================== Props ====================
const props = withDefaults(
    defineProps<{
        /** 当前选中的值 */
        modelValue?: any;
        /** 静态选项列表 */
        options?: Option[];
        /** 字典类型（配合字典接口使用） */
        dictType?: string;
        /** 自定义数据接口，返回 Option[] 或 {list: Option[]} */
        api?: () => Promise<any>;
        /** 数据源类型：dict-字典，api-接口，static-静态 */
        dataSource?: DataSource;
        /** 是否启用缓存（字典数据缓存） */
        cache?: boolean;
        /** 是否启用搜索 */
        filterable?: boolean;
        /** 是否启用远程搜索（需配合 filterable 使用） */
        remote?: boolean;
        /** 远程搜索占位文本 */
        remotePlaceholder?: string;
        /** 加载中文本 */
        loadingText?: string;
        /** 空状态文本 */
        emptyText?: string;
        /** 是否禁用 */
        disabled?: boolean;
        /** 值字段名 */
        valueKey?: string;
        /** 标签字段名 */
        labelKey?: string;
        /** 是否自动加载数据（默认 true） */
        autoLoad?: boolean;
        /** 是否去除首尾空格（搜索时） */
        trim?: boolean;
        /** 组件宽度 */
        width?: string | number;
    }>(),
    {
        modelValue: undefined,
        options: () => [],
        dictType: '',
        dataSource: 'static',
        cache: true,
        filterable: true,
        remote: false,
        remotePlaceholder: '请输入关键词搜索',
        loadingText: '加载中...',
        emptyText: '暂无数据',
        disabled: false,
        valueKey: 'value',
        labelKey: 'label',
        autoLoad: true,
        trim: true,
        width: "100%",
    }
);

// ==================== Emits ====================
const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
    (e: 'change', value: any): void;
    (e: 'clear'): void;
    (e: 'search', keyword: string): void;
    (e: 'load', data: Option[]): void;
}>();

// ==================== Refs ====================
const selectRef = ref<InstanceType<typeof ElSelect>>();
const innerOptions = ref<Option[]>([]);
const loading = ref(false);
const searchKeyword = ref('');

// ==================== Attrs ====================
const attrs = useAttrs();

// 过滤掉已处理的属性，避免重复绑定
const selectAttrs = computed(() => {
    const { modelValue, multiple, ...rest } = attrs as Record<string, any>;
    return rest;
});

// ==================== Computed ====================
// 最终显示的选项列表
const displayOptions = computed(() => {
    if (!props.filterable || !props.remote) {
        return innerOptions.value;
    }

    // 本地搜索过滤（非远程模式）
    if (props.filterable && !props.remote && searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        return innerOptions.value.filter(item => {
            const label = getLabel(item).toLowerCase();
            return label.includes(keyword);
        });
    }

    return innerOptions.value;
});

// 选项值提取函数
const getValue = (item: any) => {
    if (typeof item === 'object' && item !== null) {
        return item[props.valueKey];
    }
    return item;
};

// 选项标签提取函数
const getLabel = (item: any) => {
    if (typeof item === 'object' && item !== null) {
        return item[props.labelKey] || String(item[props.valueKey] || '');
    }
    return String(item);
};

// 选项禁用状态提取
const getDisabled = (item: any) => {
    if (typeof item === 'object' && item !== null) {
        return item.disabled || false;
    }
    return false;
};

// 宽度样式
const wrapperStyle = computed(() => ({
    width: typeof props.width === "number" ? `${props.width}px` : props.width,
}));

// ==================== 数据加载 ====================
// 字典数据缓存
const dictCache = new Map<string, Option[]>();

const loadData = async () => {
    if (loading.value) return;

    try {
        loading.value = true;
        let data: Option[] = [];

        // 根据数据源加载
        if (props.dataSource === 'dict' && props.dictType) {
            data = await loadDictData();
        } else if (props.dataSource === 'api' && props.api) {
            data = await loadApiData();
        } else if (props.dataSource === 'static') {
            data = props.options || [];
        }

        innerOptions.value = data;
        emit('load', data);
    } catch (error) {
        console.error('BaseSelect 加载数据失败:', error);
        innerOptions.value = [];
    } finally {
        loading.value = false;
    }
};

// 加载字典数据
const loadDictData = async (): Promise<Option[]> => {
    const cacheKey = props.dictType;

    // 检查缓存
    if (props.cache && dictCache.has(cacheKey)) {
        return dictCache.get(cacheKey)!;
    }

    // TODO: 替换为实际字典接口
    // const res = await getDictData(props.dictType);
    // const data = res.data.map((item: DictItem) => ({
    //   value: item.dictValue,
    //   label: item.dictLabel,
    // }));

    // 模拟字典数据
    const mockData: Option[] = [
        { value: 1, label: '选项一' },
        { value: 2, label: '选项二' },
        { value: 3, label: '选项三' },
    ];

    // 缓存数据
    if (props.cache) {
        dictCache.set(cacheKey, mockData);
    }

    return mockData;
};

// 加载API数据
const loadApiData = async (keyword?: string): Promise<Option[]> => {
    if (!props.api) return [];

    try {
        const res = await props.api();
        // 支持 {list: Option[]} 或 Option[] 两种返回格式
        const data = Array.isArray(res) ? res : (res.list || res.data || []);
        return data.map((item: any) => ({
            value: getValue(item),
            label: getLabel(item),
            disabled: getDisabled(item),
        }));
    } catch (error) {
        console.error('API 加载失败:', error);
        return [];
    }
};

// 远程搜索
const handleRemoteSearch = async (keyword: string) => {
    if (!props.remote || !props.api) return;

    searchKeyword.value = keyword;

    if (!keyword) {
        // 没有关键词时加载全部
        await loadData();
        return;
    }

    try {
        loading.value = true;
        const data = await loadApiData(keyword);
        innerOptions.value = data;
        emit('search', keyword);
    } catch (error) {
        console.error('远程搜索失败:', error);
    } finally {
        loading.value = false;
    }
};

// ==================== 事件处理 ====================
const handleUpdate = (value: any) => {
    // 处理多选场景
    if (Array.isArray(value) && props.trim) {
        // 去除数组中的空值
        value = value.filter(v => v !== null && v !== undefined && v !== '');
    }

    emit('update:modelValue', value);
};

const handleChange = (value: any) => {
    emit('change', value);
};

const handleClear = () => {
    emit('clear');
};

// ==================== 生命周期 ====================
onMounted(() => {
    if (props.autoLoad) {
        loadData();
    }
});

// 监听数据源变化重新加载
watch(
    () => [props.dictType, props.options, props.dataSource],
    () => {
        if (props.autoLoad) {
            loadData();
        }
    },
    { deep: true }
);

// ==================== 暴露方法 ====================
defineExpose({
    focus: () => selectRef.value?.focus(),
    blur: () => selectRef.value?.blur(),
    reload: loadData,
    clear: () => {
        innerOptions.value = [];
    },
    getOptions: () => innerOptions.value,
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