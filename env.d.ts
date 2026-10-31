/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 环境变量类型声明
interface ImportMetaEnv {
  /** 系统标题（按环境区分） */
  readonly VITE_APP_TITLE: string;
  /** 接口前缀 */
  readonly VITE_API_BASE_URL: string;
  /** 接口实际地址（vite proxy target） */
  readonly VITE_API_BASE_URL_ACTUAL?: string;
  /** 附件前缀地址 */
  readonly VITE_ANNEX_BASE_URL?: string;
  /** 版本号 */
  readonly VITE_APP_VERSION?: string;
  /** 是否开启调试 */
  readonly VITE_ENABLE_DEBUG?: string;
  /** 是否启用 mock */
  readonly VITE_ENABLE_MOCK?: string;
  // 添加其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
