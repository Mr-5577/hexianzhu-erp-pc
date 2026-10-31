import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },
  {
    name: "app/files-to-ignore",
    ignores: [
      "**/dist/**",
      "dist-*",
      "**/dist-ssr/**",
      "**/coverage/**",
      "**/node_modules/**",
      "src/auto-imports.d.ts",
      "src/components.d.ts",
    ],
  },

  // Vue 推荐规则（含模板语法检查）
  pluginVue.configs["flat/essential"],

  // TypeScript 推荐规则
  vueTsConfigs.recommended,

  {
    name: "app/custom-rules",
    rules: {
      // 未使用变量/参数由 TS（noUnusedLocals/Parameters）统一管控，避免双重报错
      "@typescript-eslint/no-unused-vars": "off",
      // 示例/业务代码中 any 使用频繁（表格行数据、第三方回调等），不做强制限制
      "@typescript-eslint/no-explicit-any": "off",
      // 允许组件名单词命名（如 dashboard、demo）
      "vue/multi-word-component-names": "off",
      // 模板中允许单一单词组件
      "vue/singleline-html-element-content-newline": "off",
      // 保持与 oxfmt 格式化风格兼容
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
    },
  },
);
