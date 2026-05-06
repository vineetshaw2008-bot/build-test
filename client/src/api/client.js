const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5000');

class ApiClient {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const isFormData = options.body instanceof FormData;
    const headers = isFormData
      ? { ...options.headers }
      : {
          'Content-Type': 'application/json',
          ...options.headers,
        };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const payload = await response.json();
    return payload?.data ?? payload;
  }

  // Auth endpoints
  register(data) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  login(data) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getMe() {
    return this.request('/api/auth/me');
  }

  // Teams endpoints
  createTeam(data) {
    return this.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getTeams() {
    return this.request('/api/teams');
  }

  // Sheets endpoints
  getSheets(teamId) {
    return this.request(`/api/sheets?teamId=${teamId}`);
  }

  getSheet(sheetId) {
    return this.request(`/api/sheets/${sheetId}`);
  }

  // Sheet rows
  updateRow(sheetId, rowId, data) {
    return this.request(`/api/sheets/${sheetId}/rows/${rowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteRow(sheetId, rowId) {
    return this.request(`/api/sheets/${sheetId}/rows/${rowId}`, {
      method: 'DELETE',
    });
  }

  // Forms endpoints
  getFormDefinition(sheetId) {
    return this.request(`/api/forms/${sheetId}`);
  }

  submitForm(sheetId, data) {
    return this.request(`/api/forms/${sheetId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateFormConfig(sheetId, config) {
    return this.request(`/api/sheets/${sheetId}/form-config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Import/Export
  importExcel(file, teamId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teamId', teamId);

    return this.request('/api/sheets/import', {
      method: 'POST',
      body: formData,
    });
  }

  exportExcel(sheetId, format = 'xlsx') {
    return fetch(`${API_BASE_URL}/api/sheets/${sheetId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }).then(res => res.blob());
  }

  // Dashboard endpoints
  getDashboardInsights(sheetId) {
    return this.request(`/api/dashboard/insights/${sheetId}`);
  }

  getDashboardStats() {
    return this.request('/api/dashboard/stats');
  }
}

export default new ApiClient();
