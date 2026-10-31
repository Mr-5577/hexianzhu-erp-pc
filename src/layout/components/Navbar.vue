<!-- 顶部导航：折叠按钮 + 面包屑 + 用户下拉 -->
<template>
  <div class="navbar">
    <!-- 左侧：折叠按钮 + 面包屑 -->
    <div class="navbar-left">
      <el-icon class="collapse-btn" @click="toggleCollapsed">
        <Fold v-if="!collapsed" />
        <Expand v-else />
      </el-icon>

      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="item in breadcrumbs"
          :key="item.path"
          :to="item.path"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 右侧：用户下拉 -->
    <div class="navbar-right">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="30" :icon="UserFilled" />
          <span class="user-name">{{ userName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Fold, Expand, ArrowDown, UserFilled, SwitchButton } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user-store";
import { usePermissionStore } from "@/stores/permission-store";

const collapsed = defineModel<boolean>("collapsed", { default: false });

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const permissionStore = usePermissionStore();

const userName = computed(() => userStore.userInfo?.name || "管理员");

/** 面包屑：从当前路由的 matched 链生成 */
const breadcrumbs = computed(() => {
  return route.matched
    .filter((r) => r.meta?.title && !r.meta?.hidden)
    .map((r) => ({
      path: r.path,
      title: r.meta.title as string,
    }));
});

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};

const handleCommand = async (command: string) => {
  if (command === "logout") {
    await ElMessageBox.confirm("确定退出登录吗？", "提示", {
      type: "warning",
    });
    userStore.clearUserInfo();
    permissionStore.reset();
    // 退出后重新走动态路由注册流程，回到登录页
    router.push("/login");
  }
};
</script>

<style lang="scss" scoped>
@use "@/styles/variables.scss" as *;

.navbar {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 18px;
  cursor: pointer;
  color: var(--el-text-color-regular);

  &:hover {
    color: var(--el-color-primary);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;

  .user-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}
</style>
