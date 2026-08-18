<!-- 增强版输入框 -->
<template>
    <ElInput ref="inputRef" v-bind="inputAttrs" :model-value="displayValue" :disabled="disabled" :readonly="readonly"
        :clearable="clearable" :maxlength="maxlength" :show-word-limit="showWordLimit" :type="type" :rows="rows"
        :autosize="autosize" @update:model-value="handleUpdate" @input="handleInput" @focus="handleFocus"
        @blur="handleBlur" @keyup.enter="handleEnter" @clear="handleClear" :style="wrapperStyle">
        <!-- 插槽透传 -->
        <template v-for="(_, name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData" />
        </template>
    </ElInput>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useAttrs } from 'vue';
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
        /** 输入后触发的回调延迟（毫秒），用于搜索场景 */
        searchDelay?: number;
        /** 是否大写 */
        uppercase?: boolean;
        /** 是否小写 */
        lowercase?: boolean;
        /** 是否只允许数字 */
        number?: boolean;
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
    }>(),
    {
        modelValue: '',
        trim: true,
        debounce: 0,
        searchDelay: 0,
        uppercase: false,
        lowercase: false,
        number: false,
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
    }
);

// ==================== Emits ====================
const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void;
    (e: 'input', value: string | number): void;
    (e: 'change', value: string | number): void;
    (e: 'focus', event: FocusEvent): void;
    (e: 'blur', event: FocusEvent): void;
    (e: 'enter', value: string | number): void;
    (e: 'clear'): void;
    (e: 'search', value: string): void; // 搜索专用事件
}>();

// ==================== Refs ====================
const inputRef = ref<InstanceType<typeof ElInput>>();
const innerValue = ref(props.modelValue);
let debounceTimer: any = null;
let searchTimer: any = null;

// ==================== Attrs ====================
const attrs = useAttrs();

const inputAttrs = computed(() => {
    const { modelValue, ...rest } = attrs as Record<string, any>;
    return rest;
});

// ==================== Computed ====================
const displayValue = computed({
    get: () => innerValue.value,
    set: (val) => {
        innerValue.value = val;
    },
});

// 宽度样式
const wrapperStyle = computed(() => ({
    width: typeof props.width === "number" ? `${props.width}px` : props.width,
}));

// ==================== 工具函数 ====================
const formatValue = (value: any): string | number => {
    if (value === null || value === undefined) {
        return '';
    }

    let formatted = String(value);

    // 大小写转换
    if (props.uppercase) {
        formatted = formatted.toUpperCase();
    } else if (props.lowercase) {
        formatted = formatted.toLowerCase();
    }

    // 只允许数字
    if (props.number) {
        formatted = formatted.replace(/[^\d.]/g, '');
        // 多个小数点只保留第一个
        const parts = formatted.split('.');
        if (parts.length > 2) {
            formatted = parts[0] + '.' + parts.slice(1).join('');
        }
    }

    // 去除首尾空格
    if (props.trim && typeof formatted === 'string') {
        formatted = formatted.trim();
    }

    // 数字类型转换
    if (props.number && formatted !== '') {
        const num = Number(formatted);
        return isNaN(num) ? '' : num;
    }

    return formatted;
};

// ==================== 事件处理 ====================
const handleUpdate = (value: any) => {
    let formatted = formatValue(value);

    // 防抖处理
    if (props.debounce > 0) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            emitUpdate(formatted);
        }, props.debounce);
    } else {
        emitUpdate(formatted);
    }

    // 同步内部值（不触发防抖）
    if (String(formatted) !== String(innerValue.value)) {
        innerValue.value = formatted;
    }
};

const emitUpdate = (value: any) => {
    emit('update:modelValue', value);
    emit('input', value);

    // 搜索延迟（用于搜索场景）
    if (props.searchDelay > 0) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            emit('search', String(value));
        }, props.searchDelay);
    } else if (props.searchDelay === 0) {
        // 立即触发搜索（但避免频繁触发）
        nextTick(() => {
            emit('search', String(value));
        });
    }
};

const handleInput = (value: any) => {
    // 实时输入事件，用于需要实时响应的场景
};

const handleFocus = (event: FocusEvent) => {
    emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
    // 失焦时重新格式化
    if (innerValue.value !== undefined && innerValue.value !== null) {
        const formatted = formatValue(innerValue.value);
        if (formatted !== innerValue.value) {
            innerValue.value = formatted;
            emit('update:modelValue', formatted);
        }
    }
    emit('blur', event);
    emit('change', innerValue.value);
};

const handleEnter = () => {
    emit('enter', innerValue.value);
    // 回车触发搜索
    emit('search', String(innerValue.value));
};

const handleClear = () => {
    innerValue.value = '';
    emit('update:modelValue', '');
    emit('clear');
};

// ==================== 监听 ====================
watch(
    () => props.modelValue,
    (newVal) => {
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

// ==================== 暴露方法 ====================
defineExpose({
    focus: () => inputRef.value?.focus(),
    blur: () => inputRef.value?.blur(),
    select: () => inputRef.value?.select(),
    clear: () => {
        innerValue.value = '';
        emit('update:modelValue', '');
    },
    getValue: () => innerValue.value,
});
</script>

<style scoped lang="scss">
// 无额外样式，完全继承 Element Plus
</style>