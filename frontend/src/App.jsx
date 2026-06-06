import { useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PagePlaceholder from "@/components/PagePlaceholder";

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
          <Route
            path="/login"
            element={
              <PagePlaceholder
                title="Login"
                description="Implement in pages/Login.jsx"
              />
            }
          />
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
                <ProtectedRoute roles={["Admin", "Officer", "Manager", "Vendor"]}>
                  <PagePlaceholder title="Dashboard" description="Implement in pages/Dashboard.jsx" />
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
                <ProtectedRoute roles={["Admin", "Officer"]}>
                  <PagePlaceholder title="Vendors" description="Implement in pages/Vendors.jsx" />
                </ProtectedRoute>
              }
            />

            <Route
              path="rfq"
              element={
                <ProtectedRoute roles={["Admin", "Officer", "Vendor"]}>
                  <PagePlaceholder title="RFQs" description="Implement in pages/RFQ.jsx" />
                </ProtectedRoute>
              }
            />

            <Route
              path="quotations"
              element={
                <ProtectedRoute roles={["Admin", "Officer", "Manager", "Vendor"]}>
                  <PagePlaceholder title="Quotations" description="Implement in pages/Quotations.jsx" />
                </ProtectedRoute>
              }
            />

            <Route
              path="approvals"
              element={
                <ProtectedRoute roles={["Manager"]}>
                  <PagePlaceholder title="Approvals" description="Implement in pages/Approvals.jsx" />
                </ProtectedRoute>
              }
            />

            <Route
              path="purchase-orders"
              element={
                <ProtectedRoute roles={["Admin", "Officer", "Manager", "Vendor"]}>
                  <PagePlaceholder
                    title="Purchase Orders"
                    description="Implement in pages/PurchaseOrders.jsx"
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="invoices"
              element={
                <ProtectedRoute roles={["Admin", "Officer", "Manager", "Vendor"]}>
                  <PagePlaceholder title="Invoices" description="Implement in pages/Invoices.jsx" />
                </ProtectedRoute>
              }
            />

            <Route
              path="analytics"
              element={
                <ProtectedRoute roles={["Admin", "Officer", "Manager"]}>
                  <PagePlaceholder title="Reports & Analytics" description="Implement in pages/Analytics.jsx" />
                </ProtectedRoute>
              }
            />

            <Route
              path="activity"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <PagePlaceholder title="Activity Logs" description="Implement in pages/ActivityLogs.jsx" />
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
