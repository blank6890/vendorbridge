import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Scale,
  ShoppingCart,
  Users,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Procurement Officer", "Manager", "Vendor"] },
  { label: "User Management", path: "/admin/users", icon: UsersRound, roles: ["Admin"] },
  { label: "Vendors", path: "/vendors", icon: Users, roles: ["Admin", "Procurement Officer"] },
  { label: "RFQs", path: "/rfq", icon: FileText, roles: ["Admin", "Procurement Officer", "Vendor"] },
  { label: "Quotations", path: "/quotations", icon: Scale, roles: ["Admin", "Procurement Officer", "Manager", "Vendor"] },
  { label: "Approvals", path: "/approvals", icon: Package, roles: ["Manager"] },
  { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart, roles: ["Admin", "Procurement Officer", "Manager", "Vendor"] },
  { label: "Invoices", path: "/invoices", icon: Receipt, roles: ["Admin", "Procurement Officer", "Manager", "Vendor"] },
  { label: "Reports", path: "/analytics", icon: BarChart3, roles: ["Admin", "Procurement Officer", "Manager"] },
  { label: "Activity Logs", path: "/activity", icon: Activity, roles: ["Admin"] },
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Sidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileOpenChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = collapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => user?.role && item.roles.includes(user.role)),
    [user?.role]
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-vb-sidebar text-sidebar-foreground">
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-3", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="size-8" />
            <span className="text-sm font-medium text-white">VendorBridge</span>
          </div>
        ) : (
          <img src="/logo.svg" alt="VendorBridge" className="size-8" />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden text-sidebar-foreground hover:bg-sidebar-accent lg:inline-flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              onClick={() => onMobileOpenChange?.(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive ? "bg-sidebar-accent text-white" : "text-slate-300 hover:bg-sidebar-accent/70 hover:text-white",
                  isCollapsed && "justify-center px-2"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[18px] shrink-0" />
                  {!isCollapsed ? <span className="flex-1">{item.label}</span> : null}
                  {!isCollapsed && isActive ? <ChevronRight className="size-4 text-vb-accent" /> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn("mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/60 p-2", isCollapsed && "justify-center")}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {getInitials(user?.name) || "U"}
          </div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs capitalize text-slate-400">{user?.role}</p>
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          className={cn("w-full justify-start text-slate-300 hover:bg-sidebar-accent hover:text-white", isCollapsed && "justify-center px-0")}
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          {!isCollapsed ? <span>Logout</span> : null}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => onMobileOpenChange?.(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-sidebar-border transition-all duration-200 lg:static lg:z-auto",
          isCollapsed ? "w-16" : "w-[220px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
