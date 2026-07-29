import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        "vue",
        {
          "naive-ui": ["useDialog", "useMessage", "useNotification", "useLoadingBar"],
        },
      ],
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
  ],
  base: "./",
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames(assetInfo) {
          const ext = assetInfo.name.split(".").pop();
          if (ext === "css") return "css/[name]-[hash][extname]";
          if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(ext)) return "img/[name]-[hash][extname]";
          if (["woff", "woff2", "ttf", "eot"].includes(ext)) return "fonts/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },
        manualChunks(id) {
          if (id.includes("node_modules/vue-router")) return "vue-router";
          if (id.includes("node_modules/chart.js") || id.includes("node_modules/vue-chartjs")) return "chartjs";
          if (id.includes("node_modules/vue") || id.includes("node_modules/@vue")) return "vue";
        },
      },
    },
  },
});
