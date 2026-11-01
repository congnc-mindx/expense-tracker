import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/expense-tracker/",
  server: {
    open: true, // Tự động mở trình duyệt mặc định khi chạy lệnh dev
  },

  // Force Firebase App, Auth and Firestore to share one module instance.
  // A duplicate @firebase/app instance can cause:
  // "Component auth has not been registered yet".
  resolve: {
    dedupe: [
      "firebase",
      "@firebase/app",
      "@firebase/auth",
      "@firebase/firestore",
      "@firebase/component",
      "@firebase/util",
    ],
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth", "firebase/firestore"],
  },
});
