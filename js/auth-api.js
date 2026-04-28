/**
 * NAVETTE EXPRESS — Auth Bridge API
 * PWA Entreprises — Remplace la simulation par l'API backend
 * JAEBETS HOLDING
 */
(function () {
  'use strict';

  const API_BASE = 'https://api.jaebets-holding.com';
  const TOKEN_KEY = 'navette_entreprise_token';

  // Utils.storage que la PWA utilise déjà → on le remplace proprement
  function saveToken(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('token', token); // format attendu par Utils.storage
    localStorage.setItem('user', JSON.stringify({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      company_id: user.company_id,
      entreprise: user.company_name || 'JAEBETS HOLDING'
    }));
    localStorage.setItem('navette_entreprise_user', JSON.stringify(user));
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('navette_entreprise_user');
  }

  function checkAuth() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const publicPages = ['connexion.html', 'inscription.html', 'index.html', 'erreur.html', ''];
    if (publicPages.includes(page)) return;
    if (!getToken()) window.location.href = 'connexion.html';
  }

  function hookLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      const email = (form.querySelector('[name="email"]')?.value || '').trim();
      const password = form.querySelector('[name="password"]')?.value || '';
      const btn = form.querySelector('[type="submit"], button');

      if (!email || !password) {
        alert('Veuillez remplir tous les champs.');
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Connexion...'; }

      try {
        const res = await fetch(API_BASE + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!data.success) {
          alert(data.error?.message || 'Identifiants invalides');
          return;
        }

        const user = data.data.user;
        const allowedRoles = ['enterprise_admin', 'employee', 'super_admin', 'admin'];
        if (!allowedRoles.includes(user.role)) {
          alert('Accès réservé aux comptes entreprise.');
          return;
        }

        saveToken(data.data.token, user);
        window.location.href = 'dashboard.html';

      } catch (err) {
        alert('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Se connecter'; }
      }

    }, true);
  }

  window.NavetteAuth = {
    getToken,
    getUser() {
      try { return JSON.parse(localStorage.getItem('navette_entreprise_user')); } catch(e) { return null; }
    },
    isLoggedIn: () => !!getToken(),
    logout() { clearAuth(); window.location.href = 'connexion.html'; },
    async apiFetch(path, options = {}) {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      const t = getToken();
      if (t) headers['Authorization'] = 'Bearer ' + t;
      const res = await fetch(API_BASE + path, { ...options, headers });
      if (res.status === 401) { this.logout(); return null; }
      return res.json();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    hookLoginForm();
  });

})();
