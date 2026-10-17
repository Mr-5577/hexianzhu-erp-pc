import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css"
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

// 引入ElementPlus图标
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
// 导入 base-vxe-table 组件
import BaseVxeTable from "@/components/base/base-vxe-table.vue";

VxeUIPluginRenderElement.component(ElInput);
VxeUIPluginRenderElement.component(ElInputNumber);
VxeUIPluginRenderElement.component(ElSelect);
VxeUIPluginRenderElement.component(ElCascader);
VxeUIPluginRenderElement.component(ElDatePicker);
VxeUIPluginRenderElement.component(ElTimeSelect);
VxeUI.use(VxeUIPluginRenderElement);

const app = createApp(App);

// 全局注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router);
app.use(pinia);
app.use(ElementPlus, {
  locale: zhCn,
});
app.use(VxeUIBase); // 注册 VxeUIBase
app.use(VxeUITable); // 注册 VxeUITable

// 全局注册 BaseVxeTable
app.component("BaseVxeTable", BaseVxeTable);

app.mount("#app");
