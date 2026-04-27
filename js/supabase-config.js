/**
 * NAVETTE EXPRESS — API Bridge (remplace Supabase)
 * PWA Entreprises — Toutes les fonctions appellent https://api.jaebets-holding.com
 * JAEBETS HOLDING — W2K-Digital 2025
 */

const API_BASE = 'https://api.jaebets-holding.com';

// ─── Helpers internes ─────────────────────────────────────────────────

function _getToken() {
  try {
    const s = localStorage.getItem('navette_session');
    if (s) {
      const parsed = JSON.parse(s);
      return parsed.token || parsed.access_token || null;
    }
    return localStorage.getItem('userToken');
  } catch(e) { return null; }
}

function _getEntreprise() {
  try {
    const s = localStorage.getItem('navette_entreprise');
    return s ? JSON.parse(s) : null;
  } catch(e) { return null; }
}

async function _apiFetch(path, options = {}) {
  const token = _getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('navette_session');
    localStorage.removeItem('navette_user');
    localStorage.removeItem('navette_entreprise');
    window.location.href = 'connexion.html';
    return null;
  }
  return res.json();
}

// ─── SupabaseConfig (garde la même interface) ─────────────────────────

const SupabaseConfig = {
  tables: {
    entreprises: 'companies',
    employes: 'company_employees',
    corridors: 'lines',
    factures: 'invoices',
    notifications: 'notifications',
    presences: 'boarding_records'
  },

  client: null,
  init: function() { return this; },

  // ─── AUTH ────────────────────────────────────────────────────────────

  login: async function(email, password) {
    try {
      const res = await fetch(API_BASE + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!json.success) return { success: false, error: json.error?.message || 'Identifiants incorrects' };

      const token = json.data.token;
      const user = json.data.user;

      localStorage.setItem('navette_session', JSON.stringify({ token, user }));
      localStorage.setItem('navette_user', JSON.stringify(user));

      return { success: true, data: { session: { token }, user } };
    } catch (error) {
      console.error('[Supabase] Erreur connexion:', error.message);
      return { success: false, error: 'Impossible de contacter le serveur.' };
    }
  },

  register: async function(entreprise) {
    try {
      const res = await fetch(API_BASE + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: entreprise.email,
          password: entreprise.password,
          full_name: entreprise.responsableNom || entreprise.nom,
          role: 'company',
          company_name: entreprise.nom,
          rccm: entreprise.rccm,
          secteur: entreprise.secteur,
          nombre_employes: entreprise.nombreEmployes,
          adresse: entreprise.adresse,
          phone: entreprise.telephone
        })
      });
      const json = await res.json();
      if (!json.success) return { success: false, error: json.error?.message || 'Erreur inscription' };
      return { success: true, data: json.data };
    } catch (error) {
      console.error('[Supabase] Erreur inscription:', error.message);
      return { success: false, error: error.message };
    }
  },

  logout: async function() {
    localStorage.removeItem('navette_session');
    localStorage.removeItem('navette_user');
    localStorage.removeItem('navette_entreprise');
    return { success: true };
  },

  // ─── ENTREPRISE ───────────────────────────────────────────────────────

  getEntreprise: async function() {
    try {
      const json = await _apiFetch('/api/companies/me');
      if (!json?.success) throw new Error(json?.error?.message || 'Erreur');
      localStorage.setItem('navette_entreprise', JSON.stringify(json.data));
      return { success: true, data: json.data };
    } catch (error) {
      console.error('[Supabase] Erreur récupération entreprise:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ─── CORRIDORS (= lignes) ─────────────────────────────────────────────

  getCorridors: async function() {
    try {
      const entreprise = _getEntreprise();
      const qs = entreprise ? '?company_id=' + entreprise.id : '';
      const json = await _apiFetch('/api/lines' + qs);
      const list = json?.data || json?.lines || [];
      return { success: true, data: list };
    } catch (error) {
      console.error('[Supabase] Erreur récupération corridors:', error.message);
      return { success: false, error: error.message };
    }
  },

  createCorridor: async function(corridor) {
    try {
      const entreprise = _getEntreprise();
      const json = await _apiFetch('/api/lines', {
        method: 'POST',
        body: JSON.stringify({
          company_id: entreprise?.id,
          origin: corridor.zoneDepart,
          destination: corridor.destination,
          departure_time: corridor.horaireAller,
          return_time: corridor.horaireRetour,
          vehicle_type: corridor.typeBus,
          options: corridor.options,
          distance_km: corridor.distanceKm,
          price_monthly: corridor.coutMensuel,
          status: 'active'
        })
      });
      if (!json?.success) throw new Error(json?.error?.message || 'Erreur');
      return { success: true, data: json.data };
    } catch (error) {
      console.error('[Supabase] Erreur création corridor:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ─── EMPLOYÉS ─────────────────────────────────────────────────────────

  getEmployes: async function() {
    try {
      const json = await _apiFetch('/api/companies/employees');
      const list = json?.data || [];
      return { success: true, data: list };
    } catch (error) {
      console.error('[Supabase] Erreur récupération employés:', error.message);
      return { success: false, error: error.message };
    }
  },

  addEmploye: async function(employe) {
    try {
      const entreprise = _getEntreprise();
      const json = await _apiFetch('/api/companies/employees', {
        method: 'POST',
        body: JSON.stringify({
          company_id: entreprise?.id,
          nom: employe.nom,
          telephone: employe.telephone,
          email: employe.email,
          quartier: employe.quartier,
          corridor_id: employe.corridorId || null
        })
      });
      if (!json?.success) throw new Error(json?.error?.message || 'Erreur');
      return { success: true, data: json.data };
    } catch (error) {
      console.error('[Supabase] Erreur ajout employé:', error.message);
      return { success: false, error: error.message };
    }
  },

  importEmployes: async function(employes) {
    try {
      const entreprise = _getEntreprise();
      const json = await _apiFetch('/api/companies/employees/import', {
        method: 'POST',
        body: JSON.stringify({ company_id: entreprise?.id, employes })
      });
      if (!json?.success) throw new Error(json?.error?.message || 'Erreur');
      return { success: true, data: json.data, count: json.data?.length || 0 };
    } catch (error) {
      console.error('[Supabase] Erreur import employés:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ─── FACTURES ─────────────────────────────────────────────────────────

  getFactures: async function() {
    try {
      const json = await _apiFetch('/api/companies/invoices');
      const list = json?.data || [];
      return { success: true, data: list };
    } catch (error) {
      console.error('[Supabase] Erreur récupération factures:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────

  getNotifications: async function() {
    try {
      const json = await _apiFetch('/api/notifications?limit=50');
      const list = json?.data || [];
      return { success: true, data: list };
    } catch (error) {
      console.error('[Supabase] Erreur récupération notifications:', error.message);
      return { success: false, error: error.message };
    }
  },

  markNotificationRead: async function(notificationId) {
    try {
      await _apiFetch('/api/notifications/' + notificationId + '/read', { method: 'PUT' });
      return { success: true };
    } catch (error) {
      console.error('[Supabase] Erreur marquage notification:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ─── SUIVI TRANSPORT ──────────────────────────────────────────────────

  getSuiviTransport: async function(corridorId = null) {
    try {
      const qs = corridorId ? '?line_id=' + corridorId : '';
      const json = await _apiFetch('/api/tracking/live' + qs);
      return { success: true, data: json?.data || [] };
    } catch (error) {
      console.error('[Supabase] Erreur récupération suivi:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Stub — pas de realtime Supabase
  subscribeRealtime: function(table, callback) { return null; }
};

/* Export pour utilisation globale */
window.SupabaseConfig = SupabaseConfig;
