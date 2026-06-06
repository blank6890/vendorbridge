import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": "http://localhost:5000",
      "/users": "http://localhost:5000",
      "/vendors": "http://localhost:5000",
      "/rfq": "http://localhost:5000",
      "/quotations": "http://localhost:5000",
      "/approvals": "http://localhost:5000",
      "/purchase-orders": "http://localhost:5000",
      "/po": "http://localhost:5000",
      "/invoices": "http://localhost:5000",
      "/activity": "http://localhost:5000",
      "/reports": "http://localhost:5000",
    },
  },
});
