const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
    }
  }

  getToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) { return this.request<T>(endpoint); }
  post<T>(endpoint: string, body: unknown) { return this.request<T>(endpoint, { method: 'POST', body }); }
  put<T>(endpoint: string, body: unknown) { return this.request<T>(endpoint, { method: 'PUT', body }); }
  patch<T>(endpoint: string, body: unknown) { return this.request<T>(endpoint, { method: 'PATCH', body }); }
  delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }); }
}

export const api = new ApiClient();

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post<any>('/auth/login', data),
  register: (data: { email: string; name: string; password: string }) => api.post<any>('/auth/register', data),
  refresh: (refreshToken: string) => api.post<any>('/auth/refresh', { refreshToken }),
  logout: () => api.post<any>('/auth/logout', {}),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post<any>('/auth/change-password', data),
};

// Users
export const usersApi = {
  getAll: (params?: string) => api.get<any>(`/users${params ? '?' + params : ''}`),
  getById: (id: string) => api.get<any>(`/users/${id}`),
  getMe: () => api.get<any>('/users/me'),
  create: (data: any) => api.post<any>('/users', data),
  update: (id: string, data: any) => api.put<any>(`/users/${id}`, data),
  delete: (id: string) => api.delete<any>(`/users/${id}`),
  getRoles: () => api.get<any>('/users/roles'),
  getGroups: () => api.get<any>('/users/groups'),
};

// Tickets
export const ticketsApi = {
  getAll: (params?: string) => api.get<any>(`/tickets${params ? '?' + params : ''}`),
  getById: (id: string) => api.get<any>(`/tickets/${id}`),
  getMy: (params?: string) => api.get<any>(`/tickets/my${params ? '?' + params : ''}`),
  getCreatedByMe: (params?: string) => api.get<any>(`/tickets/created-by-me${params ? '?' + params : ''}`),
  create: (data: any) => api.post<any>('/tickets', data),
  update: (id: string, data: any) => api.put<any>(`/tickets/${id}`, data),
  changeStatus: (id: string, status: string) => api.patch<any>(`/tickets/${id}/status`, { status }),
  assign: (id: string, assignedToId: string) => api.patch<any>(`/tickets/${id}/assign`, { assignedToId }),
  delete: (id: string) => api.delete<any>(`/tickets/${id}`),
  getComments: (id: string) => api.get<any>(`/tickets/${id}/comments`),
  addComment: (id: string, data: { content: string; isInternal?: boolean }) => api.post<any>(`/tickets/${id}/comments`, data),
  getSubtasks: (id: string) => api.get<any>(`/tickets/${id}/subtasks`),
  countByStatus: () => api.get<any>('/tickets/stats/by-status'),
  countByPriority: () => api.get<any>('/tickets/stats/by-priority'),
};

// SLA
export const slaApi = {
  getConfigs: () => api.get<any>('/sla/configs'),
  getConfig: (id: string) => api.get<any>(`/sla/configs/${id}`),
  createConfig: (data: any) => api.post<any>('/sla/configs', data),
  updateConfig: (id: string, data: any) => api.put<any>(`/sla/configs/${id}`, data),
  getTicketSla: (ticketId: string) => api.get<any>(`/sla/ticket/${ticketId}`),
  getBreachedCount: () => api.get<any>('/sla/stats/breached'),
  getAvgResolution: () => api.get<any>('/sla/stats/avg-resolution'),
};

// Audit
export const auditApi = {
  getAll: (params?: string) => api.get<any>(`/audit${params ? '?' + params : ''}`),
  getByEntity: (entity: string, entityId: string) => api.get<any>(`/audit/entity/${entity}/${entityId}`),
  getByUser: (userId: string) => api.get<any>(`/audit/user/${userId}`),
};

// Automation
export const automationApi = {
  getAll: () => api.get<any>('/automation'),
  getById: (id: string) => api.get<any>(`/automation/${id}`),
  create: (data: any) => api.post<any>('/automation', data),
  update: (id: string, data: any) => api.put<any>(`/automation/${id}`, data),
  delete: (id: string) => api.delete<any>(`/automation/${id}`),
};

// Notifications
export const notificationsApi = {
  getMy: (params?: string) => api.get<any>(`/notifications${params ? '?' + params : ''}`),
  getUnreadCount: () => api.get<any>('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch<any>(`/notifications/${id}/read`, {}),
  markAllAsRead: () => api.patch<any>('/notifications/read-all', {}),
};

// Dashboard
export const dashboardApi = {
  getStats: (params?: string) => api.get<any>(`/dashboard/stats${params ? '?' + params : ''}`),
};

// Health
export const healthApi = {
  check: () => api.get<any>('/health'),
};
