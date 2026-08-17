import { createApp } from "vue";

import App from "./App.vue";
// 引入路由
import router from "./router";
// 引入状态管理
import pinia from "./stores";

const app = createApp(App);

app.use(router);
app.use(pinia);

app.mount("#app");
