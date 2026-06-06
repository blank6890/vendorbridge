const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function getToken() {
  try {
    const raw = localStorage.getItem("vendorbridge_auth");
    if (!raw) return null;
    return JSON.parse(raw).token ?? null;
  } catch {
    return null;
  }
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  if (!entries.length) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let message =
      (isJson && (data?.message || data?.error)) ||
      response.statusText ||
      "Request failed";

    if (response.status === 502 || response.status === 503) {
      message =
        "Backend server is not running. Start the Flask API on http://localhost:5000.";
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authAPI = {
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password, role) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    }),

  forgotPassword: (email) =>
    request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password) =>
    request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};

export const usersAPI = {
  getAll: (params) => request(`/api/admin/users${buildQuery(params)}`),

  getUsers: (params) => request(`/api/admin/users${buildQuery(params)}`),

  getById: (id) => request(`/api/admin/users/${id}`),

  editUser: (id, data) =>
    request(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  disableUser: (id) =>
    request(`/api/admin/users/${id}/disable`, {
      method: "PUT",
    }),

  approve: (id) =>
    request(`/api/admin/users/${id}/approve`, {
      method: "PUT",
    }),
};

export const vendorsAPI = {
  getAll: (params) => request(`/api/vendors${buildQuery(params)}`),

  getById: (id) => request(`/api/vendors/${id}`),

  create: (data) =>
    request("/api/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/api/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/api/vendors/${id}`, {
      method: "DELETE",
    }),

  setStatus: (id, status) =>
    request(`/api/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  rateVendor: (id, rating) =>
    request(`/api/vendors/${id}/rate`, {
      method: "PUT",
      body: JSON.stringify({ rating }),
    }),
};

export const rfqAPI = {
  getAll: (params) => request(`/api/rfq${buildQuery(params)}`),

  getById: (id) => request(`/api/rfq/${id}`),

  create: (data) =>
    request("/api/rfq", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/api/rfq/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/api/rfq/${id}`, {
      method: "DELETE",
    }),

  assignVendors: (id, vendorIds) =>
    request(`/api/rfq/${id}`, {
      method: "PUT",
      body: JSON.stringify({ assignedVendors: vendorIds }),
    }),

  close: (id) =>
    request(`/api/rfq/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "closed" }),
    }),
};

export const quotationsAPI = {
  getAll: (params) => request(`/api/quotations${buildQuery(params)}`),

  getById: (id) => request(`/api/quotations/${id}`),

  submit: (data) =>
    request("/api/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/api/quotations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/api/quotations/${id}`, {
      method: "DELETE",
    }),

  select: (id) =>
    request(`/api/approvals/approve/${id}`, {
      method: "POST",
    }),
};

export const approvalsAPI = {
  getAll: (params) => request(`/api/quotations${buildQuery({...params, status: "pending"})}`),

  getById: (id) => request(`/api/quotations/${id}`),

  approve: (id, remarks) =>
    request(`/api/approvals/approve/${id}`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),

  reject: (id, remarks) =>
    request(`/api/approvals/reject/${id}`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),
};

export const purchaseOrdersAPI = {
  getAll: (params) => request(`/api/purchase-orders${buildQuery(params)}`),

  getById: (id) => request(`/api/purchase-orders/${id}`),

  create: (data) =>
    request("/api/purchase-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/api/purchase-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  setStatus: (id, status) =>
    request(`/api/purchase-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

export const invoicesAPI = {
  getAll: (params) => request(`/api/invoices${buildQuery(params)}`),

  getById: (id) => request(`/api/invoices/${id}`),

  generate: (poId) =>
    request("/api/invoices", {
      method: "POST",
      body: JSON.stringify({ poId }),
    }),

  update: (id, data) =>
    request(`/api/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  sendEmail: (id, toEmail) =>
    request(`/api/invoices/${id}/email`, {
      method: "POST",
      body: JSON.stringify({ toEmail }),
    }),

  emailInvoice: (id, toEmail) =>
    request(`/api/invoices/${id}/email`, {
      method: "POST",
      body: JSON.stringify({ toEmail }),
    }),

  setStatus: (id, status) =>
    request(`/api/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

export const activityAPI = {
  getAll: (params) => request(`/logs${buildQuery(params)}`),
};

export const reportsAPI = {
  getSummary: () => request("/api/reports/summary"),

  getMonthlyTrend: (year) =>
    request(`/api/reports/monthly-trend${buildQuery({ year })}`),

  getVendorPerformance: (params) =>
    request(`/api/reports/vendor-performance${buildQuery(params)}`),

  getSpendingByCategory: (params) =>
    request(`/api/reports/spending-by-category${buildQuery(params)}`),

  exportReports: (params) =>
    request(`/api/reports/export${buildQuery(params)}`),
};

// Convenience aliases matching the requested API surface
export const getUsers = usersAPI.getUsers;
export const editUser = usersAPI.editUser;
export const disableUser = usersAPI.disableUser;
export const rateVendor = vendorsAPI.rateVendor;
export const forgotPassword = authAPI.forgotPassword;
export const emailInvoice = invoicesAPI.emailInvoice;
export const exportReports = reportsAPI.exportReports;
