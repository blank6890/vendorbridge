import { useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PagePlaceholder from "@/components/PagePlaceholder";

// Import real pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Vendors from "@/pages/Vendors";
import RFQ from "@/pages/RFQ";
import Quotations from "@/pages/Quotations";
import Approvals from "@/pages/Approvals";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Invoices from "@/pages/Invoices";
import ActivityLogs from "@/pages/ActivityLogs";

function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setMobileOpen((open) => !open)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="vb-card max-w-md p-8 text-center">
        <h1 className="text-2xl font-medium text-foreground">Unauthorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/forgot-password"
            element={
              <PagePlaceholder
                title="Forgot Password"
                description="Implement in pages/ForgotPassword.jsx"
              />
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route
              path="dashboard"
              element={
                <ProtectedRoute roles={["Admin", "Procurement Officer", "Manager", "Vendor"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="admin/users"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <PagePlaceholder
                    title="User Management"
                    description="Implement in pages/AdminUsers.jsx"
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="vendors"
              element={
                <ProtectedRoute roles={["Admin", "Procurement Officer"]}>
                  <Vendors />
                </ProtectedRoute>
              }
            />

            <Route
              path="rfq"
              element={
                <ProtectedRoute roles={["Admin", "Procurement Officer", "Vendor"]}>
                  <RFQ />
                </ProtectedRoute>
              }
            />

            <Route
              path="quotations"
              element={
                <ProtectedRoute roles={["Admin", "Procurement Officer", "Manager", "Vendor"]}>
                  <Quotations />
                </ProtectedRoute>
              }
            />

            <Route
              path="approvals"
              element={
                <ProtectedRoute roles={["Manager"]}>
                  <Approvals />
                </ProtectedRoute>
              }
            />

            <Route
              path="purchase-orders"
              element={
                <ProtectedRoute roles={["Admin", "Procurement Officer", "Manager", "Vendor"]}>
                  <PurchaseOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="invoices"
              element={
                <ProtectedRoute roles={["Admin", "Procurement Officer", "Manager", "Vendor"]}>
                  <Invoices />
                </ProtectedRoute>
              }
            />

            <Route
              path="analytics"
              element={
                <ProtectedRoute roles={["Admin", "Procurement Officer", "Manager"]}>
                  <PagePlaceholder title="Reports & Analytics" description="Implement in pages/Analytics.jsx" />
                </ProtectedRoute>
              }
            />

            <Route
              path="activity"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <ActivityLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
