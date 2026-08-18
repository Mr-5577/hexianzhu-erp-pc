<!-- 增强版表单 -->
<template>
    <ElForm ref="formRef" v-bind="formAttrs" :model="formModel" :rules="formRules" :label-width="labelWidth"
        :label-position="labelPosition" :size="size" :disabled="disabled" :inline="inline"
        :validate-on-rule-change="validateOnRuleChange" :scroll-to-error="scrollToError" @validate="handleValidate">
        <!-- 表单项遍历 -->
        <ElFormItem v-for="item in visibleItems" :key="item.prop" :prop="item.prop" :label="item.label"
            :label-width="item.labelWidth || labelWidth" :label-position="item.labelPosition || labelPosition"
            :required="item.required" :rules="item.rules" :error="item.error"
            :show-message="item.showMessage !== undefined ? item.showMessage : true"
            :inline-message="item.inlineMessage !== undefined ? item.inlineMessage : inlineMessage"
            :size="item.size || size" class="base-form-item">
            <!-- 使用 v-model 绑定到 formModel 的具体属性 -->
            <component :is="getComponent(item)" v-model="formModel[item.prop]" v-bind="getComponentProps(item)"
                @change="handleFieldChange(item.prop, $event)" @input="handleFieldInput(item.prop, $event)" />

            <!-- 提示信息 -->
            <div v-if="item.tip" class="form-item-tip">
                <ElIcon v-if="item.tipIcon" :size="14">
                    <component :is="item.tipIcon" />
                </ElIcon>
                <span>{{ item.tip }}</span>
            </div>
        </ElFormItem>

        <!-- 自定义插槽 -->
        <template v-for="(_, name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData" />
        </template>

        <!-- 底部操作按钮 -->
        <div v-if="showActions" class="form-actions">
            <slot name="actions">
                <ElButton v-if="showSubmit" :type="submitType" :loading="submitLoading" :disabled="disabled"
                    @click="handleSubmit">
                    {{ submitText }}
                </ElButton>
                <ElButton v-if="showReset" :disabled="submitLoading" @click="handleReset">
                    {{ resetText }}
                </ElButton>
            </slot>
        </div>
    </ElForm>
</template>

<script setup lang="ts">
import {
    ref,
    computed,
    watch,
    useAttrs,
    onMounted,
    type ComponentPublicInstance,
} from 'vue';
import {
    ElForm,
    ElFormItem,
    ElButton,
    ElIcon,
    type FormRules,
    type FormInstance,
    type FormItemRule,
} from 'element-plus';

// ==================== 类型定义 ====================
type ComponentType =
    | 'input'
    | 'select'
    | 'cascader'
    | 'date-picker'
    | 'time-picker'
    | 'switch'
    | 'radio'
    | 'checkbox'
    | 'textarea'
    | 'input-number'
    | 'upload'
    | 'tree-select'
    | 'custom';

interface FormItem {
    /** 字段名 */
    prop: string;
    /** 标签 */
    label: string;
    /** 组件类型 */
    type?: ComponentType;
    /** 是否必填 */
    required?: boolean;
    /** 校验规则 */
    rules?: FormItemRule | FormItemRule[];
    /** 错误信息 */
    error?: string;
    /** 是否显示消息 */
    showMessage?: boolean;
    /** 是否行内消息 */
    inlineMessage?: boolean;
    /** 标签宽度 */
    labelWidth?: string | number;
    /** 标签位置 */
    labelPosition?: 'left' | 'right' | 'top';
    /** 组件大小 */
    size?: 'large' | 'default' | 'small';
    /** 提示信息 */
    tip?: string;
    /** 提示图标 */
    tipIcon?: any;
    /** 组件属性 */
    props?: Record<string, any>;
    /** 依赖字段（用于联动） */
    dependencies?: string[];
    /** 是否显示 */
    visible?: boolean | ((values: any) => boolean);
    /** 是否禁用 */
    disabled?: boolean | ((values: any) => boolean);
    /** 默认值 */
    defaultValue?: any;
    /** 选项列表 */
    options?: any[];
    /** 占位文本 */
    placeholder?: string;
    /** 自定义组件 */
    component?: any;
}

