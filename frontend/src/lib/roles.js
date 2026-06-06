/** Map backend role slugs to UI role labels. */
export const ROLE_FROM_API = {
  admin: "Admin",
  officer: "Procurement Officer",
  vendor: "Vendor",
  manager: "Manager",
};

/** Map UI role labels to backend role slugs. */
export const ROLE_TO_API = {
  Admin: "admin",
  "Procurement Officer": "officer",
  Vendor: "vendor",
  Manager: "manager",
};

export function normalizeUserFromApi(user) {
  if (!user) return null;
  return {
    ...user,
    role: ROLE_FROM_API[user.role] ?? user.role,
    status:
      user.status === "approved"
        ? "Active"
        : user.status === "pending"
          ? "Pending"
          : user.status,
  };
}
