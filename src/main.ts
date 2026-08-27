import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";

// ===== 引入 vxe-table 和 vxe-pc-ui =====
import VxeTable from 'vxe-table'
import VxePcUI from 'vxe-pc-ui'
import 'vxe-table/lib/style.css'
import 'vxe-pc-ui/lib/style.css'

VxeTable.setup({
  table: {
    // 表头单元格高度(全局)
    headerCellConfig: { height: 38 },
    // 单元格高度(全局)
    cellConfig: { height: 38 }
  }
})

import App from "./App.vue";
// 引入路由
import router from "./router";
// 引入状态管理
import pinia from "./stores";

// 引入ElementPlus图标
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
// 导入 base-vxe-table 组件
import BaseVxeTable from "@/components/base/base-vxe-table.vue";

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
app.use(VxeTable)  // 注册 vxe-table
app.use(VxePcUI) // 注册 vxe-pc-ui

// 全局注册 BaseVxeTable
app.component("BaseVxeTable", BaseVxeTable);

app.mount("#app");