// ==================== Props ====================
const props = withDefaults(
    defineProps<{
        /** 表单数据 */
        modelValue?: Record<string, any>;
        /** 表单项配置 */
        items?: FormItem[];
        /** 校验规则 */
        rules?: FormRules;
        /** 标签宽度 */
        labelWidth?: string | number;
        /** 标签位置 */
        labelPosition?: 'left' | 'right' | 'top';
        /** 组件大小 */
        size?: 'large' | 'default' | 'small';
        /** 是否禁用 */
        disabled?: boolean;
        /** 是否行内表单 */
        inline?: boolean;
        /** 校验规则变化时是否重新校验 */
        validateOnRuleChange?: boolean;
        /** 校验失败是否滚动到错误字段 */
        scrollToError?: boolean;
        /** 是否显示操作按钮 */
        showActions?: boolean;
        /** 是否显示提交按钮 */
        showSubmit?: boolean;
        /** 是否显示重置按钮 */
        showReset?: boolean;
        /** 提交按钮文本 */
        submitText?: string;
        /** 重置按钮文本 */
        resetText?: string;
        /** 提交按钮类型 */
        submitType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
        /** 提交加载状态 */
        submitLoading?: boolean;
        /** 是否行内提示信息 */
        inlineMessage?: boolean;
        /** 数据变化时自动校验 */
        autoValidate?: boolean;
    }>(),
    {
        modelValue: () => ({}),
        items: () => [],
        rules: () => ({}),
        labelWidth: '100px',
        labelPosition: 'right',
        size: 'default',
        disabled: false,
        inline: false,
        validateOnRuleChange: true,
        scrollToError: true,
        showActions: false,
        showSubmit: true,
        showReset: true,
        submitText: '提交',
        resetText: '重置',
        submitType: 'primary',
        submitLoading: false,
        inlineMessage: false,
        autoValidate: true,
    }
);

// ==================== Emits ====================
const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, any>): void;
    (e: 'change', field: string, value: any, values: Record<string, any>): void;
    (e: 'input', field: string, value: any): void;
    (e: 'validate', field: string, valid: boolean, message?: string): void;
    (e: 'submit', values: Record<string, any>): void;
    (e: 'reset'): void;
    (e: 'field-change', field: string, value: any): void;
}>();

// ==================== Refs ====================
const formRef = ref<FormInstance>();
const innerFormData = ref<Record<string, any>>({});

// ==================== Attrs ====================
const attrs = useAttrs();

const formAttrs = computed(() => {
    const { modelValue, rules, ...rest } = attrs as Record<string, any>;
    return rest;
});

// ==================== Computed ====================
// 直接使用 formModel 作为 v-model 的目标
const formModel = computed({
    get: () => innerFormData.value,
    set: (val) => {
        innerFormData.value = val;
        emit('update:modelValue', val);
    },
});

const formRules = computed(() => {
    const rules: FormRules = { ...props.rules };

    props.items.forEach((item) => {
        if (item.rules) {
            rules[item.prop] = item.rules;
        } else if (item.required) {
            rules[item.prop] = [
                { required: true, message: `请输入${item.label}`, trigger: 'blur' },
            ];
        }
    });

    return rules;
});

// 可见的表单项
const visibleItems = computed(() => {
    return props.items.filter((item) => {
        if (typeof item.visible === 'function') {
            return item.visible(innerFormData.value);
        }
        return item.visible !== false;
    });
});

// ==================== 方法 ====================
// 获取字段值
const getFieldValue = (prop: string): any => {
    return innerFormData.value[prop];
};

// 设置字段值
const setFieldValue = (prop: string, value: any) => {
    innerFormData.value[prop] = value;
    emit('update:modelValue', innerFormData.value);
    emit('field-change', prop, value);

    // 触发依赖字段更新
    triggerDependencies(prop);
};

// 获取组件
const getComponent = (item: FormItem) => {
    if (item.component) return item.component;

    const componentMap: Record<ComponentType, string> = {
        input: 'ElInput',
        textarea: 'ElInput',
        select: 'BaseSelect',
        cascader: 'BaseCascader',
        'date-picker': 'ElDatePicker',
        'time-picker': 'ElTimePicker',
        switch: 'ElSwitch',
        radio: 'ElRadioGroup',
        checkbox: 'ElCheckboxGroup',
        'input-number': 'ElInputNumber',
        upload: 'ElUpload',
        'tree-select': 'ElTreeSelect',
        custom: 'div',
    };

    return componentMap[item.type || 'input'] || 'ElInput';
};

// 获取组件属性
const getComponentProps = (item: FormItem): Record<string, any> => {
    const baseProps: Record<string, any> = {
        placeholder:
            item.placeholder || `请${item.type === 'input' ? '输入' : '选择'}${item.label}`,
        clearable: true,
        disabled:
            typeof item.disabled === 'function'
                ? item.disabled(innerFormData.value)
                : item.disabled || props.disabled,
    };

    const typeProps: Record<ComponentType, Record<string, any>> = {
        input: {
            trim: true,
        },
        textarea: {
            type: 'textarea',
            rows: 4,
            maxlength: 500,
            showWordLimit: true,
        },
        select: {
            options: item.options || [],
            filterable: true,
        },
        cascader: {
            options: item.options || [],
            filterable: true,
        },
        'date-picker': {
            type: 'date',
            valueFormat: 'YYYY-MM-DD',
        },
        'time-picker': {
            format: 'HH:mm:ss',
        },
        switch: {
            activeValue: true,
            inactiveValue: false,
        },
        radio: {
            options: item.options || [],
        },
        checkbox: {
            options: item.options || [],
        },
        'input-number': {
            min: 0,
            max: 999999,
        },
        upload: {},
        'tree-select': {
            data: item.options || [],
        },
        custom: {},
    };

    return {
        ...baseProps,
        ...typeProps[item.type || 'input'],
        ...item.props,
    };
};

