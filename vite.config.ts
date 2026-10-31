import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");
  // 根据 mode 判断环境
  const isProd = mode === "production";
  const isTest = mode === "test";
  const isDev = mode === "development";
  // console.log("当前env：", env);
  // console.log("当前环境：", mode);
  // 生成时间戳
  const timestamp = Date.now();

  return {
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        resolvers: [ElementPlusResolver()],
        dts: "src/auto-imports.d.ts",
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: "src/components.d.ts",
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 9000,
      open: true,
      hmr: true,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL_ACTUAL, // 从当前环境变量读取，避免写死
          changeOrigin: true, // 允许跨域
          ws: true,
          rewrite: (path) => path, // 保持路径不变
          // rewrite: (path) => path.replace(/^\/api/, ""), // 去掉/api
        },
      },
    },
    build: {
      outDir: `dist-${mode}`,
      sourcemap: isDev || isTest,
      // Vite 8（Rolldown 内核）默认使用 oxc 压缩器，无需再指定 esbuild
      minify: isProd,
      ...(isProd && {
        rollupOptions: {
          output: {
            entryFileNames: `assets/[name].${timestamp}.[hash:8].js`,
            chunkFileNames: `assets/[name].${timestamp}.[hash:8].js`,
            assetFileNames: `assets/[name].${timestamp}.[hash:8].[ext]`,
            // 大型依赖单独分包，提升缓存命中率与首屏加载速度
            // 注意：Vite 8（Rolldown）只支持函数形式的 manualChunks
            manualChunks(id: string) {
              if (!id.includes("node_modules")) return;
              if (id.includes("element-plus") || id.includes("@element-plus"))
                return "element";
              if (
                id.includes("vxe-pc-ui") ||
                id.includes("vxe-table") ||
                id.includes("@vxe-ui") ||
                id.includes("xe-utils")
              )
                return "vxe";
              if (
                id.includes("/vue/") ||
                id.includes("vue-router") ||
                id.includes("pinia") ||
                id.includes("@vue")
              )
                return "vue";
              return "vendor";
            },
          },
        },
      }),
    },
  };
});
