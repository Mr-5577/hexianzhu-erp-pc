# hxaz-admin-template

基于 **Vue 3 + TypeScript + Vite + Element Plus + vxe-table** 的后台管理系统基础模板。
内置布局系统、路由守卫、请求封装、可编辑表格等开箱即用的能力，新项目可直接基于此模板开发。

## 技术栈

| 分类 | 技术选型 | 说明 |
| --- | --- | --- |
| 核心框架 | Vue 3 (Composition API) | `<script setup>` 语法 |
| 构建工具 | Vite | 多环境构建（dev / test / prod） |
| 语言 | TypeScript | 严格模式 |
| UI 组件库 | Element Plus | 全量引入，中文语言包 |
| 表格组件 | vxe-table + vxe-pc-ui | 高性能可编辑表格，已封装 `BaseVxeTable` |
| 状态管理 | Pinia + persistedstate | 持久化存储 |
| 路由 | Vue Router | 含登录守卫、NProgress、动态标题 |
| HTTP | Axios | 统一封装（拦截器 / Loading / 错误提示 / 下载导出） |
| 工具库 | @vueuse/core / dayjs / xe-utils | 组合式工具与日期处理 |
| 代码规范 | ESLint + oxfmt + lint-staged | pre-commit 自动检查 |

## 环境要求

- Node.js: ^22.18.0 或 >=24.12.0

## 快速开始

```sh
# 安装依赖（会自动配置 git pre-commit 钩子）
npm install

# 开发环境启动（端口 9000，自动打开浏览器）
npm run dev

# 构建（type-check + 打包，输出目录 dist-<mode>）
npm run build        # 生产模式
npm run build:test   # 测试模式
npm run build:prod   # 生产模式

# 类型检查 / 格式化 / 代码检查
npm run type-check
npm run format
npm run lint         # eslint 自动修复
npm run lint:check   # eslint 仅检查
```

## 演示账号

登录为 mock 实现（见 `src/api/user.ts`），演示按钮级与菜单级权限：

| 账号 | 密码 | 权限 |
| --- | --- | --- |
| admin | 123456 | 超级管理员（全部权限） |
| viewer | 123456 | 只读用户（仅首页） |

## 目录结构

```
src/
├── api/                # 接口定义（按业务模块划分，参考 example-api.ts）
├── axios/              # axios 封装（request.ts + 类型定义）
├── components/
│   └── base/           # 全局基础组件（main.ts 自动注册，无需手动 import）
│       ├── base-vxe-table.vue   # vxe-table 可编辑表格封装（核心）
│       ├── base-table.vue       # el-table 增强封装（分页/选择/排序）
│       ├── base-form.vue        # 配置化表单封装
│       ├── base-dialog.vue      # 对话框封装（支持全屏切换）
│       ├── base-select.vue      # 下拉选择封装
│       ├── base-cascader.vue    # 级联选择封装
│       ├── base-input.vue       # 输入框封装
│       └── table-actions.vue    # 表格操作列按钮组（超出自动收起为"更多"）
├── constants/          # 全局常量（TOKEN_KEY、白名单、分页默认值等）
├── hooks/              # 组合式函数（useTable：分页查询表格封装）
├── layout/             # 主布局（侧边栏菜单 + 顶部导航 + 主内容区）
├── router/             # 路由（静态路由表 + 全局守卫）
├── stores/             # Pinia（user-store 含持久化）
├── styles/             # 全局样式（index.scss 入口 + variables.scss 变量）
├── types/              # 全局类型声明（路由 meta 扩展等）
├── utils/              # 通用工具（Blob 下载、金额格式化、扁平转树形等）
└── views/
    ├── dashboard/      # 首页
    ├── demo/           # 基础组件示例（vxe-table 11 种典型用法）
    ├── error/          # 404
    └── login/          # 登录页
```

## 核心约定

### 1. 路由与菜单

- 菜单由 `src/layout` 根据路由自动生成，无需单独维护菜单数据。
- 在 `src/router/index.ts` 的路由 `meta` 上配置：
  - `title`：菜单名 / 面包屑 / 浏览器标题
  - `icon`：element-plus 图标组件名（已全局注册）
  - `hidden`：不在菜单显示
  - `order`：菜单排序
  - `requiresAuth: false`：免登录白名单

### 2. 环境变量

按环境维护三个文件：`.env.development` / `.env.test` / `.env.production`。
**注意：无引号的值不能加行内注释**（dotenv 会把注释当作值的一部分），注释请单独成行。

- `VITE_API_BASE_URL`：接口前缀（默认 `/api`，走 vite proxy）
- `VITE_API_BASE_URL_ACTUAL`：接口实际地址（vite proxy target，本地联调改这里）

### 3. 请求封装

`src/axios/request.ts` 已按「`{ code, data, message }` 且 `code === 0` 成功」的后端约定封装，
支持 Loading、错误提示、静默模式、成功提示、文件下载/导出；401 自动跳登录页。
如后端响应结构不同，只需修改响应拦截器中的判断逻辑。

### 4. 可编辑表格

`BaseVxeTable` 是模板的核心组件，支持：单元格/行编辑、多级表头、树形数据、虚拟滚动、
字典映射、分页、合计行、表头提示、列级校验、高度自适应等。完整用法见「组件示例」菜单
（`src/views/demo/table-example/` 下 11 个示例）。

### 5. 权限体系

- **菜单/路由级**：业务路由统一在 `src/router/routes.ts` 声明，带 `meta.code` 的路由
  在登录后按用户权限动态注册；无 code 的路由所有人可见
- **按钮级**：`v-permission` 指令，如 `<el-button v-permission="'user:create'">新增</el-button>`，
  无权限时元素直接移除（数组形式为「拥有任意一个即可」）
- **权限来源**：登录接口返回 `roles` + `permissions`（含 `*` 为超级管理员），
  由 user store 持久化并提供 `hasPermission` / `hasRole` 等判断方法
- **接入真实后端**：替换 `src/api/user.ts` 中的 mock 登录即可，权限过滤逻辑无需改动

### 6. CRUD 标准页样板

`src/views/demo/crud-demo/index.vue` 是可直接复制的标准业务页：
搜索区 + 分页表格 + 新增/编辑弹窗 + 删除确认，通过 `useTable` hook 管理查询/分页状态。

新项目复制后只需修改三处：

1. `src/api/crud-demo.ts`：替换为真实接口的 `request` 调用与类型定义
2. 页面中的 `searchItems` / `formItems` / `columns` 三处字段配置
3. 权限标识（`v-permission`、`meta.code`）

### 7. 按需扩展

- 需要图表：推荐 `echarts`（`npm i echarts`，按需引入即可，模板未预装以控制体积）
- 需要富文本：推荐 `wangeditor`（Vue3 兼容好）或 `tinymce`
- 需要 Excel 导入导出：推荐 `xlsx`（SheetJS 社区版）

## 浏览器支持

现代浏览器（Chrome / Edge / Firefox 最新版本），不支持 IE。
