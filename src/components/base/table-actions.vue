<!-- 列表按钮操作列通用组件 -->
<template>
  <div class="table-actions">
    <!-- 直接显示的按钮 -->
    <el-button
      v-for="item in visibleActions"
      :key="item.key"
      class="action-btn"
      :type="item.type || 'primary'"
      link
      :disabled="resolveDisabled(item)"
      @click="handleClick(item)"
    >
      <el-icon v-if="item.icon" class="action-icon">
        <component :is="item.icon" />
      </el-icon>
      <span class="action-label">{{ item.label }}</span>
    </el-button>

    <!-- 溢出下拉 -->
    <el-dropdown
      v-if="hiddenActions.length > 0"
      class="action-dropdown"
      popper-class="table-actions-popper"
      trigger="click"
      :teleported="true"
      @command="handleCommand"
    >
      <el-button class="action-btn more-btn" type="primary" link>
        <span class="action-label">更多</span>
        <el-icon class="action-icon arrow-icon"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="(item, idx) in hiddenActions"
            :key="item.key"
            :command="item.key"
            :disabled="resolveDisabled(item)"
            :class="[`is-${item.type || 'primary'}`]"
          >
            <el-icon v-if="item.icon" class="action-icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.label }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";

/** 单个操作项配置 */
export interface TableActionItem {
  /** 唯一标识 */
  key: string;
  /** 按钮文本 */
  label: string;
  /** 按钮类型 */
  type?: "primary" | "success" | "warning" | "danger" | "info";
  /** 按钮图标 */
  icon?: any;
  /** 按钮是否禁用 */
  disabled?: boolean | ((row: any) => boolean);
  /** 按钮点击事件 */
  onClick?: (row: any) => void;
  /** 是否总是隐藏，更多下拉 */
  alwaysHidden?: boolean;
}

interface Props {
  /** 行数据 */
  row: any;
  /** 操作项列表 */
  actions: TableActionItem[];
  /** 最多显示按钮数量 */
  maxVisible?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 2,
});

const emit = defineEmits<{
  (e: "action", payload: { key: string; row: any }): void;
}>();

/** 解析按钮是否禁用 */
const resolveDisabled = (item: TableActionItem): boolean => {
  if (typeof item.disabled === "function") return item.disabled(props.row);
  return item.disabled === true;
};

/** 直接显示的按钮 */
const visibleActions = computed(() => {
  const list = props.actions.filter((a) => !a.alwaysHidden);
  const hiddenCount = list.length - props.maxVisible;
  if (hiddenCount <= 0) return list;
  return list.slice(0, props.maxVisible);
});

/** 更多下拉中的按钮 */
const hiddenActions = computed(() => {
  const list = props.actions.filter((a) => !a.alwaysHidden);
  const hiddenCount = list.length - props.maxVisible;
  const rest = hiddenCount <= 0 ? [] : list.slice(props.maxVisible);
  const always = props.actions.filter((a) => a.alwaysHidden);
  return [...rest, ...always];
});

/** 点击按钮 */
const handleClick = (item: TableActionItem) => {
  item.onClick?.(props.row);
  emit("action", { key: item.key, row: props.row });
};

/** 下拉菜单项点击 */
const handleCommand = (key: string) => {
  const item = props.actions.find((a) => a.key === key);
  item?.onClick?.(props.row);
  emit("action", { key, row: props.row });
};
</script>

<style lang="scss" scoped>
.table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0; // 间距由统一的分隔线控制，不再用 gap
  white-space: nowrap;
  width: 100%;
  height: 100%;

  // ===== 统一按钮样式 =====
  :deep(.action-btn) {
    // 干掉 el-button 默认的 margin-left，避免第一个按钮左侧多空
    margin-left: 0 !important;
    padding: 0 8px !important;
    height: 24px;
    font-size: 14px;
    // font-weight: 400;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    vertical-align: middle;
    transition: color 0.15s;

    // 按钮与按钮之间的竖线分隔
    & + .action-btn {
      position: relative;
      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 1px;
        height: 12px;
        background: #dcdfe6;
      }
    }

    // 图标和文字对齐
    .action-icon {
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }

    // hover 时加深，视觉反馈统一
    &:not(.is-disabled):hover {
      &.el-button--primary {
        color: #337ecc;
      }
      &.el-button--success {
        color: #529b2e;
      }
      &.el-button--warning {
        color: #b88230;
      }
      &.el-button--danger {
        color: #c45656;
      }
      &.el-button--info {
        color: #73767a;
      }
    }
  }

  // ===== "更多"下拉按钮 =====
  .action-dropdown {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;

    // 让下拉按钮继承分隔线（由 .action-btn + .action-btn 处理）
    .more-btn {
      .arrow-icon {
        font-size: 12px;
        margin-left: 2px;
        transition: transform 0.2s;
      }
    }
  }
}
</style>
<style lang="scss">
.table-actions-popper {
  // ===== 下拉菜单项配色 =====
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 0;
    font-size: 14px;
    font-weight: 500;

    .action-icon {
      font-size: 13px;
    }

    // 按 type 上色，和行内按钮保持语义一致
    // primary：主题蓝
    &.is-primary:not(.is-disabled) {
      color: #409eff;
      .action-icon {
        color: #409eff;
      }
      &:hover {
        background: #ecf5ff;
      }
    }

    // success：成功绿
    &.is-success:not(.is-disabled) {
      color: #67c23a;
      .action-icon {
        color: #67c23a;
      }
      &:hover {
        background: #f0f9eb;
      }
    }
    // warning：警告橙
    &.is-warning:not(.is-disabled) {
      color: #e6a23c;
      .action-icon {
        color: #e6a23c;
      }
      &:hover {
        background: #fdf6ec;
      }
    }

    // danger：危险红
    &.is-danger:not(.is-disabled) {
      color: #f56c6c;
      .action-icon {
        color: #f56c6c;
      }
      &:hover {
        background: #fef0f0;
      }
    }

    // info：信息灰
    &.is-info:not(.is-disabled) {
      color: #909399;
      .action-icon {
        color: #909399;
      }
      &:hover {
        background: #f4f4f5;
      }
    }
  }
}
</style>
