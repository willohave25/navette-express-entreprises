/**
 * NAVETTE EXPRESS — Client API
 * PWA Entreprises
 */
class NavetteAPI {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.tokenKey = TOKEN_KEY;
  }

  getToken() { return localStorage.getItem(this.tokenKey); }
  setToken(t) { localStorage.setItem(this.tokenKey, t); }
  removeToken() { localStorage.removeItem(this.tokenKey); localStorage.removeItem(USER_KEY); }
  getUser() { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null; }
  isLoggedIn() { return !!this.getToken(); }

  getHeaders(withAuth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (withAuth) { const t = this.getToken(); if (t) h['Authorization'] = `Bearer ${t}`; }
    return h;
  }

  async request(method, path, body = null, withAuth = true) {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method, headers: this.getHeaders(withAuth),
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await response.json();
      if (response.status === 401) { this.removeToken(); window.location.href = '/connexion.html'; return; }
      if (!response.ok && !data.success) throw { status: response.status, ...data.error };
      return data;
    } catch (err) {
      if (err.code) throw err;
      throw { code: 'NETWORK_ERROR', message: 'Erreur de connexion' };
    }
  }

  get(path, auth = true) { return this.request('GET', path, null, auth); }
  post(path, body, auth = true) { return this.request('POST', path, body, auth); }
  put(path, body, auth = true) { return this.request('PUT', path, body, auth); }

  requireAuth() {
    if (!this.isLoggedIn()) { window.location.href = '/connexion.html'; return false; }
    const user = this.getUser();
    if (!['enterprise_admin', 'employee', 'super_admin', 'admin'].includes(user?.role)) {
      window.location.href = '/connexion.html'; return false;
    }
    return true;
  }

  async login(email, password) {
    const res = await this.post('/api/auth/login', { email, password }, false);
    if (res?.success) {
      this.setToken(res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }
    return res;
  }

  logout() { this.removeToken(); window.location.href = '/connexion.html'; }

  // Profil
  getMe() { return this.get('/api/auth/me'); }

  // Mon entreprise
  getMyCompany() {
    const user = this.getUser();
    return user?.company_id ? this.get(`/api/companies/${user.company_id}`) : null;
  }
  getMyEmployees() {
    const user = this.getUser();
    return user?.company_id ? this.get(`/api/companies/${user.company_id}/employees`) : null;
  }
  getMyCorridors() {
    const user = this.getUser();
    return user?.company_id ? this.get(`/api/companies/${user.company_id}/corridors`) : null;
  }
  getMyInvoices() {
    const user = this.getUser();
    return user?.company_id ? this.get(`/api/companies/${user.company_id}/invoices`) : null;
  }

  // Lignes disponibles
  getActiveLines() { return this.get('/api/lines/active', false); }

  // Abonnements employés
  getSubscriptions(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/api/subscriptions${q ? '?' + q : ''}`);
  }

  // Paiements
  initiatePayment(data) { return this.post('/api/payments/initiate', data); }
  getPaymentHistory() { return this.get('/api/payments/history'); }

  // Notifications
  getNotifications() { return this.get('/api/notifications'); }
  markNotificationRead(id) { return this.put(`/api/notifications/${id}/read`); }
}

const API = new NavetteAPI();
