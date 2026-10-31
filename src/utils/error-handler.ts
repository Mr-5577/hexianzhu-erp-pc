import type { App } from "vue";
import router from "@/router";

/**
 * 全局错误处理
 *
 * 集中捕获以下三类运行时错误，避免线上静默失败：
 * 1. Vue 组件渲染/事件错误（app.config.errorHandler）
 * 2. 未处理的 Promise 拒绝（window unhandledrejection）
 * 3. 路由懒加载失败等路由错误（router.onError）
 *
 * 接入错误监控（Sentry 等）时，在 reportError 中上报即可。
 */
export const setupErrorHandler = (app: App) => {
  const reportError = (error: unknown, source: string) => {
    // TODO: 接入 Sentry / 自建监控时在此上报
    console.error(`[全局错误] (${source})`, error);
  };

  // 1. Vue 组件错误
  app.config.errorHandler = (error, _instance, info) => {
    reportError(error, `Vue: ${info}`);
  };

  // 2. 未处理的 Promise 拒绝
  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, "unhandledrejection");
    // 阻止默认控制台报错刷屏（错误已在此处统一记录）
    event.preventDefault();
  });

  // 3. 路由错误（常见于动态 import 加载失败 / 网络异常）
  router.onError((error) => {
    reportError(error, "router");
  });
};
