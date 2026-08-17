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
  console.log("当前env：", env);
  console.log("当前环境：", mode);
  // 生成时间戳
  const timestamp = Date.now();

  return {
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
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
          // target: env.VITE_API_BASE_URL_ACTUAL, // 开发环境
          // target: "http://sys.hexianzhu.com", // 正式环境
          target: "http://10.215.215.6:8090", // 测试环境
          // target: "http://192.168.20.200:8091",  // 本地环境
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
      minify: isProd ? "esbuild" : false,
      ...(isProd && {
        rollupOptions: {
          output: {
            entryFileNames: `assets/[name].${timestamp}.[hash:8].js`,
            chunkFileNames: `assets/[name].${timestamp}.[hash:8].js`,
            assetFileNames: `assets/[name].${timestamp}.[hash:8].[ext]`,
          },
        },
      }),
    },
  };
});