// 处理字段变化
const handleFieldChange = (prop: string, value: any) => {
    setFieldValue(prop, value);
    emit('change', prop, value, innerFormData.value);

    if (props.autoValidate) {
        validateField(prop);
    }
};

// 处理字段输入
const handleFieldInput = (prop: string, value: any) => {
    emit('input', prop, value);
};

// 触发依赖字段更新
const triggerDependencies = (prop: string) => {
    props.items.forEach((item) => {
        if (item.dependencies?.includes(prop)) {
            // 重新计算字段可见性等
        }
    });
};

// validate 事件处理
const handleValidate = (prop: any, isValid: boolean, message: string) => {
    emit('validate', prop, isValid, message);
};

// 校验表单
const validate = (callback?: (valid: boolean, fields?: any) => void) => {
    if (!formRef.value) return;

    formRef.value.validate((valid, fields) => {
        if (callback) {
            callback(valid, fields);
        }
    });
};

// ✅ 修复：校验指定字段
const validateField = (prop: string) => {
    if (!formRef.value) return;

    formRef.value.validateField(prop, (errorMessage: any) => {
        // 如果没有错误，说明校验通过
        const isValid = !errorMessage;
        const message = errorMessage ? String(errorMessage[prop]?.[0]?.message || '') : '';
        emit('validate', prop, isValid, message);
    });
};

// 重置表单
const resetFields = () => {
    if (!formRef.value) return;
    formRef.value.resetFields();
    emit('reset');
};

// 清除校验
const clearValidate = (fields?: string | string[]) => {
    if (!formRef.value) return;
    formRef.value.clearValidate(fields);
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();
        emit('submit', innerFormData.value);
    } catch (error) {
        console.error('表单提交失败:', error);
    }
};

// 重置
const handleReset = () => {
    resetFields();
    // 重置数据为初始值
    props.items.forEach((item) => {
        if (item.defaultValue !== undefined) {
            innerFormData.value[item.prop] = item.defaultValue;
        }
    });
    emit('update:modelValue', innerFormData.value);
};

// 滚动到指定字段
const scrollToField = (prop: string) => {
    if (!formRef.value) return;
    formRef.value.scrollToField(prop);
};

// ==================== 初始化 ====================
const initFormData = () => {
    const data: Record<string, any> = {};
    props.items.forEach((item) => {
        if (item.defaultValue !== undefined) {
            data[item.prop] = item.defaultValue;
        } else if (props.modelValue[item.prop] !== undefined) {
            data[item.prop] = props.modelValue[item.prop];
        } else {
            data[item.prop] = undefined;
        }
    });
    innerFormData.value = data;
    emit('update:modelValue', data);
};

// ==================== 监听 ====================
watch(
    () => props.modelValue,
    (newVal) => {
        if (JSON.stringify(newVal) !== JSON.stringify(innerFormData.value)) {
            innerFormData.value = { ...newVal };
        }
    },
    { deep: true }
);

watch(
    () => props.items,
    () => {
        initFormData();
    },
    { deep: true }
);

// ==================== 生命周期 ====================
onMounted(() => {
    initFormData();
});

// ==================== 暴露方法 ====================
defineExpose({
    /** 获取表单实例 */
    getForm: () => formRef.value,
    /** 校验表单 */
    validate,
    /** 校验指定字段 */
    validateField,
    /** 重置表单 */
    resetFields,
    /** 清除校验 */
    clearValidate,
    /** 提交表单 */
    submit: handleSubmit,
    /** 设置字段值 */
    setFieldValue,
    /** 获取字段值 */
    getFieldValue,
    /** 滚动到指定字段 */
    scrollToField,
    /** 获取表单数据 */
    getFormData: () => innerFormData.value,
    /** 设置表单数据 */
    setFormData: (data: Record<string, any>) => {
        innerFormData.value = data;
        emit('update:modelValue', data);
    },
});
</script>

<style scoped lang="scss">
.base-form-item {
    .form-item-tip {
        margin-top: 4px;
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
            flex-shrink: 0;
        }
    }
}

.form-actions {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: center;
    gap: 12px;
}

:deep(.el-form--inline) {
    .el-form-item {
        margin-right: 16px;
    }
}
</style>