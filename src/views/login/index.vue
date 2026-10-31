<!-- 登录页（模板占位：接入实际登录接口后替换 loginApi 即可） -->
<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <img src="/logo.png" alt="logo" class="login-logo" />
        <h2 class="login-title">{{ appTitle }}</h2>
      </div>

      <el-alert type="info" :closable="false" class="demo-tip">
        演示账号：admin（全部权限）/ viewer（仅首页），密码均为 123456
      </el-alert>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入账号">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user-store";
import { loginApi } from "@/api/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const appTitle = import.meta.env.VITE_APP_TITLE || "管理系统";

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const rules: FormRules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    // 演示环境走 mock 登录（见 src/api/user.ts），接入真实后端后自动切换
    const res = await loginApi(form);
    userStore.setToken(res.token);
    userStore.setUserInfo(res.userInfo);
    userStore.setPermissions(res.roles, res.permissions);

    ElMessage.success("登录成功");
    const redirect = (route.query.redirect as string) || "/";
    router.push(redirect);
  } catch (error: any) {
    ElMessage.error(error?.message || "登录失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2d3d 0%, #2b4b6f 100%);
}

.login-box {
  width: 380px;
  padding: 40px 36px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.demo-tip {
  margin-bottom: 16px;
}

.login-form {
  margin-top: 4px;
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;

  .login-logo {
    width: 36px;
    height: 36px;
  }

  .login-title {
    font-size: 20px;
    color: var(--el-text-color-primary);
  }
}

.login-btn {
  width: 100%;
  margin-top: 8px;
}
</style>
