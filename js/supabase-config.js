/**
 * Configuration Supabase — Navette Express Espace Entreprise
 * Placeholder — Clés API à renseigner lors de l'intégration
 * W2K-Digital 2025
 */

const SupabaseConfig = {
  /* Clés API Supabase (à remplir) */
  url: 'https://ilycnutphhmuvaonkrsa.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlseWNudXRwaGhtdXZhb25rcnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjY5NDcsImV4cCI6MjA5MDEwMjk0N30.80ipBwMVvAkC2f0Oz2Wzl8E6GjMwlLCoE72XbePtmnM',
  
  /* Tables utilisées */
  tables: {
    entreprises: 'entreprises',
    employes: 'employes',
    corridors: 'corridors',
    factures: 'factures',
    notifications: 'notifications',
    presences: 'presences'
  },
  
  /* Client Supabase (initialisé plus tard) */
  client: null,
  
  /**
   * Initialiser le client Supabase
   */
  init: function() {
    if (typeof supabase === 'undefined') {
      console.warn('[Supabase] SDK non chargé. Ajoutez le script Supabase.');
      return null;
    }
    
    this.client = supabase.createClient(this.url, this.anonKey);
    console.log('[Supabase] Client initialisé');
    return this.client;
  },
  
  /**
   * Connexion entreprise
   * @param {string} email - Courriel entreprise
   * @param {string} password - Mot de passe
   * @returns {Promise} Résultat connexion
   */
  login: async function(email, password) {
    if (!this.client) this.init();
    
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      /* Stocker session */
      localStorage.setItem('navette_session', JSON.stringify(data.session));
      localStorage.setItem('navette_user', JSON.stringify(data.user));
      
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur connexion:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Inscription entreprise
   * @param {Object} entreprise - Données entreprise
   * @returns {Promise} Résultat inscription
   */
  register: async function(entreprise) {
    if (!this.client) this.init();
    
    try {
      /* Créer compte auth */
      const { data: authData, error: authError } = await this.client.auth.signUp({
        email: entreprise.email,
        password: entreprise.password,
        options: {
          data: {
            nom_entreprise: entreprise.nom,
            role: 'entreprise'
          }
        }
      });
      
      if (authError) throw authError;
      
      /* Créer profil entreprise dans table */
      const { data: profileData, error: profileError } = await this.client
        .from(this.tables.entreprises)
        .insert({
          user_id: authData.user.id,
          nom: entreprise.nom,
          rccm: entreprise.rccm,
          secteur: entreprise.secteur,
          nombre_employes: entreprise.nombreEmployes,
          adresse: entreprise.adresse,
          responsable_nom: entreprise.responsableNom,
          telephone: entreprise.telephone
        })
        .select()
        .single();
      
      if (profileError) throw profileError;
      
      return { success: true, data: profileData };
    } catch (error) {
      console.error('[Supabase] Erreur inscription:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Déconnexion
   * @returns {Promise} Résultat déconnexion
   */
  logout: async function() {
    if (!this.client) this.init();
    
    try {
      await this.client.auth.signOut();
      localStorage.removeItem('navette_session');
      localStorage.removeItem('navette_user');
      localStorage.removeItem('navette_entreprise');
      return { success: true };
    } catch (error) {
      console.error('[Supabase] Erreur déconnexion:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Récupérer profil entreprise connectée
   * @returns {Promise} Données entreprise
   */
  getEntreprise: async function() {
    if (!this.client) this.init();
    
    try {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) throw new Error('Non connecté');
      
      const { data, error } = await this.client
        .from(this.tables.entreprises)
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      localStorage.setItem('navette_entreprise', JSON.stringify(data));
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur récupération entreprise:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Récupérer liste des corridors
   * @returns {Promise} Liste corridors
   */
  getCorridors: async function() {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      const { data, error } = await this.client
        .from(this.tables.corridors)
        .select('*')
        .eq('entreprise_id', entreprise.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur récupération corridors:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Créer un corridor
   * @param {Object} corridor - Données corridor
   * @returns {Promise} Corridor créé
   */
  createCorridor: async function(corridor) {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      const { data, error } = await this.client
        .from(this.tables.corridors)
        .insert({
          entreprise_id: entreprise.id,
          zone_depart: corridor.zoneDepart,
          destination: corridor.destination,
          horaire_aller: corridor.horaireAller,
          horaire_retour: corridor.horaireRetour,
          type_bus: corridor.typeBus,
          options: corridor.options,
          distance_km: corridor.distanceKm,
          cout_mensuel: corridor.coutMensuel,
          statut: 'actif'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur création corridor:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Récupérer liste des employés
   * @returns {Promise} Liste employés
   */
  getEmployes: async function() {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      const { data, error } = await this.client
        .from(this.tables.employes)
        .select('*, corridors(nom)')
        .eq('entreprise_id', entreprise.id)
        .order('nom', { ascending: true });
      
      if (error) throw error;
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur récupération employés:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Ajouter un employé
   * @param {Object} employe - Données employé
   * @returns {Promise} Employé créé
   */
  addEmploye: async function(employe) {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      const { data, error } = await this.client
        .from(this.tables.employes)
        .insert({
          entreprise_id: entreprise.id,
          nom: employe.nom,
          telephone: employe.telephone,
          email: employe.email,
          quartier: employe.quartier,
          corridor_id: employe.corridorId || null,
          statut: 'actif'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur ajout employé:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Import Excel employés (bulk insert)
   * @param {Array} employes - Liste employés à importer
   * @returns {Promise} Résultat import
   */
  importEmployes: async function(employes) {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      const employesWithEntreprise = employes.map(emp => ({
        entreprise_id: entreprise.id,
        nom: emp.nom,
        telephone: emp.telephone,
        email: emp.email,
        quartier: emp.quartier,
        statut: 'actif'
      }));
      
      const { data, error } = await this.client
        .from(this.tables.employes)
        .insert(employesWithEntreprise)
        .select();
      
      if (error) throw error;
      return { success: true, data: data, count: data.length };
    } catch (error) {
      console.error('[Supabase] Erreur import employés:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Récupérer factures
   * @returns {Promise} Liste factures
   */
  getFactures: async function() {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      const { data, error } = await this.client
        .from(this.tables.factures)
        .select('*')
        .eq('entreprise_id', entreprise.id)
        .order('periode', { ascending: false });
      
      if (error) throw error;
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur récupération factures:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Récupérer notifications
   * @returns {Promise} Liste notifications
   */
  getNotifications: async function() {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      const { data, error } = await this.client
        .from(this.tables.notifications)
        .select('*')
        .eq('entreprise_id', entreprise.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur récupération notifications:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Marquer notification comme lue
   * @param {string} notificationId - ID notification
   * @returns {Promise} Résultat
   */
  markNotificationRead: async function(notificationId) {
    if (!this.client) this.init();
    
    try {
      const { error } = await this.client
        .from(this.tables.notifications)
        .update({ lu: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[Supabase] Erreur marquage notification:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Récupérer données suivi transport temps réel
   * @param {string} corridorId - ID corridor (optionnel)
   * @returns {Promise} Données suivi
   */
  getSuiviTransport: async function(corridorId = null) {
    if (!this.client) this.init();
    
    try {
      const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
      if (!entreprise) throw new Error('Entreprise non trouvée');
      
      let query = this.client
        .from(this.tables.presences)
        .select('*, employes(nom), corridors(nom, bus_immatriculation)')
        .eq('date', new Date().toISOString().split('T')[0]);
      
      if (corridorId) {
        query = query.eq('corridor_id', corridorId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, data: data };
    } catch (error) {
      console.error('[Supabase] Erreur récupération suivi:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Souscrire aux mises à jour temps réel
   * @param {string} table - Nom table
   * @param {Function} callback - Fonction callback
   * @returns {Object} Subscription
   */
  subscribeRealtime: function(table, callback) {
    if (!this.client) this.init();
    
    const entreprise = JSON.parse(localStorage.getItem('navette_entreprise'));
    if (!entreprise) return null;
    
    return this.client
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `entreprise_id=eq.${entreprise.id}`
        },
        callback
      )
      .subscribe();
  }
};

/* Export pour utilisation globale */
window.SupabaseConfig = SupabaseConfig;

console.log('[Supabase] Configuration chargée (placeholder)');
