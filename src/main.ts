import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";

// 引入 vxe-table 和 vxe-pc-ui
import VxeUIBase, { VxeUI } from "vxe-pc-ui";
import "vxe-pc-ui/lib/style.css";
import VxeUITable from "vxe-table";
import "vxe-table/lib/style.css";
import VxeUIPluginRenderElement from "@vxe-ui/plugin-render-element";
import "@vxe-ui/plugin-render-element/dist/style.css";
import {
  ElInput,
  ElInputNumber,
  ElSelect,
  ElCascader,
  ElDatePicker,
  ElTimeSelect,
} from "element-plus";

import App from "./App.vue";
// 引入路由
import router from "./router";
// 引入状态管理
import pinia from "./stores";
// 全局样式（reset、滚动条、工具类、NProgress 主题色等）
import "@/styles/index.scss";

// 引入 ElementPlus 图标
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
// 全局权限指令（v-permission）
import { vPermission } from "@/directives/permission";
// 全局错误处理
import { setupErrorHandler } from "@/utils/error-handler";

// vxe-table 单元格渲染器：接入 element-plus 表单组件
VxeUIPluginRenderElement.component(ElInput);
VxeUIPluginRenderElement.component(ElInputNumber);
VxeUIPluginRenderElement.component(ElSelect);
VxeUIPluginRenderElement.component(ElCascader);
VxeUIPluginRenderElement.component(ElDatePicker);
VxeUIPluginRenderElement.component(ElTimeSelect);
VxeUI.use(VxeUIPluginRenderElement);

const app = createApp(App);

// 全局注册所有图标（供菜单、组件内通过字符串名称使用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// ============================================================================
// 全局注册 src/components/base 下的所有基础组件
// 组件名规则：base-vxe-table.vue → BaseVxeTable（PascalCase）
// 模板中可直接使用 <base-vxe-table /> 或 <BaseVxeTable />
// ============================================================================
const baseComponents = import.meta.glob("@/components/base/*.vue", {
  eager: true,
});
const toPascalCase = (name: string) =>
  name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

for (const [path, module] of Object.entries(baseComponents)) {
  const fileName = path.split("/").pop()?.replace(".vue", "") || "";
  if (fileName) {
    app.component(toPascalCase(fileName), (module as any).default);
  }
}

// pinia 必须先于 router 安装：路由守卫中会调用 usePermissionStore()
app.use(pinia);
app.use(router);
app.use(ElementPlus, {
  locale: zhCn,
});

// 注册全局权限指令：v-permission="'user:create'" 或 v-permission="['a', 'b']"
app.directive("permission", vPermission);

// 全局错误处理（组件错误 / 未处理的 Promise 拒绝 / 路由错误）
setupErrorHandler(app);
app.use(VxeUIBase); // 注册 VxeUIBase
app.use(VxeUITable); // 注册 VxeUITable

app.mount("#app");
